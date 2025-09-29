import { createMachine, assign } from "xstate";
import gsap from "gsap";
import mitt from "mitt";

const bus = mitt();
export const flowMachine = createMachine(
  {
    id: "kidApp",
    context: { score: 0 },
    initial: "slide1",
    on: {
      GOTO_21: { target: ".slide21" },
      GOTO_22: { target: ".slide22" },
      GOTO_32: { target: ".slide32" },
      GOTO_39: { target: ".slide39" },
      GOTO_99: { target: ".slide99" },
      GOTO_45: { target: ".slide45" },
      GOTO_33: { target: ".slide33" },
    },

    states: {
      slide1: {
        entry: "showSlide1",
        exit: "hideSlide1",
        on: { NEXT: "slide2" },
      },

      slide2: {
        entry: "showSlide2",
        exit: "hideSlide2",
        on: {
          NEXT: "slide3",
        },
      },

      slide3: {
        entry: "showSlide3",
        exit: "hideSlide3",
        on: { NEXT: "slide4" },
      },

      slide4: {
        entry: "showSlide4",
        exit: "hideSlide4",
        on: { NEXT: "slide5" },
      },

      slide5: {
        entry: "showSlide5",
        exit: "hideSlide5",
        on: { NEXT: "slide6" },
      },

      slide6: {
        entry: "showSlide6",
        on: { NEXT: "slide7" },
      },

      slide7: {
        entry: "showSlide7",
        exit: "hideSlide7",
        on: { NEXT: "slide8" },
      },

      slide8: {
        entry: "showSlide8",
        exit: "hideSlide8",
        on: { NEXT: "slide9" },
      },

      slide9: {
        entry: "showSlide9",
        exit: "hideSlide9",
        on: { NEXT: "slide10" },
      },
      slide10: {
        entry: "showSlide10",
        exit: "hideSlide10",
        on: { NEXT: "slide11" },
      },
      slide11: {
        entry: "showSlide11",
        exit: "hideSlide11",
        on: { NEXT: "slide12" },
      },
      slide12: {
        entry: "showSlide12",
        exit: "hideSlide12",
        on: { NEXT: "slide13" },
      },
      slide13: {
        entry: "showSlide13",
        exit: "hideSlide13",
        on: { NEXT: "slide14" },
      },
      slide14: {
        entry: "showSlide14",
        exit: "hideSlide14",
        on: { NEXT: "slide15" },
      },
      slide15: {
        entry: "showSlide15",
        exit: "hideSlide15",
        on: { NEXT: "slide16" },
      },
      slide16: {
        entry: "showSlide16",
        exit: "hideSlide16",
        on: { NEXT: "slide17" },
      },
      slide17: {
        entry: "showSlide17",
        exit: "hideSlide17",
        on: { NEXT: "slide18" },
      },
      slide18: {
        entry: "showSlide18",
        exit: "hideSlide18",
        on: { NEXT: "slide19" },
      },
      slide19: {
        entry: "showSlide19",
        exit: "hideSlide19",
        on: { NEXT: "slide20" },
      },
      slide20: {
        entry: "showSlide20",
        exit: "hideSlide20",
        on: { NEXT: "slide21" },
      },
      slide21: {
        entry: "showSlide21",
        exit: "hideSlide21",
        on: { NEXT: "slide22" },
      },
      slide22: {
        entry: "showSlide22",
        exit: "hideSlide22",
        on: { NEXT: "slide23" },
      },
      slide23: {
        entry: "showSlide23",
        exit: "hideSlide23",
        on: { NEXT: "slide24" },
      },
      slide24: {
        entry: "showSlide24",
        exit: "hideSlide24",
        on: { NEXT: "slide25" },
      },
      slide25: {
        entry: "showSlide25",
        exit: "hideSlide25",
        on: { NEXT: "slide26" },
      },
      slide26: {
        entry: "showSlide26",
        exit: "hideSlide26",
        on: { NEXT: "slide27" },
      },
      slide27: {
        entry: "showSlide27",
        exit: "hideSlide27",
        on: { NEXT: "slide28" },
      },
      slide28: {
        entry: "showSlide28",
        exit: "hideSlide28",
        on: { NEXT: "slide29" },
      },
      slide29: {
        entry: "showSlide29",
        exit: "hideSlide29",
        on: { NEXT: "slide30" },
      },
      slide30: {
        entry: "showSlide30",
        exit: "hideSlide30",
        on: { NEXT: "slide31" },
      },
      slide31: {
        entry: "showSlide31",
        exit: "hideSlide31",
        on: { NEXT: "slide32" },
      },
      slide32: {
        entry: "showSlide32",
        exit: "hideSlide32",
        on: { NEXT: "slide33" },
      },
      slide33: {
        entry: "showSlide33",
        exit: "hideSlide33",
        on: { NEXT: "slide34" },
      },
      slide34: {
        entry: "showSlide34",
        exit: "hideSlide34",
        on: { NEXT: "slide35" },
      },
      slide35: {
        entry: "showSlide35",
        exit: "hideSlide35",
        on: { NEXT: "slide36" },
      },
      slide36: {
        entry: "showSlide36",
        exit: "hideSlide36",
        on: { NEXT: "slide37" },
      },
      slide37: {
        entry: "showSlide37",
        exit: "hideSlide37",
        on: { NEXT: "slide38" },
      },
      slide38: {
        entry: "showSlide38",
        exit: "hideSlide38",
        on: { NEXT: "slide39" },
      },
      slide39: {
        entry: "showSlide39",
        exit: "hideSlide39",
        on: { NEXT: "slide40" },
      },
      slide40: {
        entry: "showSlide40",
        exit: "hideSlide40",
        on: { NEXT: "slide41" },
      },
      slide41: {
        entry: "showSlide41",
        exit: "hideSlide41",
        on: { NEXT: "slide42" },
      },
      slide42: {
        entry: "showSlide42",
        exit: "hideSlide42",
        on: { NEXT: "slide43" },
      },
      slide43: {
        entry: "showSlide43",
        exit: "hideSlide43",
        on: { NEXT: "slide44" },
      },
      slide44: {
        entry: "showSlide44",
        exit: "hideSlide44",
        on: { NEXT: "slide45" },
      },
      slide45: {
        entry: "showSlide45",
        exit: "hideSlide45",
        on: { NEXT: "slide46" },
      },
      slide46: {
        entry: "showSlide46",
        exit: "hideSlide46",
        on: { NEXT: "slide47" },
      },
      slide47: {
        entry: "showSlide47",
        exit: "hideSlide47",
        on: { NEXT: "slide48" },
      },
      slide48: {
        entry: "showSlide48",
        exit: "hideSlide48",
        on: { NEXT: "slide49" },
      },
      slide49: {
        entry: "showSlide49",
        exit: "hideSlide49",
        on: { NEXT: "outro" },
      },
      slide99: {
        entry: "showSlide99",
        exit: "hideSlide99",
        on: { NEXT: "outro" },
      },
      outro: {
        on: { NEXT: "outro", final: true },
      },
    },
  },
  {
    actions: {
      showSlide4: async () => {
        gsap.to("canvas", { opacity: 1, duration: 1 });
        // bus.emit('flow.progress', 'slide4')
      },
      showSlide6: async () => {
        const event = new CustomEvent("showCharacter");
        document.dispatchEvent(event);
        // bus.emit('flow.progress', 'slide4')
      },
      showSlide9: () => {
        document.dispatchEvent(new CustomEvent("hideCharacter"));
      },
      showSlide47: () => {},
      hideSlide47: () => {},
      showSlide48: () => {},
      hideSlide48: () => {},
      showSlide49: () => {},
      hideSlide49: () => {},
      showSlide99: () => {},
      hideSlide99: () => {},
    },
  }
);
