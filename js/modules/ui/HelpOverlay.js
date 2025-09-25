import gsap from "gsap";

export function initHelpOverlay({
  buttonSelector = ".btn-help",
  overlaySelector = "#help-overlay",
} = {}) {
  const button = document.querySelector(buttonSelector);
  const overlay = document.querySelector(overlaySelector);
  if (!overlay || !button) {
    return { open: () => {}, close: () => {}, toggle: () => {} };
  }
  const panel = overlay.querySelector(".help-overlay__panel");
  const closeBtn = overlay.querySelector(".help-overlay__close");

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
          { y: 10, opacity: 0.9 },
          { y: 0, opacity: 1, duration: 0.28, ease: "power3.out" },
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

  const onButton = (e) => {
    e.preventDefault();
    open();
  };
  const onClose = (e) => {
    e.preventDefault();
    close();
  };
  const onBackdrop = (e) => {
    if (e.target === overlay) close();
  };
  const onEsc = (e) => {
    if (e.key === "Escape") close();
  };
  button.addEventListener("click", onButton);
  closeBtn && closeBtn.addEventListener("click", onClose);
  overlay.addEventListener("click", onBackdrop);
  window.addEventListener("keydown", onEsc);

  // Prevent form submit for now
  const form = overlay.querySelector(".help-form");
  if (form)
    form.addEventListener("submit", (e) => {
      e.preventDefault();
    });

  const fields = overlay.querySelectorAll(".help-field");
  fields.forEach((wrap) => {
    const control = wrap.querySelector("input, textarea");
    if (!control) return;
    const label = control.getAttribute("placeholder") || "";
    if (label) wrap.setAttribute("data-label", label);
    const sync = () => {
      if (
        document.activeElement === control ||
        (control.value && control.value.length > 0)
      ) {
        wrap.classList.add("is-floating");
      } else {
        wrap.classList.remove("is-floating");
      }
    };
    control.addEventListener("focus", sync);
    control.addEventListener("blur", sync);
    control.addEventListener("input", sync);
    sync();
  });

  return { open, close, toggle };
}
