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
        val === "slide22" ||
        val === "slide23"
      ) {
        pickers.forEach((p) => {
          p.show();
          p.setLocked(false);
        });
        if (val === "slide20") pickers.forEach((p) => p.close());
      } else {
        pickers.forEach((p) => p.hide());
      }
    }

    // Game / scoreboard logic
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
      gameManager.active.api.hide();
      if (gameRoot) gameRoot.style.zIndex = "5";
    }
  });

  flowActor.start();
}
