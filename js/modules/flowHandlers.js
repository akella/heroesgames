// Slides flow management

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
    slide23: 1500, // new auto-advance duplicate intro
  };

  flowActor.subscribe((snap) => {
    if (snap === prevSnap) return;
    prevSnap = snap;
    layerManager.syncToState(snap);
    bus.emit("flow.progress", snap);
    const val = snap.value;

    // Auto advance timing
    if (flowActor._autoTimer) {
      clearTimeout(flowActor._autoTimer);
      flowActor._autoTimer = null;
    }
    if (AUTO_SLIDES[val]) {
      flowActor._autoTimer = setTimeout(() => {
        flowActor.send({ type: "NEXT" });
      }, AUTO_SLIDES[val]);
    }

    // Model appearance trigger
    if (val === "slide16") {
      try {
        document.dispatchEvent(new CustomEvent("showCharacter"));
      } catch {}
    }

    // RoomPicker visibility (resolved dynamically via globals)
    const pickers = [
      window.__pickerWall,
      window.__pickerFloor,
      window.__pickerTable,
    ].filter(Boolean);
    if (pickers.length) {
      if (val === "slide16") {
        pickers.forEach((p) => {
          p.show();
          p.setLocked(true);
        });
      } else if (
        val === "slide17" ||
        val === "slide18" ||
        val === "slide19" ||
        val === "slide20" ||
        val === "slide21" ||
        val === "slide22"
      ) {
        // show unlocked on these slides
        pickers.forEach((p) => {
          p.show();
          p.setLocked(false);
        });
        if (val === "slide20") pickers.forEach((p) => p.close());
      } else {
        // hide for slide23, slide24, outro and any others
        pickers.forEach((p) => p.hide());
      }
    }

    // Puzzle preview (slide25)
    if (val === "slide25") {
      (async () => {
        const activationSlide = val; // 'slide25'
        try {
          if (gameManager.active && gameManager.active.id !== "puzzle") {
            await gameManager.deactivate();
          }
          if (gameManager.active?.id !== "puzzle") {
            await gameManager.activate("puzzle", { bus });
          }
          // Race guard: still on slide25?
          const currentVal =
            (flowActor.getSnapshot
              ? flowActor.getSnapshot().value
              : flowActor.state?.value) || snap.value;
          if (currentVal !== activationSlide) {
            if (gameManager.active?.id === "puzzle") {
              try {
                gameManager.active.api.hide();
                gameManager.active.api.setActive(false);
              } catch {}
            }
            return;
          }
          gameManager.active?.api.show();
          gameManager.active?.api.setActive(false); // preview: not interactive
          bus.emit("score.show");
          if (gameRoot) gameRoot.style.zIndex = "40";
        } catch (e) {
          console.warn("Failed to activate puzzle game", e);
        }
      })();
      return;
    }
    // Enable interaction (slide26)
    if (val === "slide26") {
      if (gameManager.active?.id === "puzzle") {
        try {
          gameManager.active.api.show();
          gameManager.active.api.setActive(true);
          bus.emit("score.show");
          if (gameRoot) gameRoot.style.zIndex = "40";
        } catch (e) {
          console.warn("Failed to enable puzzle on slide26", e);
        }
      }
      return;
    }
    // Final stage (slide27) hide puzzle keep score visible
    if (val === "slide27") {
      if (gameManager.active?.id === "puzzle") {
        try {
          gameManager.active.api.setActive(false);
          gameManager.active.api.hide();
          bus.emit("score.show");
          if (gameRoot) gameRoot.style.zIndex = "5";
        } catch (e) {
          console.warn("Failed to hide puzzle on slide27", e);
        }
      }
      return;
    }
    if (!gameManager.active) return;
    if (val === "slide9") {
      gameManager.active.api.show();
      gameManager.active.api.setActive(false);
      if (gameRoot) gameRoot.style.zIndex = "5";
      bus.emit("score.hide");
    } else if (val === "slide13") {
      gameManager.active.api.setActive(true);
      if (gameRoot) gameRoot.style.zIndex = "20";
      bus.emit("score.show");
    } else if (val === "slide14") {
      gameManager.active.api.setActive(false);
      if (gameRoot) gameRoot.style.zIndex = "5";
    } else if (val === "slide15") {
      if (gameManager.active?.api.resetRound) {
        gameManager.active.api.resetRound(2);
      }
      gameManager.active.api.show();
      gameManager.active.api.setActive(false);
      if (gameRoot) gameRoot.style.zIndex = "5";
    } else if (val === "slide16") {
      gameManager.active.api.hide();
      bus.emit("score.hide");
      if (gameRoot) gameRoot.style.zIndex = "5";
    } else if (val === "slide17") {
      gameManager.active.api.hide();
      if (gameRoot) gameRoot.style.zIndex = "5";
    } else if (val === "outro") {
      // Final teardown after slide28: fully disable any active game and hide scoreboard
      if (gameManager.active) {
        try {
          gameManager.active.api.hide && gameManager.active.api.hide();
        } catch {}
        // Fully deactivate (destroys & clears root)
        try {
          gameManager.deactivate();
        } catch {}
      }
      // Ensure scoreboard can hide (may have been locked by a game)
      try {
        bus.emit("score.unlock");
        bus.emit("score.hide");
      } catch {}
      if (gameRoot) gameRoot.style.zIndex = "5";
    }
  });

  flowActor.start();
}
