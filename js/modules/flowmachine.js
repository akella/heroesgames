import { createMachine, assign } from "xstate";
import gsap from "gsap";
import mitt from "mitt";

const bus = mitt();
export const flowMachine = createMachine({
  id: "kidApp",
  context: { score: 0 },
  initial: "slide1",

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
        NEXT: 'slide3'
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
      entry: 'showSlide7',
      exit: 'hideSlide7',
      on: { NEXT: 'slide8' }
    },

    slide8: {
      entry: 'showSlide8',
      exit: 'hideSlide8',
      on: { NEXT: 'slide9' }
    },

    slide9: {
      entry: 'showSlide9',
      exit: 'hideSlide9',
      on: { NEXT: 'slide10' }
    },
    slide10: {
      entry: 'showSlide10',
      exit: 'hideSlide10',
      on: { NEXT: 'slide11' }
    },
    slide11: {
      entry: 'showSlide11',
      exit: 'hideSlide11',
      on: { NEXT: 'slide12' }
    },
    slide12: {
      entry: 'showSlide12',
      exit: 'hideSlide12',
      on: { NEXT: 'slide13' }
    },
    slide13: {
      entry: 'showSlide13',
      exit: 'hideSlide13',
      on: { NEXT: 'slide14' }
    },
    slide14: {
      entry: 'showSlide14',
      exit: 'hideSlide14',
      on: { NEXT: 'outro' }
    },
    outro: {
      on: { NEXT: 'outro', final: true }
    },
  },
},{
    actions: {
        showSlide4:  async () => { 
            gsap.to('canvas', {opacity: 1, duration: 1})
            // bus.emit('flow.progress', 'slide4')
        },
        showSlide6:  async () => { 
            const event = new CustomEvent('showCharacter');
            document.dispatchEvent(event);
            // bus.emit('flow.progress', 'slide4')
        },
  showSlide9: () => { document.dispatchEvent(new CustomEvent('hideCharacter')); }
    }
  });
