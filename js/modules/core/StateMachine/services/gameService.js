export function activateGame({ gameManager, bus, flowActor, gameRoot }, id, opts = {}) {
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
        opts.roomHideIds.forEach((rid) => bus.emit("room.remove", { id: rid }));
      }
      if (opts.score) {
        const { init, lock, show } = opts.score;
        if (init) bus.emit("score.init", init);
        if (lock) bus.emit("score.lock");
        if (show) bus.emit("score.show");
      }
      gameManager.active?.api?.show?.();
      gameManager.active?.api?.setActive?.(!!opts.active);
      if (opts.gameRootZ != null && gameRoot) gameRoot.style.zIndex = String(opts.gameRootZ);
      if (opts.scene) {
        if (opts.scene.parallax != null) bus.emit("scene.parallax", { enabled: opts.scene.parallax });
        if (opts.scene.view) bus.emit("scene.view", opts.scene.view);
      }
    } catch (e) {
      console.warn("activateGame failed", id, e);
    }
  })();
}

export function applyGameMisc({ gameManager, bus, gameRoot }, cfg) {
  if (!cfg) return;
  if (cfg.resetRound && gameManager.active?.api?.resetRound) {
    gameManager.active.api.resetRound(cfg.resetRound);
  }
  if (cfg.show) gameManager.active?.api?.show?.();
  if (cfg.hide) gameManager.active?.api?.hide?.();
  if (cfg.active != null) gameManager.active?.api?.setActive?.(!!cfg.active);
  if (cfg.scoreShow) bus.emit("score.show");
  if (cfg.scoreHide) bus.emit("score.hide");
  if (cfg.z != null && gameRoot) gameRoot.style.zIndex = String(cfg.z);
}
