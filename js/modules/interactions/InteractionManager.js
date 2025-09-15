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
    this.items.forEach((it) => it.onFlowProgress(val));
  }

  _onPointerMove(e) {
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
    const w = window.innerWidth;
    const h = window.innerHeight;
    const x = e.clientX / w;
    const y = 1 - e.clientY / h;
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].click(x, y)) {
        this.bus.emit("interaction.click", { id: this.items[i].config.id });
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
