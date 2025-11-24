export class HighlightCircle {
  constructor(item, config) {
    this.item = item;
    this.shaderLayer = item.shaderLayer;
    this.config = config || {};

    this.mode = this.config.highlightMode || "visible";
    this.delay = this.config.highlightDelay || 0;
    this.onlyOnSlides = this.config.highlightOnlyOnSlides || null;
    this.parallax = this.config.highlightParallax === true;
    this.offset = this.config.highlightOffset || { x: 0, y: 0 };

    this._el = null;
    this._visibleFlag = false;
    this._depth = null;
    this._showAt = 0;
    this._occluded = false;
    this._lastPx = 0;
    this._lastPy = 0;

    this._create();
    HighlightCircle._register(this);
  }

  onBBoxReady() {
    this._updateVisibility();
    this._updatePosition();
  }
  onStateChange() {
    this._updateVisibility();
  }
  onSlideChange() {
    // No longer reparent per slide; container is fixed.
    this._updateVisibility();
  }
  onHoverChange() {
    this._updateVisibility();
  }

  destroy() {
    if (this._el) this._el.remove();
    this._el = null;
    HighlightCircle._items?.delete(this);
  }

  _create() {
    const el = document.createElement("div");
    el.className = "interactive-highlight";
    Object.assign(el.style, {
      position: "absolute",
      width: "48px",
      height: "48px",
      border: "2px solid #FFFFFF",
      borderRadius: "50%",
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      pointerEvents: "none",
      left: 0,
      top: 0,
      transform: "translate3d(-1000px,-1000px,0)",
      transition: "opacity 0.15s",
      opacity: 0,
      zIndex: 14,
      animation: "highlight-yoyo 2s ease-in-out infinite",
    });
    this._el = el;
    HighlightCircle._ensureKeyframes();
    const container = HighlightCircle._ensureContainer();
    container.appendChild(el);
  }

  _updateVisibility() {
    if (!this._el) return;
    const it = this.item;
    const hasBBox = !!it._bbox;
    if (!hasBBox || !it._isVisible) {
      this._setVisible(false);
      return;
    }
    // Suppress highlights on gameplay slides
    const s = it._currentSlide;
    if (
      s === "slide33" ||
      s === "slide34" ||
      s === "slide35" ||
      s === "slide36" ||
      s === "slide37" ||
      s === "slide38" ||
      s === "slide39" ||
      s === "slide40"
    ) {
      this._setVisible(false);
      return;
    }
    let modeOk = false;
    switch (this.mode) {
      case "always":
        modeOk = true;
        break;
      case "active":
        modeOk = it._isActiveSlide || !this.config.activeSlide;
        break;
      case "visible":
        modeOk = it._isVisible;
        break;
      case "hover":
        modeOk = it._isHover;
        break;
    }
    if (!modeOk) {
      this._setVisible(false);
      return;
    }
    // Hide while hovered (global behavior)
    if (this.item._isHover) {
      this._setVisible(false);
      return;
    }
    if (this.onlyOnSlides && this.onlyOnSlides.length) {
      if (!this.onlyOnSlides.includes(it._currentSlide)) {
        this._setVisible(false);
        return;
      }
    }
    this._setVisible(true);
  }

  _setVisible(flag) {
    if (flag === this._visibleFlag) return;
    this._visibleFlag = flag;
    if (flag) {
      this._showAt = performance.now() + this.delay;
    } else if (this._el) {
      this._el.style.opacity = "0";
    }
  }

  _updatePosition() {
    if (!this._visibleFlag || !this._el || !this.item._bbox) return;
    const bbox = this.item._bbox;
    const depthAspect = this.shaderLayer.getDepthAspect();
    const screenAspect = window.innerWidth / window.innerHeight;
    let cxNew = bbox.min[0] + bbox.size[0] * 0.5;
    let cyNew = bbox.min[1] + bbox.size[1] * 0.5;

    if (this.parallax) {
      try {
        if (this._depth == null) {
          this._depth = HighlightCircle._sampleDepthAt(
            cxNew,
            cyNew,
            this.shaderLayer
          );
          if (this._depth == null) this._depth = this.config.depthHint ?? 0.5;
        }
        const mouseVec = this.shaderLayer.targetMouse ||
          this.shaderLayer.mouse || { x: 0.5, y: 0.5 };
        const parallaxStrength =
          this.shaderLayer.layerMeshes?.[0]?.material?.uniforms
            ?.parallaxStrength?.value ?? 0.05;
        const shiftX =
          (mouseVec.x - 0.5) * 0.5 * this._depth * parallaxStrength;
        const shiftY =
          (mouseVec.y - 0.5) * 0.5 * this._depth * parallaxStrength;
        cxNew += shiftX;
        cyNew += shiftY;
      } catch (e) {
        if (this.config.highlightDebug) {
          console.warn("Highlight parallax error", e);
        }
      }
    }

    let sx = cxNew;
    let sy = cyNew;
    if (depthAspect > screenAspect) {
      sx = ((cxNew - 0.5) * depthAspect) / screenAspect + 0.5;
    } else {
      sy = ((cyNew - 0.5) * screenAspect) / depthAspect + 0.5;
    }
    const px = sx * window.innerWidth;
    const py = (1 - sy) * window.innerHeight;
    const ox = this.offset.x || 0;
    const oy = this.offset.y || 0;
    const tx = Math.round(px - 24 + ox);
    const ty = Math.round(py - 24 + oy);
    this._el.style.setProperty('--tx', `${tx}px`);
    this._el.style.setProperty('--ty', `${ty}px`);
    this._el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    this._lastPx = px;
    this._lastPy = py;
    try {
      const elAt = document.elementFromPoint(Math.round(px), Math.round(py));
      const overUI = elAt?.closest?.(
        "#game-root, .slide-puzzle-intro, .slide-puzzle-table, .slide-wordbox, .gonext, .scoreboard, .room-picker-form"
      );
      this._occluded = !!overUI;
    } catch (e) {
      this._occluded = false;
    }
    if (this.config.highlightDebug) {
      if (
        !this._debugLastLog ||
        performance.now() - this._debugLastLog > 1000
      ) {
        this._debugLastLog = performance.now();
        console.debug("Highlight pos", this.item.config.id, {
          px,
          py,
          visible: this._visibleFlag,
        });
      }
    }
  }

  _tick() {
    if (!this._el) return;
    if (this._visibleFlag) {
      const canShow = performance.now() >= this._showAt && !this._occluded;
      this._el.style.opacity = canShow ? "1" : "0";
      this._updatePosition();
    }
  }

  static _ensureKeyframes() {
    if (HighlightCircle._keyframesInjected) return;
    HighlightCircle._keyframesInjected = true;
    const style = document.createElement("style");
    style.textContent = `
      @keyframes highlight-yoyo {
        0%, 100% {
          transform: translate3d(var(--tx), var(--ty), 0) scale(1);
        }
        50% {
          transform: translate3d(var(--tx), var(--ty), 0) scale(1.15);
        }
      }
    `;
    document.head.appendChild(style);
  }

  static _ensureContainer() {
    if (!HighlightCircle._container) {
      const c = document.createElement("div");
      Object.assign(c.style, {
        position: "fixed",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 7,
      });
      c.id = "interactive-highlights";
      document.body.appendChild(c);
      HighlightCircle._container = c;
    }
    return HighlightCircle._container;
  }

  static _register(instance) {
    if (!HighlightCircle._items) HighlightCircle._items = new Set();
    HighlightCircle._items.add(instance);
    HighlightCircle._startLoop();
  }

  static _startLoop() {
    if (HighlightCircle._loopStarted) return;
    HighlightCircle._loopStarted = true;
    const loop = () => {
      HighlightCircle._items?.forEach((it) => it._tick());
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  static _ensureDepthCanvas(shaderLayer) {
    const img = shaderLayer?.depthTexture?.image;
    if (!img) return null;
    if (
      HighlightCircle._depthCanvasImage === img &&
      HighlightCircle._depthCanvasCtx
    ) {
      return HighlightCircle._depthCanvasCtx;
    }
    const canvas =
      HighlightCircle._depthCanvas || document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");
    try {
      ctx.drawImage(img, 0, 0);
      HighlightCircle._depthCanvas = canvas;
      HighlightCircle._depthCanvasCtx = ctx;
      HighlightCircle._depthCanvasImage = img;
      return ctx;
    } catch (e) {
      return null;
    }
  }

  static _sampleDepthAt(newUx, newUy, shaderLayer) {
    const ctx = HighlightCircle._ensureDepthCanvas(shaderLayer);
    if (!ctx) return null;
    const canvas = ctx.canvas;
    const px = Math.min(
      canvas.width - 1,
      Math.max(0, Math.round(newUx * canvas.width))
    );
    const py = Math.min(
      canvas.height - 1,
      Math.max(0, Math.round((1 - newUy) * canvas.height))
    );
    const data = ctx.getImageData(px, py, 1, 1).data;
    return data[0] / 255;
  }
}
