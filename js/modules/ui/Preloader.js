export class Preloader {
  constructor({ bus }) {
    this.bus = bus;
    this.assets = {
      video: "./assets/preloader/preloader.webm",
      images: [
        "./assets/preloader/background-preloader.png",
        "./assets/preloader/heroes-logo-img.png",
      ],
    };
    this.state = {
      videoProgress: 0,
      duration: 0,
      assetsLoaded: 0,
      assetsTotal: 0,
    };
    this.displayProgress = 0;
    this.targetProgress = 0;
    this._rafId = null;
    this._buildDOM();
    this._bind();
    this._start();
  }

  _buildDOM() {
    this.root = document.getElementById("preloader");
    this.videoEl = this.root.querySelector("#preloaderVideo");
    this.percentEl = this.root.querySelector("#preloaderPercent");
    this.btnEl = this.root.querySelector("#preloaderBtn");
    this.heroEl = this.root.querySelector("#preloaderHero");
  }

  _bind() {
    this.btnEl?.addEventListener("click", () => this.finish());

    if (this.videoEl) {
      this.videoEl.addEventListener("loadedmetadata", () => {
        this.state.duration = isFinite(this.videoEl.duration)
          ? this.videoEl.duration
          : 0;
      });
      this.videoEl.addEventListener("progress", () => this._updateBufferedProgress());
      this.videoEl.addEventListener("timeupdate", () => this._updateBufferedProgress());
      this.videoEl.addEventListener("canplay", () => {
        this.videoEl.play().catch(() => {});
      });
      this.videoEl.addEventListener("canplaythrough", () => {
        this.state.videoProgress = Math.max(this.state.videoProgress, 0.95);
        this._updateTargetProgress();
      });
      this.videoEl.addEventListener("ended", () => {
        this._showFinalImages();
      });
    }
  }

  _start() {
    try {
      this.bus?.emit?.("scene.canvas", { visible: false });
    } catch {}

    if (this.videoEl && !this.videoEl.src) {
      this.videoEl.src = this.assets.video;
    }

    const urls = this._collectAssetUrls();
    this.state.assetsTotal = urls.length;
    this._preloadImageList(urls);

    this._modulePreload([
      "/js/games/finddiff/index.js",
      "/js/games/puzzle/index.js",
      "/js/games/wordbox/index.js",
      "/js/games/football/index.js",
    ]);

    this._updateBufferedProgress();
    this._startTick();
  }

  _renderProgress(pct) {
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    if (this.percentEl) this.percentEl.textContent = clamped + "%";
  }

  _updateBufferedProgress() {
    if (!this.videoEl) return;
    const v = this.videoEl;
    const duration = isFinite(v.duration) ? v.duration : this.state.duration;
    if (!duration || !v.buffered || v.buffered.length === 0) {
      this.state.videoProgress = Math.min(0.9, this.state.videoProgress + 0.01);
      this._updateTargetProgress();
      return;
    }
    const end = v.buffered.end(v.buffered.length - 1);
    const pct = Math.max(0, Math.min(1, end / duration));
    this.state.videoProgress = pct;
    this._updateTargetProgress();
  }

  _collectAssetUrls() {
    try {
      const set = new Set();
      const imgNodes = Array.from(document.querySelectorAll("img"));
      for (const el of imgNodes) {
        const dsrc = el.getAttribute("data-src");
        const src = el.getAttribute("src");
        if (dsrc && !/^data:/.test(dsrc)) set.add(dsrc);
        if (src && !/^data:/.test(src)) set.add(src);
      }
      const sources = Array.from(document.querySelectorAll("source"));
      for (const s of sources) {
        const srcset = s.getAttribute("srcset") || s.getAttribute("src");
        if (srcset && !/^data:/.test(srcset)) set.add(srcset);
      }
      const urls = Array.from(set).filter((u) => /^(\.|\/|assets\/).*/.test(u));
      return urls;
    } catch {
      return [];
    }
  }

  _preloadImageList(urls) {
    if (!urls || urls.length === 0) return Promise.resolve();
    let loaded = 0;
    return Promise.all(
      urls.map(
        (u) =>
          new Promise((resolve) => {
            const img = new Image();
            const done = () => {
              loaded += 1;
              this.state.assetsLoaded = loaded;
              this._updateTargetProgress();
              resolve(true);
            };
            img.onload = done;
            img.onerror = done;
            img.src = u;
          })
      )
    );
  }

  _modulePreload(paths) {
    const head = document.head || document.getElementsByTagName("head")[0];
    paths.forEach((href) => {
      try {
        const link = document.createElement("link");
        link.rel = "modulepreload";
        link.href = href;
        head.appendChild(link);
      } catch {}
    });
  }

  _updateTargetProgress() {
    const assetsPart = this.state.assetsTotal
      ? this.state.assetsLoaded / this.state.assetsTotal
      : 0;
    const videoPart = this.state.videoProgress || 0;
    const total = Math.max(0, Math.min(1, 0.5 * videoPart + 0.5 * assetsPart));
    this.targetProgress = total;
  }

  _startTick() {
    const step = () => {
      const t = this.targetProgress;
      const alpha = 0.15;
      this.displayProgress += (t - this.displayProgress) * alpha;
      if (this.displayProgress < t) {
        this.displayProgress = Math.min(t, this.displayProgress + 0.001);
      }
      this._renderProgress(this.displayProgress * 100);
      this._rafId = requestAnimationFrame(step);
    };
    if (!this._rafId) this._rafId = requestAnimationFrame(step);
  }

  _showFinalImages() {
    if (!this.assets.images || this.assets.images.length < 2) return;
    const [bgSrc, heroSrc] = this.assets.images;
    if (bgSrc) {
      this.root.style.backgroundImage = `url("${bgSrc}")`;
      this.root.style.backgroundSize = "cover";
      this.root.style.backgroundPosition = "center";
    }
    if (heroSrc && this.heroEl) {
      this.heroEl.src = heroSrc;
      this.heroEl.style.display = "block";
      this.heroEl.style.opacity = "1";
      this.heroEl.style.zIndex = "2";
      this.heroEl.removeAttribute("aria-hidden");
    }
    this.root.classList.add("is-final");
    if (this.percentEl) this.percentEl.style.display = "none";
    if (this.btnEl) {
      this.btnEl.hidden = false;
      this.btnEl.style.display = "inline-flex";
      this.btnEl.style.visibility = "visible";
      this.btnEl.style.opacity = "1";
    }
    this.targetProgress = 1;
  }

  finish() {
    this.root.classList.add("is-hidden");
    setTimeout(() => {
      this.root?.remove();
      try {
        this.bus?.emit?.("preloader.done");
        this.bus?.emit?.("scene.canvas", { visible: true });
      } catch {}
    }, 400);
  }
}
