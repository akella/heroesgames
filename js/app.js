// structure- slides, or minigames, slides with transitions next-only
// structure to visualize a lot of 2d images
// visualize 3d hero, and play animations, make a module that accepts events to trigger animations
// create dat-gui to go "next next or prev slides"
// prepare images for game assets

// create divs with numbers, and assign show-hide animations to them to run it from flowmachine!

import * as THREE from "three";
import "../css/style.scss";
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
import { INTERACTION_CONFIGS } from "./modules/interactions/interactionConfigs.js";
import { UNFILTERED_IDS } from "./modules/roomLayersConfig.js";
import { RoomPicker } from "./modules/ui/RoomPicker.js";
import { ToyPickerController } from "./modules/ui/ToyPickerController.js";
import { ensurePickersContainer } from "./modules/ui/pickersContainer.js";
import { initAnchorManager } from "./modules/anchorManager.js";
import { SceneController } from "./modules/SceneController.js";
import { initMenuOverlay } from "./modules/ui/MenuOverlay.js";
import { initHeaderProgress } from "./modules/ui/HeaderProgress.js";
import { initHelpOverlay } from "./modules/ui/HelpOverlay.js";
import { initShareOverlay } from "./modules/ui/ShareOverlay.js";

const WEBP_URLS = (() => {
  try {
    return import.meta.glob("/assets/**/*.webp", {
      query: "?url",
      import: "default",
      eager: true,
    });
  } catch {
    return {};
  }
})();

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
  slide32Layer: makeSlideLayer("slide32"),
  slide33Layer: makeSlideLayer("slide33"),
  slide34Layer: makeSlideLayer("slide34"),
  slide35Layer: makeSlideLayer("slide35"),
  slide36Layer: makeSlideLayer("slide36"),
  slide37Layer: makeSlideLayer("slide37"),
  slide38Layer: makeSlideLayer("slide38"),
  slide39Layer: makeSlideLayer("slide39"),
  slide40Layer: makeSlideLayer("slide40"),
  slide41Layer: makeSlideLayer("slide41"),
  slide42Layer: makeSlideLayer("slide42"),
  slide43Layer: makeSlideLayer("slide43"),
  slide44Layer: makeSlideLayer("slide44"),
  slide45Layer: makeSlideLayer("slide45"),
  slide46Layer: makeSlideLayer("slide46"),
  slide47Layer: makeSlideLayer("slide47"),
  slide48Layer: makeSlideLayer("slide48"),
  slide99Layer: makeSlideLayer("slide99"),
};

const layerManager = new LayerManager(layers);

const bus = mitt();

const scoreBoard = new ScoreBoard({ bus });

const gameManager = new GameManager({ bus });
try {
  window.gameManagerRef = gameManager;
} catch {}
window.__wordboxCompleted = false;
window.__puzzleCompleted = false;
window.__footballCompleted = false;
window.__puzzleExitPending = false;
window.__wordboxExitPending = false;
window.__footballExitPending = false;
window.__footballCompletedPending = false;
bus.on("game.finddiff.complete", () => {
  let curSlide;
  try {
    curSlide = flowActor.getSnapshot().value;
  } catch {}
  const m = /slide(\d+)/.exec(curSlide || "");
  let hideAt = null;
  if (m) {
    const base = parseInt(m[1], 10);
    // Show for next two slides (base+1, base+2); hide on base+3
    hideAt = "slide" + (base + 3);
  }
  try {
    window.__finddiffHideAt = hideAt;
  } catch {}
  // Deactivate interactions but keep visible
  try {
    gameManager.active?.api?.setActive?.(false);
  } catch {}
  // Optionally hide scoreboard now
  try {
    bus.emit("score.hide");
  } catch {}
  try {
    bus.emit("room.remove", { id: "picture" });
  } catch {}
  // Advance to first post-game slide
  flowActor.send({ type: "NEXT" });
});
const gameRoot = document.getElementById("game-root");
if (gameRoot) gameManager.attachRoot(gameRoot);
if (gameRoot) gameRoot.style.zIndex = "40";

