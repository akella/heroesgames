// Spot the difference game (cleaned)

const DIFF_RADIUS = 32; // px radius for marking found spot
const REQUIRED_DIFFS = 10; // updated total differences required

export function createGame({ bus }) {
  let root, canvas, ctx, maskImg, displayImg, overlayLayer, stage, handImg;
  let width = 0,
    height = 0;
  let found = []; // {x,y}
  let foundMask; // boolean 2d array flattened
  let loading = true;
  let complete = false;
  let active = false; // clicks only when active
  const HIGHLIGHT_SRC = "assets/games/finddiff/finded.png";
  let highlightTemplate = null; // preloaded image template
  const BRUSH_CURSOR_SRC = "assets/games/finddiff/brush.png";
  let brushFollower = null;
  const brushHotspot = { x: 24, y: 24 }; // doubled hotspot for larger cursor

  // Quadrant-follow movement state
  let quadCenters = [];
  let targetCX = 0,
    targetCY = 0;
  let curCX = 0,
    curCY = 0;
  let startCX = 0,
    startCY = 0;
  let transitionStart = null;
  const TRANSITION_DURATION = 600;
  const QUAD_OFFSET = 50;
  let animFrame = 0;
  let lastMouseX = window.innerWidth / 2;
  let lastMouseY = window.innerHeight / 2;

  function computeQuadrants() {
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    quadCenters = [
      { x: cw * 0.25 + QUAD_OFFSET, y: ch * 0.25 + QUAD_OFFSET },
      { x: cw * 0.75 - QUAD_OFFSET, y: ch * 0.25 + QUAD_OFFSET },
      { x: cw * 0.25 + QUAD_OFFSET, y: ch * 0.75 - QUAD_OFFSET },
      { x: cw * 0.75 - QUAD_OFFSET, y: ch * 0.75 - QUAD_OFFSET },
    ];
    quadCenters.forEach((c) => {
      c.x = Math.min(Math.max(c.x, QUAD_OFFSET), cw - QUAD_OFFSET);
      c.y = Math.min(Math.max(c.y, QUAD_OFFSET), ch - QUAD_OFFSET);
    });
    pickTarget(lastMouseX, lastMouseY, true);
  }

  function pickTarget(mx, my, immediate = false) {
    lastMouseX = mx;
    lastMouseY = my;
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const left = mx < cw / 2;
    const top = my < ch / 2;
    const idx = top ? (left ? 0 : 1) : left ? 2 : 3;
    const c = quadCenters[idx];
    if (!c) return;
    if (c.x === targetCX && c.y === targetCY) return;
    targetCX = c.x;
    targetCY = c.y;
    if (immediate) {
      curCX = targetCX;
      curCY = targetCY;
      transitionStart = null;
      applyRootTransform();
    } else {
      startCX = curCX;
      startCY = curCY;
      transitionStart = performance.now();
    }
  }

  function applyRootTransform() {
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const x = curCX - rect.width / 2;
    const y = curCY - rect.height / 2;
    root.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function animate() {
    if (transitionStart !== null) {
      const now = performance.now();
      let t = (now - transitionStart) / TRANSITION_DURATION;
      if (t >= 1) {
        t = 1;
        transitionStart = null;
      }
      const k = easeInOutCubic(Math.min(Math.max(t, 0), 1));
      curCX = startCX + (targetCX - startCX) * k;
      curCY = startCY + (targetCY - startCY) * k;
      applyRootTransform();
    }
    animFrame = requestAnimationFrame(animate);
  }
  function onMouseMove(e) {
    if (!active) return;
    pickTarget(e.clientX, e.clientY);
    if (brushFollower && !complete) {
      brushFollower.style.transform = `translate(${
        e.clientX - brushHotspot.x
      }px, ${e.clientY - brushHotspot.y}px)`;
    }
  }
  function onResize() {
    computeQuadrants();
  }

  function loadImage(src) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });
  }

  async function init(container) {
    root = document.createElement("div");
    root.className = "finddiff-root";

    stage = document.createElement("div");
    stage.className = "finddiff-stage";
    canvas = document.createElement("canvas");
    canvas.className = "finddiff-canvas";
    overlayLayer = document.createElement("div");
    overlayLayer.className = "finddiff-overlay";
    handImg = document.createElement("img");
    handImg.className = "finddiff-hand";
    handImg.src = "assets/games/finddiff/hand.png";
    handImg.alt = "";
    handImg.setAttribute("aria-hidden", "true");

    stage.appendChild(canvas);
    stage.appendChild(overlayLayer);
    stage.appendChild(handImg);
    root.appendChild(stage);
    container.appendChild(root);

    // Preload highlight asset
    highlightTemplate = new Image();
    highlightTemplate.src = HIGHLIGHT_SRC;
    highlightTemplate.className = "finddiff-found";
    highlightTemplate.style.position = "absolute";
    highlightTemplate.style.pointerEvents = "none";
    highlightTemplate.style.transform = "translate(-50%, -50%)";

    // Preload brush cursor image; once loaded ensure usable size (cap to 96px)
    try {
      const brushImg = await loadImage(BRUSH_CURSOR_SRC);
      const maxDim = 96; // reduce if image huge so browsers accept it
      const w = brushImg.naturalWidth;
      const h = brushImg.naturalHeight;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      if (scale < 1) {
        const c = document.createElement("canvas");
        c.width = Math.round(w * scale);
        c.height = Math.round(h * scale);
        const cctx = c.getContext("2d");
        cctx.drawImage(brushImg, 0, 0, c.width, c.height);
        // (old cursor scaling logic removed)
      }
    } catch (e) {}
    // Create brush follower element
    brushFollower = document.createElement("img");
    brushFollower.src = BRUSH_CURSOR_SRC;
    brushFollower.alt = "";
    brushFollower.className = "finddiff-brush-cursor";
    Object.assign(brushFollower.style, {
      position: "fixed",
      left: "0",
      top: "0",
      width: "112px",
      height: "112px",
      pointerEvents: "none",
      zIndex: "9999",
      transform: "translate(-9999px,-9999px)",
    });
    document.body.appendChild(brushFollower);

    // Load images
    const [img, mask] = await Promise.all([
      loadImage("assets/games/finddiff/finddiff-room.png"),
      loadImage("assets/games/finddiff/finddiff-mask.png"),
    ]).catch((err) => {
      throw err;
    });
    displayImg = img;
    maskImg = mask;
    width = img.naturalWidth;
    height = img.naturalHeight;
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext("2d");
    ctx.drawImage(displayImg, 0, 0);

    foundMask = new Uint8Array(width * height);

    canvas.addEventListener("click", onClick);
    loading = false;

    // Movement system
    root.style.left = "0px";
    root.style.top = "0px";
    computeQuadrants();
    pickTarget(window.innerWidth / 2, window.innerHeight / 2, true);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);
    animFrame = requestAnimationFrame(animate);
  }

  function relativePos(evt) {
    const rect = canvas.getBoundingClientRect();
    const x = (evt.clientX - rect.left) * (canvas.width / rect.width);
    const y = (evt.clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
  }

  function isDiffPixel(x, y) {
    if (!maskImg) return false;
    const temp = document.createElement("canvas");
    temp.width = maskImg.naturalWidth;
    temp.height = maskImg.naturalHeight;
    const tctx = temp.getContext("2d");
    tctx.drawImage(maskImg, 0, 0);
    const data = tctx.getImageData(0, 0, temp.width, temp.height).data;
    const ix = (Math.floor(y) * temp.width + Math.floor(x)) * 4;
    // Assume white (255,255,255) marks differences; threshold on brightness
    const r = data[ix],
      g = data[ix + 1],
      b = data[ix + 2];
    const bright = (r + g + b) / 3;
    return bright > 200; // white-ish
  }

  // Optimize: cache mask pixel data once
  let maskDataCache = null;
  function ensureMaskData() {
    if (maskDataCache) return maskDataCache;
    const temp = document.createElement("canvas");
    temp.width = maskImg.naturalWidth;
    temp.height = maskImg.naturalHeight;
    const tctx = temp.getContext("2d");
    tctx.drawImage(maskImg, 0, 0);
    maskDataCache = tctx.getImageData(0, 0, temp.width, temp.height);
    return maskDataCache;
  }

  function isDiffPixelFast(x, y) {
    const md = ensureMaskData();
    const w = md.width;
    const h = md.height;
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    const ix = (Math.floor(y) * w + Math.floor(x)) * 4;
    const d = md.data;
    const bright = (d[ix] + d[ix + 1] + d[ix + 2]) / 3;
    return bright > 200;
  }

  function markFound(x, y) {
    found.push({ x, y });
    // Use preloaded template clone for instant display
    const img = highlightTemplate ? highlightTemplate.cloneNode() : new Image();
    if (!highlightTemplate) {
      // fallback if preload failed
      img.src = HIGHLIGHT_SRC;
      img.className = "finddiff-found";
      img.style.position = "absolute";
      img.style.pointerEvents = "none";
      img.style.transform = "translate(-50%, -50%)";
    }
    img.style.left = x + "px";
    img.style.top = y + "px";
    img.style.width = DIFF_RADIUS * 2 + "px";
    img.style.height = DIFF_RADIUS * 2 + "px";
    overlayLayer.appendChild(img);
    if (found.length >= REQUIRED_DIFFS) finish();
  }

  function alreadyFound(x, y) {
    return found.some(
      (f) => (f.x - x) ** 2 + (f.y - y) ** 2 < DIFF_RADIUS * DIFF_RADIUS
    );
  }

  function onClick(evt) {
    if (loading || complete || !active) return;
    const { x, y } = relativePos(evt);
    if (alreadyFound(x, y)) return;
    // Tolerance sampling
    const samples = 12;
    let hit = false;
    const angleStep = (Math.PI * 2) / samples;
    for (let i = 0; i < samples; i++) {
      const sx = x + Math.cos(i * angleStep) * 8;
      const sy = y + Math.sin(i * angleStep) * 8;
      if (isDiffPixelFast(sx, sy)) {
        hit = true;
        break;
      }
    }
    if (hit) markFound(x, y);
  }

  function finish() {
    complete = true;
    bus.emit("game.finddiff.complete");
    // Freeze and move to bottom-right
    freezeToBottomRight();
    if (root) root.classList.remove("active-cursor");
    if (brushFollower) brushFollower.style.display = "none";
    document.body.style.cursor = "";
  }

  function freezeToBottomRight() {
    if (!root) return;
    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = 0;
    }
    transitionStart = null;
    const margin = 40;
    const rect = root.getBoundingClientRect();
    const x = Math.max(0, window.innerWidth - rect.width - margin);
    const y = Math.max(0, window.innerHeight - rect.height - margin);
    root.style.transform = `translate(${x}px, ${y}px)`;
  }

  function onResize() {
    if (complete) {
      freezeToBottomRight();
    } else {
      computeQuadrants();
    }
  }

  function show() {
    root.style.display = "block";
  }
  function hide() {
    root.style.display = "none";
  }
  function update(dt) {}
  function destroy() {
    canvas.removeEventListener("click", onClick);
  }
  function setActive(v) {
    active = v;
    root.classList.toggle("inactive", !active);
    if (active && !complete) {
      root.classList.add("active-cursor");
      pickTarget(lastMouseX, lastMouseY, false);
      if (brushFollower) {
        brushFollower.style.display = "block";
      }
      document.body.style.cursor = "none";
    } else {
      root.classList.remove("active-cursor");
      if (brushFollower) brushFollower.style.display = "none";
      document.body.style.cursor = "";
    }
  }

  const _origDestroy = destroy;
  function destroyWrapped() {
    _origDestroy();
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("resize", onResize);
    if (animFrame) cancelAnimationFrame(animFrame);
    if (root) root.classList.remove("active-cursor");
    if (brushFollower && brushFollower.parentNode)
      brushFollower.parentNode.removeChild(brushFollower);
    document.body.style.cursor = "";
  }

  return { init, show, hide, update, destroy: destroyWrapped, setActive };
}
