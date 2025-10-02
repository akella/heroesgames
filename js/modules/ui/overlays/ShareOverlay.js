import gsap from "gsap";
import shareBorderUrl from "/assets/picture-border.png?url";
import {
  captureRoom,
  downloadBlob,
} from "../../interactions/managers/captureRoom.js";

export function initShareOverlay({
  buttonSelector = ".btn-icon-circle--spark",
  overlaySelector = "#share-overlay",
} = {}) {
  const button = document.querySelector(buttonSelector);
  const overlay = document.querySelector(overlaySelector);
  if (!overlay || !button) {
    return { open: () => {}, close: () => {}, toggle: () => {} };
  }

  const panel = overlay.querySelector(".share-overlay__panel");
  const closeBtn = overlay.querySelector(".share-overlay__close");
  const previewImg = overlay.querySelector(".share-preview__img");
  const previewBorder = overlay.querySelector(".share-preview__border");
  const downloadBtn = overlay.querySelector(".share-download");
  const socialButtons = overlay.querySelectorAll(".share-social");

  let lastCapture = null; // { blob, url, width, height, mime }

  let tl;
  let prevOverflow = "";
  function open() {
    overlay.hidden = false;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    try {
      if (tl) tl.kill();
      tl = gsap.timeline();
      tl.fromTo(
        overlay,
        { opacity: 0 },
        { opacity: 1, duration: 0.28, ease: "power2.out" }
      );
      if (panel)
        tl.fromTo(
          panel,
          { y: 10, opacity: 0.9 },
          { y: 0, opacity: 1, duration: 0.28, ease: "power3.out" },
          "<"
        );
      // Defer capture by one animation frame to ensure overlay isn't in frame
      requestAnimationFrame(() => {
        generatePreview().catch(() => {});
      });
    } catch {}
  }
  function close() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
    document.body.style.overflow = prevOverflow;
  }
  function toggle() {
    if (overlay.classList.contains("is-open")) close();
    else open();
  }

  const onButton = (e) => {
    e.preventDefault();
    open();
  };
  const onClose = (e) => {
    e.preventDefault();
    close();
  };
  const onBackdrop = (e) => {
    if (e.target === overlay) close();
  };
  const onEsc = (e) => {
    if (e.key === "Escape") close();
  };
  button.addEventListener("click", onButton);
  closeBtn && closeBtn.addEventListener("click", onClose);
  overlay.addEventListener("click", onBackdrop);
  window.addEventListener("keydown", onEsc);

  async function generatePreview() {
    // Close/hide UI noise via event and CSS class
    try {
      window?.dispatchEvent?.(new CustomEvent("ui-before-capture"));
    } catch {}
    const body = document.body;
    const prevClass = body.className;
    if (!/\bis-capturing\b/.test(prevClass)) body.classList.add("is-capturing");

    // Wait a frame for layout to settle
    await new Promise((r) => requestAnimationFrame(r));
    let cap = null;
    try {
      cap = await captureRoom({ mime: "image/png", scale: 1 });
      lastCapture = cap;
      if (previewImg) previewImg.src = cap.url;
      if (previewBorder) {
        const frame = previewBorder.closest(".share-preview__frame");
        const src = frame?.getAttribute("data-border-src") || shareBorderUrl;
        if (src) previewBorder.src = src;
      }
    } catch (e) {
      // noop, leave lastCapture if present
    } finally {
      // Restore UI visibility
      body.classList.remove("is-capturing");
    }
    return cap;
  }

  // Hook download button
  if (downloadBtn) {
    downloadBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        const cap = lastCapture || (await generatePreview());
        const blob = cap?.blob; // Download raw capture without border
        if (blob) {
          const ts = new Date();
          const pad = (n) => String(n).padStart(2, "0");
          const name = `room-${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(
            ts.getDate()
          )}-${pad(ts.getHours())}${pad(ts.getMinutes())}.png`;
          await downloadBlob(blob, name);
        }
      } catch {}
    });
  }

  // Hook social buttons
  if (socialButtons && socialButtons.length) {
    socialButtons.forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          const network = detectNetwork(btn);
          const shareText = "Моя кімната";
          const targetUrl = "https://holukr.org/";
          let preOpened = false;
          if (!navigator.share) {
            preOpened = openShareWindow(network, shareText, targetUrl);
          }

          const shared = await shareLinkWebShareOnly({
            url: targetUrl,
            title: "Моя кімната",
            text: "Поділитися",
          });
          if (!shared && !preOpened) {
            openShareWindow(network, shareText, targetUrl);
          }
        } catch {}
      });
    });
  }

  return { open, close, toggle };

  async function buildExportFromPreview(cap) {
    try {
      const imgSrc = cap?.url || previewImg?.src;
      const borderSrc = previewBorder?.src;
      if (!imgSrc) return null;
      const targetW = 460;
      const targetH = 250;
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      const img = await loadImage(imgSrc);
      const scale = Math.max(
        targetW / img.naturalWidth,
        targetH / img.naturalHeight
      );
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      const dx = (targetW - dw) / 2;
      const dy = (targetH - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
      if (borderSrc) {
        try {
          const borderImg = await loadImage(borderSrc);
          ctx.drawImage(borderImg, 0, 0, targetW, targetH);
        } catch {}
      }
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      return blob;
    } catch {
      return cap?.blob || null;
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = src;
    });
  }

  function detectNetwork(btn) {
    // Prefer explicit data-network, else infer from label/aria with mapping (supports ua/ru words)
    const attr = btn.getAttribute("data-network");
    if (attr) return attr.toLowerCase();
    const mapTextToNetwork = (t) => {
      const s = (t || "").toLowerCase();
      if (s === "x" || s.includes("twitter")) return "x";
      if (s.includes("facebook") || s === "fb") return "facebook";
      if (s.includes("tiktok") || s.includes("tik tok") || s.includes("тікток"))
        return "tiktok";
      if (
        s.includes("mail") ||
        s.includes("email") ||
        s.includes("e-mail") ||
        s.includes("пошта") ||
        s.includes("почта")
      )
        return "mail";
      return "generic";
    };
    const label = btn.parentElement
      ?.querySelector?.(".share-social__label")
      ?.textContent?.trim();
    if (label) return mapTextToNetwork(label);
    const aria = btn.getAttribute("aria-label")?.trim();
    return mapTextToNetwork(aria);
  }

  function openShareWindow(network, text, url) {
    try {
      let shareUrl = null;
      const t = encodeURIComponent(text || "");
      const u = encodeURIComponent(url || window.location.href);
      switch ((network || "").toLowerCase()) {
        case "x":
        case "twitter":
          shareUrl = `https://x.com/intent/tweet?text=${t}&url=${u}`;
          break;
        case "facebook":
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${u}`;
          break;
        case "tiktok":
          shareUrl = `https://www.tiktok.com/`;
          break;
        case "mail":
        case "email":
          shareUrl = `mailto:?subject=${encodeURIComponent(text)}&body=${u}`;
          break;
        default:
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${u}`;
      }
      if (shareUrl) {
        window.open(
          shareUrl,
          "_blank",
          "noopener,noreferrer,width=640,height=680"
        );
        return true;
      }
    } catch {}
    return false;
  }

  async function shareWithWebShareOnly(blob, { title, text } = {}) {
    try {
      const type = blob?.type || "image/png";
      const file = new File([blob], "room.png", { type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title, text });
        return true;
      }
    } catch {}
    return false;
  }

  async function shareLinkWebShareOnly({ url, title, text } = {}) {
    try {
      if (navigator.share) {
        await navigator.share({ url, title, text });
        return true;
      }
    } catch {}
    return false;
  }
}
