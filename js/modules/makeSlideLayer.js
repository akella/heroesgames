import gsap from 'gsap';

export function makeSlideLayer(id) {
    const el = document.getElementById(id);
  
    // helper – tween opacity and resolve when finished
    function fadeTo(targetOpacity, duration = 0.4) {
      return new Promise((resolve) => {
        gsap.to(el, {
          autoAlpha: targetOpacity,
          duration,
          onStart: () => {
            // enable clicks only while visible
            el.style.pointerEvents = targetOpacity > 0 ? 'auto' : 'none';
          },
          onComplete: resolve
        });
      });
    }
  
    // public API expected by LayerManager
    return {
      intro() {                    // fade IN
        return fadeTo(1);
      },
      outro() {                    // fade OUT
        return fadeTo(0);
      },
      update() { /* nothing needed for static DOM slide */ }
    };
  }