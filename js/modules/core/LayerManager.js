export class LayerManager {
  constructor(allLayers, layerMap) {
    this.layers = allLayers;
    this.layerMap = layerMap || this._inferMap(allLayers);
    this.active = new Set();
  }

  _inferMap(allLayers) {
    const map = {};
    Object.keys(allLayers || {}).forEach((key) => {
      const m = /^(slide\d+)Layer$/.exec(key);
      if (m) {
        const slideId = m[1];
        if (!map[slideId]) map[slideId] = [];
        map[slideId].push(key);
      }
    });
    return map;
  }

  async syncToState(snapshot) {
    const slideId = snapshot?.value || snapshot;
    const targetList = this.layerMap[slideId] || [];
    const want = new Set(targetList);

    // 1 — fade out layers no longer needed
    for (const id of Array.from(this.active)) {
      if (!want.has(id)) {
        try {
          this.layers[id]?.outro?.();
        } catch {}
        this.active.delete(id);
      }
    }

    // 2 — fade in new layers
    for (const id of want) {
      if (!this.active.has(id)) {
        try {
          this.layers[id]?.intro?.();
        } catch {}
        this.active.add(id);
      }
    }
  }

  update(dt) {
    this.active.forEach((id) => {
      try {
        this.layers[id]?.update?.(dt);
      } catch {}
    });
  }
}
