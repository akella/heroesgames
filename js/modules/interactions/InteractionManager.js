import { InteractiveItem } from "./InteractiveItem.js";

export class InteractionManager {
  constructor({ shaderLayer, bus }) {
    this.shaderLayer = shaderLayer;
    this.bus = bus;
    this.items = [];
    this._onFlow = this._onFlow.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onClick = this._onClick.bind(this);
    this._hoverActive = false;
    this._currentSlide = null;
  }

  register(config) {
    const item = new InteractiveItem(config, {
      shaderLayer: this.shaderLayer,
      bus: this.bus,
    });
    item.init();
    this.items.push(item);
    return item;
  }

  attach() {
    this.bus.on("flow.progress", this._onFlow);
    this.bus.on("room.remove", ({ id }) => {
      if (!id) return;
      const it = this.getItem(id);
      if (it) this.remove(id);
    });
    window.addEventListener("mousemove", this._onPointerMove, {
      passive: true,
    });
    window.addEventListener("click", this._onClick, { passive: true });
  }

  detach() {
    this.bus.off?.("flow.progress", this._onFlow);
    window.removeEventListener("mousemove", this._onPointerMove);
    window.removeEventListener("click", this._onClick);
  }

  _onFlow(snap) {
    const val = snap?.value || snap;
    this._currentSlide = val;
    this.items.forEach((it) => it.onFlowProgress(val));
  }

  _onPointerMove(e) {
    // Block interaction hover if not on an allowlisted slide
    const allowHover = new Set([
      "slide21", "slide22", "slide29", "slide30", "slide31", "slide32", "slide33", "slide38", "slide99"
    ]);
    if (!allowHover.has(this._currentSlide)) {
      if (this._hoverActive) {
        this._hoverActive = false;
        document.body.style.cursor = "";
      }
      return;
    }
    const topEl = document.elementFromPoint(e.clientX, e.clientY);
    if (topEl) {
      const isOverUI = topEl.closest?.(
        "#game-root, .slide-puzzle-intro, .slide-puzzle-table, .slide-wordbox, .bubble, .small-dog__bubble, .gonext, .scoreboard, .room-picker-form"
      );
      if (isOverUI) {
        if (this._hoverActive) {
          this._hoverActive = false;
          document.body.style.cursor = "";
        }
        return;
      }
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    const x = e.clientX / w;
    const y = 1 - e.clientY / h;
    this.items.forEach((it) => it.pointerMove(x, y));
    const anyHover = this.items.some((it) => it._isHover);
    if (anyHover !== this._hoverActive) {
      this._hoverActive = anyHover;
      document.body.style.cursor = anyHover ? "pointer" : "";
    }
  }

  _onClick(e) {
    // Allow clicks only on specific slides
    const allowClick = new Set([
      "slide21", "slide22", "slide29", "slide30", "slide31", "slide32", "slide33", "slide38", "slide99"
    ]);
    if (!allowClick.has(this._currentSlide)) return;
    const topEl = document.elementFromPoint(e.clientX, e.clientY);
    if (topEl) {
      const isOverUI = topEl.closest?.(
        "#game-root, .slide-puzzle-intro, .slide-puzzle-table, .slide-wordbox, .bubble, .small-dog__bubble, .gonext, .scoreboard, .room-picker-form"
      );
      if (isOverUI) return;
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    const x = e.clientX / w;
    const y = 1 - e.clientY / h;
    const snapshot = this.items.slice();
    for (const item of snapshot) {
      if (item && item.click(x, y)) {
        this.bus.emit("interaction.click", { id: item.config.id });
        break;
      }
    }
  }

  getItem(id) {
    return this.items.find((it) => it.config.id === id) || null;
  }

  remove(id) {
    const idx = this.items.findIndex((it) => it.config.id === id);
    if (idx === -1) return false;
    try {
      this.items[idx].destroy?.();
    } catch {}
    this.items.splice(idx, 1);
    return true;
  }

  removeAll() {
    this.items.forEach((it) => {
      try {
        it.destroy?.();
      } catch {}
    });
    this.items.length = 0;
  }
}
