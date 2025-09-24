import gsap from "gsap";
import BALL_10 from "../../../assets/games/football/ball-10.webp";
import BALL_20 from "../../../assets/games/football/ball-20.webp";
import BALL_30 from "../../../assets/games/football/ball-30.webp";
import BALL_40 from "../../../assets/games/football/ball-40.webp";
import BALL_50 from "../../../assets/games/football/ball-50.webp";
import BALL_60 from "../../../assets/games/football/ball-60.webp";
import BALL_70 from "../../../assets/games/football/ball-70.webp";
import BALL_80 from "../../../assets/games/football/ball-80.webp";
import BALL_90 from "../../../assets/games/football/ball-90.webp";
import BALL_100 from "../../../assets/games/football/ball-100.webp";
import BASE_SRC from "../../../assets/games/football/tube-1.webp";
import HANDLE_SRC from "../../../assets/games/football/tube-2.webp";
import SHADOW_SRC from "../../../assets/games/football/sh.webp";

// Football pump mini-game

function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

export async function preload() {
  const balls = [
    BALL_10,
    BALL_20,
    BALL_30,
    BALL_40,
    BALL_50,
    BALL_60,
    BALL_70,
    BALL_80,
    BALL_90,
    BALL_100,
  ];
  const others = [BASE_SRC, HANDLE_SRC, SHADOW_SRC];
  const assets = [...others, ...balls];
  await Promise.all(assets.map(preloadImage));
}

export function createGame({ bus }) {
  let rootEl = null;
  let wrap = null;
  let active = false;
  let uiEl, handleWrapEl, handleImgEl, baseEl, ballEl;
  let progress = 0; // 0..10
  let pumping = false;
  let onFlowProgress;
  let completed = false;

  function layout() {
    if (!uiEl) return;
    const slide = document.getElementById("slide42");
    if (!slide) return;
    const r = slide.getBoundingClientRect();
    uiEl.style.position = "absolute";
    uiEl.style.left = r.left + "px";
    uiEl.style.top = r.top + "px";
    uiEl.style.width = r.width + "px";
    uiEl.style.height = r.height + "px";
  }

  const BALL_SRCS = [
    BALL_10,
    BALL_20,
    BALL_30,
    BALL_40,
    BALL_50,
    BALL_60,
    BALL_70,
    BALL_80,
    BALL_90,
    BALL_100,
  ];

  function ballImgFor(n) {
    const idx = Math.max(1, Math.min(10, n)) - 1; // clamp to 0..9
    return BALL_SRCS[idx];
  }

  function renderBall() {
    if (!ballEl) return;
    ballEl.src = ballImgFor(progress);
  }

  function onPumpClick(e) {
    if (!active) return;
    e.preventDefault();
    e.stopPropagation();
    if (pumping) return;
    pumping = true;

    // Animate handle down then up
    const downY = 110; // px relative movement
    gsap.fromTo(
      handleImgEl,
      { y: 0 },
      {
        y: downY,
        duration: 0.18,
        ease: "power1.in",
        onComplete: () => {
          gsap.to(handleImgEl, {
            y: 0,
            duration: 0.2,
            ease: "power1.out",
            onComplete: () => {
              pumping = false;
            },
          });
        },
      }
    );

    // Increment progress with clamp
    if (progress < 10) {
      progress += 1;
      renderBall();
      try {
        bus.emit("score.update", { value: progress });
      } catch {}
      if (progress === 10) {
        completed = true;
        try {
          bus.emit("game.football.complete");
        } catch {}
      }
    }
  }

  return {
    async init(root) {
      rootEl = root;
      wrap = document.createElement("div");
      wrap.className = "football-root";
      wrap.style.pointerEvents = "none";
      wrap.innerHTML = `
        <div class="football-ui">
          <div class="football-stage">
            <img class="football-shadow" alt="shadow" src="${SHADOW_SRC}" />
            <img class="football-ball" alt="ball" src="${ballImgFor(
              progress
            )}" />
            <img class="football-base" alt="pump base" src="${BASE_SRC}" />
            <div class="football-handle-wrap">
              <img class="football-handle" alt="pump handle" src="${HANDLE_SRC}" />
            </div>
          </div>
        </div>
      `;
      rootEl.appendChild(wrap);
      uiEl = wrap.querySelector(".football-ui");
      baseEl = wrap.querySelector(".football-base");
      handleWrapEl = wrap.querySelector(".football-handle-wrap");
      handleImgEl = wrap.querySelector(".football-handle");
      ballEl = wrap.querySelector(".football-ball");

      // Stop bubbling after target phase so nested clicks still fire
      ["click", "mousedown", "mouseup", "touchstart", "touchend"].forEach(
        (evt) => {
          uiEl.addEventListener(evt, (e) => {
            e.stopPropagation();
          });
        }
      );

      // Attach interaction to handle wrapper (layout), animate inner image
      handleWrapEl.addEventListener("click", onPumpClick);
      handleWrapEl.style.cursor = "pointer";

      // Setup score 0..10
      try {
        bus.emit("score.init", { total: 10, value: 0 });
        bus.emit("score.show");
      } catch {}

      layout();
      window.addEventListener("resize", layout);
      window.addEventListener("scroll", layout, true);
      window.addEventListener("app-resize", layout);

      onFlowProgress = (snap) => {
        const val = snap?.value || snap;
        if (val === "slide42") return;
        if (completed && (val === "slide43" || val === "slide44")) {
          if (wrap) wrap.style.display = "block";
          return;
        }
        if (wrap) wrap.style.display = "none";
        if (completed) {
          if (val === "slide45" || val === "outro") {
            progress = 0;
            completed = false;
            renderBall();
          }
        } else {
          progress = 0;
          renderBall();
        }
      };
      try {
        bus.on("flow.progress", onFlowProgress);
      } catch {}

      renderBall();
    },
    show() {
      if (!wrap) return;
      wrap.style.display = "block";
      layout();
      renderBall();
    },
    hide() {
      if (!wrap) return;
      wrap.style.display = "none";
      progress = 0;
      renderBall();
    },
    destroy() {
      try {
        bus.off && onFlowProgress && bus.off("flow.progress", onFlowProgress);
      } catch {}
      window.removeEventListener("resize", layout);
      window.removeEventListener("scroll", layout, true);
      window.removeEventListener("app-resize", layout);
      if (handleWrapEl) handleWrapEl.removeEventListener("click", onPumpClick);
      if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
      wrap = null;
      rootEl = null;
      uiEl = handleWrapEl = handleImgEl = baseEl = ballEl = null;
    },
    setActive(v) {
      active = !!v;
      if (wrap) wrap.style.pointerEvents = active ? "auto" : "none";
      if (active) {
        try {
          bus.emit("score.init", { total: 10, value: progress });
          bus.emit("score.show");
        } catch {}
      }
    },
    update() {},
  };
}
