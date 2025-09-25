// Generic interactive item handling default / active / hover layer visibility
import { HighlightCircle } from "./HighlightCircle.js";

export class InteractiveItem {
  constructor(config, ctx) {
    this.config = config;
    this.shaderLayer = ctx.shaderLayer;
    this.bus = ctx.bus;
    this._bbox = null; // in mask/newUV space (same as shader newUV before parallax)
    this._isActiveSlide = false;
    this._isHover = false;
    this._isVisible = false;
    this._currentSlide = null;

    if (this.config.highlight !== false) {
      this._highlight = new HighlightCircle(this, this.config);
    }
  }

  init() {
    const { layers } = this.config;
    if (layers.default) this.shaderLayer.setLayerEnabled(layers.default, false);
    if (layers.active) this.shaderLayer.setLayerEnabled(layers.active, false);
    if (layers.hover) this.shaderLayer.setLayerEnabled(layers.hover, false);

    this.shaderLayer.onBBoxesReady(() => {
      const targetLayerId = this._layerIdForBBox();
      this._bbox = this.shaderLayer.getLayerBBox(targetLayerId);
      this._highlight?.onBBoxReady();
    });
  }

  destroy() {
    const { layers } = this.config;
    if (layers.default) this.shaderLayer.setLayerEnabled(layers.default, false);
    if (layers.active) this.shaderLayer.setLayerEnabled(layers.active, false);
    if (layers.hover) this.shaderLayer.setLayerEnabled(layers.hover, false);
    this._highlight?.destroy?.();
  }

  _layerIdForBBox() {
    const { bboxLayer = "active", layers } = this.config;
    if (bboxLayer === "default")
      return layers.default || layers.active || layers.hover;
    if (bboxLayer === "hover")
      return layers.hover || layers.active || layers.default;
    return layers.active || layers.default || layers.hover;
  }

  onFlowProgress(val) {
    this._currentSlide = val;
    const { activeSlide, visibleSlides } = this.config;
    const visible = Array.isArray(visibleSlides)
      ? visibleSlides.includes(val)
      : true;
    const active = visible && activeSlide && val === activeSlide;
    const changedVisibility = visible !== this._isVisible;
    const changedActive = active !== this._isActiveSlide;
    if (changedVisibility || changedActive) {
      this._isVisible = visible;
      this._isActiveSlide = active;
      this._applyState(changedVisibility);
      if (this.config.highlightDebug) {
        console.debug("InteractiveItem state", this.config.id, {
          slide: val,
          visible,
          active,
        });
      }
    }
    // Re-evaluate highlight visibility every slide change (even if base state unchanged)
    this._highlight?.onSlideChange();
  }

  _applyState(visibilityChanged) {
    const { layers } = this.config;
    if (!this._isVisible) {
      // fully hide all variants
      if (layers.default)
        this.shaderLayer.setLayerEnabled(layers.default, false);
      if (layers.active) this.shaderLayer.setLayerEnabled(layers.active, false);
      if (layers.hover) this.shaderLayer.setLayerEnabled(layers.hover, false);
      if (this._isHover) this._emit("hover.off");
      if (visibilityChanged) this._emit("hide");
      this._isHover = false;
      this._highlight?.onStateChange();
      return;
    }
    // visible
    if (this._isActiveSlide) {
      if (layers.default)
        this.shaderLayer.setLayerEnabled(layers.default, false);
      if (layers.active) this.shaderLayer.setLayerEnabled(layers.active, true);
      if (layers.hover) this.shaderLayer.setLayerEnabled(layers.hover, false);
      this._emit("activate");
    } else {
      if (layers.default)
        this.shaderLayer.setLayerEnabled(layers.default, true);
      if (layers.active) this.shaderLayer.setLayerEnabled(layers.active, false);
      if (layers.hover) this.shaderLayer.setLayerEnabled(layers.hover, false);
      if (this._isHover) this._emit("hover.off");
      this._isHover = false;
      this._emit("deactivate");
      if (visibilityChanged) this._emit("show");
    }
    this._highlight?.onStateChange();
  }

  pointerMove(x, y) {
    if (!this.config.hover) return;
    if (!this._isVisible) return;
    // Optional: limit hover to specific slides without toggling base visibility
    if (
      Array.isArray(this.config.hoverOnlyOnSlides) &&
      !this.config.hoverOnlyOnSlides.includes(this._currentSlide)
    ) {
      return;
    }
    if (!(this._isActiveSlide || this.config.hoverWhenInactive)) return;
    if (!this._bbox) return;
    // Map screen UV to newUV (same aspect correction as shader)
    const depthAspect = this.shaderLayer.getDepthAspect();
    const screenAspect = window.innerWidth / window.innerHeight;
    let newX = x;
    let newY = y;
    if (depthAspect > screenAspect) {
      newX = ((x - 0.5) * screenAspect) / depthAspect + 0.5;
    } else {
      newY = ((y - 0.5) * depthAspect) / screenAspect + 0.5;
    }
    // Optional approximate parallax shift
    if (this.config.useParallaxInHit) {
      const parallaxStrength = 0.05; // sync with shader uniform default
      const mx = (window._shaderMouseX ?? x) - 0.5; // fallback
      const my = (window._shaderMouseY ?? y) - 0.5;
      // We don't know depth per pixel here; use mid depth 0.5
      newX -= mx * 0.5 * 0.5 * parallaxStrength;
      newY -= my * 0.5 * 0.5 * parallaxStrength;
    }

    const inside = this._pointInsideBBox(newX, newY, this._bbox);
    if (inside !== this._isHover) {
      this._isHover = inside;
      const { layers } = this.config;
      if (layers.hover) this.shaderLayer.setLayerEnabled(layers.hover, inside);
      this._emit(inside ? "hover.on" : "hover.off");
      this._highlight?.onHoverChange();
    }
  }

  _pointInsideBBox(x, y, bbox) {
    if (!bbox) return false;
    const [minX, minY] = bbox.min;
    const [sizeX, sizeY] = bbox.size;
    return x >= minX && x <= minX + sizeX && y >= minY && y <= minY + sizeY;
  }

  _emit(suffix) {
    const p = this.config.eventsPrefix || this.config.id;
    this.bus.emit(`${p}.${suffix}`, { id: this.config.id });
  }

  click(x, y) {
    if (!this.config.click) return false;
    if (!this._isVisible) return false;
    if (!(this._isActiveSlide || this.config.clickWhenInactive)) return false;
    if (!this._bbox) return false;
    const depthAspect = this.shaderLayer.getDepthAspect();
    const screenAspect = window.innerWidth / window.innerHeight;
    let newX = x;
    let newY = y;
    if (depthAspect > screenAspect) {
      newX = ((x - 0.5) * screenAspect) / depthAspect + 0.5;
    } else {
      newY = ((y - 0.5) * depthAspect) / screenAspect + 0.5;
    }
    const inside = this._pointInsideBBox(newX, newY, this._bbox);
    if (inside) {
      this._emit("click");
      return true;
    }
    return false;
  }
}
