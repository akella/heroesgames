export function parseSlideNumber(slide) {
  if (typeof slide !== "string") return null;
  if (!slide.startsWith("slide")) return null;
  const n = parseInt(slide.slice(5), 10);
  return Number.isFinite(n) ? n : null;
}

export function isGameSlide(slide, ranges) {
  const n = parseSlideNumber(slide);
  if (n == null) return false;
  return ranges.some(([from, to]) => n >= from && n <= to);
}

export function allGamesDone() {
  const wordDone =
    !!window.__wordboxCompleted || !!window.__wordboxCompletedPending;
  const puzzDone =
    !!window.__puzzleCompleted || !!window.__puzzleCompletedPending;
  return puzzDone && wordDone && !!window.__footballCompleted;
}
