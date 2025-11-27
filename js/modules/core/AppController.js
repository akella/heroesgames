import * as THREE from "three";
import ShaderLayer from "../../lib/ShaderLayer.js";
import ModelLayer from "../../lib/ModelLayer.js";
import { SceneController } from "./SceneController.js";
import { UNFILTERED_IDS } from "./config/roomLayersConfig.js";

export class AppController {
  constructor({ dom, bus, flowActor, gameManager, gameRoot }) {
    this.container = dom;
    this.bus = bus;
    this.flowActor = flowActor;
    this.gameManager = gameManager;
    this.gameRoot = gameRoot;
    this.render = this.render.bind(this);
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.bgRenderer = new THREE.WebGLRenderer({ antialias: true });
    this.bgRenderer.setPixelRatio(1);
    this.bgRenderer.setSize(this.width, this.height);
    this.bgRenderer.autoClear = true;
    this.bgRenderer.toneMapping = THREE.NeutralToneMapping;
    this.bgRenderer.toneMappingExposure = 1.35;
    this.bgRenderer.domElement.classList.add("gl-canvas", "gl-canvas--bg");
    this.container.appendChild(this.bgRenderer.domElement);

    this.filterEl = document.createElement("div");
    this.filterEl.className = "scene-filter";
    this.filterEl.style.opacity = "0.5";
    this.filterOpacity = 0.5;
    this.container.appendChild(this.filterEl);

    this.fgRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.fgRenderer.setPixelRatio(1);
    this.fgRenderer.setSize(this.width, this.height);
    this.fgRenderer.autoClear = false;
    this.fgRenderer.toneMapping = THREE.NeutralToneMapping;
    this.fgRenderer.toneMappingExposure = 1.35;
    this.fgRenderer.domElement.classList.add("gl-canvas", "gl-canvas--fg");
    this.container.appendChild(this.fgRenderer.domElement);

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
    this.perspCamera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      100
    );
    this.perspCamera.position.set(0, 0, 2);
    this.time = 0;
    this._canvasVisible = true;
    this.mouse = new THREE.Vector2(0.5, 0.5);

    this.shaderLayerBG = new ShaderLayer({
      mouse: this.mouse,
      events: this.bus,
      excludeIds: UNFILTERED_IDS,
    });
    this.shaderLayerFG = new ShaderLayer({
      mouse: this.mouse,
      events: this.bus,
      includeIds: UNFILTERED_IDS,
    });

    this.modelLayer = new ModelLayer({ mouse: this.mouse, events: this.bus });
    try { this.modelLayer.attachBusListeners(); } catch {}

    this.sceneController = new SceneController({
      bus: this.bus,
      shaderLayerBG: this.shaderLayerBG,
      shaderLayerFG: this.shaderLayerFG,
      bgRenderer: this.bgRenderer,
      fgRenderer: this.fgRenderer,
      filterEl: this.filterEl,
    });

    this.bus.on("scene.canvas", ({ visible } = {}) => {
      this.setCanvasActive(visible !== false);
    });

    this.bus.on("model.view", ({ cameraZ, yOffset, scaleMul } = {}) => {
      try {
        if (typeof cameraZ === "number") {
          this.perspCamera.position.z = cameraZ;
        }
        if (this.modelLayer?.applyView) {
          this.modelLayer.applyView({ yOffset, scaleMul });
        }
      } catch {}
    });
    this.bus.on("model.view.reset", () => {
      try {
        this.perspCamera.position.z = 2;
        if (this.modelLayer?.resetView) this.modelLayer.resetView();
      } catch {}
    });

    // Game completion wiring and UI events are external
    this.setupResize();
    this.setupMouseMove();
    this.isPlaying = false;
    this.lastTime = performance.now();
    this.setCanvasActive(false);
  }

  setCanvasActive(flag) {
    const visible = !!flag;
    if (visible === this._canvasVisible) return;
    this._canvasVisible = visible;
    this._setCanvasDisplay(visible);
    if (visible) {
      this.resize();
      this.lastTime = performance.now();
      this._applyFilterOpacity();
      this._ensureRenderLoop();
    } else {
      this.isPlaying = false;
    }
  }

  _ensureRenderLoop() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    requestAnimationFrame(this.render);
  }

  _setCanvasDisplay(visible) {
    const display = visible ? "" : "none";
    if (this.bgRenderer?.domElement)
      this.bgRenderer.domElement.style.display = display;
    if (this.fgRenderer?.domElement)
      this.fgRenderer.domElement.style.display = display;
    if (this.filterEl) this.filterEl.style.display = visible ? "" : "none";
  }

  showFilter(opacity = 0.5) {
    this.filterOpacity = opacity;
    this.filterEl.style.pointerEvents = "none";
    if (this.filterEl) this.filterEl.style.opacity = String(this.filterOpacity);
  }

  hideFilter() {
    this.filterOpacity = 0;
    if (this.filterEl) this.filterEl.style.opacity = "0";
  }

  // Ensure the visual filter matches the last requested opacity
  _applyFilterOpacity() {
    if (!this.filterEl) return;
    const value =
      typeof this.filterOpacity === "number" ? this.filterOpacity : 0;
    this.filterEl.style.opacity = String(value);
  }

  setupMouseMove() {
    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX / this.width;
      this.mouse.y = 1.0 - e.clientY / this.height;
    });
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.perspCamera.aspect = this.width / this.height;
    this.perspCamera.updateProjectionMatrix();
    this.bgRenderer.setSize(this.width, this.height);
    this.fgRenderer.setSize(this.width, this.height);
    window.dispatchEvent(
      new CustomEvent("app-resize", {
        detail: { width: this.width, height: this.height },
      })
    );
  }

  render() {
    if (!this.isPlaying) return;
    const now = performance.now();
    const delta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    this.time += 0.05;
    this.bgRenderer.clear();
    this.shaderLayerBG.update(this.time);
    this.shaderLayerBG.render(this.bgRenderer, this.camera);
    this.fgRenderer.clear();
    this.shaderLayerFG.update(this.time);
    this.shaderLayerFG.render(this.fgRenderer, this.camera);
    this.modelLayer.update(delta);
    this.fgRenderer.clearDepth();
    this.modelLayer.render(this.fgRenderer, this.perspCamera);
    if (this.overlayManager) this.overlayManager.update();
    this.gameManager?.update?.(delta);
    requestAnimationFrame(this.render);
  }
}
