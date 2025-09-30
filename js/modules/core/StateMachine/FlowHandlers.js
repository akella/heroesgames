// Declarative slide rules system for readability & reduced code size
import { AUTO_SLIDES, CANVAS_ACTIVE_SLIDES, RULES } from "./flowConfig.js";
import { parseSlideNumber, isGameSlide, allGamesDone } from "./flowUtils.js";
import {
  maybeHandlePostGameRedirect,
  redirectToHub,
} from "./postGameRedirect.js";
import { applyPickers, applyScore } from "./services/uiService.js";
import { applyRoomOps } from "./services/roomService.js";
import { dispatchChar } from "./services/sceneService.js";
import {
  activateGame as activateGameSvc,
  applyGameMisc as applyGameMiscSvc,
} from "./services/gameService.js";
import { bindGameCompletionHandlers } from "./handlers/gameCompletion.js";

export function setupFlowSubscription({
  flowActor,
  layerManager,
  bus,
  gameManager,
  gameRoot,
}) {
  let prevSnap;

  const emit = (type, payload) => {
    try {
      bus.emit(type, payload);
    } catch {}
  };
  const activateGame = (id, opts = {}) =>
    activateGameSvc({ gameManager, bus, flowActor, gameRoot }, id, opts);

  function matches(rule, slide) {
    return Array.isArray(rule.when)
      ? rule.when.includes(slide)
      : rule.when === slide;
  }

  function allGamesDone() {
    const wordDone =
      !!window.__wordboxCompleted || !!window.__wordboxCompletedPending;
    const puzzDone =
      !!window.__puzzleCompleted || !!window.__puzzleCompletedPending;
    return puzzDone && wordDone && !!window.__footballCompleted;
  }

  function parseSlideNumber(slide) {
    if (typeof slide !== "string") return null;
    if (!slide.startsWith("slide")) return null;
    const n = parseInt(slide.slice(5), 10);
    return Number.isFinite(n) ? n : null;
  }

  function isGameSlide(slide, ranges) {
    const n = parseSlideNumber(slide);
    if (n == null) return false;
    return ranges.some(([from, to]) => n >= from && n <= to);
  }

  function maybeHandlePostGameRedirect(slideNumber) {
    const action = window.__postGameRedirectAction;
    if (!action) return;
    const allDone =
      !!window.__puzzleCompleted &&
      !!window.__wordboxCompleted &&
      !!window.__footballCompleted;
    if (!allDone) return;
    if (
      window.__puzzleExitPending ||
      window.__wordboxExitPending ||
      window.__footballExitPending
    )
      return;

    if (slideNumber != null) {
      if (action === "GOTO_45" && slideNumber >= 45) {
        window.__postGameRedirectAction = null;
        return;
      }
      if (action === "GOTO_99" && slideNumber >= 99) {
        window.__postGameRedirectAction = null;
        return;
      }
    }

    const toSend = action;
    window.__postGameRedirectAction = null;
    setTimeout(() => {
      try {
        flowActor.send({ type: toSend });
      } catch {}
    });
  }

  function redirectToHub() {
    try {
      emit("scene.parallax", { enabled: true });
      emit("scene.view.reset");
      dispatchChar("show");
    } catch {}
    try {
      if (gameManager.active) {
        gameManager.active.api?.setActive?.(false);
        gameManager.active.api?.hide?.();
        if (typeof gameManager.deactivate === "function") {
        }
      }
      if (gameRoot) gameRoot.style.zIndex = "5";
    } catch {}
    try {
      emit("score.unlock");
      emit("score.hide");
    } catch {}
    try {
      flowActor.send({ type: "GOTO_99" });
    } catch {}
  }

  const applyGameMisc = (cfg) =>
    applyGameMiscSvc({ gameManager, bus, gameRoot }, cfg);

  function handleWordBoxRule(rule, slide) {
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
        gameManager.active?.api?.setActive?.(false);
        gameManager.active?.api?.hide?.();
        if (gameRoot) gameRoot.style.zIndex = "5";
      }
      if (cfg.scoreHide) {
        emit("score.unlock");
        emit("score.hide");
      }
    }
  }

  function handlePuzzleRules(slide) {
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
      gameManager.active?.api?.show?.();
      gameManager.active?.api?.setActive?.(true);
      emit("score.show");
      if (gameRoot) gameRoot.style.zIndex = "40";
      return true;
    }
    if (slide === "slide27" && gameManager.active?.id === "puzzle") {
      gameManager.active?.api?.setActive?.(false);
      gameManager.active?.api?.hide?.();
      emit("score.show");
      if (gameRoot) gameRoot.style.zIndex = "5";
      return true;
    }
    return false;
  }

  function handleFootballRule(slide) {
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

  function handlePostFootball(slide) {
    if (slide === "slide45") {
      // Now hide football game finally
      if (gameManager.active?.id === "football") {
        try {
          gameManager.active?.api?.hide?.();
        } catch {}
      }
      emit("scene.parallax", { enabled: true });
      emit("scene.view.reset");
      const ps = pickers();
      ps.forEach((p) => {
        p.show();
        p.setLocked(false);
        p.close();
      });
      if (gameRoot) gameRoot.style.zIndex = "5";
    }
  }

  function handleOutro(slide) {
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

  // Centralized game completion bus handlers
  bindGameCompletionHandlers({
    bus,
    flowActor,
    gameManager,
    emit,
    maybeHandlePostGameRedirect: (fa, n) => maybeHandlePostGameRedirect(fa, n),
  });

  const handleRoomOps = (rule, slide) => applyRoomOps(bus, rule, slide);

  flowActor.subscribe((snap) => {
    if (snap === prevSnap) return;
    prevSnap = snap;
    layerManager.syncToState(snap);
    emit("flow.progress", snap);
    const slide = snap.value;
    const slideNumber = parseSlideNumber(slide);

    try {
      bus.emit("scene.canvas", { visible: CANVAS_ACTIVE_SLIDES.has(slide) });
    } catch {}

    if (slide === "slide22" || slide === "slide32" || slide === "slide39") {
      if (!allGamesDone()) {
      }
    }

    if (slideNumber != null) {
      if (window.__puzzleExitPending && slideNumber >= 29) {
        window.__puzzleExitPending = false;
      }
      if (window.__wordboxExitPending && slideNumber >= 38) {
        window.__wordboxExitPending = false;
      }
      if (window.__footballExitPending && slideNumber >= 45) {
        window.__footballExitPending = false;
      }
      maybeHandlePostGameRedirect(slideNumber);
    } else maybeHandlePostGameRedirect(null);

    if (
      window.__puzzleCompleted &&
      !window.__puzzleCompletedPending &&
      !window.__puzzleExitPending &&
      isGameSlide(slide, [[25, 27]])
    ) {
      try {
        if (gameManager.active?.id === "puzzle") {
          gameManager.active.api?.setActive?.(false);
          gameManager.active.api?.hide?.();
          if (gameRoot) gameRoot.style.zIndex = "5";
        }
      } catch {}
      flowActor.send({ type: "NEXT" });
      return;
    }
    if (
      window.__wordboxCompleted &&
      !window.__wordboxCompletedPending &&
      !window.__wordboxExitPending &&
      isGameSlide(slide, [[34, 37]])
    ) {
      flowActor.send({ type: "NEXT" });
      return;
    }
    if (
      window.__footballCompleted &&
      !window.__footballCompletedPending &&
      !window.__footballExitPending &&
      isGameSlide(slide, [[42, 44]])
    ) {
      flowActor.send({ type: "NEXT" });
      return;
    }
    if (flowActor._autoTimer) {
      clearTimeout(flowActor._autoTimer);
      flowActor._autoTimer = null;
    }
    if (AUTO_SLIDES[slide]) {
      flowActor._autoTimer = setTimeout(
        () => flowActor.send({ type: "NEXT" }),
        AUTO_SLIDES[slide]
      );
    }
    if (handlePuzzleRules(slide)) return;
    if (slide === "slide45" && !allGamesDone()) {
      redirectToHub();
      return;
    }

    // Apply declarative rules
    RULES.forEach((rule) => {
      if (!matches(rule, slide)) return;
      if (rule.character) dispatchChar(rule.character);
      if (rule.pickers) applyPickers(rule.pickers, slide);
      if (rule.score) applyScore(emit, rule.score);
      if (rule.gameMisc) applyGameMisc(rule.gameMisc);
      if (rule.gameDeactivate && gameManager.active) {
        try {
          gameManager.active.api?.hide?.();
        } catch {}
      }
      if (rule.game) {
        activateGame(rule.game.id, {
          ensureSlide: slide,
          active: !!rule.game.active,
          gameRootZ: rule.game.z ?? rule.game.gameRootZ,
          score: rule.game.score,
          roomHideIds: rule.game.roomHideIds,
        });
      }
      if (rule.gamePreload) {
        try {
          rule.gamePreload.forEach((id) => {
            try {
              gameManager.preload(id);
            } catch {}
          });
        } catch {}
      }
      if (rule.gameEnsure && gameManager.active?.id === rule.gameEnsure.id) {
        applyGameMisc(rule.gameEnsure);
      }
      handleRoomOps(rule, slide);
      if (rule.wordbox) handleWordBoxRule(rule, slide);
      if (rule.football) handleFootballRule(slide);
      if (rule.postFootball) handlePostFootball(slide); // legacy (unused now)
      if (rule.postFootballPersist) {
        const cfg = rule.postFootballPersist;
        if (cfg.showCharacter) dispatchChar("show");
        if (cfg.z != null && gameRoot) gameRoot.style.zIndex = String(cfg.z);
        if (cfg.scene) {
          if (cfg.scene.parallax != null)
            emit("scene.parallax", { enabled: !!cfg.scene.parallax });
          if (cfg.scene.view) {
            try {
              const view =
                typeof cfg.scene.view === "function"
                  ? cfg.scene.view()
                  : cfg.scene.view;
              if (view) emit("scene.view", view);
            } catch {}
          }
        }
      }
      if (rule.afterFootballEnd) handlePostFootball(slide);
      if (rule.outro) handleOutro(slide);
      const n = parseInt((slide || "").replace("slide", ""), 10);
      if (n >= 46 && n <= 49 && !allGamesDone()) {
        redirectToHub();
        return;
      }
      if (rule.onEnter === "slide46_setup") {
        try {
          bus.emit("scene.parallax", { enabled: true });
          // Turn off filter overlay
          try {
            const el = document.querySelector(".scene-filter");
            if (el) el.style.opacity = "0";
          } catch {}
          // Reveal all remaining room layers grouped as END
          bus.emit("room.revealAll");
          // Switch to full depth map
          bus.emit("room.setDepth", { mode: "full" });
        } catch {}
      }
      if (
        (slide === "slide43" || slide === "slide44" || slide === "slide45") &&
        flowActor._wheelPumpCleanup
      ) {
        try {
          flowActor._wheelPumpCleanup();
        } catch {}
      }
    });

    if (slide === "slide38" && window.__wordboxCompletedPending) {
      try {
        window.__wordboxCompleted = true;
        window.__wordboxCompletedPending = false;
      } catch {}
      // All games finished? Jump to final slides
      try {
        if (window.__puzzleCompleted && window.__footballCompleted) {
          window.__postGameRedirectAction = "GOTO_45";
          maybeHandlePostGameRedirect(38);
        }
      } catch {}
    }

    if (slide === "slide28" && window.__puzzleCompletedPending) {
      try {
        window.__puzzleCompleted = true;
        window.__puzzleCompletedPending = false;
      } catch {}
      // All games finished? Jump to final slides
      try {
        if (window.__wordboxCompleted && window.__footballCompleted) {
          window.__postGameRedirectAction = "GOTO_45";
          maybeHandlePostGameRedirect(28);
        }
      } catch {}
    }

    if (slide === "slide45" && window.__footballCompletedPending) {
      try {
        window.__footballCompletedPending = false;
      } catch {}
    }

    try {
      if (window.__finddiffHideAt && slide === window.__finddiffHideAt) {
        if (gameManager.active?.id === "finddiff") {
          try {
            gameManager.active.api?.hide?.();
          } catch {}
          try {
            gameManager.deactivate();
          } catch {}
        }
        window.__finddiffHideAt = null;
      }
    } catch {}
  });

  flowActor.start();
}
