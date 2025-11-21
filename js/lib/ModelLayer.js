import BaseLayer from "./BaseLayer.js";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import modelUrl from "../../model/clay_guy_material.glb?url";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { PMREMGenerator } from "three";
export default class ModelLayer extends BaseLayer {
  constructor({ mouse, events }) {
    super();
    this.mouse = mouse;
    this.events = events;
    this.targetMouse = new THREE.Vector2(0.5, 0.5);
    this.model = null;
    this.mixer = null;
    this.actions = [];
    // Presentation overrides (for close-up face slides)
    this._viewScaleMul = 1.0;
    this._viewYOffset = 0.0;
    this._motionEnabled = true; // allow disabling mouse-driven motion for static close-up
    const forceVisible =
      typeof window !== "undefined" &&
      (window.SHOW_MODEL === true ||
        (window.location?.hash || "").includes("showModel"));
    this._shouldBeVisible = !!forceVisible; // desired visibility before model loads
    this.initLoaders();
    this.loadModel();
    this.addLighting();
    this._setupEnvironment();
    document.addEventListener("showCharacter", () => {
      this.showCharacter();
    });
    document.addEventListener("hideCharacter", () => {
      this.hideCharacter();
    });
  }

  attachBusListeners() {
    if (!this.events) return;
    try {
      this.events.on("model.motion", ({ enabled } = {}) => {
        this._motionEnabled = enabled !== false;
        if (!this._motionEnabled && this.model) {
          // Reset rotation to neutral
            this.model.rotation.x = 0.07;
            this.model.rotation.y = 0;
        }
      });
    } catch {}
  }

  _setupEnvironment() {
    try {
      const c = document.querySelector("canvas.gl-canvas--fg");
      if (!c || !c.getContext) return;
      const gl = c.getContext("webgl2") || c.getContext("webgl");
      if (!gl) return;
      const renderer = new THREE.WebGLRenderer({ canvas: c, context: gl });
      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      this.environment = env;
      this.background = null;
    } catch (e) {
      // Non-fatal if environment setup fails
    }
  }

  showCharacter() {
    this._shouldBeVisible = true;
    if (this.model) this.model.visible = true;
  }
  hideCharacter() {
    this._shouldBeVisible = false;
    if (this.model) this.model.visible = false;
  }

  addLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.add(ambientLight);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x8899aa, 1);
    hemi.position.set(0, 1, 0);
    this.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(2.5, 3.0, 2.0);
    key.target.position.set(0, 0.5, 0);
    this.add(key);
    this.add(key.target);
  }

  initLoaders() {
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.5.7/"
    );
    this.dracoLoader.preload();
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
  }

  loadModel() {
    this.gltfLoader.load(
      modelUrl,
      (gltf) => {
        this.model = gltf.scene;
        this.model.visible = !!this._shouldBeVisible;
        let scale = 0.33;
        this._baseScale = scale;
        this.model.scale.set(scale, scale, scale);
        const boundingBox = new THREE.Box3().setFromObject(this.model);
        const center = boundingBox.getCenter(new THREE.Vector3());
        if (import.meta.env?.DEV) {
          // Debug model center while tuning
          console.log(center);
        }
        this.model.position.x = -center.x;
        this.model.position.y = -center.y - 0.7;
        const zOffset = 0.18;
        this.model.position.z = -center.z + zOffset;
        this.modelY = this.model.position.y;
        this.add(this.model);
        this.model.traverse((obj) => {
          if (obj.isMesh && obj.material) {
            const m = obj.material;
            if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
              if (m.envMapIntensity != null) m.envMapIntensity = 0.8;
              if (m.roughness != null)
                m.roughness = Math.min(0.9, Math.max(0.65, m.roughness * 1.05));
              if (m.metalness != null)
                m.metalness = Math.max(0, Math.min(0.12, m.metalness * 0.6));
              if (m.clearcoat != null) m.clearcoat = Math.min(0.1, m.clearcoat);
              if (m.sheen != null) m.sheen = 0;
            }
            if (m.color) {
              m.color.multiplyScalar(1.08);
            }
          }
        });
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(this.model);
          this.actions = gltf.animations.map((clip) =>
            this.mixer.clipAction(clip)
          );
          this.playAnimation(0);
        }
        try {
          // Mark globally and notify listeners that the character model is ready
          if (typeof window !== "undefined") window.__characterLoaded = true;
          document.dispatchEvent(new CustomEvent("characterLoaded"));
        } catch {}
      },
      undefined,
      (err) => {
        console.error("Failed to load model:", modelUrl, err);
      }
    );
  }

  // Apply presentation overrides for close-up slides
  applyView({ scaleMul, yOffset } = {}) {
    if (typeof scaleMul === "number") this._viewScaleMul = scaleMul;
    if (typeof yOffset === "number") this._viewYOffset = yOffset;
    if (this.model) {
      const s = (this._baseScale || 1) * (this._viewScaleMul || 1);
      this.model.scale.set(s, s, s);
      this.model.position.y = (this.modelY || 0) + (this._viewYOffset || 0);
    }
  }

  resetView() {
    this._viewScaleMul = 1.0;
    this._viewYOffset = 0.0;
    if (this.model) {
      const s = this._baseScale || 1;
      this.model.scale.set(s, s, s);
      this.model.position.y = this.modelY || 0;
    }
  }

  render(renderer, camera) {
    super.render(renderer, camera);
  }

  playAnimation(index = 0) {
    if (this.actions && this.actions[index]) {
      this.actions[index].reset().play();
    }
  }

  update(delta) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
    if (this.model && this.mouse && this._motionEnabled) {
      this.targetMouse.lerp(this.mouse, 0.05);
      this.model.rotation.y = -(this.targetMouse.x - 0.5) * Math.PI * 0.04;
      this.model.rotation.x =
        0.07 + (this.targetMouse.y - 0.5) * Math.PI * 0.02;
      // Apply subtle idle motion on top of presentation offset
      const baseY = (this.modelY || 0) + (this._viewYOffset || 0);
      this.model.position.y = baseY + (this.targetMouse.y - 0.5) * 0.05;
    }
  }
}
