import { Pane } from "tweakpane";
import { RoomPicker } from "./pickers/RoomPicker.js";
import { ToyPickerController } from "./pickers/ToyPickerController.js";
import { ensurePickersContainer } from "./components/pickersContainer.js";
import { InteractionManager } from "../interactions/InteractionManager.js";
import { INTERACTION_CONFIGS } from "../core/config/interactionConfigs.js";
import { initMenuOverlay } from "./overlays/MenuOverlay.js";
import { initHeaderProgress } from "./components/HeaderProgress.js";
import { initHelpOverlay } from "./overlays/HelpOverlay.js";
import { initShareOverlay } from "./overlays/ShareOverlay.js";
import { initMessageOverlay } from "./overlays/MessageOverlay.js";
import { initGameBackButton } from "./components/GameBackButton.js";
import { initPsychOverlay } from "./overlays/PsychOverlay.js";

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

export class UIController {
  constructor({
    bus,
    flowActor,
    gameManager,
    gameRoot,
    shaderLayerBG,
    shaderLayerFG,
  }) {
    this.bus = bus;
    this.flowActor = flowActor;
    this.gameManager = gameManager;
    this.gameRoot = gameRoot;
    this.shaderLayerBG = shaderLayerBG;
    this.shaderLayerFG = shaderLayerFG;

    this._initPickers();
    this._initToyPickers();
    this._registerInteractions();
    this._wireBus();
    this._preloadHoverLayers();
    this._initPane();
    this._initOverlays();
  }

