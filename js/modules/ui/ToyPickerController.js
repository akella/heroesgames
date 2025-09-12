import { RoomPicker } from "./RoomPicker.js";

export class ToyPickerController {
  constructor({
    bus,
    shaderBG,
    shaderFG,
    container = document.body,
    anchors = null,
  } = {}) {
    this.bus = bus;
    this.shaderBG = shaderBG;
    this.shaderFG = shaderFG;
    this.container = container;
    this.toyActionsEnabled = false;
    this.anchors = anchors || {
      dino: {
        shader: this.shaderBG,
        layerId: "dino",
        align: "center",
        offset: { x: 0, y: 0 },
      },
      ship: {
        shader: this.shaderBG,
        layerId: "ship",
        align: "center",
        offset: { x: 0, y: 0 },
      },
      robot: {
        shader: this.shaderBG,
        layerId: "robot",
        align: "center",
        offset: { x: 0, y: 0 },
      },
    };

    // Create toy pickers
    this.toyDino = this.#makeToy("assets/picker/dino.png", this.anchors.dino);
    this.toyShip = this.#makeToy("assets/picker/ship.png", this.anchors.ship);
    this.toyRobot = this.#makeToy(
      "assets/picker/robot.png",
      this.anchors.robot
    );
    // Track if a toy was placed (clicked). Persist across slides.
    this.placed = { dino: false, ship: false, robot: false };

    // Initial hide
    this.toyDino.setLocked(true);
    this.toyDino.hide();
    this.toyShip.setLocked(true);
    this.toyShip.hide();
    this.toyRobot.setLocked(true);
    this.toyRobot.hide();

    // Hook flow to update state
    this.bus?.on?.("flow.progress", (snap) => {
      const val = snap?.value || snap;
      this.updateForSlide(val);
    });
  }

  updateForSlide(val) {
    if (val === "slide29") {
      [this.toyDino, this.toyShip, this.toyRobot].forEach((p) => {
        p.show();
        p.setLocked(true);
        if (p._thumbSrc) p.thumbImg.src = p._thumbSrc;
        // Hide overlay images when locked
        p.thumbImg.style.visibility = "hidden";
      });
      this.toyActionsEnabled = false;
    } else if (val === "slide30") {
      [this.toyDino, this.toyShip, this.toyRobot].forEach((p) => {
        p.show();
        // Unlock toys visually and functionally
        p.setLocked(false);
        if (p._thumbSrc) p.thumbImg.src = p._thumbSrc;
        p.thumbImg.style.visibility = "visible";
      });
      this.toyActionsEnabled = true;
    } else if (val === "slide31") {
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
    } else {
      [this.toyDino, this.toyShip, this.toyRobot].forEach((p) => p.hide());
      this.toyActionsEnabled = false;
    }
  }

  // Internal helpers
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
    picker.thumbImg.src = thumbSrc;

    const handler = () => this.#handleToyClick(picker);
    picker.onLockedClick = handler;
    picker.button?.addEventListener(
      "click",
      (e) => {
        if (!picker.locked) {
          e.preventDefault();
          e.stopImmediatePropagation();
          handler();
        }
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
