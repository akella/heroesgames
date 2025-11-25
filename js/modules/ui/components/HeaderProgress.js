// HeaderProgress

export function initHeaderProgress({ bus } = {}) {
  const header = document.querySelector(".app-header");
  if (!header) return;

  // Build DOM
  const wrap = document.createElement("div");
  wrap.className = "header-progress";
  wrap.setAttribute("aria-label", "прогрес виконання завдань");
  wrap.innerHTML = `
    <div class="header-progress__circle">
      <svg class="header-progress__circle-border" viewBox="0 0 56 56">
        <circle class="header-progress__circle-bg" cx="28" cy="28" r="26" />
        <circle class="header-progress__circle-progress" cx="28" cy="28" r="26" />
      </svg>
      <div class="header-progress__circle-inner">
        <img class="header-progress__smile" src="assets/header-progress/smile-1.png" alt="" />
      </div>
    </div>
    <div class="header-progress__track">
      <div class="header-progress__track-gradient"></div>
      <div class="header-progress__line header-progress__line--1"></div>
      <div class="header-progress__dot header-progress__dot--1">
        <img class="header-progress__star" src="assets/header-progress/star.svg" alt="" />
      </div>
      <div class="header-progress__line header-progress__line--2"></div>
      <div class="header-progress__dot header-progress__dot--2">
        <img class="header-progress__star" src="assets/header-progress/star.svg" alt="" />
      </div>
      <div class="header-progress__line header-progress__line--3"></div>
      <div class="header-progress__dot header-progress__dot--3">
        <img class="header-progress__star" src="assets/header-progress/star.svg" alt="" />
      </div>
      <div class="header-progress__line header-progress__line--4"></div>
      <div class="header-progress__dot header-progress__dot--4">
        <img class="header-progress__star" src="assets/header-progress/star.svg" alt="" />
      </div>
    </div>
  `;
  // Insert after burger button
  const burger = header.querySelector(".btn-burger");
  if (burger && burger.nextSibling)
    header.insertBefore(wrap, burger.nextSibling);
  else header.appendChild(wrap);

  const circleProgress = wrap.querySelector(".header-progress__circle-progress");
  const circleInner = wrap.querySelector(".header-progress__circle-inner");
  const smileImg = wrap.querySelector(".header-progress__smile");
  const lines = wrap.querySelectorAll(".header-progress__line");
  const dots = wrap.querySelectorAll(".header-progress__dot");
  const gradientOverlay = wrap.querySelector(".header-progress__track-gradient");
  
  let menuOpen = false;
  let slideEligible = false; // becomes true only after slide6
  const applyVisibility = () => {
    const visible = slideEligible && !menuOpen;
    wrap.style.transition = "opacity 0.2s ease";
    wrap.style.opacity = visible ? "1" : "0";
    wrap.style.pointerEvents = "none";
  };
  const hide = () => {
    menuOpen = true;
    applyVisibility();
  };
  const show = () => {
    menuOpen = false;
    applyVisibility();
  };

  // Track game completions (4 games total)
  const state = {
    finddiff: false,
    puzzle: false,
    wordbox: false,
    football: false,
  };
  
  const GAME_ORDER = ["finddiff", "puzzle", "wordbox", "football"];
  
  const getSmileImage = (completed) => {
    if (completed === 0) return "smile-1.png";
    if (completed === 1) return "smile-1.png"; // 0-25%
    if (completed === 2) return "smile-2.png"; // 50%
    if (completed === 3) return "smile-3.png"; // 75%
    return "smile-4.png"; // 100%
  };
  
  const getProgressColor = (completed) => {
    if (completed <= 1) return "#FFF769"; // 0-25%
    if (completed === 2) return "#BDFAA2"; // 50%
    if (completed === 3) return "#A1FBBA"; // 75%
    return "#61FFEA"; // 100%
  };
  
  const update = () => {
    const completed = GAME_ORDER.filter(k => state[k]).length;
    const percent = (completed / 4) * 100;
    const color = getProgressColor(completed);
    
    // Update circle progress (0%, 25%, 50%, 75%, 100%)
    const circumference = 2 * Math.PI * 26;
    const offset = circumference - (percent / 100) * circumference;
    circleProgress.style.strokeDashoffset = offset;
    circleProgress.style.stroke = color;
    
    // Update circle background to match progress color
    circleInner.style.background = color;
    
    // Update smile image
    smileImg.src = `assets/header-progress/${getSmileImage(completed)}`;
    
    // Update lines and dots based on completed games
    lines.forEach((line, i) => {
      if (i < completed) {
        line.classList.add("is-active");
      } else {
        line.classList.remove("is-active");
      }
    });
    
    dots.forEach((dot, i) => {
      if (i < completed) {
        dot.classList.add("is-active");
      } else {
        dot.classList.remove("is-active");
      }
    });
    

  };
  update();

  // Listen to completion events
  if (bus) {
    bus.on("menu.open", hide);
    bus.on("menu.close", show);
    // Show only starting from slide7
    bus.on("flow.progress", (snap) => {
      try {
        const val = snap?.value || snap;
        const m = /^slide(\d+)$/i.exec(String(val));
        if (m) {
          const n = parseInt(m[1], 10);
          slideEligible = n > 6;
        } else {
          // Non-numeric states (intro/outro) — default to hidden per spec
          slideEligible = false;
        }
        applyVisibility();
      } catch {}
    });
    bus.on("game.finddiff.complete", () => {
      state.finddiff = true;
      update();
    });
    bus.on("game.puzzle.complete", () => {
      state.puzzle = true;
      update();
    });
    bus.on("game.wordbox.complete", () => {
      state.wordbox = true;
      update();
    });
    bus.on("game.football.complete", () => {
      state.football = true;
      update();
    });
  }

  // Expose for debugging
  try {
    window.__headerProgress = {
      set: (k, v) => {
        if (state.hasOwnProperty(k)) {
          state[k] = !!v;
          update();
        }
      },
    };
  } catch {}

  // Start hidden until eligible slide passes
  applyVisibility();
}
