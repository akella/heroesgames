import BaseLayer from "./BaseLayer.js";
import * as THREE from "three";
import vertex from "../shader/vertex.glsl";
import layerFragment from "../shader/layerFragment.glsl";
import {
  maskTextures as MASK_PATHS,
  layers as ROOM_LAYERS,
  layerById,
  INITIAL_HIDE,
  MID_GAME_REVEALABLE,
  END_GAME_GROUP,
} from "../modules/roomLayersConfig.js";
import depthMapFull from "../../assets/room/room-depth-2.png";
import depthMapEmpty from "../../assets/room/room-depth-1.png";

export default class ShaderLayer extends BaseLayer {
  constructor({ mouse, events, includeIds = null, excludeIds = null }) {
    super();
    this.mouse = mouse;
    this.targetMouse = new THREE.Vector2(0.5, 0.5);
    this.time = 0;
    this.events = events;
    this.variantState = {};
    this._bboxReadyCallbacks = [];
    this._includeIds = Array.isArray(includeIds) ? new Set(includeIds) : null;
    this._excludeIds = Array.isArray(excludeIds) ? new Set(excludeIds) : null;
    this._buildMultiPass();
    this._applyInitialVisibility();
    this._wireRevealEvents();
    setTimeout(() => this.setVariant("table", 1), 0);
  }

