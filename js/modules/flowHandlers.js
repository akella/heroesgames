// Declarative slide rules system for readability & reduced code size

export function setupFlowSubscription({
  flowActor,
  layerManager,
  bus,
  gameManager,
  gameRoot,
}) {
  let prevSnap;

  const AUTO_SLIDES = {
    slide3: 1500,
    slide5: 1500,
    slide6: 2000,
    slide8: 1500,
    slide16: 2000,
    slide20: 2000,
    slide23: 1500,
  };

  const pickers = () =>
    [window.__pickerWall, window.__pickerFloor, window.__pickerTable].filter(
      Boolean
    );

  const emit = (type, payload) => {
    try {
      bus.emit(type, payload);
    } catch {}
  };
  const dispatchChar = (mode) => {
    if (!mode) return;
    try {
      document.dispatchEvent(
        new CustomEvent(mode === "show" ? "showCharacter" : "hideCharacter")
      );
    } catch {}
  };

  function activateGame(id, opts = {}) {
    (async () => {
      try {
        if (gameManager.active && gameManager.active.id !== id) {
          await gameManager.deactivate();
        }
        if (gameManager.active?.id !== id) {
          await gameManager.activate(id, { bus });
        }
        if (opts.ensureSlide) {
          const cv = flowActor.getSnapshot().value;
          if (cv !== opts.ensureSlide) {
            if (gameManager.active?.id === id) {
              gameManager.active?.api?.hide?.();
              gameManager.active?.api?.setActive?.(false);
            }
            return;
          }
        }
        if (opts.roomHideIds) {
          opts.roomHideIds.forEach((rid) => emit("room.remove", { id: rid }));
        }
        if (opts.score) {
          const { init, lock, show } = opts.score;
          if (init) emit("score.init", init);
          if (lock) emit("score.lock");
          if (show) emit("score.show");
        }
        gameManager.active?.api?.show?.();
        gameManager.active?.api?.setActive?.(!!opts.active);
        if (opts.gameRootZ != null && gameRoot)
          gameRoot.style.zIndex = String(opts.gameRootZ);
        if (opts.scene) {
          if (opts.scene.parallax != null)
            emit("scene.parallax", { enabled: opts.scene.parallax });
          if (opts.scene.view) emit("scene.view", opts.scene.view);
        }
      } catch (e) {
        console.warn("activateGame failed", id, e);
      }
    })();
  }

  const RULES = [
    // Force-hide pickers across puzzle pre-intro (now starting one slide earlier) and gameplay slides
    {
      when: ["slide23", "slide24", "slide25", "slide26", "slide27"],
      pickers: { hide: true },
    },
    { when: "slide4", character: "hide" },
    {
      when: "slide16",
      character: "show",
      pickers: { show: true, locked: true },
    },
    {
      when: ["slide17", "slide18", "slide19", "slide20", "slide21", "slide22"],
      pickers: { show: true, locked: false, closeOn: "slide20" },
    },
    {
      when: ["slide29", "slide30", "slide31"],
      pickers: { show: true, locked: false, close: true },
    },
    { when: ["slide32", "slide33"], pickers: { hide: true } },
    { when: "slide39", character: "show" },
    { when: ["slide40", "slide41", "slide42"], character: "hide" },
    // Generic mini-game early slides (existing behavior retained)
    {
      when: "slide9",
      gameMisc: { show: true, active: false, scoreHide: true, z: 5 },
    },
    { when: "slide13", gameMisc: { active: true, scoreShow: true, z: 20 } },
    { when: "slide14", gameMisc: { active: false, z: 5 } },
    {
      when: "slide15",
      gameMisc: { resetRound: 2, show: true, active: false, z: 5 },
    },
    // Puzzle preview / active / post
    {
      when: "slide25",
      game: {
        id: "puzzle",
        active: false,
        ensure: "slide25",
        score: { show: true },
        z: 40,
      },
    },
    { when: ["slide25", "slide26", "slide27"], pickers: { hide: true } },
    { when: "slide24", pickers: { hide: true } },
    {
      when: "slide26",
      gameEnsure: { id: "puzzle", active: true, z: 40, scoreShow: true },
    },
    {
      when: "slide27",
      gameEnsure: {
        id: "puzzle",
        hide: true,
        active: false,
        z: 5,
        scoreShow: true,
      },
    },
    // WordBox activation
    { when: "slide34", wordbox: { activate: true } },
    { when: ["slide36", "slide37"], wordbox: { hide: true, scoreHide: true } },
    // Room object reveal / scoreboard hides
    {
      when: "slide29",
      roomReveal: ["book-floor", "box", "football-0"],
      score: { unlock: true, hide: true },
      gameDeactivate: true,
      z: 5,
    },
    {
      when: ["slide30", "slide31", "slide32", "slide33"],
      roomReveal: ["book-floor", "box", "football-0"],
    },
    { when: "slide35", score: { unlock: true, hide: true } },
    {
      when: "slide38",
      roomReveal: ["book-floor", "box", "football-0"],
      score: { unlock: true, hide: true },
      z: 5,
    },
    { when: "slide41", roomRemove: ["wheel-pump", "sh-wheel-pump"] },
    { when: "slide42", football: true },
    {
      when: "slide43",
      postFootballPersist: { keepGame: true, z: 5 },
    },
    {
      when: "slide44",
      postFootballPersist: { keepGame: true, z: 5 },
    },
    { when: "slide45", afterFootballEnd: true },
    { when: "slide45", character: "show" },
    { when: ["slide43", "slide44"], character: "hide" },
    // Outro
    { when: "outro", outro: true },
  ];

  function matches(rule, slide) {
    return Array.isArray(rule.when)
      ? rule.when.includes(slide)
      : rule.when === slide;
  }

  function applyPickers(cfg, slide) {
    const list = pickers();
    if (!list.length || !cfg) return;
    if (cfg.hide) return list.forEach((p) => p.hide());
    if (cfg.show) {
      list.forEach((p) => {
        p.show();
        if (cfg.locked != null) p.setLocked(!!cfg.locked);
        if (cfg.close) p.close();
      });
      if (cfg.closeOn && slide === cfg.closeOn) list.forEach((p) => p.close());
    } else if (cfg.close) list.forEach((p) => p.close());
  }

  function applyScore(cfg) {
    if (!cfg) return;
    if (cfg.init) emit("score.init", cfg.init);
    if (cfg.unlock) emit("score.unlock");
    if (cfg.lock) emit("score.lock");
    if (cfg.show) emit("score.show");
    if (cfg.hide) emit("score.hide");
  }

  function applyGameMisc(cfg) {
    if (!cfg) return;
    if (cfg.resetRound && gameManager.active?.api?.resetRound) {
      gameManager.active.api.resetRound(cfg.resetRound);
    }
    if (cfg.show) gameManager.active?.api?.show?.();
    if (cfg.hide) gameManager.active?.api?.hide?.();
    if (cfg.active != null) gameManager.active?.api?.setActive?.(!!cfg.active);
    if (cfg.scoreShow) emit("score.show");
    if (cfg.scoreHide) emit("score.hide");
    if (cfg.z != null && gameRoot) gameRoot.style.zIndex = String(cfg.z);
  }

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

  function handleRoomOps(rule) {
    if (rule.roomReveal) {
      rule.roomReveal.forEach((id) => emit("room.reveal", { id }));
    }
    if (rule.roomRemove) {
      rule.roomRemove.forEach((id) => emit("room.remove", { id }));
    }
  }

  flowActor.subscribe((snap) => {
    if (snap === prevSnap) return;
    prevSnap = snap;
    layerManager.syncToState(snap);
    emit("flow.progress", snap);
    const slide = snap.value;

    // Auto advance
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

    // Puzzle special cases (kept outside generic rules due to async preview pattern)
    if (handlePuzzleRules(slide)) return;

    // Apply declarative rules
    RULES.forEach((rule) => {
      if (!matches(rule, slide)) return;
      if (rule.character) dispatchChar(rule.character);
      if (rule.pickers) applyPickers(rule.pickers, slide);
      if (rule.score) applyScore(rule.score);
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
      if (rule.gameEnsure && gameManager.active?.id === rule.gameEnsure.id) {
        applyGameMisc(rule.gameEnsure);
      }
      handleRoomOps(rule);
      if (rule.wordbox) handleWordBoxRule(rule, slide);
      if (rule.football) handleFootballRule(slide);
      if (rule.postFootball) handlePostFootball(slide); // legacy (unused now)
      if (rule.postFootballPersist) {
        const cfg = rule.postFootballPersist;
        if (cfg.showCharacter) dispatchChar("show");
        if (cfg.z != null && gameRoot) gameRoot.style.zIndex = String(cfg.z);
      }
      if (rule.afterFootballEnd) handlePostFootball(slide);
      if (rule.outro) handleOutro(slide);
      if (
        (slide === "slide43" || slide === "slide44" || slide === "slide45") &&
        flowActor._wheelPumpCleanup
      ) {
        try {
          flowActor._wheelPumpCleanup();
        } catch {}
      }
    });

    // Post-finddiff persistence hide logic
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
