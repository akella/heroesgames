import gsap from "gsap";

export function initMenuOverlay({
  buttonSelector = ".btn-burger",
  overlaySelector = "#app-menu",
} = {}) {
  const menuButton = document.querySelector(buttonSelector);
  const menuOverlay = document.querySelector(overlaySelector);
  if (!menuButton || !menuOverlay) {
    return {
      open: () => {},
      close: () => {},
      toggle: () => {},
      destroy: () => {},
    };
  }

  const overlayContent = menuOverlay.querySelector(".menu-overlay__content");
  const tooltip = document.createElement("div");
  tooltip.className = "menu-tooltip";
  tooltip.textContent = "незабаром";
  tooltip.setAttribute("aria-hidden", "true");
  tooltip.style.opacity = "0";
  tooltip.style.left = "0";
  tooltip.style.top = "0";
  overlayContent && overlayContent.appendChild(tooltip);

  const offset = 12;
  function positionTooltip(e) {
    if (!overlayContent) return;
    const rect = overlayContent.getBoundingClientRect();
    const tRect = tooltip.getBoundingClientRect();
    let x = e.clientX - rect.left + offset;
    let y = e.clientY - rect.top + offset;
    const maxX = rect.width - tRect.width - 8;
    const maxY = rect.height - tRect.height - 8;
    if (x > maxX) x = maxX;
    if (y > maxY) y = maxY;
    if (x < 8) x = 8;
    if (y < 8) y = 8;
    tooltip.style.transform = `translate(${x}px, ${y}px)`;
  }
  function showTooltip() {
    tooltip.style.opacity = "1";
  }
  function hideTooltip() {
    tooltip.style.opacity = "0";
  }

  let menuTl;

  function open() {
    menuButton.setAttribute("aria-expanded", "true");
    menuOverlay.hidden = false;
    menuOverlay.setAttribute("aria-hidden", "false");
    menuOverlay.classList.add("is-open");
    menuOverlay.style.pointerEvents = "auto";
    menuOverlay.style.display = "flex";
    try {
      if (menuTl) menuTl.kill();
      menuTl = gsap.timeline();
      menuTl.fromTo(
        menuOverlay,
        { opacity: 0 },
        { opacity: 1, duration: 0.32, ease: "power2.out" }
      );
      const left = menuOverlay.querySelector(".menu-preview--left");
      const center = menuOverlay.querySelector(".menu-preview--center");
      const right = menuOverlay.querySelector(".menu-preview--right");
      if (left && center && right) {
        gsap.set([left, center, right], { opacity: 0 });
        menuTl
          .fromTo(
            left,
            { x: -40, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.45, ease: "power3.out" },
            "<+0.05"
          )
          .fromTo(
            center,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" },
            "<+0.08"
          )
          .fromTo(
            right,
            { x: 40, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.45, ease: "power3.out" },
            "<+0.08"
          );
      }
    } catch {}
  }

  function close() {
    menuButton.setAttribute("aria-expanded", "false");
    hideTooltip();
    menuOverlay.style.pointerEvents = "none";
    menuOverlay.classList.remove("is-open");
    menuOverlay.setAttribute("aria-hidden", "true");
    menuOverlay.hidden = true;
    menuOverlay.style.display = "none";
    try {
      if (menuTl) menuTl.kill();
      menuTl = gsap.timeline();
      const left = menuOverlay.querySelector(".menu-preview--left");
      const center = menuOverlay.querySelector(".menu-preview--center");
      const right = menuOverlay.querySelector(".menu-preview--right");
    } catch {}
  }

  function toggle() {
    const expanded = menuButton.getAttribute("aria-expanded") === "true";
    if (expanded) close();
    else open();
  }

  const onButtonClick = () => toggle();
  const onOverlayClick = (e) => {
    if (e.target === menuOverlay) close();
  };
  const onEsc = (e) => {
    if (e.key === "Escape") close();
  };

  // Restart button under center preview -> reset current game (finddiff if active)
  const restartBtn = menuOverlay.querySelector(".menu-restart-btn");
  const onRestart = () => {
    try {
      close();
    } catch {}
    try {
      window.__finddiffHideAt = null;
    } catch {}
    try {
      window.location.reload();
    } catch {}
  };

  menuButton.addEventListener("click", onButtonClick);
  menuOverlay.addEventListener("click", onOverlayClick);
  window.addEventListener("keydown", onEsc);
  if (restartBtn) restartBtn.addEventListener("click", onRestart);

  const leftEl = menuOverlay.querySelector(".menu-preview--left");
  const rightEl = menuOverlay.querySelector(".menu-preview--right");
  const moveHandler = (e) => {
    positionTooltip(e);
  };
  const enterHandler = (e) => {
    positionTooltip(e);
    showTooltip();
  };
  const leaveHandler = () => hideTooltip();
  if (leftEl) {
    leftEl.addEventListener("mouseenter", enterHandler);
    leftEl.addEventListener("mousemove", moveHandler);
    leftEl.addEventListener("mouseleave", leaveHandler);
  }
  if (rightEl) {
    rightEl.addEventListener("mouseenter", enterHandler);
    rightEl.addEventListener("mousemove", moveHandler);
    rightEl.addEventListener("mouseleave", leaveHandler);
  }

  function destroy() {
    try {
      if (menuTl) menuTl.kill();
    } catch {}
    menuButton.removeEventListener("click", onButtonClick);
    menuOverlay.removeEventListener("click", onOverlayClick);
    window.removeEventListener("keydown", onEsc);
    if (restartBtn) restartBtn.removeEventListener("click", onRestart);
    if (leftEl) {
      leftEl.removeEventListener("mouseenter", enterHandler);
      leftEl.removeEventListener("mousemove", moveHandler);
      leftEl.removeEventListener("mouseleave", leaveHandler);
    }
    if (rightEl) {
      rightEl.removeEventListener("mouseenter", enterHandler);
      rightEl.removeEventListener("mousemove", moveHandler);
      rightEl.removeEventListener("mouseleave", leaveHandler);
    }
  }

  return { open, close, toggle, destroy };
}
