import { createMachine } from "xstate";

// Factory to create a dynamic slide machine from a list of slide IDs
export function createFlowMachine(slideIds = [], startSlide) {
  const slides = Array.from(slideIds).filter((s) => typeof s === "string");
  slides.sort((a, b) => {
    const na = parseInt(String(a).replace("slide", ""), 10);
    const nb = parseInt(String(b).replace("slide", ""), 10);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return String(a).localeCompare(String(b));
  });
  const uniqueSlides = [...new Set(slides)];

  // Build states map with NEXT transitions
  const states = {};
  for (let i = 0; i < uniqueSlides.length; i++) {
    const cur = uniqueSlides[i];
    const next = uniqueSlides[i + 1] || "outro";
    states[cur] = { on: { NEXT: next } };
  }
  if (uniqueSlides.includes("slide99")) {
    states["slide99"] = { on: { NEXT: "outro" } };
  }
  states["outro"] = { type: "final" };

  const goto = (slide) => ({ target: "." + slide });

  return createMachine({
    id: "kidAppDynamic",
    initial:
      startSlide && uniqueSlides.includes(startSlide)
        ? startSlide
        : uniqueSlides[0] || "slide1",
    on: {
      GOTO: ({ event }) => goto(event.slide),
      GOTO_21: goto("slide21"),
      GOTO_22: goto("slide22"),
      GOTO_32: goto("slide32"),
      GOTO_33: goto("slide33"),
      GOTO_39: goto("slide42"),
      GOTO_45: goto("slide48"),
      GOTO_99: goto("slide99"),
    },
    states,
  });
}

export const flowMachine = createFlowMachine(
  Array.from({ length: 52 }, (_, i) => `slide${i + 1}`).concat(["slide99"]),
  "slide1"
);
