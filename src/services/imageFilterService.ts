import { ImageFilterType } from '../types';

/**
 * Apply real-time visual filter to a canvas using pixel manipulation
 */
export function applyImageFilterToCanvas(
  canvas: HTMLCanvasElement,
  filterType: ImageFilterType = 'none'
): void {
  if (filterType === 'none' || !filterType) return;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  if (width === 0 || height === 0) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = data.length;

  if (filterType === 'grayscale') {
    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
  } else if (filterType === 'clean-scan') {
    // 1. Calculate average luminance and histogram sample
    let sumLuma = 0;
    const step = 8; // Sample for speed
    let sampleCount = 0;

    for (let i = 0; i < len; i += 4 * step) {
      const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sumLuma += luma;
      sampleCount++;
    }

    const avgLuma = sampleCount > 0 ? sumLuma / sampleCount : 128;
    // Dynamic white threshold based on background brightness
    const whiteThreshold = Math.min(225, Math.max(140, avgLuma * 0.88));
    const blackThreshold = Math.max(45, whiteThreshold * 0.45);

    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;

      let out: number;
      if (luma >= whiteThreshold) {
        out = 255; // Clean paper background
      } else if (luma <= blackThreshold) {
        out = 0; // Dark ink
      } else {
        // High contrast ramp
        const norm = (luma - blackThreshold) / (whiteThreshold - blackThreshold);
        out = Math.pow(norm, 1.6) * 255;
      }

      data[i] = out;
      data[i + 1] = out;
      data[i + 2] = out;
    }
  } else if (filterType === 'high-contrast') {
    const contrastFactor = 1.6; // High contrast punch
    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Stretch around midpoint 128
      let val = (gray - 128) * contrastFactor + 128;
      val = Math.max(0, Math.min(255, val));

      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
  } else if (filterType === 'invert') {
    for (let i = 0; i < len; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
