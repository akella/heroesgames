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
import { GameManager } from "./modules/GameManager.js";
import { ScoreBoard } from "./modules/ScoreBoard.js";
import { InteractionManager } from "./modules/interactions/InteractionManager.js";

const layers = {
  slide1Layer: makeSlideLayer("slide1"),
  slide2Layer: makeSlideLayer("slide2"),
  slide3Layer: makeSlideLayer("slide3"),
  slide4Layer: makeSlideLayer("slide4"),
  slide5Layer: makeSlideLayer("slide5"),
  slide6Layer: makeSlideLayer("slide6"),
  slide7Layer: makeSlideLayer("slide7"),
  slide8Layer: makeSlideLayer("slide8"),
  slide9Layer: makeSlideLayer("slide9"),
  slide10Layer: makeSlideLayer("slide10"),
  slide11Layer: makeSlideLayer("slide11"),
  slide12Layer: makeSlideLayer("slide12"),
  slide13Layer: makeSlideLayer("slide13"),
  slide14Layer: makeSlideLayer("slide14"),
};

const layerManager = new LayerManager(layers);

const bus = mitt();

// Scoreboard instance (initially hidden)
const scoreBoard = new ScoreBoard({ bus });

const gameManager = new GameManager({ bus });
bus.on("game.finddiff.complete", () => {
  if (gameManager.active?.api) gameManager.active.api.setActive(false);
  flowActor.send({ type: "NEXT" });
});
const gameRoot = document.getElementById("game-root");
if (gameRoot) gameManager.attachRoot(gameRoot);
if (gameRoot) gameRoot.style.zIndex = "5";

let prevSnap;
const flowActor = createActor(flowMachine);
flowActor.subscribe((snap) => {
  if (snap === prevSnap) return;
  prevSnap = snap;
  layerManager.syncToState(snap);
  bus.emit("flow.progress", snap);
  const val = snap.value;
  if (!gameManager.active) return;
  if (val === "slide9") {
    gameManager.active.api.show();
    gameManager.active.api.setActive(false);
    if (gameRoot) gameRoot.style.zIndex = "5";
    bus.emit("score.hide");
  } else if (val === "slide13") {
    gameManager.active.api.setActive(true);
    if (gameRoot) gameRoot.style.zIndex = "20";
    bus.emit("score.show");
  } else if (val === "slide14") {
    gameManager.active.api.setActive(false);
    if (gameRoot) gameRoot.style.zIndex = "5";
    bus.emit("score.hide");
  } else if (val === "outro") {
    gameManager.active.api.hide();
    if (gameRoot) gameRoot.style.zIndex = "5";
    bus.emit("score.hide");
  }
});
flowActor.start();
let gonext = [...document.querySelectorAll(".js-next")];
gonext.forEach((el) => {
  el.addEventListener("click", () => {
    flowActor.send({ type: "NEXT" });
  });
});

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
    this.renderer.domElement.classList.add("gl-canvas");
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

    // Interaction manager & items
    this.interactionManager = new InteractionManager({
      shaderLayer: this.shaderLayer,
      bus,
    });
    this.interactionManager.register({
      id: "picture",
      layers: {
        default: "picture-1",
        active: "picture-2",
        hover: "picture-hover",
      },
      activeSlide: "slide7",
      hover: true,
      hoverWhenInactive: false,
      click: true,
      clickWhenInactive: false,
      bboxLayer: "default",
      eventsPrefix: "picture",
    });
    this.interactionManager.attach();

    bus.on("picture.click", () => {
      flowActor.send({ type: "NEXT" });
    });

    this.initPane();

    // Register games
    gameManager.register("finddiff", () => import("./games/finddiff/index.js"));
    // Preload game
    (async () => {
      try {
        await gameManager.activate("finddiff", { bus });
        gameManager.active?.api.setActive(false);
        gameManager.active?.api.hide();
      } catch (e) {}
    })();

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
    if (this.overlayManager) this.overlayManager.update();
    gameManager.update(delta);
    requestAnimationFrame(this.render.bind(this));
  }
}

new AppController({
  dom: document.getElementById("container"),
});
