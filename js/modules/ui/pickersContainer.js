// Factory ensuring a single shared container for room & toy pickers
export function ensurePickersContainer() {
  let el = document.getElementById("room-pickers-container");
  if (!el) {
    el = document.createElement("div");
    el.id = "room-pickers-container";
    el.style.position = "absolute";
    el.style.left = "0";
    el.style.top = "0";
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.pointerEvents = "none";
    el.style.zIndex = "150";
    document.body.appendChild(el);
  }
  return el;
}
