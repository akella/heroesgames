import gsap from "gsap";

/**
 * Reusable message overlay with dynamic content and actions.
 * const api = initMessageOverlay({ bus });
 * api.open({
 *   title: '...",
 *   subtitle: '...",
 *   actions: [
 *     { label: 'Так', className: 'primary', onClick: () => {} },
 *     { label: 'Ні', onClick: () => {} },
 *   ]
 * });
 */
export function initMessageOverlay({
  overlaySelector = "#message-overlay",
  bus,
} = {}) {
  const overlay = document.querySelector(overlaySelector);
  if (!overlay) return { open: () => {}, close: () => {}, toggle: () => {} };

  const panel = overlay.querySelector(".message-overlay__panel");
  const titleEl = overlay.querySelector(".message-title");
  const subtitleEl = overlay.querySelector(".message-subtitle");
  const actionsEl = overlay.querySelector(".message-actions");
  const closeBtn = overlay.querySelector(".message-overlay__close");

  let tl;
  let prevOverflow = "";

  const clearActions = () => {
    while (actionsEl.firstChild) actionsEl.removeChild(actionsEl.firstChild);
  };

  const open = ({ title, subtitle, actions } = {}) => {
    if (titleEl) titleEl.textContent = title || "";
    if (subtitleEl) subtitleEl.textContent = subtitle || "";
    clearActions();
    if (Array.isArray(actions) && actions.length) {
      actions.forEach((act, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn-pill" + (act.className ? ` ${act.className}` : "");
        btn.textContent = act.label || `Action ${idx + 1}`;
        btn.style.cursor = "pointer";
        btn.addEventListener("click", () => {
          try {
            act.onClick && act.onClick();
          } catch {}
          if (!act.keepOpen) close();
        });
        actionsEl.appendChild(btn);
      });
    }

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
        { opacity: 1, duration: 0.24, ease: "power2.out" }
      );
      if (panel)
        tl.fromTo(
          panel,
          { y: 10, opacity: 0.92 },
          { y: 0, opacity: 1, duration: 0.24, ease: "power3.out" },
          "<"
        );
    } catch {}
  };

  const close = () => {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
    document.body.style.overflow = prevOverflow;
  };

  const toggle = () => {
    if (overlay.classList.contains("is-open")) close();
    else open();
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
  closeBtn && closeBtn.addEventListener("click", onClose);
  overlay.addEventListener("click", onBackdrop);
  window.addEventListener("keydown", onEsc);

  if (bus && bus.on) {
    bus.on("message.open", (payload) => open(payload || {}));
  }

  return { open, close, toggle };
}
