import gsap from 'gsap';

export class OverlayObjectsManager {
  constructor({ container, mouse, events }) {
    this.container = container;
    this.mouse = mouse;
    this.events = events;
    this.items = new Map();
    this.activeSlide = null;
    this._onFlow = this._onFlow.bind(this);
    events.on('flow.progress', this._onFlow);
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  add(cfg) {
    const { id, slides = [], initial = {}, parallax, images, zIndex = 10, action } = cfg;
    if (this.items.has(id)) return this.items.get(id);

    const el = document.createElement('div');
    el.className = 'overlay-object';
    el.dataset.id = id;
    el.style.position = 'absolute';
    el.style.top = (typeof initial.y === 'number' ? initial.y + 'px' : (initial.y || '10%'));
    el.style.left = (typeof initial.x === 'number' ? initial.x + 'px' : (initial.x || '10%'));
    el.style.width = (initial.width || '200px');
    el.style.aspectRatio = initial.aspectRatio || '1/1';
    el.style.pointerEvents = 'auto';
    el.style.zIndex = zIndex;
    el.style.opacity = '0';
    el.style.visibility = 'hidden';
    el.style.transition = 'filter 0.3s ease';

    // base image
    const img = document.createElement('img');
    img.src = images.normal;
    img.alt = id;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.display = 'block';
    img.style.position = 'relative';
    img.style.zIndex = 1;
    el.appendChild(img);

    // hover overlay image
    let imgHover = null;
    if (images.hover) {
      imgHover = document.createElement('img');
      imgHover.src = images.hover;
      imgHover.alt = id + '-hover';
      const hoverScale = images.hoverScale || 1;
      const hoverWidth = images.hoverWidth;
      const hoverHeight = images.hoverHeight;
      imgHover.style.width = hoverWidth || '100%';
      imgHover.style.height = hoverHeight || '100%';
      imgHover.style.display = 'block';
      imgHover.style.position = 'absolute';
      if (hoverScale !== 1 || hoverWidth || hoverHeight) {
        imgHover.style.left = '50%';
        imgHover.style.top = '50%';
        imgHover.style.transform = `translate(-50%, -50%) scale(${hoverScale})`;
      } else {
        imgHover.style.left = 0;
        imgHover.style.top = 0;
      }
      imgHover.style.opacity = 0;
      imgHover.style.transition = 'opacity 0.25s ease';
      imgHover.style.zIndex = 2;
      el.appendChild(imgHover);
      el.addEventListener('mouseenter', () => { imgHover.style.opacity = 1; });
      el.addEventListener('mouseleave', () => { imgHover.style.opacity = 0; });
    }

    // Click action restricted to specific slides
    if (action && (action.onTrigger || action.handler)) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        const fn = action.onTrigger || action.handler;
        if (!fn) return;
        if (action.slides && action.slides.length > 0) {
          if (action.slides.includes(this.activeSlide)) {
            fn({ slide: this.activeSlide, id });
          }
        } else {
          fn({ slide: this.activeSlide, id });
        }
      });
    }

    this.container.appendChild(el);

    const record = {
      id,
      slides: new Set(slides),
      el,
      img,
      imgHover,
      action,
      parallax: Object.assign({ strengthX: 25, strengthY: 25, lerp: 0.1 }, parallax),
      base: { x: el.offsetLeft, y: el.offsetTop },
      targetOffset: { x: 0, y: 0 },
      currentOffset: { x: 0, y: 0 },
      centerOffset: (initial.centerOffset && typeof initial.centerOffset.x === 'number' && typeof initial.centerOffset.y === 'number')
        ? {
            x: initial.centerOffset.x,
            y: initial.centerOffset.y,
            mode: initial.centerOffset.mode === 'norm' ? 'norm' : 'px',
            anchor: initial.centerOffset.anchor || 'center'
          }
        : null
    };
    this.items.set(id, record);
    if (record.centerOffset) {
      this._applyCenterOffset(record);
    }
    this._syncVisibility(record);
    return record;
  }

  _onFlow(snap) {
    this.activeSlide = snap.value;
    this.items.forEach(item => this._syncVisibility(item));
  }

  _syncVisibility(item) {
    const shouldShow = item.slides.has(this.activeSlide);
    if (shouldShow) {
      gsap.to(item.el, { autoAlpha: 1, duration: 0.5 });
    } else {
      gsap.to(item.el, { autoAlpha: 0, duration: 0.3, onComplete: () => {
        if (!item.slides.has(this.activeSlide)) {
          item.el.style.visibility = 'hidden';
        }
      }});
    }
  }

  update() {
    this.items.forEach(item => {
      if (!item.slides.has(this.activeSlide)) return;
      if (item.centerOffset) {
        this._applyCenterOffset(item);
      }
      // parallax calc
      const { strengthX, strengthY, lerp } = item.parallax;
      const targetX = (this.mouse.x - 0.5) * strengthX;
      const targetY = -(this.mouse.y - 0.5) * strengthY;
      item.currentOffset.x += (targetX - item.currentOffset.x) * lerp;
      item.currentOffset.y += (targetY - item.currentOffset.y) * lerp;
      item.el.style.transform = `translate3d(${item.currentOffset.x}px, ${ item.currentOffset.y }px,0)`;
      item.el.style.visibility = 'visible';
    });
  }

  _applyCenterOffset(item) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const { x, y, mode, anchor } = item.centerOffset;
    let dx = mode === 'norm' ? x * w : x;
    let dy = mode === 'norm' ? y * h : y;
    let left = w / 2 + dx;
    let top = h / 2 + dy;
    if (anchor === 'center') {
      left -= item.el.offsetWidth / 2;
      top  -= item.el.offsetHeight / 2;
    }
    item.el.style.left = left + 'px';
    item.el.style.top  = top + 'px';
  }

  _onResize() {
    this.items.forEach(item => {
      if (item.centerOffset) this._applyCenterOffset(item);
    });
  }
}
