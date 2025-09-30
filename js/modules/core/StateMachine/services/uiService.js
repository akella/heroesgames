export function getPickers() {
  return [window.__pickerWall, window.__pickerFloor, window.__pickerTable].filter(Boolean);
}

export function applyPickers(cfg, slide) {
  const list = getPickers();
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

export function applyScore(emit, cfg) {
  if (!cfg) return;
  if (cfg.init) emit("score.init", cfg.init);
  if (cfg.unlock) emit("score.unlock");
  if (cfg.lock) emit("score.lock");
  if (cfg.show) emit("score.show");
  if (cfg.hide) emit("score.hide");
}
