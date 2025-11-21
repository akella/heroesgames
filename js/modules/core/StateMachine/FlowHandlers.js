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
import {
  handleWordBoxRule,
  handlePuzzleRules,
  handleFootballRule,
  handlePostFootball,
  handleOutro,
} from "./handlers/slideHandlers.js";

export function setupFlowSubscription({
  flowActor,
  layerManager,
  bus,
  gameManager,
  gameRoot,
}) {
  let prevSnap;
  let faceSlideActive = false;
  let pictureTemporarilyHidden = false;

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

  const applyGameMisc = (cfg) =>
    applyGameMiscSvc({ gameManager, bus, gameRoot }, cfg);

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

    const slideEl = (() => {
      try {
        return document.getElementById(slide);
      } catch {
        return null;
      }
    })();
    const hasCharacterFace = !!slideEl?.querySelector?.(".character-face");
    const isFaceZoomSlide = hasCharacterFace && (slideNumber === 5 || slideNumber === 8);

    try {
      bus.emit("scene.canvas", { visible: CANVAS_ACTIVE_SLIDES.has(slide) });
    } catch {}

    try {
      const fgCanvas = document.querySelector(".gl-canvas--fg");
      if (isFaceZoomSlide) {
        emit("scene.canvas", { visible: true });
        if (fgCanvas) fgCanvas.style.zIndex = "12";
        emit("scene.parallax", { enabled: false });
        emit("model.view", { cameraZ: 1, yOffset: -0.12, scaleMul: 1.15 });
        emit("model.motion", { enabled: false });
        try {
          const filterEl = document.querySelector(".scene-filter");
          if (filterEl) filterEl.style.opacity = "0";
        } catch {}
        try {
          ["picture", "picture-1", "picture-2", "picture-sh"].forEach((id) => {
            bus.emit("room.hide", { id });
          });
          pictureTemporarilyHidden = true;
        } catch {}
        try {
          document.dispatchEvent(new CustomEvent("showCharacter"));
        } catch {}
        faceSlideActive = true;

        const hideFaceIfModelReady = () => {
          try {
            if (!faceSlideActive) return;
            const faceEl = slideEl?.querySelector?.(".character-face");
            if (faceEl) faceEl.style.display = "none";
          } catch {}
        };
        if (window.__characterLoaded) {
          hideFaceIfModelReady();
        } else {
          const onLoaded = () => {
            hideFaceIfModelReady();
            document.removeEventListener("characterLoaded", onLoaded);
          };
          document.addEventListener("characterLoaded", onLoaded);
        }
      } else if (faceSlideActive) {
        faceSlideActive = false;
        try {
          const prev = document.querySelector(".slide .character-face[style]");
          if (prev) prev.style.display = "";
        } catch {}
        if (fgCanvas) fgCanvas.style.zIndex = "";
        emit("scene.parallax", { enabled: true });
        emit("model.view.reset");
        if (pictureTemporarilyHidden) {
          try {
            ["picture", "picture-1", "picture-2", "picture-sh"].forEach((id) => {
              bus.emit("room.reveal", { id });
            });
          } catch {}
          pictureTemporarilyHidden = false;
        }
        try {
          const filterEl = document.querySelector(".scene-filter");
          if (filterEl && CANVAS_ACTIVE_SLIDES.has(slide)) filterEl.style.opacity = "0.5";
        } catch {}
        try {
          document.dispatchEvent(new CustomEvent("hideCharacter"));
        } catch {}
          emit("model.motion", { enabled: true });
      }
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
      maybeHandlePostGameRedirect(flowActor, slideNumber);
    } else maybeHandlePostGameRedirect(flowActor, null);

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
    if (
      handlePuzzleRules({
        slide,
        activateGame,
        gameManager,
        emit,
        gameRoot,
      })
    )
      return;
    if (slide === "slide45" && !allGamesDone()) {
      redirectToHub({ flowActor, bus, gameManager, gameRoot });
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
      if (rule.wordbox)
        handleWordBoxRule({
          rule,
          slide,
          emit,
          gameManager,
          gameRoot,
          activateGame,
        });
      if (rule.football)
        handleFootballRule({
          slide,
          activateGame,
          flowActor,
          gameManager,
          emit,
        });
      if (rule.postFootball)
        handlePostFootball({ slide, gameManager, emit, gameRoot }); // legacy
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
      if (rule.afterFootballEnd)
        handlePostFootball({ slide, gameManager, emit, gameRoot });
      if (rule.outro) handleOutro({ slide, gameManager, emit, gameRoot });
      const n = parseInt((slide || "").replace("slide", ""), 10);
      if (n >= 46 && n <= 49 && !allGamesDone()) {
        redirectToHub({ flowActor, bus, gameManager, gameRoot });
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
          maybeHandlePostGameRedirect(flowActor, 38);
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
          maybeHandlePostGameRedirect(flowActor, 28);
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
