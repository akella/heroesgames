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
    slide23: 1500,
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

    if (val === "slide4") {
      try {
        document.dispatchEvent(new CustomEvent("hideCharacter"));
      } catch {}
    } else if (val === "slide16") {
      try {
        document.dispatchEvent(new CustomEvent("showCharacter"));
      } catch {}
    } else if (val === "slide39") {
      try {
        document.dispatchEvent(new CustomEvent("showCharacter"));
      } catch {}
    } else if (val === "slide40" || val === "slide41" || val === "slide42") {
      try {
        document.dispatchEvent(new CustomEvent("hideCharacter"));
      } catch {}
    }

    // RoomPicker visibility
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
        pickers.forEach((p) => {
          p.show();
          p.setLocked(false);
        });
        if (val === "slide20") pickers.forEach((p) => p.close());
      } else if (val === "slide29" || val === "slide30") {
        pickers.forEach((p) => {
          p.show();
          p.setLocked(false);
          p.close();
        });
      } else if (val === "slide31") {
        pickers.forEach((p) => {
          p.show();
          p.setLocked(false);
          p.close();
        });
      } else if (val === "slide32" || val === "slide33") {
        pickers.forEach((p) => {
          p.hide();
          p.close();
        });
      } else {
        pickers.forEach((p) => p.hide());
      }
    }

    // Puzzle preview
    if (val === "slide25") {
      (async () => {
        const activationSlide = val;
        try {
          if (gameManager.active && gameManager.active.id !== "puzzle") {
            await gameManager.deactivate();
          }
          if (gameManager.active?.id !== "puzzle") {
            await gameManager.activate("puzzle", { bus });
          }
          const currentVal =
            (flowActor.getSnapshot
              ? flowActor.getSnapshot().value
              : flowActor.state?.value) || snap.value;
          if (currentVal !== activationSlide) {
            if (gameManager.active?.id === "puzzle") {
              try {
                gameManager.active?.api?.hide?.();
                gameManager.active?.api?.setActive?.(false);
              } catch {}
            }
            return;
          }
          gameManager.active?.api?.show?.();
          gameManager.active?.api?.setActive?.(false);
          bus.emit("score.show");
          if (gameRoot) gameRoot.style.zIndex = "40";
        } catch (e) {
          console.warn("Failed to activate puzzle game", e);
        }
      })();
      return;
    }
    if (val === "slide26") {
      if (gameManager.active?.id === "puzzle") {
        try {
          gameManager.active?.api?.show?.();
          gameManager.active?.api?.setActive?.(true);
          bus.emit("score.show");
          if (gameRoot) gameRoot.style.zIndex = "40";
        } catch (e) {
          console.warn("Failed to enable puzzle on slide26", e);
        }
      }
      return;
    }
    if (val === "slide27") {
      if (gameManager.active?.id === "puzzle") {
        try {
          gameManager.active?.api?.setActive?.(false);
          gameManager.active?.api?.hide?.();
          bus.emit("score.show");
          if (gameRoot) gameRoot.style.zIndex = "5";
        } catch (e) {
          console.warn("Failed to hide puzzle on slide27", e);
        }
      }
      return;
    }
    // WordBox activation on slide34 (independent of current active game)
    if (val === "slide34") {
      try {
        bus.emit("score.init", { total: 7, value: 0 });
        bus.emit("score.lock");
        bus.emit("score.show");
      } catch {}
      (async () => {
        const activationSlide = val;
        try {
          if (gameManager.active && gameManager.active.id !== "wordbox") {
            await gameManager.deactivate();
          }
          if (gameManager.active?.id !== "wordbox") {
            await gameManager.activate("wordbox", { bus });
          }
          const currentVal =
            (flowActor.getSnapshot
              ? flowActor.getSnapshot().value
              : flowActor.state?.value) || snap.value;
          if (currentVal !== activationSlide) {
            if (gameManager.active?.id === "wordbox") {
              try {
                gameManager.active?.api?.hide?.();
                gameManager.active?.api?.setActive?.(false);
              } catch {}
            }
            return;
          }
          gameManager.active?.api?.show?.();
          gameManager.active?.api?.setActive?.(true);
          if (gameRoot) gameRoot.style.zIndex = "20";
          bus.emit("score.init", { total: 7, value: 0 });
          bus.emit("score.lock");
          bus.emit("score.show");
        } catch (e) {
          console.warn("Failed to activate wordbox on slide34", e);
        }
      })();
      return;
    }
    if (val === "slide9") {
      gameManager.active?.api?.show?.();
      gameManager.active?.api?.setActive?.(false);
      if (gameRoot) gameRoot.style.zIndex = "5";
      bus.emit("score.hide");
    } else if (val === "slide29") {
      try {
        bus.emit("room.reveal", { id: "book-floor" });
        bus.emit("room.reveal", { id: "box" });
        bus.emit("room.reveal", { id: "football-0" });
      } catch {}
      try {
        bus.emit("score.unlock");
        bus.emit("score.hide");
      } catch {}
      try {
        gameManager.active?.api?.setActive?.(false);
        gameManager.active?.api?.hide?.();
      } catch {}
      if (gameRoot) gameRoot.style.zIndex = "5";
    } else if (
      val === "slide30" ||
      val === "slide31" ||
      val === "slide32" ||
      val === "slide33"
    ) {
      try {
        bus.emit("room.reveal", { id: "book-floor" });
        bus.emit("room.reveal", { id: "box" });
        bus.emit("room.reveal", { id: "football-0" });
      } catch {}
    } else if (val === "slide35") {
      try {
        bus.emit("score.unlock");
        bus.emit("score.hide");
      } catch {}
    } else if (val === "slide38") {
      try {
        bus.emit("room.reveal", { id: "book-floor" });
        bus.emit("room.reveal", { id: "box" });
        bus.emit("room.reveal", { id: "football-0" });
      } catch {}
      try {
        bus.emit("score.unlock");
        bus.emit("score.hide");
      } catch {}
      if (gameRoot) gameRoot.style.zIndex = "5";
    } else if (val === "slide41") {
      // Hide in-room pump and its shadow so only centered pump is visible
      try {
        bus.emit("room.remove", { id: "wheel-pump" });
      } catch {}
      try {
        bus.emit("room.remove", { id: "sh-wheel-pump" });
      } catch {}
      return;
    } else if (val === "slide42") {
      // Hide in-room football so only DOM-game ball is visible
      try {
        bus.emit("room.remove", { id: "football-0" });
        bus.emit("room.remove", { id: "sh-football" });
      } catch {}
      (async () => {
        const activationSlide = val;
        try {
          if (gameManager.active && gameManager.active.id !== "football") {
            await gameManager.deactivate();
          }
          if (gameManager.active?.id !== "football") {
            await gameManager.activate("football", { bus });
          }
          const currentVal =
            (flowActor.getSnapshot
              ? flowActor.getSnapshot().value
              : flowActor.state?.value) || snap.value;
          if (currentVal !== activationSlide) {
            if (gameManager.active?.id === "football") {
              try {
                gameManager.active?.api?.hide?.();
                gameManager.active?.api?.setActive?.(false);
              } catch {}
            }
            return;
          }
          try {
            bus.emit("score.init", { total: 10, value: 0 });
            bus.emit("score.lock");
            bus.emit("score.show");
          } catch {}
          gameManager.active?.api?.show?.();
          gameManager.active?.api?.setActive?.(true);
          if (gameRoot) gameRoot.style.zIndex = "40";
          // Scene adjustments for the game
          try {
            bus.emit("scene.parallax", { enabled: false });
            bus.emit("scene.view", {
              zoom: 1.5,
              offsetY: -Math.round(window.innerHeight * 0.25),
            });
          } catch {}
        } catch (e) {
          console.warn("Failed to activate football on slide42", e);
        }
      })();
      return;
    } else if (val === "slide43") {
      try {
        bus.emit("scene.view.reset");
        bus.emit("score.unlock");
        bus.emit("score.hide");
        document.dispatchEvent(new CustomEvent("showCharacter"));
      } catch {}
      if (gameRoot) gameRoot.style.zIndex = "5";
      return;
    } else if (val === "slide44") {
      // Keep scene as-is; final reset happens on slide45
      return;
    } else if (val === "slide45") {
      // Final post-game slide: normal room view and pickers visible again
      try {
        bus.emit("scene.parallax", { enabled: true });
        bus.emit("scene.view.reset");
      } catch {}
      const pickers = [
        window.__pickerWall,
        window.__pickerFloor,
        window.__pickerTable,
      ].filter(Boolean);
      if (pickers.length) {
        pickers.forEach((p) => {
          p.show();
          p.setLocked(false);
          p.close();
        });
      }
      if (gameRoot) gameRoot.style.zIndex = "5";
      return;
    } else if (val === "slide34") {
      if (gameManager.active?.id === "wordbox") {
        try {
          gameManager.active?.api?.show?.();
          gameManager.active?.api?.setActive?.(true);
          if (gameRoot) gameRoot.style.zIndex = "20";
          bus.emit("score.init", { total: 7, value: 0 });
          bus.emit("score.lock");
          bus.emit("score.show");
        } catch (e) {
          console.warn("Failed to enable wordbox on slide34", e);
        }
      }
      return;
    } else if (val === "slide36" || val === "slide37") {
      if (gameManager.active?.id === "wordbox") {
        try {
          gameManager.active?.api?.setActive?.(false);
          gameManager.active?.api?.hide?.();
          if (gameRoot) gameRoot.style.zIndex = "5";
        } catch (e) {
          console.warn("Failed to hide wordbox after slide36+", e);
        }
      }
      try {
        bus.emit("score.unlock");
        bus.emit("score.hide");
      } catch {}
    } else if (val === "slide13") {
      gameManager.active?.api?.setActive?.(true);
      if (gameRoot) gameRoot.style.zIndex = "20";
      bus.emit("score.show");
    } else if (val === "slide14") {
      gameManager.active?.api?.setActive?.(false);
      if (gameRoot) gameRoot.style.zIndex = "5";
    } else if (val === "slide15") {
      if (gameManager.active?.api?.resetRound) {
        gameManager.active?.api?.resetRound?.(2);
      }
      gameManager.active?.api?.show?.();
      gameManager.active?.api?.setActive?.(false);
      if (gameRoot) gameRoot.style.zIndex = "5";
    } else if (val === "slide16") {
      gameManager.active?.api?.hide?.();
      bus.emit("score.hide");
      if (gameRoot) gameRoot.style.zIndex = "5";
    } else if (val === "slide17") {
      gameManager.active?.api?.hide?.();
      if (gameRoot) gameRoot.style.zIndex = "5";
    } else if (val === "outro") {
      if (gameManager.active) {
        try {
          gameManager.active?.api?.hide && gameManager.active?.api?.hide();
        } catch {}
        try {
          gameManager.deactivate();
        } catch {}
      }
      try {
        bus.emit("score.unlock");
        bus.emit("score.hide");
        // Reset scene view/parallax on exit to outro
        bus.emit("scene.view.reset");
      } catch {}
      if (gameRoot) gameRoot.style.zIndex = "5";
    }
  });

  flowActor.start();
}
