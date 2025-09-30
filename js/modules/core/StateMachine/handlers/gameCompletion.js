import { parseSlideNumber } from "../flowUtils.js";

export function bindGameCompletionHandlers({
  bus,
  flowActor,
  gameManager,
  emit,
  maybeHandlePostGameRedirect,
}) {
  if (!bus || !flowActor) return;

  try {
    bus.on("game.finddiff.complete", () => {
      let curSlide;
      try {
        curSlide = flowActor.getSnapshot().value;
      } catch {}
      const m = /slide(\d+)/.exec(curSlide || "");
      let hideAt = null;
      if (m) {
        const base = parseInt(m[1], 10);
        hideAt = "slide" + (base + 3);
      }
      try {
        window.__finddiffHideAt = hideAt;
      } catch {}
      try {
        if (gameManager.active?.id === "finddiff") {
          gameManager.active.api?.setActive?.(false);
        }
      } catch {}
      try {
        emit("score.hide");
      } catch {}
      try {
        emit("room.remove", { id: "picture" });
      } catch {}
      try {
        flowActor.send({ type: "NEXT" });
      } catch {}
    });

    // Puzzle completion
    bus.on("game.puzzle.complete", () => {
      try {
        window.__puzzleCompletedPending = true;
      } catch {}
      try {
        emit("room.remove", { id: "book-floor" });
      } catch {}
      try {
        const cur = flowActor.getSnapshot().value;
        const n = parseSlideNumber(cur);
        if (n != null && n >= 25 && n <= 27) flowActor.send({ type: "NEXT" });
      } catch {}
    });

    // Wordbox completion
    bus.on("game.wordbox.complete", () => {
      try {
        window.__wordboxCompletedPending = true;
      } catch {}
      try {
        emit("room.remove", { id: "box" });
      } catch {}
      try {
        const cur = flowActor.getSnapshot().value;
        const n = parseSlideNumber(cur);
        if (n != null && n >= 34 && n <= 37) flowActor.send({ type: "NEXT" });
      } catch {}
    });

    // Football completion
    bus.on("game.football.complete", () => {
      try {
        window.__footballCompleted = true;
        window.__footballCompletedPending = false;
      } catch {}
      try {
        emit("room.remove", { id: "football-0" });
        emit("room.remove", { id: "sh-football" });
      } catch {}
      try {
        const cur = flowActor.getSnapshot().value;
        const n = parseSlideNumber(cur);
        if (n != null && n >= 42 && n <= 44) flowActor.send({ type: "NEXT" });
      } catch {}
      try {
        if (window.__puzzleCompleted && window.__wordboxCompleted) {
          window.__postGameRedirectAction = "GOTO_45";
          const cur = flowActor.getSnapshot().value;
          maybeHandlePostGameRedirect(flowActor, parseSlideNumber(cur));
        }
      } catch {}
    });
  } catch {}
}
