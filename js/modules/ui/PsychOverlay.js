import gsap from "gsap";

export function initPsychOverlay({ overlaySelector = "#psych-overlay" } = {}) {
  const overlay = document.querySelector(overlaySelector);
  if (!overlay) {
    return {
      open: () => {},
      close: () => {},
      toggle: () => {},
      destroy: () => {},
    };
  }

  const panel = overlay.querySelector(".psych-overlay__panel");
  const closeBtn = overlay.querySelector(".psych-overlay__close");

  let tl;
  let prevOverflow = "";

  function open() {
    overlay.hidden = false;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    try {
      if (tl) tl.kill();
      tl = gsap.timeline();
      tl.fromTo(
        overlay,
        { opacity: 0 },
        { opacity: 1, duration: 0.28, ease: "power2.out" }
      );
      if (panel)
        tl.fromTo(
          panel,
          { scale: 0.98, opacity: 0.92 },
          { scale: 1, opacity: 1, duration: 0.32, ease: "power3.out" },
          "<"
        );
    } catch {}
  }

  function close() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
    document.body.style.overflow = prevOverflow;
  }

  function toggle() {
    if (overlay.classList.contains("is-open")) close();
    else open();
  }

  const onBackdrop = (e) => {
    if (e.target === overlay) close();
  };
  const onEsc = (e) => {
    if (e.key === "Escape") close();
  };

  overlay.addEventListener("click", onBackdrop);
  window.addEventListener("keydown", onEsc);
  closeBtn && closeBtn.addEventListener("click", close);

  function destroy() {
    overlay.removeEventListener("click", onBackdrop);
    window.removeEventListener("keydown", onEsc);
    closeBtn && closeBtn.removeEventListener("click", close);
    try {
      if (tl) tl.kill();
    } catch {}
  }

  return { open, close, toggle, destroy };
}
