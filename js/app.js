/**
 * Main application entry point for initializing game modules, UI controllers, and event bus.
 *
 * - Imports styles, core modules, game logic, and UI components.
 * - Generates layers from DOM and initializes LayerManager for scene management.
 * - Sets up a global event bus using mitt for inter-module communication.
 * - Initializes ScoreBoard and GameManager, exposing GameManager globally for debugging.
 * - Registers available games for dynamic loading and flow control.
 * - Creates a flow actor for managing game flow state using XState.
 * - Instantiates AppController for rendering and scene management.
 * - Initializes UIController for handling UI interactions, pickers, and hydration.
 * - Subscribes to flow events and connects LayerManager, GameManager, and UI logic.
 * - Sets up navigation buttons to trigger flow transitions.
 * - Initializes anchor manager for responsive asset positioning.
 *
 */

import "../css/style.scss";
import { createActor } from "xstate";
import {
  createFlowMachine,
  flowMachine as fallbackFlowMachine,
} from "./modules/core/StateMachine/FlowMachine.js";
import { setupFlowSubscription } from "./modules/core/StateMachine/FlowHandlers.js";
import mitt from "mitt";
import { LayerManager } from "./modules/core/LayerManager.js";
import { generateLayersFromDOM } from "./modules/core/generateLayers.js";
import { GameManager } from "./modules/core/GameManager.js";
import { initAnchorManager } from "./modules/interactions/managers/anchorManager.js";
import { AppController } from "./modules/core/AppController.js";
import { ScoreBoard } from "./modules/ui/components/ScoreBoard.js";
import { UIController } from "./modules/ui/UIController.js";
import { Preloader } from "./modules/ui/Preloader.js";

const { layers, layerMap } = generateLayersFromDOM({
  fallbackCount: 50,
  include: ["slide99"],
});
const layerManager = new LayerManager(layers, layerMap);

const bus = mitt();

// Fullscreen preloader
new Preloader({ bus });

// Create global scoreboard (controlled via bus events from games/flow)
new ScoreBoard({ bus });

const gameManager = new GameManager({ bus });
try {
  window.gameManagerRef = gameManager;
} catch {}
window.__wordboxCompleted = false;
window.__puzzleCompleted = false;
window.__footballCompleted = false;
window.__puzzleCompletedPending = false;
window.__wordboxCompletedPending = false;
window.__puzzleExitPending = false;
window.__wordboxExitPending = false;
window.__footballExitPending = false;
window.__footballCompletedPending = false;
const gameRoot = document.getElementById("game-root");
if (gameRoot) gameManager.attachRoot(gameRoot);
if (gameRoot) gameRoot.style.zIndex = "40";

// Register games early so flow rules can preload them by slide
gameManager.register("finddiff", () => import("./games/finddiff/index.js"));
gameManager.register("puzzle", () => import("./games/puzzle/index.js"));
gameManager.register("wordbox", () => import("./games/wordbox/index.js"));
gameManager.register("football", () => import("./games/football/index.js"));

// Prefer dynamic machine built from actual slide IDs; fallback to static if needed
let flowActor;
try {
  const slideIds = Object.keys(layerManager.layerMap).filter((k) =>
    /^slide\d+$/.test(k)
  );
  const dynMachine = createFlowMachine(slideIds, "slide2");
  flowActor = createActor(dynMachine);
} catch (e) {
  console.warn("Falling back to static flow machine:", e);
  flowActor = createActor(fallbackFlowMachine);
}

// Instantiate controller (rendering, scene)
const appController = new AppController({
  dom: document.getElementById("container"),
  bus,
  flowActor,
  gameManager,
  gameRoot,
});

// Initialize UI Controller (pickers, interactions, toy pickers, hydration)
const uiController = new UIController({
  bus,
  flowActor,
  gameManager,
  gameRoot,
  shaderLayerBG: appController.shaderLayerBG,
  shaderLayerFG: appController.shaderLayerFG,
});

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

// Initialize anchor system for responsive positioned assets
initAnchorManager();
