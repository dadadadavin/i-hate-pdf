import { CropRect } from '../types';

/**
 * Load an image Blob into an HTMLImageElement
 */
export function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Generate a thumbnail and dimensions for an image file
 */
export async function processImageFile(
  blob: Blob,
  maxThumbnailWidth = 320
): Promise<{ thumbnailUrl: string; width: number; height: number }> {
  const img = await loadImageFromBlob(blob);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const scale = Math.min(1, maxThumbnailWidth / width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);

  return { thumbnailUrl, width, height };
}

/**
 * Render plain text or CSV into a crisp page preview
 */
export async function renderTextToThumbnail(
  text: string,
  width = 600,
  height = 800
): Promise<{ thumbnailUrl: string; width: number; height: number; blob: Blob }> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Border guide
  ctx.strokeStyle = '#e5e5e5';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Text setup
  ctx.fillStyle = '#000000';
  ctx.font = '14px ui-monospace, Menlo, Monaco, monospace';
  const lineHeight = 20;
  const marginX = 40;
  const marginY = 50;

  const lines = text.split('\n');
  let y = marginY;
  const maxLines = Math.floor((height - marginY * 2) / lineHeight);

  for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
    const line = lines[i].length > 60 ? lines[i].substring(0, 57) + '...' : lines[i];
    ctx.fillText(line, marginX, y);
    y += lineHeight;
  }

  if (lines.length > maxLines) {
    ctx.fillStyle = '#888888';
    ctx.font = 'italic 12px sans-serif';
    ctx.fillText(`... +${lines.length - maxLines} more lines`, marginX, y + 5);
  }

  const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
  });

  return { thumbnailUrl, width, height, blob };
}

/**
 * Apply crop and rotation to any canvas or image element
 */
export function applyCropAndRotationToCanvas(
  source: HTMLCanvasElement | HTMLImageElement,
  rotation = 0,
  crop?: CropRect,
  maxDpiScale = 1.0
): HTMLCanvasElement {
  const srcWidth = 'naturalWidth' in source ? source.naturalWidth : source.width;
  const srcHeight = 'naturalHeight' in source ? source.naturalHeight : source.height;

  // Step 1: calculate cropped region
  let cropX = 0;
  let cropY = 0;
  let cropW = srcWidth;
  let cropH = srcHeight;

  if (crop) {
    cropX = Math.round(crop.x * srcWidth);
    cropY = Math.round(crop.y * srcHeight);
    cropW = Math.round(crop.width * srcWidth);
    cropH = Math.round(crop.height * srcHeight);
  }

  // Step 2: intermediate cropped canvas
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) throw new Error('Canvas context error');

  cropCtx.fillStyle = '#ffffff';
  cropCtx.fillRect(0, 0, cropW, cropH);
  cropCtx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  // Step 3: Handle rotation and DPI scaling
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const isRotated90or270 = normalizedRotation === 90 || normalizedRotation === 270;

  const targetW = Math.round((isRotated90or270 ? cropH : cropW) * maxDpiScale);
  const targetH = Math.round((isRotated90or270 ? cropW : cropH) * maxDpiScale);

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = Math.max(1, targetW);
  finalCanvas.height = Math.max(1, targetH);
  const finalCtx = finalCanvas.getContext('2d');
  if (!finalCtx) throw new Error('Final canvas context error');

  finalCtx.fillStyle = '#ffffff';
  finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

  finalCtx.save();
  finalCtx.translate(finalCanvas.width / 2, finalCanvas.height / 2);
  finalCtx.rotate((normalizedRotation * Math.PI) / 180);
  finalCtx.scale(maxDpiScale, maxDpiScale);

  finalCtx.drawImage(
    cropCanvas,
    -cropW / 2,
    -cropH / 2,
    cropW,
    cropH
  );
  finalCtx.restore();

  return finalCanvas;
}

/**
 * Convert canvas to Blob with quality and MIME type
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'image/jpeg' | 'image/png' | 'image/webp',
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate image blob'));
      },
      format,
      quality
    );
  });
}
