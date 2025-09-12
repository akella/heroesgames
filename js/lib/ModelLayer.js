import BaseLayer from "./BaseLayer.js";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import modelUrl from "../../model/clay_guy_material_fix_2.glb?url";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export default class ModelLayer extends BaseLayer {
  constructor({ mouse, events }) {
    super();
    this.mouse = mouse;
    this.targetMouse = new THREE.Vector2(0.5, 0.5);
    this.model = null;
    this.mixer = null;
    this.actions = [];
    // Default: show model immediately; add #showModel to URL or set window.SHOW_MODEL=true also forces visibility
    const forceVisible =
      typeof window !== "undefined" &&
      (window.SHOW_MODEL === true ||
        (window.location?.hash || "").includes("showModel"));
    this._shouldBeVisible = forceVisible || true; // desired visibility before model loads
    this.initLoaders();
    this.loadModel();
    this.addLighting();
    // Don't hide by default; visibility will be controlled by flow events or debug override
    document.addEventListener("showCharacter", () => {
      this.showCharacter();
    });
    document.addEventListener("hideCharacter", () => {
      this.hideCharacter();
    });
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.add(directionalLight);
    // If you need an environment map, provide PMREM from an existing renderer.
  }

  initLoaders() {
    this.dracoLoader = new DRACOLoader();
    // Configure Draco decoder path (required if model is Draco-compressed)
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
        // Respect the desired visibility (may have been set before load completed)
        this.model.visible = !!this._shouldBeVisible;
        // Center the model by computing its bounding box
        let scale = 0.4;
        this.model.scale.set(scale, scale, scale);
        const boundingBox = new THREE.Box3().setFromObject(this.model);
        const center = boundingBox.getCenter(new THREE.Vector3());
        console.log(center);
        this.model.position.x = -center.x;
        this.model.position.y = -center.y - 0.7;
        this.model.position.z = -center.z;
        this.modelY = this.model.position.y;
        this.add(this.model);
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(this.model);
          this.actions = gltf.animations.map((clip) =>
            this.mixer.clipAction(clip)
          );
          // this.playAnimation(0);
        }
      },
      undefined,
      (err) => {
        console.error("Failed to load model:", modelUrl, err);
      }
    );
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
    if (this.model && this.mouse) {
      // Rotate model based on mouse position
      this.targetMouse.lerp(this.mouse, 0.05);
      this.model.rotation.y = -(this.targetMouse.x - 0.5) * Math.PI * 0.04;
      this.model.rotation.x =
        0.07 + (this.targetMouse.y - 0.5) * Math.PI * 0.02;
      this.model.position.y = this.modelY + (this.targetMouse.y - 0.5) * 0.05;
    }
  }
}
