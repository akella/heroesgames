// structure- slides, or minigames, slides with transitions next-only
// structure to visualize a lot of 2d images
// visualize 3d hero, and play animations, make a module that accepts events to trigger animations
// create dat-gui to go "next next or prev slides"
// prepare images for game assets

// create divs with numbers, and assign show-hide animations to them to run it from flowmachine!

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import GUI from "lil-gui";
import ShaderLayer from "./lib/ShaderLayer.js";
import ModelLayer from "./lib/ModelLayer.js";
import { Pane } from "tweakpane";
import { createMachine, createActor } from "xstate";
import { flowMachine } from "./modules/flowmachine.js";
import mitt from "mitt";
import { LayerManager } from "./modules/LayerManager.js";
import { makeSlideLayer } from "./modules/makeSlideLayer.js";
import { OverlayObjectsManager } from './modules/OverlayObjectsManager.js';

const layers = {
  slide1Layer: makeSlideLayer('slide1'),
  slide2Layer: makeSlideLayer('slide2'),
  slide3Layer: makeSlideLayer('slide3'),
  slide4Layer: makeSlideLayer('slide4'),
  slide5Layer: makeSlideLayer('slide5'),
  slide6Layer: makeSlideLayer('slide6'),
  slide7Layer: makeSlideLayer('slide7'),
};

const layerManager = new LayerManager(layers);

const bus = mitt();

let prevSnap;
const flowActor = createActor(flowMachine);
console.log(flowActor);
flowActor.subscribe((snap) => {
  if (snap === prevSnap) return;
  prevSnap = snap;              
  layerManager.syncToState(snap);

  //----------------------------------------------------------
  // 🔔 BROADCAST TO ALL RENDERING LAYERS
  //----------------------------------------------------------
  bus.emit('flow.progress', snap);     // 1-line fan-out
});
flowActor.start();
let gonext = [...document.querySelectorAll('.js-next')]
gonext.forEach(el => {
  el.addEventListener('click', () => {
    flowActor.send({ type: "NEXT" });
  })
})

class AppController {
  constructor(options) {
    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    // this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.autoClear = false;
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
    this.perspCamera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      100
    );
    this.perspCamera.position.set(0, 0, 2);
    this.time = 0;
    this.mouse = new THREE.Vector2(0.5, 0.5);

    this.shaderLayer = new ShaderLayer({
      mouse: this.mouse,
      events: bus,
    });
    this.modelLayer = new ModelLayer({
      mouse: this.mouse,
      events: bus,
    });

    // Overlay objects manager
    this.overlayManager = new OverlayObjectsManager({
      container: document.body,
      mouse: this.mouse,
      events: bus,
    });
    this.overlayManager.add({
      id: 'picture1',
      slides: ['slide6','slide7'],
      initial: { centerOffset: { x: -545, y: 280, mode: 'px', anchor: 'center' }, width: '85px' },
      parallax: { strengthX: 17, strengthY: 10, lerp: 0.08 },
      images: { normal: 'assets/picture.png', hover: 'assets/picture-hover.png', hoverScale: 2 },
      action: {
        slides: ['slide6'],
        onTrigger: () => {
          flowActor.send({ type: 'NEXT' });
        }
      },
      zIndex: 12,
    });

    this.initPane();

    this.isPlaying = true;
    this.resize();
    this.setupResize();
    this.setupMouseMove();
    this.lastTime = performance.now();
    this.render();
  }

  initPane() {
    this.PARAMS = { opacity: 1 };
    this.pane = new Pane();
    // this.pane
    //   .addBinding(this.PARAMS, "opacity", { min: 0, max: 1 })
    //   .on("change", (ev) => {
    //     this.shaderLayer.setOpacity(ev.value);
    //   });
    this.pane.addButton({ title: "Next" }).on("click", () => {
      flowActor.send({ type: "NEXT" });
    });
  }

  setupMouseMove() {
    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX / this.width;
      this.mouse.y = 1.0 - e.clientY / this.height;
    });
  }

  // overlay objects now managed by OverlayObjectsManager

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.perspCamera.aspect = this.width / this.height;
    this.perspCamera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    // Dispatch custom resize event with dimensions
    window.dispatchEvent(
      new CustomEvent("app-resize", {
        detail: {
          width: this.width,
          height: this.height,
        },
      })
    );
  }

  render() {
    if (!this.isPlaying) return;
    const now = performance.now();
    const delta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    this.time += 0.05;
    this.renderer.clear();
    this.shaderLayer.update(this.time);
    this.shaderLayer.render(this.renderer, this.camera);
    this.modelLayer.update(delta);
    this.renderer.clearDepth();
    this.modelLayer.render(this.renderer, this.perspCamera);
    // simple parallax: move picture slightly with mouse (lerp already applied on layers)
  if(this.overlayManager) this.overlayManager.update();
    requestAnimationFrame(this.render.bind(this));
  }
}

new AppController({
  dom: document.getElementById("container"),
});
