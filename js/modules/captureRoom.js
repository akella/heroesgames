// Utilities to capture the current room rendering (bg + fg WebGL canvases)

const getCanvases = () => {
  const bg = document.querySelector(".gl-canvas--bg");
  const fg = document.querySelector(".gl-canvas--fg");
  if (!bg || !fg) throw new Error("Room canvases not found");
  return { bg, fg };
};

export async function captureRoom({
  mime = "image/png",
  quality,
  scale = 1,
} = {}) {
  const { bg, fg } = getCanvases();
  const w = Math.max(bg.width || 0, fg.width || 0) || bg.clientWidth || 0;
  const h = Math.max(bg.height || 0, fg.height || 0) || bg.clientHeight || 0;
  if (!w || !h) throw new Error("Invalid canvas size");

  const outW = Math.max(1, Math.round(w * scale));
  const outH = Math.max(1, Math.round(h * scale));
  const off = document.createElement("canvas");
  off.width = outW;
  off.height = outH;
  const ctx = off.getContext("2d", { willReadFrequently: false });
  if (!ctx) throw new Error("2D context unavailable");
  ctx.drawImage(bg, 0, 0, w, h, 0, 0, outW, outH);
  ctx.drawImage(fg, 0, 0, w, h, 0, 0, outW, outH);

  try {
    const filterEl = document.querySelector(".scene-filter");
    if (filterEl) {
      const cs = getComputedStyle(filterEl);
      const op = Math.max(0, Math.min(1, parseFloat(cs.opacity) || 0));
      const blend = (cs.mixBlendMode || "").trim();
      if (op > 0) {
        const prevGCO = ctx.globalCompositeOperation;
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "saturation";
        if (
          ctx.globalCompositeOperation === "saturation" &&
          (blend === "saturation" || blend === "")
        ) {
          ctx.fillStyle = `rgba(255,255,255,${op})`;
          ctx.fillRect(0, 0, outW, outH);
        } else {
          const tmp = document.createElement("canvas");
          tmp.width = outW;
          tmp.height = outH;
          const tctx = tmp.getContext("2d");
          tctx.drawImage(off, 0, 0);
          ctx.globalCompositeOperation = "source-over";
          ctx.clearRect(0, 0, outW, outH);
          const sat = Math.max(0, 1 - op); // 0..1
          const prevFilter = ctx.filter;
          ctx.filter = `saturate(${sat})`;
          ctx.drawImage(tmp, 0, 0);
          ctx.filter = prevFilter || "none";
        }
        ctx.globalCompositeOperation = prevGCO;
      }
    }
  } catch {}

  const blob = await new Promise((resolve, reject) => {
    try {
      off.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        mime,
        quality
      );
    } catch (e) {
      try {
        const dataUrl = off.toDataURL(mime, quality);
        const b = dataURLToBlob(dataUrl);
        resolve(b);
      } catch (e2) {
        reject(e2);
      }
    }
  });

  const url = URL.createObjectURL(blob);
  return { blob, url, width: outW, height: outH, mime };
}

export function revokeObjectUrlSafe(url) {
  try {
    if (url) URL.revokeObjectURL(url);
  } catch {}
}

export async function downloadBlob(blob, filename = "room.png") {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  const supportsDownload = "download" in HTMLAnchorElement.prototype;
  if (!supportsDownload) {
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => revokeObjectUrlSafe(url), 2000);
    return;
  }
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => revokeObjectUrlSafe(url), 0);
}

export async function shareImageBlob(
  blob,
  { title = "Моя кімната", text = "Поділюся своєю кімнатою" } = {}
) {
  try {
    const file = new File([blob], "room.png", {
      type: blob.type || "image/png",
    });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title, text });
      return true;
    }
  } catch {}
  // Try Clipboard API
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const item = new ClipboardItem({ [blob.type || "image/png"]: blob });
      await navigator.clipboard.write([item]);
      return "copied";
    }
  } catch {}
  return false;
}

function dataURLToBlob(dataUrl) {
  const [meta, data] = dataUrl.split(",");
  const mime = /data:([^;]+);/.exec(meta)?.[1] || "image/png";
  const bin = atob(data);
  const len = bin.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
