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
  if (form) {
    const getWrap = (el) => el?.closest?.(".help-field");
    const ensureErrorEl = (wrap) => {
      let err = wrap.querySelector(".help-error");
      if (!err) {
        err = document.createElement("div");
        err.className = "help-error";
        wrap.appendChild(err);
      }
      return err;
    };
    const clearError = (control) => {
      const wrap = getWrap(control);
      if (!wrap) return;
      wrap.classList.remove("is-invalid");
      control.removeAttribute("aria-invalid");
      const err = wrap.querySelector(".help-error");
      if (err) err.textContent = "";
    };
    const setError = (control, msg) => {
      const wrap = getWrap(control);
      if (!wrap) return;
      wrap.classList.add("is-invalid");
      control.setAttribute("aria-invalid", "true");
      const err = ensureErrorEl(wrap);
      err.textContent = msg || "";
    };
    const isEmail = (v) =>
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test((v || "").trim());
    const isPhone = (v) => /^(?:\+?\d[\d\s\-()]{6,})$/i.test((v || "").trim());
    const validateControl = (control) => {
      const name = control.getAttribute("name");
      const val = (control.value || "").trim();
      clearError(control);
      if (name === "name") {
        if (val.length < 2)
          return setError(
            control,
            "Вкажіть, будь ласка, ім'я (мін. 2 символи)"
          );
      } else if (name === "email") {
        if (!isEmail(val)) return setError(control, "Вкажіть коректну пошту");
      } else if (name === "phone") {
        if (!val) return setError(control, "Вкажіть номер телефону");
        if (!isPhone(val))
          return setError(control, "Вкажіть коректний номер телефону");
      }
      return true;
    };

    const controls = form.querySelectorAll("input[name], textarea[name]");
    const submitBtn = form.querySelector(".help-submit");

    const isFormValidNow = () => {
      let ok = true;
      controls.forEach((c) => {
        const name = c.getAttribute("name");
        const val = (c.value || "").trim();
        if (name === "name") {
          if (val.length < 2) ok = false;
        } else if (name === "email") {
          if (!isEmail(val)) ok = false;
        } else if (name === "phone") {
          if (!val || !isPhone(val)) ok = false;
        }
      });
      return ok;
    };
    const updateSubmitState = () => {
      if (!submitBtn) return;
      const valid = isFormValidNow();
      submitBtn.disabled = !valid;
      submitBtn.setAttribute("aria-disabled", String(!valid));
    };
    controls.forEach((c) => {
      c.addEventListener("blur", () => {
        validateControl(c);
        updateSubmitState();
      });
      c.addEventListener("input", () => {
        validateControl(c);
        updateSubmitState();
      });
    });

    // Initial disabled state
    updateSubmitState();

    form.addEventListener("submit", (e) => {
      let firstInvalid = null;
      controls.forEach((c) => {
        const ok = validateControl(c);
        if (!ok && !firstInvalid) firstInvalid = c;
      });
      if (firstInvalid) {
        e.preventDefault();
        firstInvalid.focus();
        return;
      }
      // No backend yet; prevent real submit but keep UX responsive
      e.preventDefault();
    });
  }

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
