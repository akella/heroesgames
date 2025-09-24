// Public API: createGame({ bus }) -> { init(root), show(), hide(), destroy(), setActive(bool), update(dt) }

const TARGET = "БРАСЛЕТ"; // 7 letters

export function createGame({ bus }) {
  let rootEl = null;
  let wrap = null;
  let active = false;
  let value = "";
  let blocksEl, uiEl, typedEl;
  let syncObserver = null;
  let ro = null;
  let completed = false;
  let onFlowProgress;
  let completeTimer = null;

  function syncPosition() {
    if (!uiEl) return;
    const targetImg = document.querySelector("#slide34 .wb-blocks");
    if (!targetImg) return;
    const r = targetImg.getBoundingClientRect();
    uiEl.style.position = "absolute";
    uiEl.style.left = r.left + "px";
    uiEl.style.top = r.top + "px";
    uiEl.style.width = r.width + "px";
    uiEl.style.height = r.height + "px";
  }

  function renderBlocks() {
    if (!blocksEl) return;
    const typed = value.toUpperCase();
    const correct = typed === TARGET;
    const chars = typed.split("");
    let matchLen = 0;
    for (let i = 0; i < chars.length && i < TARGET.length; i++) {
      if (chars[i] === TARGET[i]) matchLen++;
      else break;
    }
    const tiles = Array.from({ length: TARGET.length }, (_, i) => {
      const filled = chars[i] || "";
      return `<div class=\"wb-tile\" data-i=\"${i}\">${filled}</div>`;
    }).join("");
    blocksEl.innerHTML = tiles;
    if (!completed && matchLen === TARGET.length) {
      completed = true;
      try {
        bus.emit("score.update", { value: TARGET.length });
      } catch {}
      const slide = document.getElementById("slide34");
      if (slide) slide.classList.add("is-complete");
      if (wrap) wrap.classList.add("is-complete");
      if (!completeTimer) {
        completeTimer = setTimeout(() => {
          try {
            bus.emit("game.wordbox.complete");
          } catch {}
          completeTimer = null;
        }, 2000);
      }
    }
    if (!completed) {
      try {
        bus.emit("score.update", { value: matchLen });
      } catch {}
    }
  }

  function onKey(e) {
    if (!active) return;
    if (e.key === "Backspace") {
      value = value.slice(0, -1);
      renderBlocks();
      return;
    }
    if (e.key.length === 1) {
      const char = e.key.toUpperCase();
      if (/^[A-ZА-ЯЁІЇЄҐ]$/i.test(char)) {
        if (value.length < TARGET.length) {
          value += char;
          renderBlocks();
        }
      }
    }
  }

  return {
    async init(root) {
      rootEl = root;
      wrap = document.createElement("div");
      wrap.className = "wordbox-root";
      wrap.style.pointerEvents = "none";
      wrap.innerHTML = `
        <div class="wordbox-ui">
          <div class="wordbox-blocks" aria-label="blocks" ></div>
          <div class="wordbox-typed" aria-live="polite"></div>
        </div>
      `;
      rootEl.appendChild(wrap);
      uiEl = wrap.querySelector(".wordbox-ui");
      blocksEl = wrap.querySelector(".wordbox-blocks");
      typedEl = wrap.querySelector(".wordbox-typed");
      ["click", "mousedown", "mouseup", "touchstart", "touchend"].forEach(
        (evt) => {
          uiEl.addEventListener(
            evt,
            (e) => {
              e.stopPropagation();
            },
            true
          );
        }
      );
      renderBlocks();
      try {
        bus.emit("score.init", { total: TARGET.length, value: 0 });
      } catch {}
      syncPosition();
      try {
        const targetImg = document.querySelector("#slide34 .wb-blocks");
        if (targetImg) {
          if (!targetImg.complete) {
            targetImg.addEventListener("load", syncPosition, { once: true });
          }
          ro = new ResizeObserver(() => syncPosition());
          ro.observe(targetImg);
        }
      } catch {}
      window.addEventListener("resize", syncPosition);
      window.addEventListener("scroll", syncPosition, true);
      window.addEventListener("app-resize", syncPosition);

      onFlowProgress = (snap) => {
        const val = snap?.value || snap;
        if (val !== "slide34") {
          try {
            if (wrap) wrap.style.display = "none";
            const slide = document.getElementById("slide34");
            if (slide) slide.classList.remove("is-complete");
            if (wrap) wrap.classList.remove("is-complete");
            value = "";
            completed = false;
            if (blocksEl) blocksEl.innerHTML = "";
            if (typedEl) typedEl.textContent = "";
          } catch {}
        }
      };
      try {
        bus.on("flow.progress", onFlowProgress);
      } catch {}
    },
    show() {
      if (!wrap) return;
      wrap.style.display = "block";
      syncPosition();
      // One more tick after layout settles fixes initial drift
      requestAnimationFrame(() => syncPosition());
    },
    hide() {
      if (!wrap) return;
      wrap.style.display = "none";
      const slide = document.getElementById("slide34");
      if (slide) slide.classList.remove("is-complete");
      if (wrap) wrap.classList.remove("is-complete");
      value = "";
      completed = false;
      if (blocksEl) blocksEl.innerHTML = "";
      if (typedEl) typedEl.textContent = "";
      if (completeTimer) {
        clearTimeout(completeTimer);
        completeTimer = null;
      }
    },
    destroy() {
      if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
      wrap = null;
      rootEl = null;
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("scroll", syncPosition, true);
      window.removeEventListener("app-resize", syncPosition);
      try {
        ro && ro.disconnect && ro.disconnect();
      } catch {}
      try {
        bus.off && onFlowProgress && bus.off("flow.progress", onFlowProgress);
      } catch {}
    },
    setActive(v) {
      active = !!v;
      if (wrap) wrap.style.pointerEvents = active ? "auto" : "none";
      if (active) {
        window.addEventListener("keydown", onKey, true);
        const typed = value.toUpperCase();
        let matchLen = 0;
        for (let i = 0; i < typed.length && i < TARGET.length; i++) {
          if (typed[i] === TARGET[i]) matchLen++;
          else break;
        }
        try {
          bus.emit("score.init", { total: TARGET.length, value: matchLen });
          bus.emit("score.show");
        } catch {}
      } else {
        window.removeEventListener("keydown", onKey, true);
      }
    },
    update() {},
  };
}
