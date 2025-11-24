import gsap from "gsap";
import BALL_10 from "../../../assets/games/football/ball-10.webp";
import BALL_20 from "../../../assets/games/football/ball-20.webp";
import BALL_40 from "../../../assets/games/football/ball-40.webp";
import BALL_50 from "../../../assets/games/football/ball-50.webp";
import BALL_60 from "../../../assets/games/football/ball-60.webp";
import BALL_80 from "../../../assets/games/football/ball-80.webp";
import BALL_90 from "../../../assets/games/football/ball-90.webp";
import BALL_100 from "../../../assets/games/football/ball-100.webp";
import BASE_SRC from "../../../assets/games/football/tube-1.webp";
import HANDLE_SRC from "../../../assets/games/football/tube-2.webp";
import HANDLE_HOVER_SRC from "../../../assets/games/football/tube-2-hover.webp";
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
    BALL_40,
    BALL_50,
    BALL_60,
    BALL_80,
    BALL_90,
    BALL_100,
  ];
  const others = [BASE_SRC, HANDLE_SRC, HANDLE_HOVER_SRC, SHADOW_SRC];
  const assets = [...others, ...balls];
  await Promise.all(assets.map(preloadImage));
}

export function createGame({ bus }) {
  let rootEl = null;
  let wrap = null;
  let active = false;
  let uiEl, handleWrapEl, handleImgEl, baseEl, ballEl;
  let progress = 0; // 0..8
  let pumping = false;
  let onFlowProgress;
  let completed = false;
  let hasClickedOnce = false; // Track if user has clicked the pump
  const REST_Y = 0; // px: neutral rest position
  const DOWN_Y = 110; // px: click animation depth
  
  // Hint system
  let hintTimeout = null;
  let hintMarker = null;
  let hintTween = null;
  let hintOverlay = null;

  function layout() {
    if (!uiEl) return;
    const slide = document.getElementById("slide45");
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
    BALL_40,
    BALL_50,
    BALL_60,
    BALL_80,
    BALL_90,
    BALL_100,
  ];

  function ballImgFor(n) {
    const idx = Math.max(1, Math.min(8, n)) - 1; // clamp to 0..7
    return BALL_SRCS[idx];
  }

  function renderBall() {
    if (!ballEl) return;
    ballEl.src = ballImgFor(progress);
  }

  function showHint() {
    if (completed || hasClickedOnce || !active) return;
    
    // Remove existing hint if any
    if (hintTween) {
      try {
        hintTween.kill();
      } catch {}
      hintTween = null;
    }
    if (hintMarker) {
      try {
        hintMarker.remove();
      } catch {}
      hintMarker = null;
    }
    
    // Create white circle hint marker on the pump handle
    hintMarker = document.createElement("div");
    Object.assign(hintMarker.style, {
      position: "absolute",
      left: "50%",
      bottom: "540px",
      width: "64px",
      height: "64px",
      border: "2px solid #FFFFFF",
      borderRadius: "50%",
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      pointerEvents: "none",
      transform: "translate(-190px, 0)",
      opacity: "0",
      willChange: "opacity",
      zIndex: "10"
    });
    
    if (uiEl) {
      const stage = uiEl.querySelector(".football-stage");
      if (stage) {
        stage.appendChild(hintMarker);
        
        // Looping pulse animation
        hintTween = gsap.to(hintMarker, {
          opacity: 1,
          duration: 1.0,
          ease: "power2.inOut",
          yoyo: true,
          repeat: -1
        });
      }
    }
  }

  function startHintSystem() {
    if (completed || hasClickedOnce || !active) return;
    clearTimeout(hintTimeout);
    // Show hint immediately
    hintTimeout = setTimeout(showHint, 0);
  }

  function stopHintSystem() {
    clearTimeout(hintTimeout);
    if (hintTween) {
      try {
        hintTween.kill();
      } catch {}
      hintTween = null;
    }
    if (hintMarker) {
      try {
        hintMarker.remove();
      } catch {}
      hintMarker = null;
    }
  }

  function onPumpClick(e) {
    if (!active) return;
    e.preventDefault();
    e.stopPropagation();
    if (pumping) return;
    
    // Stop hint system on first click
    if (!hasClickedOnce) {
      hasClickedOnce = true;
      stopHintSystem();
    }
    
    pumping = true;
    handleImgEl.classList.add("is-pumping");
    try {
      handleImgEl.src = HANDLE_SRC;
    } catch {}

    gsap.fromTo(
      handleImgEl,
      { y: 0 },
      {
        y: DOWN_Y,
        duration: 0.18,
        ease: "power1.in",
        onComplete: () => {
          gsap.to(handleImgEl, {
            y: 0,
            duration: 0.2,
            ease: "power1.out",
            onComplete: () => {
              pumping = false;
              handleImgEl.classList.remove("is-pumping");
              gsap.set(handleImgEl, { clearProps: "transform" });
              // If still hovered, restore hover sprite
              try {
                if (
                  handleImgEl.matches(":hover") ||
                  (handleWrapEl && handleWrapEl.matches(":hover"))
                ) {
                  handleImgEl.src = HANDLE_HOVER_SRC;
                }
              } catch {}
            },
          });
        },
      }
    );

    // Increment progress with clamp
    if (progress < 8) {
      progress += 1;
      renderBall();
      try {
        bus.emit("score.update", { value: progress });
      } catch {}
      if (progress === 8) {
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

      // Add hover effects for the pump handle
      handleWrapEl.addEventListener("mouseenter", () => {
        if (active && !pumping) {
          handleImgEl.src = HANDLE_HOVER_SRC;
        }
      });
      handleWrapEl.addEventListener("mouseleave", () => {
        if (active && !pumping) {
          handleImgEl.src = HANDLE_SRC;
        }
      });

      // Setup score 0..8
      try {
        bus.emit("score.init", { total: 8, value: 0, gameType: "football" });
        bus.emit("score.show");
      } catch {}

      layout();
      window.addEventListener("resize", layout);
      window.addEventListener("scroll", layout, true);
      window.addEventListener("app-resize", layout);

      onFlowProgress = (snap) => {
        const val = snap?.value || snap;
        if (val === "slide45") return;
        if (completed && (val === "slide46" || val === "slide47")) {
          if (wrap) {
            wrap.style.display = "block";
            renderBall();
          }
          return;
        }
        if (wrap) wrap.style.display = "none";
        if (completed) {
          if (val === "slide48" || val === "outro") {
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
      stopHintSystem();
      if (!completed) {
        progress = 0;
        renderBall();
      }
    },
    destroy() {
      stopHintSystem();
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
          bus.emit("score.init", {
            total: 8,
            value: progress,
            gameType: "football",
          });
          bus.emit("score.show");
        } catch {}
        
        // Start hint system if user hasn't clicked yet
        if (!hasClickedOnce) {
          startHintSystem();
        }
      } else {
        // Stop hint system when game becomes inactive
        stopHintSystem();
      }
    },
    update() {},
  };
}
