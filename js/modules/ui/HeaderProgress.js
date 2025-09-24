// HeaderProgress

export function initHeaderProgress({ bus } = {}) {
  const header = document.querySelector(".app-header");
  if (!header) return;

  // Build DOM
  const wrap = document.createElement("div");
  wrap.className = "header-progress";
  wrap.setAttribute("aria-label", "допоможи герою облаштувати кімнату");
  wrap.innerHTML = `
    <div class="header-progress__cap" aria-hidden="true">
      <svg class="header-progress__icon" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path opacity="0.5" d="M14.0002 25.6667C20.4435 25.6667 25.6668 23.8385 25.6668 21.5833C25.6668 19.3282 20.4435 17.5 14.0002 17.5C7.55684 17.5 2.3335 19.3282 2.3335 21.5833C2.3335 23.8385 7.55684 25.6667 14.0002 25.6667Z" fill="white"/>
        <path d="M14 1.45898C14.2321 1.45898 14.4546 1.55117 14.6187 1.71527C14.7828 1.87936 14.875 2.10192 14.875 2.33398V3.54265L20.7177 6.46398L20.7807 6.49548C21.637 6.92365 22.3673 7.28882 22.876 7.64348C23.3917 8.00398 23.933 8.52665 23.933 9.33398C23.933 10.1413 23.3917 10.664 22.876 11.0245C22.3673 11.3792 21.637 11.7443 20.7807 12.1725L14.875 15.1242V21.0007C14.875 21.2327 14.7828 21.4553 14.6187 21.6194C14.4546 21.7835 14.2321 21.8757 14 21.8757C13.7679 21.8757 13.5454 21.7835 13.3813 21.6194C13.2172 21.4553 13.125 21.2327 13.125 21.0007V2.33398C13.125 2.10192 13.2172 1.87936 13.3813 1.71527C13.5454 1.55117 13.7679 1.45898 14 1.45898Z" fill="white"/>
      </svg>
    </div>
    <div class="header-progress__body">
      <div class="header-progress__body-inner">
        <div class="header-progress__label">допоможи герою облаштувати кімнату</div>
        <div class="header-progress__bar"><div class="header-progress__fill" style="width:0%"></div></div>
      </div>
    </div>
  `;
  // Insert after burger button
  const burger = header.querySelector(".btn-burger");
  if (burger && burger.nextSibling)
    header.insertBefore(wrap, burger.nextSibling);
  else header.appendChild(wrap);

  const fillEl = wrap.querySelector(".header-progress__fill");
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

  // Compute overall progress across minigames
  const state = {
    games: {
      finddiff: false,
      puzzle: false,
      wordbox: false,
      football: false,
    },
    toys: {
      dino: false,
      ship: false,
      robot: false,
    },
  };
  const GAME_KEYS = Object.keys(state.games);
  const TOY_KEYS = Object.keys(state.toys);
  const update = () => {
    const total = GAME_KEYS.length + TOY_KEYS.length;
    const value =
      GAME_KEYS.reduce((acc, k) => acc + (state.games[k] ? 1 : 0), 0) +
      TOY_KEYS.reduce((acc, k) => acc + (state.toys[k] ? 1 : 0), 0);
    const pct = total > 0 ? (value / total) * 100 : 0;
    if (fillEl) fillEl.style.width = pct + "%";
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
      state.games.finddiff = true;
      update();
    });
    bus.on("game.puzzle.complete", () => {
      state.games.puzzle = true;
      update();
    });
    bus.on("game.wordbox.complete", () => {
      state.games.wordbox = true;
      update();
    });
    bus.on("game.football.complete", () => {
      state.games.football = true;
      update();
    });
    bus.on("toy.placed", ({ id }) => {
      if (id && state.toys.hasOwnProperty(id)) {
        state.toys[id] = true;
        update();
      }
    });
  }

  // Expose for debugging
  try {
    window.__headerProgress = {
      set: (k, v) => {
        if (state.games.hasOwnProperty(k)) state.games[k] = !!v;
        if (state.toys.hasOwnProperty(k)) state.toys[k] = !!v;
        update();
      },
    };
  } catch {}

  // Start hidden until eligible slide passes
  applyVisibility();
}
