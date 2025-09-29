export class SceneController {
  constructor({
    bus,
    shaderLayerBG,
    shaderLayerFG,
    bgRenderer,
    fgRenderer,
    filterEl,
  }) {
    this.bus = bus;
    this.shaderLayerBG = shaderLayerBG;
    this.shaderLayerFG = shaderLayerFG;
    this.bgRenderer = bgRenderer;
    this.fgRenderer = fgRenderer;
    this.filterEl = filterEl;

    this._parallaxDisabled = false;
    this._savedParallaxBG = null;
    this._savedParallaxFG = null;
    this._sceneScale = 1;
    this._sceneOffsetY = 0;

    this._applySceneTransform = this._applySceneTransform.bind(this);
    this.attachBus();
  }

  attachBus() {
    if (!this.bus) return;
    this.bus.on("scene.parallax", ({ enabled } = {}) => {
      const flag = enabled !== false;
      this._setParallaxEnabled(flag);
    });
    this.bus.on("scene.view", ({ zoom, offsetY } = {}) => {
      if (typeof zoom === "number") this._setSceneZoom(zoom);
      if (typeof offsetY === "number") this._setSceneOffset(offsetY);
    });
    this.bus.on("scene.view.reset", () => {
      this._setSceneZoom(1);
      this._setSceneOffset(0);
      this._setParallaxEnabled(true);
    });
  }

  _setParallaxEnabled(flag) {
    const setFor = (shader, saveKey) => {
      if (!shader || !shader.layerMeshes) return;
      if (!flag) {
        if (!this[saveKey]) {
          this[saveKey] = shader.layerMeshes.map(
            ({ material }) => material.uniforms.parallaxStrength.value
          );
        }
        shader.layerMeshes.forEach(({ material }) => {
          material.uniforms.parallaxStrength.value = 0.0;
        });
      } else {
        if (
          this[saveKey] &&
          this[saveKey].length === shader.layerMeshes.length
        ) {
          shader.layerMeshes.forEach(({ material }, i) => {
            material.uniforms.parallaxStrength.value = this[saveKey][i];
          });
        } else {
          shader.layerMeshes.forEach(({ material }) => {
            material.uniforms.parallaxStrength.value = 0.05;
          });
        }
        this[saveKey] = null;
      }
    };
    setFor(this.shaderLayerBG, "_savedParallaxBG");
    setFor(this.shaderLayerFG, "_savedParallaxFG");
    this._parallaxDisabled = !flag;
  }

  _applySceneTransform() {
    const els = [
      this.bgRenderer?.domElement,
      this.fgRenderer?.domElement,
      this.filterEl,
    ].filter(Boolean);
    els.forEach((el) => {
      el.style.transformOrigin = "center center";
      el.style.transform = `translateY(${this._sceneOffsetY}px) scale(${this._sceneScale})`;
    });
  }

  _setSceneZoom(scale = 1) {
    this._sceneScale = scale;
    this._applySceneTransform();
  }

  _setSceneOffset(offsetY = 0) {
    this._sceneOffsetY = offsetY;
    this._applySceneTransform();
  }
}
