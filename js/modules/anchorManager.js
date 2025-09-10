// Simple anchor layout system to keep specific images at fixed design coordinates
// relative to a base 1920x1080 layout, scaling & centering for any viewport.

const DESIGN_W = 1920;
const DESIGN_H = 1080;

function layoutAnchors() {
  const sw = window.innerWidth;
  const sh = window.innerHeight;
  const scale = Math.min(sw / DESIGN_W, sh / DESIGN_H);
  const offsetX = (sw - DESIGN_W * scale) / 2;
  const offsetY = (sh - DESIGN_H * scale) / 2;

  document.querySelectorAll(".js-anchor").forEach((el) => {
    const x = parseFloat(el.dataset.x || "0");
    const y = parseFloat(el.dataset.y || "0");
    const w = parseFloat(el.dataset.w || "0");
    const h = parseFloat(el.dataset.h || "0");
    el.style.position = "absolute";
    el.style.left = offsetX + x * scale + "px";
    el.style.top = offsetY + y * scale + "px";
    if (w) el.style.width = w * scale + "px";
    if (h) el.style.height = h * scale + "px";
    // Ensure proper stacking if needed
    if (!el.style.zIndex) el.style.zIndex = "12";
  });
}

export function initAnchorManager() {
  layoutAnchors();
  window.addEventListener("resize", layoutAnchors);
  // Optional: mutation observer if slides dynamically injected later
  const obs = new MutationObserver((muts) => {
    let need = false;
    for (const m of muts) {
      if (
        [...m.addedNodes].some(
          (n) =>
            n.nodeType === 1 && n.classList && n.classList.contains("js-anchor")
        )
      ) {
        need = true;
        break;
      }
    }
    if (need) layoutAnchors();
  });
  obs.observe(document.body, { childList: true, subtree: true });
  // Return simple API (random layout removed / reverted)
  return {
    update: () => {
      layoutAnchors();
    },
  };
}
