export function setCanvasVisibility(bus, slide, activeSlides) {
  try {
    bus.emit("scene.canvas", { visible: activeSlides.has(slide) });
  } catch {}
}

export function setParallax(bus, enabled) {
  try {
    bus.emit("scene.parallax", { enabled });
  } catch {}
}

export function setView(bus, view) {
  try {
    bus.emit("scene.view", view);
  } catch {}
}

export function resetView(bus) {
  try {
    bus.emit("scene.view.reset");
  } catch {}
}

export function dispatchChar(mode) {
  if (!mode) return;
  try {
    document.dispatchEvent(
      new CustomEvent(mode === "show" ? "showCharacter" : "hideCharacter")
    );
  } catch {}
}
