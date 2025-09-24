import { RoomPicker } from "./RoomPicker.js";
import dinoThumb from "../../../assets/picker/dino.webp";
import shipThumb from "../../../assets/picker/ship.webp";
import robotThumb from "../../../assets/picker/robot.webp";

export class ToyPickerController {
  constructor({
    bus,
    shaderBG,
    shaderFG,
    container = document.body,
    anchors = null,
    slideBehavior = null,
  } = {}) {
    this.bus = bus;
    this.shaderBG = shaderBG;
    this.shaderFG = shaderFG;
    this.container = container;
    this.toyActionsEnabled = false;
    this.anchors = anchors || {};
    this.slideBehavior = slideBehavior || {
      hidden: [],
      lockedVisible: [],
      unlockedVisible: [],
    };

    // Create toy pickers
    this.toyDino = this.#makeToy(dinoThumb, this.anchors.dino);
    this.toyShip = this.#makeToy(shipThumb, this.anchors.ship);
    this.toyRobot = this.#makeToy(robotThumb, this.anchors.robot);

    // Track if a toy was placed (clicked). Persist across slides.
    this.placed = { dino: false, ship: false, robot: false };

    // Initial hide
    [this.toyDino, this.toyShip, this.toyRobot].forEach((p) => {
      p.setLocked(true);
      p.hide();
    });

    // Hook flow to update state
    this.bus?.on?.("flow.progress", (snap) => {
      const val = snap?.value || snap;
      this.updateForSlide(val);
    });
  }

  updateForSlide(val) {
    const {
      hidden = [],
      lockedVisible = [],
      unlockedVisible = [],
    } = this.slideBehavior || {};

    if (hidden.includes(val)) {
      [this.toyDino, this.toyShip, this.toyRobot].forEach((p) => {
        p.hide();
        p.setLocked(true);
      });
      this.toyActionsEnabled = false;
      return;
    }

    if (lockedVisible.includes(val)) {
      [this.toyDino, this.toyShip, this.toyRobot].forEach((p) => {
        p.show();
        p.setLocked(true);
        if (p._thumbSrc) p.thumbImg.src = p._thumbSrc;
      });
      this.toyActionsEnabled = false;
      return;
    }

    if (unlockedVisible.includes(val)) {
      const entries = [
        [this.toyDino, this.placed.dino],
        [this.toyShip, this.placed.ship],
        [this.toyRobot, this.placed.robot],
      ];
      entries.forEach(([p, wasPlaced]) => {
        if (wasPlaced) {
          p.hide();
        } else {
          p.show();
          p.setLocked(false);
          if (p._thumbSrc) p.thumbImg.src = p._thumbSrc;
          p.thumbImg.style.visibility = "visible";
        }
      });
      this.toyActionsEnabled = true;
      return;
    }

    // Fallback for other slides
    [this.toyDino, this.toyShip, this.toyRobot].forEach((p) => p.hide());
    this.toyActionsEnabled = false;
  }

  #makeToy(thumbSrc, anchor) {
    const picker = new RoomPicker({
      container: this.container,
      shaderBG: this.shaderBG,
      shaderFG: this.shaderFG,
      locked: true,
      allowLockedClick: true,
      category: "wall",
      onLockedClick: null,
      anchor,
    });
    picker._thumbSrc = thumbSrc;

    const handler = () => this.#handleToyClick(picker);
    picker.onLockedClick = handler;
    picker.button?.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        handler();
      },
      true
    );

    return picker;
  }

  #handleToyClick(picker) {
    if (!this.toyActionsEnabled) return;
    try {
      if (picker === this.toyDino) {
        this.shaderBG.setLayerEnabled("dino", true);
        this.shaderBG.setLayerEnabled("books-shelf", false);
        this.bus?.emit && this.bus.emit("room.reveal", { id: "dino" });
        this.placed.dino = true;
      } else if (picker === this.toyShip) {
        this.shaderBG.setLayerEnabled("ship", true);
        this.bus?.emit && this.bus.emit("room.reveal", { id: "ship" });
        this.placed.ship = true;
      } else if (picker === this.toyRobot) {
        this.shaderBG.setLayerEnabled("robot", true);
        this.shaderBG.setLayerEnabled("ufo", true);
        this.shaderBG.setLayerEnabled("rocket", true);
        this.shaderBG.setLayerEnabled("plane", true);
        this.bus?.emit && this.bus.emit("room.reveal", { id: "robot" });
        this.bus?.emit && this.bus.emit("room.reveal", { id: "ufo" });
        this.bus?.emit && this.bus.emit("room.reveal", { id: "rocket" });
        this.bus?.emit && this.bus.emit("room.reveal", { id: "plane" });
        this.placed.robot = true;
      }
      picker.hide();
    } catch {}
  }
}
