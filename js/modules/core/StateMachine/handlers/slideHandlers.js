// Slide-specific rule handlers extracted from FlowHandlers to keep orchestration slim
import { getPickers } from "../services/uiService.js";

// Handle WordBox-specific rule
export function handleWordBoxRule({
  rule,
  slide,
  emit,
  gameManager,
  gameRoot,
  activateGame,
}) {
  if (!rule.wordbox) return;
  const cfg = rule.wordbox;
  if (cfg.activate) {
    activateGame("wordbox", {
      ensureSlide: slide,
      active: true,
      gameRootZ: 20,
      score: { init: { total: 7, value: 0 }, lock: true, show: true },
    });
  } else if (cfg.hide) {
    if (gameManager.active?.id === "wordbox") {
      try {
        gameManager.active?.api?.setActive?.(false);
      } catch {}
      try {
        gameManager.active?.api?.hide?.();
      } catch {}
      if (gameRoot) gameRoot.style.zIndex = "5";
    }
    if (cfg.scoreHide) {
      emit("score.unlock");
      emit("score.hide");
    }
  }
}

// Handle Puzzle slides entry/exit; return true if a direct transition was applied
export function handlePuzzleRules({
  slide,
  activateGame,
  gameManager,
  emit,
  gameRoot,
}) {
  if (slide === "slide25") {
    activateGame("puzzle", {
      ensureSlide: slide,
      active: false,
      gameRootZ: 40,
      score: { show: true },
    });
    // Extra safety: hide pickers if still visible
    [window.__pickerWall, window.__pickerFloor, window.__pickerTable].forEach(
      (p) => {
        try {
          p && p.hide();
        } catch {}
      }
    );
    return true;
  }
  if (slide === "slide26" && gameManager.active?.id === "puzzle") {
    try {
      gameManager.active?.api?.show?.();
    } catch {}
    try {
      gameManager.active?.api?.setActive?.(true);
    } catch {}
    emit("score.show");
    if (gameRoot) gameRoot.style.zIndex = "40";
    return true;
  }
  if (slide === "slide27" && gameManager.active?.id === "puzzle") {
    try {
      gameManager.active?.api?.setActive?.(false);
    } catch {}
    try {
      gameManager.active?.api?.hide?.();
    } catch {}
    emit("score.show");
    if (gameRoot) gameRoot.style.zIndex = "5";
    return true;
  }
  return false;
}

// Handle Football activation and dynamic wheel-pump hint visibility
export function handleFootballRule({
  slide,
  activateGame,
  flowActor,
  gameManager,
  emit,
}) {
  if (slide !== "slide42") return;
  activateGame("football", {
    ensureSlide: slide,
    active: true,
    gameRootZ: 40,
    roomHideIds: ["football-0", "sh-football"],
    score: { init: { total: 10, value: 0 }, lock: true, show: true },
    scene: {
      parallax: false,
      view: { zoom: 1.5, offsetY: -Math.round(window.innerHeight * 0.25) },
    },
  });

  // Dynamic wheel-pump visibility when centered
  try {
    const wp = document.querySelector('[data-id="wheel-pump"]');
    if (wp) {
      wp.style.opacity = "0";
      wp.style.transition = "opacity 0.35s ease";
      const check = () => {
        if (!wp.isConnected) return;
        const r = wp.getBoundingClientRect();
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const inside =
          r.left < cx && r.right > cx && r.top < cy && r.bottom > cy;
        wp.style.opacity = inside ? "1" : "0";
      };
      check();
      window.addEventListener("resize", check, { passive: true });
      window.addEventListener("scroll", check, { passive: true });
      // Store cleanup for later slides
      flowActor._wheelPumpCleanup = () => {
        window.removeEventListener("resize", check);
        window.removeEventListener("scroll", check);
      };
    }
  } catch {}
}

// Handle post-football cleanup on slide45
export function handlePostFootball({ slide, gameManager, emit, gameRoot }) {
  if (slide !== "slide45") return;
  if (gameManager.active?.id === "football") {
    try {
      gameManager.active?.api?.hide?.();
    } catch {}
  }
  emit("scene.parallax", { enabled: true });
  emit("scene.view.reset");
  try {
    const ps = getPickers();
    ps.forEach((p) => {
      p.show();
      p.setLocked(false);
      p.close();
    });
  } catch {}
  if (gameRoot) gameRoot.style.zIndex = "5";
}

// Handle outro state cleanup
export function handleOutro({ slide, gameManager, emit, gameRoot }) {
  if (slide !== "outro") return;
  if (gameManager.active) {
    try {
      gameManager.active?.api?.hide?.();
    } catch {}
    try {
      gameManager.deactivate();
    } catch {}
  }
  emit("score.unlock");
  emit("score.hide");
  emit("scene.view.reset");
  if (gameRoot) gameRoot.style.zIndex = "5";
}
