// ScoreBoard component
import starImg from "../../assets/star.png";
// API via events on provided bus:
//  score.init { total, value? }
//  score.update { value }
//  score.increment { delta? }
//  score.reset
//  score.show / score.hide

export class ScoreBoard {
  constructor({ bus, parent = document.body } = {}) {
    this.bus = bus;
    this.total = 0;
    this.value = 0;
    this.visible = false;
    this.locked = false; // when true, ignore hide requests
    this._rafShow = null;
    this._build(parent);
    this._bindBus();
  }

  _build(parent) {
    const wrap = document.createElement("div");
    wrap.className = "scoreboard";
    wrap.style.display = "none";
    wrap.innerHTML = `
      <div class="scoreboard__bar"><div class="scoreboard__bar-fill" style="width:0%"></div></div>
      <div class="scoreboard__star-wrap"><img class="scoreboard__star" src="${starImg}" alt="" /></div>
      <div class="scoreboard__value" aria-live="polite">0/0</div>
    `;
    parent.appendChild(wrap);
    this.el = wrap;
    this.valueEl = wrap.querySelector(".scoreboard__value");
    this.fillEl = wrap.querySelector(".scoreboard__bar-fill");
  }

  _bindBus() {
    if (!this.bus) return;
    this.bus.on("score.init", ({ total, value = 0 } = {}) => {
      this.setTotal(total);
      this.setValue(value);
    });
    this.bus.on("score.update", ({ value } = {}) => this.setValue(value));
    this.bus.on("score.increment", ({ delta = 1 } = {}) =>
      this.increment(delta)
    );
    this.bus.on("score.reset", () => this.reset());
    this.bus.on("score.show", () => this.show());
    this.bus.on("score.hide", () => this.hide());
    this.bus.on("score.lock", () => {
      this.locked = true;
      if (this.visible === false) this.show();
    });
    this.bus.on("score.unlock", () => {
      this.locked = false;
    });
  }

  setTotal(total) {
    if (typeof total === "number") this.total = total;
    this._render();
  }

  setValue(v) {
    if (typeof v === "number")
      this.value = Math.max(0, Math.min(v, this.total));
    this._render();
  }

  increment(delta = 1) {
    this.setValue(this.value + delta);
  }

  reset() {
    this.value = 0;
    this._render();
  }

  _render() {
    if (this.valueEl) this.valueEl.textContent = `${this.value}/${this.total}`;
    if (this.fillEl) {
      const pct = this.total > 0 ? (this.value / this.total) * 100 : 0;
      this.fillEl.style.width = pct + "%";
    }
  }

  show() {
    if (this.visible) return;
    this.visible = true;
    this.el.style.display = "flex";
    if (this._rafShow) cancelAnimationFrame(this._rafShow);
    this._rafShow = requestAnimationFrame(() => {
      this._rafShow = null;
      if (this.visible) this.el.classList.add("scoreboard--visible");
    });
  }

  hide() {
    if (!this.visible) return;
    if (this.locked) return;
    this.visible = false;
    if (this._rafShow) {
      cancelAnimationFrame(this._rafShow);
      this._rafShow = null;
    }
    this.el.classList.remove("scoreboard--visible");
    let done = false;
    const onEnd = (e) => {
      if (e && e.propertyName && e.propertyName !== "opacity") return;
      done = true;
      if (!this.visible) this.el.style.display = "none";
      this.el.removeEventListener("transitionend", onEnd);
    };
    this.el.addEventListener("transitionend", onEnd);
    setTimeout(() => {
      if (!done && !this.visible) this.el.style.display = "none";
    }, 450);
  }
}