// Register games early so flow rules can preload them by slide
gameManager.register("finddiff", () => import("./games/finddiff/index.js"));
gameManager.register("puzzle", () => import("./games/puzzle/index.js"));
gameManager.register("wordbox", () => import("./games/wordbox/index.js"));
gameManager.register("football", () => import("./games/football/index.js"));

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
    try {
      bus.emit("ui.closePickers");
    } catch {}
    flowActor.send({ type: "NEXT" });
  });
});

// Initialize header/menu overlay interactions
const menuOverlayApi = initMenuOverlay({ bus });
// Initialize header progress (game completion bar)
initHeaderProgress({ bus });
// Initialize help overlay (contact form)
initHelpOverlay();
// Initialize share overlay (share form)
const shareApi = initShareOverlay();

class AppController {
  constructor(options) {
    this.container = options.dom;
    this.bus = options.bus;
    this.render = this.render.bind(this);
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    // Create two renderers/canvases: background (filtered) and foreground (unfiltered)
    this.bgRenderer = new THREE.WebGLRenderer({ antialias: true });
    this.bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.bgRenderer.setSize(this.width, this.height);
    this.bgRenderer.autoClear = true;
    this.bgRenderer.toneMapping = THREE.NeutralToneMapping;
    this.bgRenderer.toneMappingExposure = 1.35;
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
    let currentSlide = null;
    const onOpenOnce = (() => {
      let fired = false;
      return () => {
        if (fired) return;
        if (
          currentSlide === "slide18" ||
          currentSlide === "slide19" ||
          currentSlide === "slide20" ||
          currentSlide === "slide21" ||
          currentSlide === "slide22" ||
          currentSlide === "slide29" ||
          currentSlide === "slide30" ||
          currentSlide === "slide31" ||
          currentSlide === "slide47" ||
          currentSlide === "slide48"
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
          currentSlide === "slide18" ||
          currentSlide === "slide19" ||
          currentSlide === "slide20" ||
          currentSlide === "slide21" ||
          currentSlide === "slide22" ||
          currentSlide === "slide29" ||
          currentSlide === "slide30" ||
          currentSlide === "slide31" ||
          currentSlide === "slide47" ||
          currentSlide === "slide48"
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
        // Do not auto-advance when on slides with pickers disabled for auto-next
        if (
          currentSlide === "slide47" ||
          currentSlide === "slide48" ||
          currentSlide === "slide29" ||
          currentSlide === "slide30" ||
          currentSlide === "slide31"
        ) {
          return;
        }
        fired = true;
        try {
          flowActor.send({ type: "NEXT" });
        } catch {}
      };
    })();

    let pickerWall, pickerFloor, pickerTable;
    const roomPickersContainer = ensurePickersContainer();
    const closeOthers = (who) => {
      [pickerWall, pickerFloor, pickerTable].forEach((p) => {
        if (p && p !== who) p.close();
      });
    };

    // expose pickers on window for quick manual QA
    window.__pickerWall = pickerWall = new RoomPicker({
      container: roomPickersContainer,
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
      container: roomPickersContainer,
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
      container: roomPickersContainer,
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
      container: roomPickersContainer,
      slideBehavior: {
        hidden: ["slide29", "slide33", "slide99"],
        lockedVisible: ["slide30"],
        unlockedVisible: ["slide31", "slide32"],
      },
      anchors: {
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

    const PUZZLE_SLIDES = [
      "slide23",
      "slide24",
      "slide25",
      "slide26",
      "slide27",
      "slide28",
    ];
    const WORDBOX_SLIDES = [
      "slide33",
      "slide34",
      "slide35",
      "slide36",
      "slide37",
    ];
    const FOOTBALL_SLIDES = ["slide41"];
    const DEFER_SLIDES = [
      ...PUZZLE_SLIDES,
      ...WORDBOX_SLIDES,
      ...FOOTBALL_SLIDES,
    ];
    const deferImagesForSlides = (ids) => {
      ids.forEach((sid) => {
        const slideEl = document.getElementById(sid);
        if (!slideEl) return;
        const imgs = slideEl.querySelectorAll("img[src]");
        imgs.forEach((img) => {
          // Skip if already deferred
          if (img.dataset && img.dataset.src) return;
          try {
            img.dataset.src = img.getAttribute("src");
            img.removeAttribute("src");
            img.setAttribute("loading", "lazy");
            img.setAttribute("decoding", "async");
          } catch {}
        });
      });
    };
    const resolveBuiltUrl = (p) => {
      const abs = p.startsWith("/") ? p : "/" + p;
      return WEBP_URLS[abs] || abs;
    };

    const hydrateImagesForSlides = (ids) => {
      ids.forEach((sid) => {
        const slideEl = document.getElementById(sid);
        if (!slideEl) return;
        const imgs = slideEl.querySelectorAll("img[data-src]:not([src])");
        imgs.forEach((img) => {
          try {
            const original = img.dataset.src;
            if (!original) return;
            img.setAttribute("src", resolveBuiltUrl(original));
          } catch {}
        });
      });
    };
    deferImagesForSlides(DEFER_SLIDES);

    this.bus.on("flow.progress", (snap) => {
      currentSlide = snap?.value || snap;
      // Toggle share (spark) visibility starting at slide6, without layout shift
      try {
        const spark = document.querySelector(".btn-icon-circle--spark");
        if (spark) {
          const show =
            typeof currentSlide === "string" &&
            /^(slide[6-9]|slide\d{2,})$/.test(currentSlide);
          spark.classList.toggle("is-visible", !!show);
        }
      } catch {}
      try {
        toyController?.toyDino?.close?.();
        toyController?.toyShip?.close?.();
        toyController?.toyRobot?.close?.();
      } catch {}
      if (currentSlide === "slide19" && !this._puzzleImagesPrefetched) {
        this._puzzleImagesPrefetched = true;
        hydrateImagesForSlides(PUZZLE_SLIDES);
      }
      if (
        typeof currentSlide === "string" &&
        currentSlide.startsWith("slide")
      ) {
        hydrateImagesForSlides([currentSlide]);
      }
    });

    try {
      this.shaderLayerFG?.preloadLayers?.([
        "picture-hover",
        "book-floor-hover",
        "box-hover",
        "football-hover",
        "wheel-pump-hover",
      ]);
    } catch {}

    this.bus.on("flow.progress", (snap) => {
      const val = snap?.value || snap;
      if (val === "slide16" && !this._pickerVariantsPreloaded) {
        this._pickerVariantsPreloaded = true;
        try {
          this.shaderLayerBG?.preloadVariants?.("wall");
          this.shaderLayerBG?.preloadVariants?.("floor");
          this.shaderLayerBG?.preloadVariants?.("table");
        } catch {}
        try {
          this.shaderLayerFG?.preloadVariants?.("wall");
          this.shaderLayerFG?.preloadVariants?.("floor");
          this.shaderLayerFG?.preloadVariants?.("table");
        } catch {}
      }
    });

    // Close pickers proactively when user hits Next
    this.bus.on("ui.closePickers", () => {
      try {
        pickerWall?.close?.();
        pickerFloor?.close?.();
        pickerTable?.close?.();
        toyController?.toyDino?.close?.();
        toyController?.toyShip?.close?.();
        toyController?.toyRobot?.close?.();
      } catch {}
    });

    this.interactionManager = new InteractionManager({
      shaderLayer: this.shaderLayerFG,
      bus,
    });
    this.interactionManagerBG = new InteractionManager({
      shaderLayer: this.shaderLayerBG,
      bus,
    });

    // Register all interactions via centralized configs
    INTERACTION_CONFIGS.forEach((entry) => {
      const manager =
        entry.manager === "bg"
          ? this.interactionManagerBG
          : this.interactionManager;
      manager.register(entry.config);
    });

    this.interactionManager.attach();
    this.interactionManagerBG.attach();

    // Scene controller (parallax + zoom/pan) via bus API
    this.sceneController = new SceneController({
      bus,
      shaderLayerBG: this.shaderLayerBG,
      shaderLayerFG: this.shaderLayerFG,
      bgRenderer: this.bgRenderer,
      fgRenderer: this.fgRenderer,
      filterEl: this.filterEl,
    });

    this.bus.on("scene.canvas", ({ visible } = {}) => {
      this.setCanvasActive(visible !== false);
    });

    bus.on("picture.click", () => {
      flowActor.send({ type: "NEXT" });
    });
    bus.on("book-floor.click", () => {
      flowActor.send({ type: "GOTO_22" });
    });
    bus.on("box.click", () => {
      flowActor.send({ type: "GOTO_33" });
    });
    bus.on("football.click", () => {
      flowActor.send({ type: "GOTO_39" });
    });

    bus.on("wheel-pump.click", () => {
      flowActor.send({ type: "NEXT" });
    });

    this.initPane();

    // Register puzzle game
    bus.on("game.puzzle.complete", () => {
      if (window.__puzzleCompleted || window.__puzzleCompletedPending) return;
      window.__puzzleCompletedPending = true;
      try {
        if (gameManager.active?.id === "puzzle") {
          gameManager.active.api?.setActive?.(false);
          gameManager.active.api?.hide?.();
        }
      } catch {}
      try {
        if (gameRoot) gameRoot.style.zIndex = "5";
      } catch {}
      try {
        bus.emit("score.unlock");
        bus.emit("score.hide");
      } catch {}
      try {
        bus.emit("room.remove", { id: "book-floor" });
        this.interactionManager?.remove?.("book-floor");
      } catch {}
      try {
        const wordDone =
          !!window.__wordboxCompleted || !!window.__wordboxCompletedPending;
        const footDone = !!window.__footballCompleted;
        const willBeAllDone = wordDone && footDone;
        window.__puzzleCompleted = true;
        window.__puzzleCompletedPending = false;
        window.__puzzleExitPending = true;
        if (willBeAllDone) {
          window.__postGameRedirectAction = "GOTO_45";
        }
        flowActor.send({ type: "NEXT" });
      } catch {}
    });

    // Register WordBox game
    bus.on("game.wordbox.complete", () => {
      if (window.__wordboxCompleted || window.__wordboxCompletedPending) return;
      window.__wordboxCompletedPending = true;
      try {
        gameManager.active?.api?.setActive?.(false);
      } catch {}
      try {
        bus.emit("score.unlock");
        bus.emit("score.hide");
      } catch {}
      try {
        this.interactionManager?.remove?.("box");
        this.interactionManagerBG?.remove?.("box");
        bus.emit("room.remove", { id: "box" });
      } catch {}
      try {
        gameManager.active?.api?.hide?.();
      } catch {}
      try {
        const willBeAllDone =
          !!window.__puzzleCompleted && !!window.__footballCompleted;
        window.__wordboxCompleted = true;
        window.__wordboxCompletedPending = false;
        window.__wordboxExitPending = true;
        if (willBeAllDone) {
          window.__postGameRedirectAction = "GOTO_45";
        }
        flowActor.send({ type: "NEXT" });
      } catch {}
    });

    // Register football pump game
    bus.on("game.football.complete", () => {
      if (window.__footballCompleted) return;
      window.__footballCompleted = true;
      window.__footballCompletedPending = false;
      try {
        gameManager.active?.api?.setActive?.(false);
      } catch {}
      try {
        gameManager.active?.api?.hide?.();
      } catch {}
      try {
        if (gameRoot) gameRoot.style.zIndex = "5";
      } catch {}
      try {
        if (flowActor && flowActor._wheelPumpCleanup) {
          flowActor._wheelPumpCleanup();
          flowActor._wheelPumpCleanup = null;
        }
      } catch {}
      try {
        bus.emit("score.unlock");
        bus.emit("score.hide");
      } catch {}
      try {
        const wordDone =
          !!window.__wordboxCompleted || !!window.__wordboxCompletedPending;
        const puzzDone =
          !!window.__puzzleCompleted || !!window.__puzzleCompletedPending;
        const allDone = puzzDone && wordDone && !!window.__footballCompleted;
        window.__footballExitPending = true;
        if (allDone) {
          window.__footballCompletedPending = true;
          window.__postGameRedirectAction = "GOTO_45";
        }
        flowActor.send({ type: "NEXT" });
      } catch {}
    });

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
    if (this.bgRenderer?.domElement) {
      this.bgRenderer.domElement.style.display = display;
    }
    if (this.fgRenderer?.domElement) {
      this.fgRenderer.domElement.style.display = display;
    }
    if (this.filterEl) {
      this.filterEl.style.display = visible ? "" : "none";
    }
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
    requestAnimationFrame(this.render);
  }
}

new AppController({
  dom: document.getElementById("container"),
  bus,
});

// Initialize anchor system for responsive positioned assets
initAnchorManager();