  _buildMultiPass() {
    const loader = new THREE.TextureLoader();
    this._currentDepthMap = "empty";
    this.depthTexture = loader.load(depthMapEmpty, (tex) => {
      const img = tex.image;
      if (img && img.width && img.height) {
        const aspect = img.width / img.height;
        this.layerMeshes?.forEach(({ material }) => {
          if (material.uniforms.depthAspect)
            material.uniforms.depthAspect.value = aspect;
        });
      }
    });
    this._pendingMaskLoads = 0;
    this.maskTextures = MASK_PATHS.map((p) => {
      this._pendingMaskLoads++;
      return loader.load(p, () => {
        this._pendingMaskLoads--;
        this._tryComputeBBoxes();
      });
    });
    this.layerDefs = ROOM_LAYERS.filter((def) => {
      if (this._includeIds && !this._includeIds.has(def.id)) return false;
      if (this._excludeIds && this._excludeIds.has(def.id)) return false;
      return true;
    });
    this.layerEntries = this.layerDefs.map((def) => {
      let variants = null;
      let baseTex;
      if (def.variant) {
        variants = def.variants.map((p) => loader.load(p));
        this.variantState[def.id] = 0;
        baseTex = variants[0];
      } else {
        baseTex = loader.load(def.tex);
      }
      return { def, baseTex, variants };
    });

    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.layerMeshes = this.layerEntries.map((entry, idx) => {
      const material = new THREE.ShaderMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
        blendSrcAlpha: THREE.OneFactor,
        blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
        uniforms: {
          time: { value: 0 },
          mouse: { value: this.mouse },
          resolution: {
            value: new THREE.Vector2(window.innerWidth, window.innerHeight),
          },
          depthTexture: { value: this.depthTexture },
          parallaxStrength: { value: 0.05 },
          layerTex: { value: entry.baseTex },
          maskTex: { value: this.maskTextures[entry.def.mask.i] },
          maskChannel: {
            value: ["r", "g", "b", "a"].indexOf(entry.def.mask.c),
          },
          enabled: { value: 1.0 },
          opacity: { value: 1.0 },
          bboxMin: { value: new THREE.Vector2(0, 0) },
          bboxSize: { value: new THREE.Vector2(1, 1) },
          depthAspect: { value: 1.0 },
        },
        vertexShader: vertex,
        fragmentShader: layerFragment,
      });
      const mesh = new THREE.Mesh(this.geometry, material);
      mesh.renderOrder = 10 + idx;
      this.add(mesh);
      if (entry.def.id === "picture-hover") {
        material.uniforms.enabled.value = 0.0;
      }
      if (INITIAL_HIDE.includes(entry.def.id)) {
        material.uniforms.enabled.value = 0.0;
      }
      return { mesh, material, entry };
    });

    window.addEventListener("app-resize", (e) => {
      this.layerMeshes.forEach(({ material }) => {
        material.uniforms.resolution.value.set(e.detail.width, e.detail.height);
      });
    });
  }

  _applyInitialVisibility() {}

  _wireRevealEvents() {
    if (!this.events) return;
    this.events.on("room.reveal", ({ id }) => {
      if (!id) return;
      this.setLayerEnabled(id, true);
      if (
        MID_GAME_REVEALABLE.every((rid) => this._isLayerEnabled(rid)) &&
        !this._midCompleted
      ) {
        this._midCompleted = true;
        this.events.emit("room.midCompleted");
      }
    });
    this.events.on("room.revealAll", () => {
      END_GAME_GROUP.forEach((id) => this.setLayerEnabled(id, true));
      this._swapDepthMap("full");
      this.events.emit("room.fullVisible");
    });
    this.events.on("room.setDepth", ({ mode }) => {
      this._swapDepthMap(mode === "full" ? "full" : "empty");
    });
  }

  _isLayerEnabled(id) {
    const entry = this.getLayerEntry(id);
    return entry ? entry.material.uniforms.enabled.value > 0.5 : false;
  }

  _swapDepthMap(mode) {
    if (mode === this._currentDepthMap) return;
    const loader = new THREE.TextureLoader();
    const texPath = mode === "full" ? depthMapFull : depthMapEmpty;
    loader.load(texPath, (tex) => {
      this.depthTexture = tex;
      this.layerMeshes.forEach(({ material }) => {
        material.uniforms.depthTexture.value = tex;
        if (tex.image) {
          const img = tex.image;
          const aspect = img.width / img.height;
          if (material.uniforms.depthAspect)
            material.uniforms.depthAspect.value = aspect;
        }
      });
      this._currentDepthMap = mode;
    });
  }

  _tryComputeBBoxes() {
    if (this._pendingMaskLoads > 0) return; // wait all loaded
    // Ensure every mask texture has image data
    if (
      !this.maskTextures.every(
        (t) => t.image && (t.image.width || t.image.naturalWidth)
      )
    )
      return;
    if (this._bboxesComputed) return;
    this._bboxesComputed = true;
    this._maskChannelBBoxes = {}; // key: `${i}_${c}`
    const channelIndex = { r: 0, g: 1, b: 2, a: 3 };
    const scanChannelAdaptive = (img, chIdx) => {
      const thresholds = [40, 25, 15, 8, 5, 3, 1];
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, w, h).data;
      for (let t = 0; t < thresholds.length; t++) {
        const threshold = thresholds[t];
        let minX = w,
          minY = h,
          maxX = -1,
          maxY = -1;
        for (let y = 0; y < h; y++) {
          let rowIndex = y * w * 4;
          for (let x = 0; x < w; x++) {
            const v = data[rowIndex + x * 4 + chIdx];
            if (v > threshold) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX !== -1) {
          return { minX, minY, maxX, maxY, w, h, thresholdUsed: threshold };
        }
      }
      return null;
    };
    const combos = [];
    this.layerDefs.forEach((def) => {
      const key = def.mask.i + "_" + def.mask.c;
      if (!combos.includes(key)) combos.push(key);
    });
    combos.forEach((key) => {
      const [mi, c] = key.split("_");
      const tex = this.maskTextures[parseInt(mi, 10)];
      const img = tex.image;
      if (!img) return;
      const bbox = scanChannelAdaptive(img, channelIndex[c]);
      if (bbox) {
        const width = bbox.maxX - bbox.minX + 1;
        const height = bbox.maxY - bbox.minY + 1;
        // Convert from canvas (0,0 top-left) to UV (0,0 bottom-left)
        const minXuv = bbox.minX / bbox.w;
        const sizeXuv = width / bbox.w;
        const sizeYuv = height / bbox.h;
        const minYuv = 1.0 - (bbox.maxY + 1) / bbox.h; // bottom-left origin
        this._maskChannelBBoxes[key] = {
          min: [minXuv, minYuv],
          size: [sizeXuv, sizeYuv],
          threshold: bbox.thresholdUsed,
        };
      }
    });
    this.layerMeshes.forEach((layer) => {
      const def = layer.entry.def;
      const key = def.mask.i + "_" + def.mask.c;
      const box = this._maskChannelBBoxes[key];
      if (box) {
        layer.material.uniforms.bboxMin.value.set(box.min[0], box.min[1]);
        layer.material.uniforms.bboxSize.value.set(box.size[0], box.size[1]);
      }
    });
    if (this._bboxReadyCallbacks.length) {
      this._bboxReadyCallbacks.forEach((cb) => {
        try {
          cb();
        } catch (e) {}
      });
      this._bboxReadyCallbacks.length = 0;
    }
  }

  setVariant(id, variantIndex) {
    const def = layerById[id];
    if (!def || !def.variant) return;
    const entry = this.layerMeshes.find((l) => l.entry.def.id === id);
    if (!entry) return;
    const list = entry.entry.variants;
    const clamped = Math.max(0, Math.min(list.length - 1, variantIndex));
    if (this.variantState[id] === clamped) return;
    this.variantState[id] = clamped;
    entry.material.uniforms.layerTex.value = list[clamped];
  }

  setLayerEnabled(id, flag) {
    const entry = this.layerMeshes.find((l) => l.entry.def.id === id);
    if (!entry) return;
    entry.material.uniforms.enabled.value = flag ? 1.0 : 0.0;
    if (id === "picture") {
      const sh = this.layerMeshes.find((l) => l.entry.def.id === "picture-sh");
      if (sh) sh.material.uniforms.enabled.value = flag ? 1.0 : 0.0;
    }
  }

  onBBoxesReady(cb) {
    if (this._bboxesComputed) cb();
    else this._bboxReadyCallbacks.push(cb);
  }

  getLayerBBox(id) {
    const def = layerById[id];
    if (!def || !this._maskChannelBBoxes) return null;
    const key = def.mask.i + "_" + def.mask.c;
    return this._maskChannelBBoxes[key] || null;
  }

  getLayerEntry(id) {
    return this.layerMeshes.find((l) => l.entry.def.id === id) || null;
  }

  getDepthAspect() {
    if (!this.layerMeshes || !this.layerMeshes.length) return 1;
    return this.layerMeshes[0].material.uniforms.depthAspect?.value || 1;
  }

  setParallaxStrength(id, value) {
    const entry = this.getLayerEntry(id);
    if (entry) entry.material.uniforms.parallaxStrength.value = value;
  }

  update(time) {
    this.targetMouse.lerp(this.mouse, 0.05);
    this.layerMeshes.forEach(({ material }) => {
      material.uniforms.time.value = time;
      material.uniforms.mouse.value = this.targetMouse;
    });
  }

  render(renderer, camera) {
    super.render(renderer, camera);
  }

  setOpacity(value) {
    this.material.uniforms.opacity.value = value;
  }
}
