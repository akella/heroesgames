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

export function applyRoomOps(bus, rule, slide, allGamesDone = true) {
  if (rule.roomReveal) {
    const ids = filterRoomRevealIds(rule.roomReveal, slide);
    ids.forEach((id) => safeEmit(bus, "room.reveal", { id }));
    
    // On slide99, reveal football object only if football game is completed
    if (slide === "slide99" && (window.__footballCompleted || window.__footballCompletedPending)) {
      safeEmit(bus, "room.reveal", { id: "football" });
    }
  }
  if (rule.roomRestore) {
    rule.roomRestore.forEach((id) => safeEmit(bus, "room.restore", { id }));
  }
  if (rule.roomRemove) {
    rule.roomRemove.forEach((id) => safeEmit(bus, "room.remove", { id }));
  }
  // Only apply roomRevealAll and depthMap when all games are done
  if (rule.roomRevealAll && allGamesDone) {
    safeEmit(bus, "room.revealAll");
  }
  if (rule.depthMap && allGamesDone) {
    safeEmit(bus, "room.setDepth", { mode: rule.depthMap });
    // Also disable scene filter overlay when switching to full depth map
    if (rule.depthMap === "full") {
      try {
        const filterEl = document.querySelector(".scene-filter");
        if (filterEl) filterEl.style.opacity = "0";
      } catch {}
    }
  }
}