  // #region Pickers
  _initPickers() {
    let currentSlide = null;
    const onOpenOnce = (() => {
      let fired = false;
      return () => {
        if (fired) return;
        if (
          [
            "slide18",
            "slide19",
            "slide20",
            "slide21",
            "slide22",
            "slide29",
            "slide30",
            "slide31",
            "slide47",
            "slide48",
            "slide99",
          ].includes(currentSlide)
        )
          return;
        fired = true;
        try {
          this.flowActor?.send?.({ type: "NEXT" });
        } catch {}
      };
    })();
    const onSelectOnce = (() => {
      let fired = false;
      return () => {
        if (fired) return;
        if (
          [
            "slide18",
            "slide19",
            "slide20",
            "slide21",
            "slide22",
            "slide29",
            "slide30",
            "slide31",
            "slide50",
            "slide51",
            "slide99",
          ].includes(currentSlide)
        )
          return;
        fired = true;
        try {
          this.flowActor?.send?.({ type: "NEXT" });
        } catch {}
      };
    })();
    const onLockedClickOnce = (() => {
      let fired = false;
      return () => {
        if (fired) return;
        if (
          ["slide50", "slide51", "slide29", "slide30", "slide31"].includes(
            currentSlide
          )
        )
          return;
        fired = true;
        try {
          this.flowActor?.send?.({ type: "NEXT" });
        } catch {}
      };
    })();

    const roomPickersContainer = ensurePickersContainer();
    const closeOthers = (who) => {
      [this.pickerWall, this.pickerFloor, this.pickerTable].forEach((p) => {
        if (p && p !== who) p.close();
      });
    };

    window.__pickerWall = this.pickerWall = new RoomPicker({
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
        closeOthers(this.pickerWall);
        onOpenOnce();
      },
      onFirstSelect: onSelectOnce,
      onLockedClick: onLockedClickOnce,
    });
    window.__pickerFloor = this.pickerFloor = new RoomPicker({
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
        closeOthers(this.pickerFloor);
        onOpenOnce();
      },
      onFirstSelect: onSelectOnce,
      onLockedClick: onLockedClickOnce,
    });
    window.__pickerTable = this.pickerTable = new RoomPicker({
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
        closeOthers(this.pickerTable);
        onOpenOnce();
      },
      onFirstSelect: onSelectOnce,
      onLockedClick: onLockedClickOnce,
    });
    this.pickerWall.hide();
    this.pickerFloor.hide();
    this.pickerTable.hide();

    this.bus.on("flow.progress", (snap) => {
      currentSlide = snap?.value || snap;
    });
  }

  _initToyPickers() {
    const container =
      document.getElementById("room-pickers-container") ||
      ensurePickersContainer();
    this.toyController = new ToyPickerController({
      bus: this.bus,
      shaderBG: this.shaderLayerBG,
      shaderFG: this.shaderLayerFG,
      container,
      slideBehavior: {
        hidden: ["slide29", "slide33", "slide34", "slide35", "slide36", "slide99"],
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
  }
  // #endregion

  // #region Interactions
  _registerInteractions() {
    this.interactionManager = new InteractionManager({
      shaderLayer: this.shaderLayerFG,
      bus: this.bus,
    });
    this.interactionManagerBG = new InteractionManager({
      shaderLayer: this.shaderLayerBG,
      bus: this.bus,
    });
    this.interactionManager.attach();
    this.interactionManagerBG.attach();
    try {
      if (Array.isArray(INTERACTION_CONFIGS)) {
        INTERACTION_CONFIGS.forEach((entry) => {
          const mgr =
            entry.manager === "bg"
              ? this.interactionManagerBG
              : this.interactionManager;
          try {
            mgr.register(entry.config);
          } catch {}
        });
      }
    } catch {}
  }
  // #endregion

  _wireBus() {
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
      "slide38",
      "slide39",
      "slide40",
    ];
    const FOOTBALL_SLIDES = ["slide44"];
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
      try {
        if (!p) return p;
        if (/^(data:|blob:|https?:)/.test(p)) return p;
        const abs = p.startsWith("/") ? p : "/" + p;
        return WEBP_URLS[abs] || abs;
      } catch {
        return p;
      }
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
      const currentSlide = snap?.value || snap;
      try {
        const spark = document.querySelector(".btn-icon-circle--spark");
        if (spark)
          spark.classList.toggle(
            "is-visible",
            !!(
              typeof currentSlide === "string" &&
              /^(slide[6-9]|slide\d{2,})$/.test(currentSlide)
            )
          );
      } catch {}
      try {
        this.toyController?.toyDino?.close?.();
        this.toyController?.toyShip?.close?.();
        this.toyController?.toyRobot?.close?.();
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

    // Close pickers proactively when user hits Next
    this.bus.on("ui.closePickers", () => {
      try {
        this.pickerWall?.close?.();
        this.pickerFloor?.close?.();
        this.pickerTable?.close?.();
        this.toyController?.toyDino?.close?.();
        this.toyController?.toyShip?.close?.();
        this.toyController?.toyRobot?.close?.();
      } catch {}
    });

    // Map room object clicks to flow transitions (moved from AppController)
    this.bus.on("picture.click", () =>
      this.flowActor?.send?.({ type: "NEXT" })
    );
    this.bus.on("book-floor.click", () =>
      this.flowActor?.send?.({ type: "GOTO_22" })
    );
    this.bus.on("box.click", () => this.flowActor?.send?.({ type: "GOTO_33" }));
    this.bus.on("football.click", () =>
      this.flowActor?.send?.({ type: "GOTO_39" })
    );
    this.bus.on("wheel-pump.click", () =>
      this.flowActor?.send?.({ type: "NEXT" })
    );
  }

  _preloadHoverLayers() {
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
  }

  _initPane() {
    try {
      this.pane = new Pane();
      this.pane.addButton({ title: "Next" }).on("click", () => {
        this.flowActor?.send?.({ type: "NEXT" });
      });
    } catch {}
  }

  // region Overlays
  _initOverlays() {
    try {
      const psychOverlayApi = initPsychOverlay();
      const menuOverlayApi = initMenuOverlay({
        bus: this.bus,
        onOpenPsych: () => {
          try {
            psychOverlayApi?.open?.();
          } catch {}
        },
      });
      initHeaderProgress({ bus: this.bus });
      initHelpOverlay();
      const shareApi = initShareOverlay();
      const messageApi = initMessageOverlay({ bus: this.bus });
      const gameBackButtonApi = initGameBackButton({
        bus: this.bus,
        messageApi,
        flowActor: this.flowActor,
        gameManager: this.gameManager,
        menuOverlayApi,
      });
    } catch {}
  }
  // endregion
}
