import {
  pieces as CONFIG_PIECES,
  BOARD_W,
  BOARD_H,
  COLS,
  ROWS,
  KEEP_ORIGINAL_SIZES,
  GROUP_SCALE,
  BOARD_ADJUST_X,
  BOARD_ADJUST_Y,
} from "./piecesConfig.js";

// Preload assets (images) for the puzzle so first activation is instant
export function preload() {
  return Promise.all(
    CONFIG_PIECES.map(
      (p) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = img.onerror = () => resolve();
          img.src = p.src; // already imported URL
        })
    )
  );
}

// Derived from config
const CELL_W = BOARD_W / COLS;
const CELL_H = BOARD_H / ROWS;

export function createGame({ bus }) {
  let root; // container inside #game-root
  let tray; // right side column for pieces
  let board; // drop board (over back-photo area)
  let complete = false;
  let placedCount = 0;
  let totalPieces = 0;
  let active = false;
  // Uniform scaling factor (width-based) – use single scale to avoid distortion
  let boardScale = 1;
  let anchorBoardEl = null; // DOM element with class back-photo (anchor-managed)
  let followRAF = null;
  let lastAnchorRect = null;
  let anchorObserver = null;
  let measurePending = 0;
  let piecesState = new Map(); // id -> state object
  let boardLayer; // inner layer for placed pieces
  let resizeObserver;
  let onPointerMoveBound;
  let onPointerUpBound;
  let onKeyDownBound;
  let dragging = null; // {piece, startX, startY, offsetX, offsetY, originParent, originNext, startLeft, startTop}

  const groupOffsetX = 0;
  const groupOffsetY = 0;
  // z-layering: corners frame should sit above any puzzle piece (even while dragging)
  // We'll keep dragged pieces below a high frame layer defined in CSS (e.g. 140)
  let zStackCounter = 60; // incremental base for free pieces (kept < frame)

  function buildDOM(container) {
    root = document.createElement("div");
    root.className = "puzzlegame-root";
    Object.assign(root.style, {
      position: "absolute",
      inset: 0,
      // pointer events will be toggled with active state
      pointerEvents: "none",
      zIndex: 30,
    });

    board = document.createElement("div");
    board.className = "puzzlegame-board";
    boardLayer = document.createElement("div");
    Object.assign(boardLayer.style, {
      position: "absolute",
      left: 0,
      top: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none",
    });
    board.appendChild(boardLayer);

    tray = document.createElement("div");
    tray.className = "puzzlegame-tray";

    root.append(board, tray);
    container.appendChild(root);
  }

  function initPieces() {
    // Convert config pieces into runtime meta (adding targetX/Y for consistency)
    const PIECES = CONFIG_PIECES.map((p) => ({
      id: p.id,
      targetX: p.x,
      targetY: p.y,
      anchorX: p.anchorX ?? 0,
      anchorY: p.anchorY ?? 0,
      w: p.w, // optional override
      h: p.h, // optional override
      naturalW: null, // will fill after load
      naturalH: null,
      src: p.src, // direct imported asset URL
    }));
    totalPieces = PIECES.length;
    const frag = document.createDocumentFragment();
    PIECES.forEach((p) => {
      const img = document.createElement("img");
      img.className = "puzzlegame-piece";
      img.draggable = false;
      img.alt = `piece ${p.id}`;
      img.dataset.id = String(p.id);
      img.src = p.src;
      // store state
      piecesState.set(p.id, {
        meta: p,
        el: img,
        state: "tray",
      });
      // capture natural size once loaded (only if we intend to keep original)
      if (KEEP_ORIGINAL_SIZES) {
        img.addEventListener(
          "load",
          () => {
            if (p.w || p.h) return; // explicit override provided
            p.naturalW = img.naturalWidth;
            p.naturalH = img.naturalHeight;
            if (boardScale) {
              const tw = p.naturalW * GROUP_SCALE * boardScale;
              const th = p.naturalH * GROUP_SCALE * boardScale;
              Object.assign(img.style, { width: tw + "px", height: th + "px" });
            }
          },
          { once: true }
        );
      }
      img.addEventListener("pointerdown", (e) => onPiecePointerDown(e, p.id));
      frag.appendChild(img);
    });
    tray.appendChild(frag);
    measureBoard();
    bus.emit("score.init", { total: totalPieces, value: placedCount });
  }

  function measureBoard() {
    if (!anchorBoardEl) {
      anchorBoardEl = document.querySelector(".back-photo");
    }
    const targetEl = anchorBoardEl || board; // fallback to board if anchor missing
    const rect = targetEl.getBoundingClientRect();
    // Inline-position the logical board exactly over the anchor so children can use local coords
    const rootRect = root.getBoundingClientRect();
    const relLeft = rect.left - rootRect.left;
    const relTop = rect.top - rootRect.top;
    // Width-driven scale; adjust offsets proportionally to avoid drift when scale changes
    const scaleX = rect.width / BOARD_W;
    boardScale = scaleX;
    const scaledAdjustX = BOARD_ADJUST_X * boardScale;
    const scaledAdjustY = BOARD_ADJUST_Y * boardScale;
    const boardPixelH = BOARD_H * boardScale;
    Object.assign(board.style, {
      left: relLeft + scaledAdjustX + "px",
      top: relTop + scaledAdjustY + "px",
      width: rect.width + "px",
      height: boardPixelH + "px",
    });
    // Reposition already placed pieces to scaled coords (they are relative to board now)
    piecesState.forEach((ps) => {
      if (ps.state === "placed") positionPlacedPiece(ps);
      else {
        // Update tray piece sizes after board scale known
        const { meta, el } = ps;
        const { w, h } = resolvePieceDims(meta);
        if (meta.naturalW || w) {
          const baseW = meta.naturalW || w;
          const baseH = meta.naturalH || h;
          el.style.width = baseW * GROUP_SCALE * boardScale + "px";
          el.style.height = baseH * GROUP_SCALE * boardScale + "px";
        }
      }
    });
    if (anchorBoardEl && !anchorObserver) {
      try {
        anchorObserver = new ResizeObserver(() => scheduleMeasureBoard());
        anchorObserver.observe(anchorBoardEl);
      } catch {}
    }
  }

  function scheduleMeasureBoard() {
    if (measurePending) return;
    measurePending = 3;
    const step = () => {
      if (measurePending <= 0) return;
      measureBoard();
      measurePending--;
      if (measurePending > 0) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function startAnchorFollow() {
    if (followRAF) return;
    const tick = () => {
      followRAF = requestAnimationFrame(tick);
      if (!anchorBoardEl) anchorBoardEl = document.querySelector(".back-photo");
      if (!anchorBoardEl) return;
      const r = anchorBoardEl.getBoundingClientRect();
      if (
        !lastAnchorRect ||
        Math.abs(r.left - lastAnchorRect.left) > 0.5 ||
        Math.abs(r.top - lastAnchorRect.top) > 0.5 ||
        Math.abs(r.width - lastAnchorRect.width) > 0.5 ||
        Math.abs(r.height - lastAnchorRect.height) > 0.5
      ) {
        lastAnchorRect = {
          left: r.left,
          top: r.top,
          width: r.width,
          height: r.height,
        };
        measureBoard();
      }
    };
    followRAF = requestAnimationFrame(tick);
  }

  function stopAnchorFollow() {
    if (followRAF) {
      cancelAnimationFrame(followRAF);
      followRAF = null;
    }
  }

  function resolvePieceDims(meta) {
    // Priority: explicit w/h -> natural sizes (if keeping original) -> cell size
    let w = meta.w;
    let h = meta.h;
    if (
      (w == null || h == null) &&
      KEEP_ORIGINAL_SIZES &&
      meta.naturalW &&
      meta.naturalH
    ) {
      w = meta.naturalW;
      h = meta.naturalH;
    }
    if (w == null || h == null) {
      w = CELL_W;
      h = CELL_H;
    }
    return { w, h };
  }

  function positionPlacedPiece(ps) {
    const { meta, el } = ps;
    const { w, h } = resolvePieceDims(meta);
    // Apply group scale around (0,0) then translate via groupOffset
    const scaledTargetX = meta.targetX * GROUP_SCALE + groupOffsetX;
    const scaledTargetY = meta.targetY * GROUP_SCALE + groupOffsetY;
    const scaledW = w * GROUP_SCALE;
    const scaledH = h * GROUP_SCALE;
    // Board is already aligned & (0,0) corresponds to anchor's top-left
    const left = (scaledTargetX - meta.anchorX * scaledW) * boardScale;
    const top = (scaledTargetY - meta.anchorY * scaledH) * boardScale;
    Object.assign(el.style, {
      position: "absolute",
      left: left + "px",
      top: top + "px",
      width: scaledW * boardScale + "px",
      height: scaledH * boardScale + "px",
      transform: "",
      pointerEvents: "none",
      cursor: "default",
    });
  }

  function onPiecePointerDown(e, id) {
    if (!active || complete) return;
    if (dragging) return; // ignore if another drag in progress
    const ps = piecesState.get(id);
    if (!ps) return;
    e.preventDefault();
    const el = ps.el;
    // Ensure pointer events enabled for free/tray pieces
    if (ps.state === "free" || ps.state === "tray") {
      el.style.pointerEvents = "auto";
    }
    // Bring to front but keep under frame (cap at 100)
    zStackCounter = Math.min(zStackCounter + 1, 100);
    el.style.zIndex = zStackCounter.toString();
    const r = el.getBoundingClientRect();
    let placeholder = null;
    const originalParent = el.parentNode;
    if (ps.state === "tray") {
      // Create placeholder exactly at original index (replace element) only for tray
      placeholder = document.createElement("div");
      placeholder.className = "puzzlegame-piece-placeholder";
      Object.assign(placeholder.style, {
        width: r.width + "px",
        height: r.height + "px",
        flex: "0 0 auto",
      });
      // Keep the gap after the piece is taken
      placeholder.dataset.permanent = "1";
      if (originalParent) {
        originalParent.replaceChild(placeholder, el);
      }
    }
    dragging = {
      id,
      piece: ps,
      originParent: originalParent,
      originNext: null,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - r.left,
      offsetY: e.clientY - r.top,
      startRect: r,
      placeholder,
    };
    el.classList.add("dragging");
    // elevate to fixed layer
    Object.assign(el.style, {
      position: "fixed",
      left: r.left + "px",
      top: r.top + "px",
      width: r.width + "px",
      height: r.height + "px",
      zIndex: 1000,
      pointerEvents: "none",
      transform: "translate(0,0)",
    });
    root.appendChild(el);
    if (!onPointerMoveBound) {
      onPointerMoveBound = onGlobalPointerMove;
      window.addEventListener("pointermove", onPointerMoveBound);
    }
    if (!onPointerUpBound) {
      onPointerUpBound = onGlobalPointerUp;
      window.addEventListener("pointerup", onPointerUpBound, { once: false });
      window.addEventListener("pointercancel", onGlobalPointerCancel, {
        once: false,
      });
    }
  }

  function onGlobalPointerMove(e) {
    if (!dragging) return;
    const { piece, offsetX, offsetY } = dragging;
    const nx = e.clientX - offsetX;
    const ny = e.clientY - offsetY;
    piece.el.style.left = nx + "px";
    piece.el.style.top = ny + "px";
  }

  function onGlobalPointerUp() {
    if (!dragging) return;
    attemptDrop();
  }

  function onGlobalPointerCancel() {
    if (!dragging) return;
    const { piece } = dragging;
    const r = piece.el.getBoundingClientRect();
    finalizeFreePlacement(piece, r);
    dragging = null;
  }

  function attemptDrop() {
    if (!dragging) return;
    const { piece } = dragging;
    const el = piece.el;
    const r = el.getBoundingClientRect();
    // Determine snap
    const centerX = r.left + r.width / 2;
    const centerY = r.top + r.height / 2;
    const { targetX, targetY, anchorX = 0, anchorY = 0 } = piece.meta;
    const { w: dwOrig, h: dhOrig } = resolvePieceDims(piece.meta);
    const dw = dwOrig * GROUP_SCALE;
    const dh = dhOrig * GROUP_SCALE;
    const scaledTargetX = targetX * GROUP_SCALE + groupOffsetX;
    const scaledTargetY = targetY * GROUP_SCALE + groupOffsetY;
    // Global target position derived from board's current rect (board aligned to anchor)
    const currentBoardRect = board.getBoundingClientRect();
    const targetLeft =
      currentBoardRect.left + (scaledTargetX - anchorX * dw) * boardScale;
    const targetTop =
      currentBoardRect.top + (scaledTargetY - anchorY * dh) * boardScale;
    const targetW = dw * boardScale;
    const targetH = dh * boardScale;
    const targetCenterX = targetLeft + targetW / 2;
    const targetCenterY = targetTop + targetH / 2;
    const dx = centerX - targetCenterX;
    const dy = centerY - targetCenterY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    // Base tolerances (axis + radial) – generous for usability
    const axisTol = Math.min(targetW, targetH) * 0.5; // 50% axis tolerance
    const radialTol = Math.min(targetW, targetH) * 0.8; // 80% radial tolerance
    // Overlap calculation
    const overlapLeft = Math.max(r.left, targetLeft);
    const overlapTop = Math.max(r.top, targetTop);
    const overlapRight = Math.min(r.right, targetLeft + targetW);
    const overlapBottom = Math.min(r.bottom, targetTop + targetH);
    const overlapW = Math.max(0, overlapRight - overlapLeft);
    const overlapH = Math.max(0, overlapBottom - overlapTop);
    const overlapArea = overlapW * overlapH;
    const targetArea = targetW * targetH;
    const overlapRatio = targetArea ? overlapArea / targetArea : 0;
    const centerDist = Math.hypot(dx, dy);
    let shouldSnap =
      (absDx < axisTol && absDy < axisTol) ||
      centerDist < radialTol ||
      overlapRatio > 0.3; // 30% overlap
    // Ultra-permissive fallback: if any overlap at all and cursor released inside board bounds
    if (!shouldSnap && overlapRatio > 0.05) {
      shouldSnap = true;
    }
    // Fallback: if user is very near (within one target dimension) snap anyway
    if (!shouldSnap && centerDist < Math.max(targetW, targetH) * 0.9) {
      shouldSnap = true;
    }
    // Dev emergency: allow force snap via global flag
    if (window.PUZZLE_FORCE_SNAP) shouldSnap = true;

    if (shouldSnap) snapPiece(piece);
    else finalizeFreePlacement(piece, r);

    dragging = null;
  }

  function finalizeFreePlacement(ps, rect) {
    // Remove placeholder if exists
    if (
      dragging?.placeholder?.parentNode &&
      !dragging.placeholder.dataset.permanent
    ) {
      dragging.placeholder.parentNode.removeChild(dragging.placeholder);
    }
    const el = ps.el;
    ps.state = "free";
    // Convert viewport coords to root-relative (root covers viewport)
    Object.assign(el.style, {
      position: "absolute",
      left: rect.left + "px",
      top: rect.top + "px",
      zIndex: (++zStackCounter).toString(),
      pointerEvents: "auto",
    });
    el.classList.remove("dragging");
    // Ensure can drag again
    if (el._freeDragBound)
      el.removeEventListener("pointerdown", el._freeDragBound);
    el._freeDragBound = (e) => onPiecePointerDown(e, ps.meta.id);
    el.addEventListener("pointerdown", el._freeDragBound, { passive: false });
    root.appendChild(el);
  }

  function snapPiece(ps) {
    ps.state = "placed";
    const { targetX, targetY, anchorX = 0, anchorY = 0 } = ps.meta;
    const { w: pw, h: ph } = resolvePieceDims(ps.meta);
    const scaledTargetX = targetX * GROUP_SCALE + groupOffsetX;
    const scaledTargetY = targetY * GROUP_SCALE + groupOffsetY;
    const scaledW = pw * GROUP_SCALE;
    const scaledH = ph * GROUP_SCALE;
    // Local (board-relative) coordinates
    const left = (scaledTargetX - anchorX * scaledW) * boardScale;
    const top = (scaledTargetY - anchorY * scaledH) * boardScale;
    const w = scaledW * boardScale;
    const h = scaledH * boardScale;
    boardLayer.appendChild(ps.el);
    // Remove placeholder if exists
    if (
      dragging?.placeholder?.parentNode &&
      !dragging.placeholder.dataset.permanent
    )
      dragging.placeholder.parentNode.removeChild(dragging.placeholder);
    Object.assign(ps.el.style, {
      position: "absolute",
      left: left + "px",
      top: top + "px",
      width: w + "px",
      height: h + "px",
      zIndex: 10, // placed pieces sit below actively dragged ones
      pointerEvents: "none",
    });
    ps.el.classList.remove("dragging");
    placedCount++;
    bus.emit("score.update", { value: placedCount });
    if (placedCount >= totalPieces) finish();
  }

  // Developer helper: snap all remaining pieces into place
  function autoSolve() {
    if (!active || complete) return;
    if (dragging) {
      const d = dragging;
      dragging = null;
      try {
        d.piece?.el?.classList?.remove("dragging");
      } catch {}
    }
    piecesState.forEach((ps) => {
      if (ps.state !== "placed") snapPiece(ps);
    });
  }

  function onGlobalKeyDown(e) {
    // Alt+F triggers auto solve while puzzle is active
    const key = e.key || "";
    if (e.altKey && (key === "f" || key === "F")) {
      e.preventDefault();
      autoSolve();
    }
  }

  function finish() {
    if (complete) return;
    complete = true;
    bus.emit("game.puzzle.complete");
  }

  function show() {
    if (root) root.style.display = "block";
  }
  function hide() {
    if (root) root.style.display = "none";
  }
  function setActive(v) {
    active = !!v;
    if (active) {
      root?.classList.add("active");
      root.style.pointerEvents = "auto";
      tray.style.pointerEvents = "auto";
      // Keyboard fine-tune only in preview (assembled) to help align

      startAnchorFollow();
      // Re-init scoreboard (guard in case previous game hid it asynchronously)
      bus.emit("score.init", { total: totalPieces, value: placedCount });
      bus.emit("score.show");
      bus.emit("score.lock");
      // Reinforce visibility in case of late hide from previous game
      setTimeout(() => bus.emit("score.show"), 32);
      setTimeout(() => bus.emit("score.show"), 120);
      // Stabilize scoreboard against stray events for ~600ms
      let attempts = 0;
      const maxAttempts = 6;
      const stabilizer = () => {
        attempts++;
        if (!active || complete) return;
        bus.emit("score.init", { total: totalPieces, value: placedCount });
        bus.emit("score.show");
        if (attempts < maxAttempts) setTimeout(stabilizer, 100);
      };
      setTimeout(stabilizer, 150);
      // Attach dev hotkey listener
      if (!onKeyDownBound) {
        onKeyDownBound = onGlobalKeyDown;
        window.addEventListener("keydown", onKeyDownBound);
      }
    } else {
      root?.classList.remove("active");
      root.style.pointerEvents = "none";

      stopAnchorFollow();
      // Detach dev hotkey listener
      if (onKeyDownBound) {
        window.removeEventListener("keydown", onKeyDownBound);
        onKeyDownBound = null;
      }
    }
  }

  function destroy() {
    if (resizeObserver) resizeObserver.disconnect();
    window.removeEventListener("pointermove", onPointerMoveBound || (() => {}));
    window.removeEventListener("pointerup", onPointerUpBound || (() => {}));
    if (onKeyDownBound) {
      window.removeEventListener("keydown", onKeyDownBound);
      onKeyDownBound = null;
    }
    piecesState.forEach((ps) => {
      ps.el?.remove();
    });
    piecesState.clear();
    root?.parentNode?.removeChild(root);
    stopAnchorFollow();

    bus.emit("score.unlock");
  }
  async function init(container) {
    buildDOM(container);
    initPieces();
    // Observe board resize
    resizeObserver = new ResizeObserver(() => {
      scheduleMeasureBoard();
    });
    resizeObserver.observe(board);
    window.addEventListener("resize", scheduleMeasureBoard);
    if (anchorObserver) {
      try {
        anchorObserver.disconnect();
      } catch {}
      anchorObserver = null;
    }
  }

  return { init, show, hide, setActive, destroy };
}
