const DEFAULT_GAME_SLIDES = [
  "slide23",
  "slide24",
  "slide25",
  "slide26",
  "slide27",
  "slide28",
  "slide33",
  "slide34",
  "slide35",
  "slide36",
  "slide37",
  "slide41",
];

const EXIT_TITLE = "Ти дійсно хочеш вийти?";
const EXIT_SUBTITLE =
  "Якщо ви покинете цю діяльність, вам доведеться почати все спочатку, коли ви повернетеся.";

function createButton() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-circle game-back-btn";
  btn.setAttribute("aria-label", "Назад до вибору ігор");
  btn.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M11.6665 22.3125C11.3189 22.3124 10.9857 22.1743 10.7397 21.9287L10.7388 21.9287L3.73877 14.9287C3.49303 14.6827 3.35504 14.3487 3.35498 14.001C3.35498 13.6967 3.46091 13.4033 3.65186 13.1699L3.73877 13.0732L10.7388 6.07324C10.8569 5.94938 10.9984 5.84996 11.1548 5.78027C11.3157 5.70859 11.4894 5.6701 11.6655 5.66699C11.8417 5.66388 12.0168 5.69574 12.1802 5.76172C12.3436 5.82772 12.4921 5.92618 12.6167 6.05078C12.7413 6.1754 12.8398 6.32388 12.9058 6.4873C12.9718 6.65069 13.0036 6.82577 13.0005 7.00195C12.9974 7.17809 12.9589 7.35176 12.8872 7.51269C12.8155 7.6737 12.7124 7.81929 12.5835 7.93945L7.83447 12.6885L23.3335 12.6885C23.6814 12.6885 24.0151 12.8264 24.2612 13.0723C24.5074 13.3184 24.646 13.6529 24.646 14.001C24.6459 14.349 24.5073 14.6826 24.2612 14.9287C24.0151 15.1748 23.6815 15.3135 23.3335 15.3135L7.83447 15.3135L12.5942 20.0732C12.84 20.3193 12.979 20.6532 12.979 21.001C12.9789 21.3487 12.84 21.6827 12.5942 21.9287C12.3482 22.1745 12.0143 22.3125 11.6665 22.3125Z" fill="#4071FD" stroke="#4071FD" stroke-width="0.875"/>
    </svg>`;
  document.body.appendChild(btn);
  return btn;
}

function defaultOnExit({ gameManager, bus, flowActor }) {
  try {
    gameManager.active?.api?.setActive?.(false);
    gameManager.active?.api?.hide?.();
  } catch {}
  try {
    bus.emit("score.hide");
  } catch {}
  try {
    flowActor.send({ type: "GOTO_21" });
  } catch {}
}

export function initGameBackButton({
  bus,
  messageApi,
  flowActor,
  gameManager,
  slides = DEFAULT_GAME_SLIDES,
  onExit = defaultOnExit,
} = {}) {
  if (!bus || !messageApi || !flowActor || !gameManager) {
    return { destroy: () => {} };
  }

  const targetSlides = new Set(slides);
  const button = createButton();

  const updateVisibility = (snapshot) => {
    const value = snapshot?.value || snapshot;
    const visible = targetSlides.has(value);
    button.classList.toggle("is-visible", visible);
  };

  const onFlowProgress = (snapshot) => updateVisibility(snapshot);
  bus.on("flow.progress", onFlowProgress);

  updateVisibility(flowActor.getSnapshot());

  button.addEventListener("click", () => {
    messageApi.open({
      title: EXIT_TITLE,
      subtitle: EXIT_SUBTITLE,
      actions: [
        {
          label: "Так",
          onClick: () => onExit({ gameManager, bus, flowActor }),
        },
        {
          label: "Ні",
        },
      ],
    });
  });

  return {
    destroy: () => {
      try {
        bus.off("flow.progress", onFlowProgress);
      } catch {}
      try {
        button.remove();
      } catch {}
    },
  };
}
