import BaseLayer from './BaseLayer.js';
import * as THREE from 'three';
import fragment from '../shader/fragment.glsl';
import vertex from '../shader/vertex.glsl';
import room from '../../assets/empty-room.png';
import room_depth from '../../empty-room.jpg';

export default class ShaderLayer extends BaseLayer {
  constructor({mouse, events}) {
    super();
    this.mouse = mouse;
    this.targetMouse = new THREE.Vector2(0.5, 0.5);
    this.time = 0;
    this.addObjects();
    events.on('flow.progress', (snap) => {
      const { value, context } = snap;
      console.log(value, context,snap,'shaderlayer')
  
    });
  }

  addObjects() {
    const textureLoader = new THREE.TextureLoader();
    const colorTexture = textureLoader.load(room);
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
        colorTexture: { value: colorTexture },
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

  render(renderer, camera) {
    super.render(renderer, camera);
  }

  setOpacity(value) {
    this.material.uniforms.opacity.value = value;
  }
} 