// Lightweight RoomPicker UI (no title): button + form with wallpaper thumbnails.
// Picker images are imported as modules to let the bundler handle them (Vite).

import pickerBase from "../../../assets/picker/room-picker.png";
import pickerLocked from "../../../assets/picker/room-picker-locked.png";
import wall1 from "../../../assets/picker/wall-1.png";
import wall2 from "../../../assets/picker/wall-2.png";
import wall3 from "../../../assets/picker/wall-3.png";
import wall4 from "../../../assets/picker/wall-4.png";
import wall5 from "../../../assets/picker/wall-5.png";

const wallThumbs = [wall1, wall2, wall3, wall4, wall5];

export class RoomPicker {
  constructor({
    container = document.body,
    shaderBG,
    shaderFG,
    position = { left: 16, top: 16 },
    locked = false,
    allowLockedClick = false,
    category = "wall", // single-category picker: 'wall' | 'floor' | 'table'
    onOpen = null,
    onFirstSelect = null,
    onLockedClick = null,
    anchor = null, // { shader, layerId, align?: 'top-left'|'center', offset?: {x,y} }
  } = {}) {
    this.container = container;
    this.shaderBG = shaderBG;
    this.shaderFG = shaderFG;
    this.pos = position;
    this.locked = !!locked;
    this.allowLockedClick = !!allowLockedClick;
    this.onOpen = typeof onOpen === "function" ? onOpen : null;
    this.onFirstSelect =
      typeof onFirstSelect === "function" ? onFirstSelect : null;
    this.onLockedClick =
      typeof onLockedClick === "function" ? onLockedClick : null;
    this.anchor = anchor;
    this.open = false;
    this.category = category || "wall";
    this.selected = 0;
    this._firstSelectFired = false;
    this._res = {
      w: this.container?.clientWidth || window.innerWidth,
      h: this.container?.clientHeight || window.innerHeight,
    };

    this._build();
    this.setLocked(this.locked);
    this._attach();
  }

  _build() {
    // Wrapper
    this.root = document.createElement("div");
    this.root.className = "room-picker-root";
    this.root.style.position = "absolute";
    this.root.style.left = `${this.pos.left}px`;
    this.root.style.top = `${this.pos.top}px`;
    this.root.style.zIndex = "140";
    this.root.style.pointerEvents = "auto";

    // Button
    this.button = document.createElement("button");
    this.button.className = "room-picker-btn";
    this.button.setAttribute("aria-label", "Room picker");
    // Base frame image (room-picker or locked)
    this.baseImg = document.createElement("img");
    this.baseImg.className = "room-picker__base";
    this.baseImg.alt = "room-picker-base";
    this.baseImg.draggable = false;
    // Selected wallpaper overlay (on top)
    this.thumbImg = document.createElement("img");
    this.thumbImg.className = "room-picker__thumb";
    this.thumbImg.alt = "room-picker-selected";
    this.thumbImg.draggable = false;
    this.button.appendChild(this.baseImg);
    this.button.appendChild(this.thumbImg);
    this.root.appendChild(this.button);

    // Form (no title). Build a single grid for this.category
    this.form = document.createElement("div");
    this.form.className = "room-picker-form";
    this.form.setAttribute("aria-hidden", "true");
    const counts = { wall: 5, floor: 4, table: 3 };
    this.grid = document.createElement("div");
    this.grid.className = "room-picker-grid";
    const total = counts[this.category] || 5;
    for (let i = 0; i < total; i++) {
      const item = document.createElement("button");
      item.className = "room-picker-item";
      item.type = "button";
      item.dataset.index = String(i);
      const img = document.createElement("img");
      img.alt = `${this.category}-${i + 1}`;
      img.src = wallThumbs[i] || wallThumbs[0]; // reuse wallpapers for now
      img.draggable = false;
      item.appendChild(img);
      if (i === this.selected) item.classList.add("selected");
      item.addEventListener("click", () => this._onSelect(i));
      this.grid.appendChild(item);
    }
    this.form.appendChild(this.grid);
    this.root.appendChild(this.form);

    // Events
    this.button.addEventListener("click", () => {
      if (this.locked) {
        try {
          this.onLockedClick && this.onLockedClick();
        } catch {}
        return;
      }
      this.toggle();
    });

    // Anchor positioning (optional)
    if (this.anchor && this.anchor.shader && this.anchor.layerId) {
      try {
        this.anchor.shader.onBBoxesReady(() => this._positionFromAnchor());
      } catch {}
      window.addEventListener("app-resize", (e) => {
        this._res = {
          w: e.detail?.width || this._res.w,
          h: e.detail?.height || this._res.h,
        };
        this._positionFromAnchor();
      });
      this._positionFromAnchor();
    }
  }

