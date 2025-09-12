// structure- slides, or minigames, slides with transitions next-only
// structure to visualize a lot of 2d images
// visualize 3d hero, and play animations, make a module that accepts events to trigger animations
// create dat-gui to go "next next or prev slides"
// prepare images for game assets

// create divs with numbers, and assign show-hide animations to them to run it from flowmachine!

import * as THREE from "three";
import "../css/style.scss"; // ensure SCSS is processed by Vite
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import GUI from "lil-gui";
import ShaderLayer from "./lib/ShaderLayer.js";
import ModelLayer from "./lib/ModelLayer.js";
import { Pane } from "tweakpane";
import { createMachine, createActor } from "xstate";
import { flowMachine } from "./modules/flowmachine.js";
import { setupFlowSubscription } from "./modules/flowHandlers.js";
import mitt from "mitt";
import { LayerManager } from "./modules/LayerManager.js";
import { makeSlideLayer } from "./modules/makeSlideLayer.js";
import { GameManager } from "./modules/GameManager.js";
import { ScoreBoard } from "./modules/ScoreBoard.js";
import { InteractionManager } from "./modules/interactions/InteractionManager.js";
import { UNFILTERED_IDS } from "./modules/roomLayersConfig.js";
import { RoomPicker } from "./modules/ui/RoomPicker.js";
import { ToyPickerController } from "./modules/ui/ToyPickerController.js";
import { initAnchorManager } from "./modules/anchorManager.js";

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
  slide15Layer: makeSlideLayer("slide15"),
  slide16Layer: makeSlideLayer("slide16"),
  slide17Layer: makeSlideLayer("slide17"),
  slide18Layer: makeSlideLayer("slide18"),
  slide19Layer: makeSlideLayer("slide19"),
  slide20Layer: makeSlideLayer("slide20"),
  slide21Layer: makeSlideLayer("slide21"),
  slide22Layer: makeSlideLayer("slide22"),
  slide23Layer: makeSlideLayer("slide23"),
  slide24Layer: makeSlideLayer("slide24"),
  slide25Layer: makeSlideLayer("slide25"),
  slide26Layer: makeSlideLayer("slide26"),
  slide27Layer: makeSlideLayer("slide27"),
  slide28Layer: makeSlideLayer("slide28"),
  slide29Layer: makeSlideLayer("slide29"),
  slide30Layer: makeSlideLayer("slide30"),
  slide31Layer: makeSlideLayer("slide31"),
};

const layerManager = new LayerManager(layers);

const bus = mitt();

const scoreBoard = new ScoreBoard({ bus });

const gameManager = new GameManager({ bus });
bus.on("game.finddiff.complete", () => {
  if (gameManager.active?.api) gameManager.active.api.setActive(false);
  flowActor.send({ type: "NEXT" });
});
const gameRoot = document.getElementById("game-root");
if (gameRoot) gameManager.attachRoot(gameRoot);
if (gameRoot) gameRoot.style.zIndex = "40";

const flowActor = createActor(flowMachine);
setupFlowSubscription({
  flowActor,
  layerManager,
  bus,
  gameManager,
  gameRoot,
});
let gonext = [...document.querySelectorAll(".js-next")];
gonext.forEach((el) => {
  el.addEventListener("click", () => {
    flowActor.send({ type: "NEXT" });
  });
});

