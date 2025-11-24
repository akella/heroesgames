import { allGamesDone } from "./flowUtils.js";

export function maybeHandlePostGameRedirect(flowActor, slideNumber) {
  const action = window.__postGameRedirectAction;
  if (!action) return;
  if (!allGamesDone()) return;
  if (
    window.__puzzleExitPending ||
    window.__wordboxExitPending ||
    window.__footballExitPending
  )
    return;

  if (slideNumber != null) {
    if (action === "GOTO_45" && slideNumber >= 48) {
      window.__postGameRedirectAction = null;
      return;
    }
    if (action === "GOTO_99" && slideNumber >= 99) {
      window.__postGameRedirectAction = null;
      return;
    }
  }

  const toSend = action;
  window.__postGameRedirectAction = null;
  setTimeout(() => {
    try {
      flowActor.send({ type: toSend });
    } catch {}
  });
}

export function redirectToHub({ flowActor, bus, gameManager, gameRoot }) {
  try {
    bus.emit("scene.parallax", { enabled: true });
    bus.emit("scene.view.reset");
    document.dispatchEvent(new CustomEvent("showCharacter"));
  } catch {}
  try {
    if (gameManager.active) {
      gameManager.active.api?.setActive?.(false);
      gameManager.active.api?.hide?.();
    }
    if (gameRoot) gameRoot.style.zIndex = "5";
  } catch {}
  try {
    bus.emit("score.unlock");
    bus.emit("score.hide");
  } catch {}
  try {
    flowActor.send({ type: "GOTO_99" });
  } catch {}
}