  _attach() {
    (this.container || document.body).appendChild(this.root);
    this._updateButtonImage();
  }

  _updateButtonImage() {
    // Base frame image depends on lock state
    this.baseImg.src = this.locked ? pickerLocked : pickerBase;
    // Overlay shows current selection for this picker category
    const idx = Math.max(0, Number(this.selected) || 0);
    const clampedIdx = Math.min(idx, wallThumbs.length - 1);
    this.thumbImg.src = wallThumbs[clampedIdx] || wallThumbs[0];
    this.button.disabled = !!this.locked;
    // When locked, hide overlay; when unlocked, show it
    this.thumbImg.style.visibility = this.locked ? "hidden" : "visible";
  }

  _updateSelectionHighlight() {
    if (!this.grid) return;
    const items = this.grid.querySelectorAll(".room-picker-item");
    items.forEach((el) => el.classList.remove("selected"));
    const el = this.grid.querySelector(
      `.room-picker-item[data-index="${this.selected}"]`
    );
    if (el) el.classList.add("selected");
  }

  _positionFromAnchor() {
    if (!this.anchor || !this.anchor.shader || !this.anchor.layerId) return;
    const bbox = this.anchor.shader.getLayerBBox(this.anchor.layerId);
    if (!bbox || !bbox.min || !bbox.size) return;
    const depthAspect = this.anchor.shader.getDepthAspect?.() || 1;
    const W = this._res.w;
    const H = this._res.h;
    const screenAspect = W / H;

    const invMap = (newUV) => {
      let vUvX, vUvY;
      if (depthAspect > screenAspect) {
        vUvX = (newUV.x - 0.5) * (depthAspect / screenAspect) + 0.5;
        vUvY = newUV.y;
      } else {
        vUvX = newUV.x;
        vUvY = (newUV.y - 0.5) * (screenAspect / depthAspect) + 0.5;
      }
      const px = vUvX * W;
      const py = (1.0 - vUvY) * H; // UV origin bottom-left -> CSS top-left
      return { x: px, y: py };
    };

    const bl = { x: bbox.min[0], y: bbox.min[1] }; // bottom-left
    const tr = { x: bbox.min[0] + bbox.size[0], y: bbox.min[1] + bbox.size[1] }; // top-right
    const pBL = invMap(bl);
    const pTR = invMap(tr);
    const left = pBL.x;
    const top = pTR.y;
    const center = { x: (pBL.x + pTR.x) / 2, y: (pBL.y + pTR.y) / 2 };
    const align = this.anchor.align || "top-left";
    let ax = left;
    let ay = top;
    if (align === "center") {
      ax = center.x - this.root.offsetWidth / 2;
      ay = center.y - this.root.offsetHeight / 2;
    }
    const off = this.anchor.offset || { x: 0, y: 0 };
    this.root.style.left = Math.round(ax + off.x) + "px";
    this.root.style.top = Math.round(ay + off.y) + "px";
  }

  _onSelect(index) {
    this.selected = index;
    this._updateSelectionHighlight();
    // Apply to shaders; setVariant clamps to available range
    try {
      this.shaderBG?.setVariant?.(this.category, index);
    } catch {}
    try {
      this.shaderFG?.setVariant?.(this.category, index);
    } catch {}
    this._updateButtonImage();
    if (!this._firstSelectFired) {
      this._firstSelectFired = true;
      try {
        this.onFirstSelect &&
          this.onFirstSelect({ category: this.category, index });
      } catch {}
    }
  }

  setLocked(flag) {
    this.locked = !!flag;
    if (this.locked && this.open) this.close();
    this._updateButtonImage();
  }

  setPosition({ left, top }) {
    if (left != null) this.root.style.left = `${left}px`;
    if (top != null) this.root.style.top = `${top}px`;
  }

  openForm() {
    if (this.open) return;
    this.open = true;
    this.form.setAttribute("aria-hidden", "false");
    try {
      this.onOpen && this.onOpen();
    } catch {}
  }
  close() {
    this.open = false;
    this.form.setAttribute("aria-hidden", "true");
  }
  toggle() {
    this.open ? this.close() : this.openForm();
  }

  show() {
    this.root.style.display = "flex";
    // Ensure correct placement when shown
    if (this.anchor) this._positionFromAnchor();
  }
  hide() {
    this.root.style.display = "none";
    this.close();
  }

  destroy() {
    this.root?.remove();
  }
}
