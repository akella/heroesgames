function safeEmit(bus, type, payload) {
  try {
    bus.emit(type, payload);
  } catch {}
}

export function filterRoomRevealIds(ids, slide) {
  return ids.filter((id) => {
    if (
      id === "box" &&
      (window.__wordboxCompleted || window.__wordboxCompletedPending) &&
      slide !== "slide45" &&
      slide !== "slide46"
    ) {
      return false;
    }
    if (
      id === "book-floor" &&
      (window.__puzzleCompleted || window.__puzzleCompletedPending) &&
      slide !== "slide45" &&
      slide !== "slide46"
    ) {
      return false;
    }
    if (
      id === "football-0" &&
      (window.__footballCompleted || window.__footballCompletedPending) &&
      slide !== "slide45" &&
      slide !== "slide46"
    ) {
      return false;
    }
    return true;
  });
}

export function applyRoomOps(bus, rule, slide) {
  if (rule.roomReveal) {
    const ids = filterRoomRevealIds(rule.roomReveal, slide);
    ids.forEach((id) => safeEmit(bus, "room.reveal", { id }));
  }
  if (rule.roomRestore) {
    rule.roomRestore.forEach((id) => safeEmit(bus, "room.restore", { id }));
  }
  if (rule.roomRemove) {
    rule.roomRemove.forEach((id) => safeEmit(bus, "room.remove", { id }));
  }
}
