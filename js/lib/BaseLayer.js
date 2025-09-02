import * as THREE from "three";

export default class BaseLayer extends THREE.Scene {
  constructor() {
    super();
  }

  render(renderer, camera) {
    renderer.render(this, camera);
  }
}
