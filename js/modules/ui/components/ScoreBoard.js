// ScoreBoard component
import starImg from "/assets/star.webp";

export class ScoreBoard {
  constructor({ bus, parent = document.body } = {}) {
    this.bus = bus;
    this.total = 0;
    this.value = 0;
    this.visible = false;
    this.locked = false;
    this.gameType = null;
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
    this.bus.on("score.init", ({ total, value = 0, gameType } = {}) => {
      if (
        this.locked &&
        this.total &&
        typeof total === "number" &&
        total !== this.total
      ) {
        return;
      }
      this.gameType = gameType;
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
    if (this.valueEl) {
      if (this.value === this.total && this.total > 0) {
        switch (this.gameType) {
          case "finddiff":
            this.valueEl.innerHTML = `<span class="scoreboard__text">Всі відмінності знайдено</span>`;
            break;
          case "puzzle":
            // Completed puzzle: show success phrase
            this.valueEl.innerHTML = `<span class="scoreboard__text">Всі пазли зібрано</span>`;
            break;
          case "wordbox":
            // Completed wordbox: show success phrase
            this.valueEl.innerHTML = `<span class="scoreboard__text">Всі букви відгадано</span>`;
            break;
          case "football":
            // Completed football: show success phrase
            this.valueEl.innerHTML = `<span class="scoreboard__text">М’яч накачано</span>`;
            break;
          default:
            this.valueEl.innerHTML = `<span class="scoreboard__count">${this.value}</span><span class="scoreboard__text">/${this.total}</span>`;
        }
      } else {
        // In progress - show progress message
        switch (this.gameType) {
          case "finddiff":
            this.valueEl.innerHTML = `<span class="scoreboard__count">${this.value}</span><span class="scoreboard__text">/${this.total} відмінностей знайдено</span>`;
            break;
          case "puzzle":
            this.valueEl.innerHTML = `<span class="scoreboard__count">${this.value}</span><span class="scoreboard__text">/${this.total} пазлів зібрано</span>`;
            break;
          case "wordbox":
            this.valueEl.innerHTML = `<span class="scoreboard__count">${this.value}</span><span class="scoreboard__text">/${this.total} букв відгадано</span>`;
            break;
          case "football":
            this.valueEl.innerHTML = `<span class="scoreboard__text">Накачано </span><span class="scoreboard__count">${this.value}</span><span class="scoreboard__text"> з ${this.total} разів</span>`;
            break;
          default:
            this.valueEl.innerHTML = `<span class="scoreboard__count">${this.value}</span><span class="scoreboard__text">/${this.total}</span>`;
        }
      }
    }
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
