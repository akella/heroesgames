import { makeSlideLayer } from "./makeSlideLayer.js";

// Discover slide IDs from DOM (elements with id="slideN"), sorted numerically
export function discoverSlideIdsFromDOM() {
  const els = Array.from(document.querySelectorAll('[id^="slide"]'));
  const ids = els
    .map((el) => el.id)
    .filter((id) => /^slide\d+$/.test(id))
    .sort((a, b) => parseInt(a.slice(5), 10) - parseInt(b.slice(5), 10));
  return Array.from(new Set(ids));
}

// Build an object of slide layer instances: { slide1Layer: Layer, ... }
export function buildSlideLayers(slideIds) {
  const layers = {};
  slideIds.forEach((sid) => {
    const key = `${sid}Layer`;
    layers[key] = makeSlideLayer(sid);
  });
  return layers;
}

// Build a mapping from slide id to an array of layer keys for that slide
export function buildLayerMap(slideIds) {
  const map = {};
  slideIds.forEach((sid) => {
    map[sid] = [`${sid}Layer`];
  });
  return map;
}

// Convenience: generate layers and map from DOM, with optional fallback range
export function generateLayersFromDOM({
  fallbackCount = 0,
  include = [],
} = {}) {
  let slideIds = discoverSlideIdsFromDOM();
  if (!slideIds.length && fallbackCount > 0) {
    slideIds = Array.from({ length: fallbackCount }, (_, i) => `slide${i + 1}`);
  }
  if (Array.isArray(include) && include.length) {
    const set = new Set(slideIds);
    include.forEach((id) => set.add(id));
    slideIds = Array.from(set).sort((a, b) => {
      const na = parseInt((a || "").replace("slide", ""), 10);
      const nb = parseInt((b || "").replace("slide", ""), 10);
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return String(a).localeCompare(String(b));
    });
  }
  const layers = buildSlideLayers(slideIds);
  const layerMap = buildLayerMap(slideIds);
  return { layers, layerMap };
}
