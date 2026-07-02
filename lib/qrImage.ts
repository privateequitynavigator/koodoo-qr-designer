// Shared QR image rasterisation logic used by both the Single-tab uploader
// (QRDesigner.tsx) and the Batch Export uploader (BatchExport.tsx).
//
// Some QR export tools — including KooDoo's own "qr-generic-…" export —
// pad the PNG with extra transparent canvas above/below the actual QR
// code (e.g. a 512×567 file where only the top ~430px is the real QR
// matrix). Left untouched, that padding gets baked into the rasterised
// 512×512 PNG as wasted space, making the QR render smaller than the
// card's QR box. This detects the real content bounds first and crops to
// those before scaling up, so the code always fills the box.
//
// Detection works by measuring, per row/column, what fraction of pixels
// are opaque. Real QR content (including its own white quiet zone) is
// fully opaque across its whole width; padding is transparent. A file
// with no padding (e.g. a plain qr_01.png) will have ~100% coverage
// everywhere, so this is a no-op for those — safe to apply universally.

const OUTPUT_SIZE = 512;
const COVERAGE_THRESHOLD = 0.5; // row/col counts as "real content" above this opacity coverage

function findContentBounds(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const { data } = ctx.getImageData(0, 0, width, height);

  const rowCoverage = (y: number) => {
    let opaque = 0;
    const rowStart = y * width * 4;
    for (let x = 0; x < width; x++) {
      if (data[rowStart + x * 4 + 3] > 10) opaque++;
    }
    return opaque / width;
  };
  const colCoverage = (x: number) => {
    let opaque = 0;
    for (let y = 0; y < height; y++) {
      if (data[(y * width + x) * 4 + 3] > 10) opaque++;
    }
    return opaque / height;
  };

  let top = 0;
  let bottom = height - 1;
  let left = 0;
  let right = width - 1;

  while (top < bottom && rowCoverage(top) < COVERAGE_THRESHOLD) top++;
  while (bottom > top && rowCoverage(bottom) < COVERAGE_THRESHOLD) bottom--;
  while (left < right && colCoverage(left) < COVERAGE_THRESHOLD) left++;
  while (right > left && colCoverage(right) < COVERAGE_THRESHOLD) right--;

  // Sanity fallback — if detection collapses to something implausibly small,
  // trust the original image instead of risking a broken crop.
  if (right - left < width * 0.3 || bottom - top < height * 0.3) {
    return { sx: 0, sy: 0, sw: width, sh: height };
  }

  return { sx: left, sy: top, sw: right - left + 1, sh: bottom - top + 1 };
}

/**
 * Reads a QR image file, trims any wasted transparent margin around the
 * actual QR code, and returns a clean 512×512 PNG data URL ready to drop
 * into the card's QR box.
 */
export function rasteriseQrImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onerror = () => resolve(dataUrl); // fallback: use as-is if decoding fails
      img.onload = () => {
        try {
          const srcCanvas = document.createElement("canvas");
          srcCanvas.width = img.naturalWidth;
          srcCanvas.height = img.naturalHeight;
          const srcCtx = srcCanvas.getContext("2d");
          if (!srcCtx) { resolve(dataUrl); return; }
          srcCtx.drawImage(img, 0, 0);

          const { sx, sy, sw, sh } = findContentBounds(srcCtx, srcCanvas.width, srcCanvas.height);

          const outCanvas = document.createElement("canvas");
          outCanvas.width  = OUTPUT_SIZE;
          outCanvas.height = OUTPUT_SIZE;
          const outCtx = outCanvas.getContext("2d");
          if (!outCtx) { resolve(dataUrl); return; }
          // White backing first — the source may have transparent gaps within
          // its own bounds (e.g. between finder patterns in some exports).
          outCtx.fillStyle = "#FFFFFF";
          outCtx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
          outCtx.drawImage(img, sx, sy, sw, sh, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

          resolve(outCanvas.toDataURL("image/png"));
        } catch {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}