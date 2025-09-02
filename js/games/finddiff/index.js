// Spot-the-difference mini game logic
import { gsap } from "gsap";

// Game tuning values / assets
const DIFF_RADIUS = 32; // marker radius
const REQUIRED_DIFFS = 10; // how many to find to win
const MASK_THRESHOLD = 200; // brightness threshold for mask
const QUAD_OFFSET = 70; // margin from window for movement centers
const HIGHLIGHT_SRC = "assets/games/finddiff/finded.png";
const ROOM_SRC = "assets/games/finddiff/finddiff-room.png";
const MASK_SRC = "assets/games/finddiff/finddiff-mask.png";
const BRUSH_CURSOR_SRC = "assets/games/finddiff/brush.png";
const HAND_IMG_SRC = "assets/games/finddiff/hand.png";
// Spring motion tuning (critically damped-ish subjective values)
const SPRING_STIFFNESS = 0.04; // higher -> snappier
const SPRING_DAMPING = 0.32; // higher -> less oscillation
const SPRING_EPS = 0.05; // stop threshold (px)

export function createGame({ bus }) {
  let root, canvas, ctx, overlayLayer, stage;
  let maskData = null;
  let found = [];
  let active = false;
  let complete = false;
  let highlightTemplate;
  let brushFollower;
  let quadCenters = [];
  let handImg;
  let lastQuadrant = -1;
  // Spring motion state
  let posX = 0,
    posY = 0,
    velX = 0,
    velY = 0,
    targetX = 0,
    targetY = 0;
  let springRunning = false;
  let rootSize = null;
  let setX, setY;
  let lastTarget = { x: null, y: null };

  const load = (src) =>
    new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    });

  // Build game DOM nodes
  function buildDOM(container) {
    root = document.createElement("div");
    root.className = "finddiff-root";
    stage = document.createElement("div");
    stage.className = "finddiff-stage";
    canvas = document.createElement("canvas");
    canvas.className = "finddiff-canvas";
    overlayLayer = document.createElement("div");
    overlayLayer.className = "finddiff-overlay";
    stage.append(canvas, overlayLayer);
    handImg = document.createElement("img");
    handImg.className = "finddiff-hand";
    handImg.src = HAND_IMG_SRC;
    stage.appendChild(handImg);
    root.append(stage);
    container.append(root);
  }

  // Create and inject custom brush cursor element
  function setupCursor() {
    brushFollower = document.createElement("img");
    Object.assign(brushFollower, { src: BRUSH_CURSOR_SRC, alt: "" });
    Object.assign(brushFollower.style, {
      position: "fixed",
      left: 0,
      top: 0,
      width: "112px",
      height: "112px",
      pointerEvents: "none",
      zIndex: 9999,
      transform: "translate(-9999px,-9999px)",
    });
    document.body.appendChild(brushFollower);
  }

  // Precompute 4 clamped movement centers (corners-ish)
  function computeQuadrants() {
    const w = window.innerWidth,
      h = window.innerHeight;
    const halfW = (rootSize?.w || 0) / 2;
    const halfH = (rootSize?.h || 0) / 2;
    const minX = halfW + QUAD_OFFSET;
    const maxX = w - halfW - QUAD_OFFSET;
    const minY = halfH + QUAD_OFFSET;
    const maxY = h - halfH - QUAD_OFFSET;
    const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
    quadCenters = [
      { x: w * 0.25, y: h * 0.25 },
      { x: w * 0.75, y: h * 0.25 },
      { x: w * 0.25, y: h * 0.75 },
      { x: w * 0.75, y: h * 0.75 },
    ].map((c) => ({ x: clamp(c.x, minX, maxX), y: clamp(c.y, minY, maxY) }));
  }

  // Update target center (spring drives actual motion)
  function centerRootAt(cx, cy, instant = false) {
    if (!root) return;
    if (!rootSize) {
      const r = root.getBoundingClientRect();
      rootSize = { w: r.width, h: r.height };
    }
    // desired top-left from requested center
    let nx = cx - rootSize.w / 2;
    let ny = cy - rootSize.h / 2;
    const maxX = Math.max(0, window.innerWidth - rootSize.w);
    const maxY = Math.max(0, window.innerHeight - rootSize.h);
    if (nx < 0) nx = 0;
    else if (nx > maxX) nx = maxX;
    if (ny < 0) ny = 0;
    else if (ny > maxY) ny = maxY;
    targetX = nx;
    targetY = ny;
    if (instant) {
      posX = targetX;
      posY = targetY;
      velX = velY = 0;
      if (!setX || !setY) {
        setX = gsap.quickSetter(root, "x", "px");
        setY = gsap.quickSetter(root, "y", "px");
      }
      setX(posX);
      setY(posY);
    }
  }

  function stepSpring(dt) {
    // Clamp dt to avoid huge jumps (ms -> s)
    if (dt > 0.05) dt = 0.05;
    const dx = targetX - posX;
    const dy = targetY - posY;
    // Hooke's law with damping: a = k*x - c*v
    const ax = SPRING_STIFFNESS * dx - SPRING_DAMPING * velX;
    const ay = SPRING_STIFFNESS * dy - SPRING_DAMPING * velY;
    velX += ax * dt * 60; // scale to feel independent of frame rate
    velY += ay * dt * 60;
    posX += velX * dt * 60;
    posY += velY * dt * 60;
    // Snap when near target & slow
    if (
      Math.abs(dx) < SPRING_EPS &&
      Math.abs(dy) < SPRING_EPS &&
      Math.abs(velX) < 0.02 &&
      Math.abs(velY) < 0.02
    ) {
      posX = targetX;
      posY = targetY;
      velX = velY = 0;
    }
    if (!setX || !setY) {
      setX = gsap.quickSetter(root, "x", "px");
      setY = gsap.quickSetter(root, "y", "px");
    }
    setX(posX);
    setY(posY);
  }

  function runSpringLoop() {
    if (springRunning) return; // avoid multiple loops
    springRunning = true;
    let last = performance.now();
    const loop = () => {
      if (!springRunning) return;
      if (!complete) {
        const now = performance.now();
        const dt = (now - last) / 1000;
        last = now;
        stepSpring(dt);
        requestAnimationFrame(loop);
      }
    };
    requestAnimationFrame(loop);
  }

  // Map mouse pos to quadrant index 0..3
  function quadrantFromMouse(mx, my) {
    const left = mx < window.innerWidth / 2;
    const top = my < window.innerHeight / 2;
    return top ? (left ? 0 : 1) : left ? 2 : 3;
  }

  // Move brush & maybe tween root to new quadrant center
  function onMouseMove(e) {
    if (brushFollower)
      brushFollower.style.transform = `translate(${e.clientX - 24}px,${
        e.clientY - 24
      }px)`;
    if (active && !complete) {
      const qIdx = quadrantFromMouse(e.clientX, e.clientY);
      const q = quadCenters[qIdx];
      if (q) {
        const need =
          qIdx !== lastQuadrant ||
          (lastTarget.x - q.x) ** 2 + (lastTarget.y - q.y) ** 2 > 25;
        if (need) {
          lastQuadrant = qIdx;
          lastTarget.x = q.x;
          lastTarget.y = q.y;
          centerRootAt(q.x, q.y, false);
        }
      }
    }
  }

  // Recompute centers on resize and reposition
  function onResize() {
    rootSize = null;
    if (root) {
      const r = root.getBoundingClientRect();
      rootSize = { w: r.width, h: r.height };
    }
    computeQuadrants();
    if (!complete) {
      const idx = lastQuadrant >= 0 ? lastQuadrant : 0;
      const q = quadCenters[idx];
      if (q) centerRootAt(q.x, q.y, true);
    } else freezeBottomRight();
  }

  // Convert mask image to pixel data
  function buildMask(maskImg) {
    const c = document.createElement("canvas");
    c.width = maskImg.naturalWidth;
    c.height = maskImg.naturalHeight;
    const cctx = c.getContext("2d");
    cctx.drawImage(maskImg, 0, 0);
    maskData = cctx.getImageData(0, 0, c.width, c.height);
  }

  // Check if pixel belongs to a diff area
  function isDiff(x, y) {
    if (!maskData) return false;
    if (x < 0 || y < 0 || x >= maskData.width || y >= maskData.height)
      return false;
    const i = ((y | 0) * maskData.width + (x | 0)) * 4;
    const d = maskData.data;
    return (d[i] + d[i + 1] + d[i + 2]) / 3 > MASK_THRESHOLD;
  }

  // Prevent duplicate finds near existing marker
  function alreadyFound(x, y) {
    return found.some(
      (f) => (f.x - x) ** 2 + (f.y - y) ** 2 < DIFF_RADIUS * DIFF_RADIUS
    );
  }

  // Place a visual marker
  function addMarker(x, y) {
    const m = highlightTemplate.cloneNode();
    m.style.left = x + "px";
    m.style.top = y + "px";
    m.style.width = m.style.height = DIFF_RADIUS * 2 + "px";
    overlayLayer.appendChild(m);
  }

  // On click sample a small ring to validate a diff
  function handleClick(e) {
    if (!active || complete) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    if (alreadyFound(x, y)) return;
    const samples = 12,
      r = 8;
    let hit = false;
    for (let i = 0; i < samples; i++) {
      const a = (i * (Math.PI * 2)) / samples;
      if (isDiff(x + Math.cos(a) * r, y + Math.sin(a) * r)) {
        hit = true;
        break;
      }
    }
    if (hit) {
      found.push({ x, y });
      addMarker(x, y);
      if (found.length >= REQUIRED_DIFFS) finish();
    }
  }

  function finish() {
    complete = true;
    bus.emit("game.finddiff.complete");
    freezeBottomRight();
    if (brushFollower) brushFollower.style.display = "none";
    document.body.style.cursor = "";
  }

  // Park game UI bottom-right when done
  function freezeBottomRight() {
    if (!root) return;
    springRunning = false; // stop spring updates
    const rect = root.getBoundingClientRect();
    const margin = 40;
    const x = Math.max(0, window.innerWidth - rect.width - margin);
    const y = Math.max(0, window.innerHeight - rect.height - margin);
    gsap.set(root, { x, y });
  }

  // Toggle active gameplay (cursor + movement)
  function setActive(v) {
    active = v;
    root.classList.toggle("inactive", !v);
    if (v && !complete) {
      document.body.style.cursor = "none";
      if (brushFollower) brushFollower.style.display = "block";
      if (lastQuadrant >= 0) {
        const q = quadCenters[lastQuadrant];
        if (q) centerRootAt(q.x, q.y, false);
      }
    } else {
      document.body.style.cursor = "";
      if (brushFollower) brushFollower.style.display = "none";
    }
  }

  function show() {
    root.style.display = "block";
  }
  function hide() {
    root.style.display = "none";
  }

  // Remove listeners & detached nodes
  function destroy() {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("resize", onResize);
    canvas.removeEventListener("click", handleClick);
    if (brushFollower?.parentNode)
      brushFollower.parentNode.removeChild(brushFollower);
    if (handImg?.parentNode) handImg.parentNode.removeChild(handImg);
  }

  // Entry point: build UI, load assets, start listeners
  async function init(container) {
    buildDOM(container);
    setupCursor();
    highlightTemplate = new Image();
    highlightTemplate.src = HIGHLIGHT_SRC;
    Object.assign(highlightTemplate.style, {
      position: "absolute",
      pointerEvents: "none",
      transform: "translate(-50%, -50%)",
    });
    const [room, mask] = await Promise.all([load(ROOM_SRC), load(MASK_SRC)]);
    canvas.width = room.naturalWidth;
    canvas.height = room.naturalHeight;
    ctx = canvas.getContext("2d");
    ctx.drawImage(room, 0, 0);
    buildMask(mask);
    canvas.addEventListener("click", handleClick);
    const r = root.getBoundingClientRect();
    rootSize = { w: r.width, h: r.height };
    computeQuadrants();
    const startQ = quadCenters[3] || quadCenters[0]; // start bottom-right
    if (startQ) {
      lastQuadrant = quadCenters.indexOf(startQ);
      lastTarget.x = startQ.x;
      lastTarget.y = startQ.y;
      centerRootAt(startQ.x, startQ.y, true);
    }
    runSpringLoop();
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);
  }

  return { init, show, hide, destroy, setActive };
}
