/**
 * CustomizeButton - Interactive button for room customization
 * - Shows "кастомізувати" with room-edit-icon by default
 * - Changes to "підтвердити" with room-approve-icon when in customize mode
 * - Shows animated borders on slides 16 and 29
 * - Controls visibility of room pickers and interaction buttons
 */

const CUSTOMIZE_TEXT = "кастомізувати";
const CONFIRM_TEXT = "підтвердити";

function createButton() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "customize-button";
  btn.setAttribute("aria-label", CUSTOMIZE_TEXT);

  btn.innerHTML = `
    <div class="customize-button__border customize-button__border--outer"></div>
    <div class="customize-button__border customize-button__border--inner"></div>
    <div class="customize-button__content">
      <img class="customize-button__icon" src="" alt="" aria-hidden="true" />
      <span class="customize-button__text">${CUSTOMIZE_TEXT}</span>
    </div>
  `;

  document.body.appendChild(btn);
  return btn;
}

export function initCustomizeButton({
  bus,
  flowActor,
  pickerWall,
  pickerFloor,
  pickerTable,
  toyController,
  interactionManager,
  interactionManagerBG,
} = {}) {
  if (!bus || !flowActor) {
    return { destroy: () => {} };
  }

  const button = createButton();
  const icon = button.querySelector(".customize-button__icon");
  const text = button.querySelector(".customize-button__text");

  let isCustomizing = false;
  let currentSlide = null;

  // Slides where button should be visible (after 16, excluding games)
  const GAME_SLIDES = [
    "slide23", "slide24", "slide25", "slide26", "slide27", "slide28",
    "slide33", "slide34", "slide35", "slide36", "slide37", "slide38", "slide39", "slide40",
    "slide44", "slide45", "slide46", "slide47"
  ];

  // Slides where we show borders (need to customize)
  const BORDER_SLIDES = ["slide16", "slide29", "slide30"];

  // Slides where confirming goes to next slide
  const CONFIRM_NEXT_SLIDES = ["slide16", "slide19", "slide29", "slide30", "slide32"];
  
  // Slide32 specifically goes to slide99
  const GOTO_99_SLIDE = "slide32";

  // Slide 29 is for toy pickers
  const TOY_PICKER_SLIDE = "slide29";

  const isVisible = (slide) => {
    if (!slide || typeof slide !== "string") return false;
    
    // Extract slide number
    const match = slide.match(/slide(\d+)/);
    if (!match) return false;
    
    const slideNum = parseInt(match[1], 10);
    
    // Show after slide 16, but not on game slides
    if (slideNum >= 16 && !GAME_SLIDES.includes(slide)) {
      return true;
    }
    
    return false;
  };

  const updateButtonState = (slide, customizing) => {
    const showBorders = BORDER_SLIDES.includes(slide) && !customizing;
    
    button.classList.toggle("is-customizing", customizing);
    button.classList.toggle("has-borders", showBorders);

    if (customizing) {
      icon.src = "assets/room/room-approve-icon.png";
      text.textContent = CONFIRM_TEXT;
      button.setAttribute("aria-label", CONFIRM_TEXT);
    } else {
      icon.src = "assets/room/room-edit-icon.png";
      text.textContent = CUSTOMIZE_TEXT;
      button.setAttribute("aria-label", CUSTOMIZE_TEXT);
    }
  };

  const updateVisibility = (slide) => {
    currentSlide = slide;
    const visible = isVisible(slide);
    button.classList.toggle("is-visible", visible);
    updateButtonState(slide, isCustomizing);
  };

  const showPickers = () => {
    if (currentSlide === TOY_PICKER_SLIDE) {
      // Show toy pickers on slide 29
      try {
        toyController?.toyDino?.show?.();
        toyController?.toyShip?.show?.();
        toyController?.toyRobot?.show?.();
      } catch {}
    } else if (currentSlide === "slide30") {
      // On slide30, don't show pickers yet - they'll appear on slide31
    } else {
      // Show room pickers on other slides
      try {
        pickerWall?.show?.();
        pickerFloor?.show?.();
        pickerTable?.show?.();
      } catch {}
    }
  };

  const hidePickers = () => {
    if (currentSlide === TOY_PICKER_SLIDE || currentSlide === "slide30" || currentSlide === "slide32") {
      // Hide toy pickers
      try {
        toyController?.toyDino?.hide?.();
        toyController?.toyShip?.hide?.();
        toyController?.toyRobot?.hide?.();
        toyController?.toyDino?.close?.();
        toyController?.toyShip?.close?.();
        toyController?.toyRobot?.close?.();
      } catch {}
    } else {
      // Hide room pickers
      try {
        pickerWall?.hide?.();
        pickerFloor?.hide?.();
        pickerTable?.hide?.();
        pickerWall?.close?.();
        pickerFloor?.close?.();
        pickerTable?.close?.();
      } catch {}
    }
  };

  const disableInteractions = () => {
    // Disable interaction detection when customizing
    if (interactionManager) interactionManager._customizeMode = true;
    if (interactionManagerBG) interactionManagerBG._customizeMode = true;
  };

  const enableInteractions = () => {
    // Re-enable interaction detection
    if (interactionManager) interactionManager._customizeMode = false;
    if (interactionManagerBG) interactionManagerBG._customizeMode = false;
  };

  button.addEventListener("click", () => {
    if (!isCustomizing) {
      // Enter customize mode
      isCustomizing = true;
      updateButtonState(currentSlide, true);
      showPickers();
      disableInteractions();

      // If on slide 16 or 29, go to next slide when entering customize mode
      if (BORDER_SLIDES.includes(currentSlide)) {
        try {
          flowActor.send({ type: "NEXT" });
        } catch {}
      }
    } else {
      // Exit customize mode (confirm)
      isCustomizing = false;
      updateButtonState(currentSlide, false);
      enableInteractions();

      // Hide pickers first, then navigate
      hidePickers();
      
      // Close pickers explicitly via bus event
      try {
        bus.emit("ui.closePickers");
      } catch {}

      // Go to next slide on confirm for specific slides (with small delay to ensure pickers close)
      if (CONFIRM_NEXT_SLIDES.includes(currentSlide)) {
        setTimeout(() => {
          try {
            if (currentSlide === GOTO_99_SLIDE) {
              flowActor.send({ type: "GOTO_99" });
            } else {
              flowActor.send({ type: "NEXT" });
            }
          } catch {}
        }, 50);
      }
    }
  });

  const onFlowProgress = (snapshot) => {
    const value = snapshot?.value || snapshot;
    updateVisibility(value);

    // Reset customizing state when changing slides
    if (value !== currentSlide && isCustomizing) {
      isCustomizing = false;
      updateButtonState(value, false);
      hidePickers();
      enableInteractions();
    }
  };

  bus.on("flow.progress", onFlowProgress);
  updateVisibility(flowActor.getSnapshot()?.value || "slide1");

  return {
    destroy: () => {
      try {
        bus.off("flow.progress", onFlowProgress);
      } catch {}
      try {
        button.remove();
      } catch {}
    },
    isCustomizing: () => isCustomizing,
    reset: () => {
      isCustomizing = false;
      updateButtonState(currentSlide, false);
    },
  };
}