class AppController {
  constructor(options) {
    this.container = options.dom;
    this.bus = options.bus;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    // Create two renderers/canvases: background (filtered) and foreground (unfiltered)
    this.bgRenderer = new THREE.WebGLRenderer({ antialias: true });
    this.bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.bgRenderer.setSize(this.width, this.height);
    this.bgRenderer.autoClear = true;
    this.bgRenderer.domElement.classList.add("gl-canvas", "gl-canvas--bg");
    this.container.appendChild(this.bgRenderer.domElement);

    this.filterEl = document.createElement("div");
    this.filterEl.className = "scene-filter";
    this.filterEl.style.opacity = "0.5";
    this.container.appendChild(this.filterEl);

    this.fgRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.fgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.fgRenderer.setSize(this.width, this.height);
    this.fgRenderer.autoClear = false;
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
    this.mouse = new THREE.Vector2(0.5, 0.5);

    this.shaderLayerBG = new ShaderLayer({
      mouse: this.mouse,
      events: bus,
      excludeIds: UNFILTERED_IDS,
    });
    this.shaderLayerFG = new ShaderLayer({
      mouse: this.mouse,
      events: bus,
      includeIds: UNFILTERED_IDS,
    });

    this.modelLayer = new ModelLayer({ mouse: this.mouse, events: bus });

    // RoomPicker UI: separate pickers for wall, floor, table
    // Track current slide locally to gate auto-advance on specific slides
    let currentSlide = null;
    const onOpenOnce = (() => {
      let fired = false;
      return () => {
        if (fired) return;
        if (
          currentSlide === "slide29" ||
          currentSlide === "slide30" ||
          currentSlide === "slide31"
        )
          return;
        fired = true;
        try {
          flowActor.send({ type: "NEXT" });
        } catch {}
      };
    })();
    const onSelectOnce = (() => {
      let fired = false;
      return () => {
        if (fired) return;
        if (
          currentSlide === "slide29" ||
          currentSlide === "slide30" ||
          currentSlide === "slide31"
        )
          return;
        fired = true;
        try {
          flowActor.send({ type: "NEXT" });
        } catch {}
      };
    })();
    const onLockedClickOnce = (() => {
      let fired = false;
      return () => {
        if (fired) return;
        fired = true;
        try {
          flowActor.send({ type: "NEXT" });
        } catch {}
      };
    })();

    let pickerWall, pickerFloor, pickerTable;
    const closeOthers = (who) => {
      [pickerWall, pickerFloor, pickerTable].forEach((p) => {
        if (p && p !== who) p.close();
      });
    };

    window.__pickerWall = pickerWall = new RoomPicker({
      container: document.body,
      shaderBG: this.shaderLayerBG,
      shaderFG: this.shaderLayerFG,
      category: "wall",
      anchor: {
        shader: this.shaderLayerBG,
        layerId: "wall",
        align: "center",
        offset: { x: -250, y: -200 },
      },
      locked: true,
      onOpen: () => {
        closeOthers(pickerWall);
        onOpenOnce();
      },
      onFirstSelect: onSelectOnce,
      onLockedClick: onLockedClickOnce,
    });
    window.__pickerFloor = pickerFloor = new RoomPicker({
      container: document.body,
      shaderBG: this.shaderLayerBG,
      shaderFG: this.shaderLayerFG,
      category: "floor",
      anchor: {
        shader: this.shaderLayerBG,
        layerId: "floor",
        align: "center",
        offset: { x: 280, y: 200 },
      },
      locked: true,
      onOpen: () => {
        closeOthers(pickerFloor);
        onOpenOnce();
      },
      onFirstSelect: onSelectOnce,
      onLockedClick: onLockedClickOnce,
    });
    window.__pickerTable = pickerTable = new RoomPicker({
      container: document.body,
      shaderBG: this.shaderLayerBG,
      shaderFG: this.shaderLayerFG,
      category: "table",
      anchor: {
        shader: this.shaderLayerBG,
        layerId: "table",
        align: "center",
        offset: { x: 0, y: -150 },
      },
      locked: true,
      onOpen: () => {
        closeOthers(pickerTable);
        onOpenOnce();
      },
      onFirstSelect: onSelectOnce,
      onLockedClick: onLockedClickOnce,
    });
    pickerWall.hide();
    pickerFloor.hide();
    pickerTable.hide();

    // Toy pickers controller
    const toyController = new ToyPickerController({
      bus: this.bus,
      shaderBG: this.shaderLayerBG,
      shaderFG: this.shaderLayerFG,
      container: document.body,
      anchors: {
        // Anchor to visible/base layers near desired positions for stability
        // Dino wants top-left placement: anchor to wall top-left with margin
        dino: {
          shader: this.shaderLayerBG,
          layerId: "wall",
          align: "top-left",
          offset: { x: 260, y: 230 },
        },
        ship: {
          shader: this.shaderLayerBG,
          layerId: "wall",
          align: "center",
          offset: { x: 300, y: -80 },
        },
        robot: {
          shader: this.shaderLayerBG,
          layerId: "floor",
          align: "center",
          offset: { x: 500, y: -330 },
        },
      },
    });

    this.bus.on("flow.progress", (snap) => {
      currentSlide = snap?.value || snap;
    });

    this.interactionManager = new InteractionManager({
      shaderLayer: this.shaderLayerFG,
      bus,
    });
    // Picture interaction
    this.interactionManager.register({
      id: "picture",
      layers: {
        default: "picture-1",
        active: "picture-2",
        hover: "picture-hover",
      },
      activeSlide: "slide7",
      visibleSlides: ["slide4", "slide5", "slide6", "slide7"],
      hover: true,
      hoverWhenInactive: false,
      click: true,
      clickWhenInactive: false,
      bboxLayer: "default",
      eventsPrefix: "picture",
      highlightMode: "active",
      highlightParallax: true,
    });
    // Book on the floor interaction
    this.interactionManager.register({
      id: "book-floor",
      layers: {
        default: "book-floor",
        hover: "book-floor-hover",
      },
      visibleSlides: ["slide20", "slide21", "slide22", "slide29"],
      hover: true,
      hoverWhenInactive: true, // allow hover even before activation
      hoverOnlyOnSlides: ["slide21", "slide22"],
      click: true,
      clickWhenInactive: true,
      bboxLayer: "hover",
      eventsPrefix: "book-floor",
      highlightOnlyOnSlides: ["slide20", "slide21", "slide22"],
      highlightMode: "visible",
      highlightParallax: true,
      highlightOffset: { x: 0, y: 8 },
    });
    // Box interaction
    this.interactionManager.register({
      id: "box",
      layers: {
        default: "box",
        hover: "box-hover",
      },
      visibleSlides: ["slide20", "slide21", "slide22", "slide29"],
      hover: true,
      hoverWhenInactive: true,
      hoverOnlyOnSlides: ["slide21", "slide22"],
      click: true,
      clickWhenInactive: true,
      bboxLayer: "hover",
      eventsPrefix: "box",
      highlightOnlyOnSlides: ["slide20", "slide21", "slide22"],
      highlightMode: "visible",
      highlightParallax: true,
      highlightOffset: { x: 0, y: 8 },
    });
    // Football interaction
    this.interactionManager.register({
      id: "football-0",
      layers: {
        default: "football-0",
        hover: "football-hover",
      },
      visibleSlides: ["slide20", "slide21", "slide22", "slide29"],
      hover: true,
      hoverWhenInactive: true,
      hoverOnlyOnSlides: ["slide21", "slide22"],
      click: true,
      clickWhenInactive: true,
      bboxLayer: "hover",
      eventsPrefix: "football",
      highlightOnlyOnSlides: ["slide20", "slide21", "slide22"],
      highlightMode: "visible",
      highlightParallax: true,
      highlightOffset: { x: 0, y: 8 },
    });
    this.interactionManager.attach();

    bus.on("picture.click", () => {
      flowActor.send({ type: "NEXT" });
    });
    bus.on("book-floor.click", () => {
      flowActor.send({ type: "NEXT" });
    });
    // bus.on("box.click", () => {
    //   flowActor.send({ type: "NEXT" });
    // });
    // bus.on("football.click", () => {
    //   flowActor.send({ type: "NEXT" });
    // });

    this.initPane();

    gameManager.register("finddiff", () => import("./games/finddiff/index.js"));
    (async () => {
      try {
        await gameManager.activate("finddiff", { bus });
        gameManager.active?.api.setActive(false);
        gameManager.active?.api.hide();
      } catch (e) {}
    })();

    // Register puzzle game (activated later on slide24 lazily)
    gameManager.register("puzzle", () => import("./games/puzzle/index.js"));
    // Kick off preload early (non-blocking)
    gameManager.preload("puzzle");
    bus.on("game.puzzle.complete", () => {
      // Advance flow when puzzle is complete
      try {
        flowActor.send({ type: "NEXT" });
      } catch {}
    });

    this.isPlaying = true;
    this.resize();
    this.setupResize();
    this.setupMouseMove();
    this.lastTime = performance.now();
    this.render();
  }

  showFilter(opacity = 0.5) {
    this.filterOpacity = opacity;
    this.filterEl.style.pointerEvents = "none";
    this._applyFilterOpacity();
  }

  hideFilter() {
    this.filterOpacity = 0;
    this._applyFilterOpacity();
  }

  _applyFilterOpacity() {
    const v = this.filterOpacity == null ? 0.5 : this.filterOpacity;
    if (this.filterEl) this.filterEl.style.opacity = String(v);
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
    this.bgRenderer.setSize(this.width, this.height);
    this.fgRenderer.setSize(this.width, this.height);
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
    gameManager.update(delta);
    requestAnimationFrame(this.render.bind(this));
  }
}

new AppController({
  dom: document.getElementById("container"),
  bus,
});

// Initialize anchor system for responsive positioned assets
initAnchorManager();
