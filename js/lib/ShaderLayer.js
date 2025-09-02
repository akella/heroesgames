import BaseLayer from './BaseLayer.js';
import * as THREE from 'three';
import fragment from '../shader/fragment.glsl';
import vertex from '../shader/vertex.glsl';
import emptyRoomEarly from '../../assets/room/empty-room-2.png';
import emptyRoomLate from '../../assets/room/empty-room.png';
import room_depth from '../../empty-room.jpg';

export default class ShaderLayer extends BaseLayer {
  constructor({mouse, events}) {
    super();
    this.mouse = mouse;
    this.targetMouse = new THREE.Vector2(0.5, 0.5);
    this.time = 0;
    this.addObjects();
    events.on('flow.progress', (snap) => {
      const { value } = snap;
      this.updateRoomForSlide(value);
    });

    // initial texture
    this.updateRoomForSlide('slide1');
  }

  addObjects() {
  const textureLoader = new THREE.TextureLoader();
  // preload textures
  this.textures = {
    early: textureLoader.load(emptyRoomEarly),
    late: textureLoader.load(emptyRoomLate),
  };
  const depthTexture = textureLoader.load(room_depth);

    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives : enable',
      },
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: {
        time: { value: 0 },
        mouse: { value: this.mouse },
        colorTexture: { value: this.textures.early },
        depthTexture: { value: depthTexture },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        opacity: { value: 1.0 },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.add(this.plane);
    window.addEventListener('app-resize', (e) => {
      this.material.uniforms.resolution.value.set(e.detail.width, e.detail.height);
    });
  }

  update(time) {
    this.targetMouse.lerp(this.mouse, 0.05);
    this.material.uniforms.time.value = time;
    this.material.uniforms.mouse.value = this.targetMouse;
  }

  updateRoomForSlide(slideId) {
    if(!this.textures || !this.material) return;
    const num = parseInt(String(slideId).replace('slide',''),10) || 1;
    // slides 1-6 use early texture, slide 7+ use late texture
    const tex = num >= 7 ? this.textures.late : this.textures.early;
    if (this.material.uniforms.colorTexture.value !== tex) {
      this.material.uniforms.colorTexture.value = tex;
    }
  }

  render(renderer, camera) {
    super.render(renderer, camera);
  }

  setOpacity(value) {
    this.material.uniforms.opacity.value = value;
  }
} 