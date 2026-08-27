import { PageItem, PageLayoutOptions, PageNumberingOptions, WatermarkOptions } from '../types';
import { STANDARD_PAPER_SIZES } from '../constants/paper';
import { applyImageFilterToCanvas } from './imageFilterService';

export { STANDARD_PAPER_SIZES } from '../constants/paper';

export interface PageGeometry {
  paperWidth: number; // PDF points
  paperHeight: number; // PDF points
  printableX: number;
  printableY: number;
  printableWidth: number;
  printableHeight: number;
  drawX: number; // Coordinates on paper
  drawY: number;
  drawWidth: number;
  drawHeight: number;
  contentAspect: number;
  paperAspect: number;
  isClipped: boolean;
  scale: number;
}

/**
 * Calculates exact placement and sheet geometry.
 * Used identically for UI preview rendering and final PDF document generation.
 */
export function calculatePageGeometry(
  contentWidth: number,
  contentHeight: number,
  rotation = 0,
  crop?: { x: number; y: number; width: number; height: number },
  layout: PageLayoutOptions = {
    format: 'a4',
    orientation: 'portrait',
    sizingMode: 'fit',
    marginPt: 0,
  }
): PageGeometry {
  let effectiveW = contentWidth || 600;
  let effectiveH = contentHeight || 800;

  if (crop) {
    effectiveW = Math.max(1, crop.width * effectiveW);
    effectiveH = Math.max(1, crop.height * effectiveH);
  }

  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const isRotated90or270 = normalizedRotation === 90 || normalizedRotation === 270;
  const rotatedContentW = isRotated90or270 ? effectiveH : effectiveW;
  const rotatedContentH = isRotated90or270 ? effectiveW : effectiveH;
  const contentAspect = rotatedContentW / rotatedContentH;

  let paperW = 595.28;
  let paperH = 841.89;

  if (layout.format === 'original') {
    paperW = rotatedContentW + (layout.marginPt || 0) * 2;
    paperH = rotatedContentH + (layout.marginPt || 0) * 2;
  } else if (layout.format === 'custom' && layout.customWidthPt && layout.customHeightPt) {
    paperW = layout.customWidthPt;
    paperH = layout.customHeightPt;
  } else {
    const key = layout.format as keyof typeof STANDARD_PAPER_SIZES;
    const std = (STANDARD_PAPER_SIZES[key] as { width: number; height: number } | undefined) ?? STANDARD_PAPER_SIZES.a4;
    const baseW = std.width;
    const baseH = std.height;

    if (layout.orientation === 'landscape') {
      paperW = Math.max(baseW, baseH);
      paperH = Math.min(baseW, baseH);
    } else if (layout.orientation === 'portrait') {
      paperW = Math.min(baseW, baseH);
      paperH = Math.max(baseW, baseH);
    } else {
      if (contentAspect >= 1.0) {
        paperW = Math.max(baseW, baseH);
        paperH = Math.min(baseW, baseH);
      } else {
        paperW = Math.min(baseW, baseH);
        paperH = Math.max(baseW, baseH);
      }
    }
  }

  const paperAspect = paperW / paperH;

  const margin = Math.min(layout.marginPt || 0, Math.min(paperW, paperH) / 3);
  const printableX = margin;
  const printableY = margin;
  const printableWidth = Math.max(1, paperW - margin * 2);
  const printableHeight = Math.max(1, paperH - margin * 2);

  let drawX = printableX;
  let drawY = printableY;
  let drawWidth = printableWidth;
  let drawHeight = printableHeight;
  let isClipped = false;
  let scale = 1.0;

  if (layout.sizingMode === 'fit') {
    const scaleX = printableWidth / rotatedContentW;
    const scaleY = printableHeight / rotatedContentH;
    scale = Math.min(scaleX, scaleY);
    drawWidth = rotatedContentW * scale;
    drawHeight = rotatedContentH * scale;
    drawX = printableX + (printableWidth - drawWidth) / 2;
    drawY = printableY + (printableHeight - drawHeight) / 2;
  } else if (layout.sizingMode === 'fill') {
    const scaleX = printableWidth / rotatedContentW;
    const scaleY = printableHeight / rotatedContentH;
    scale = Math.max(scaleX, scaleY);
    drawWidth = rotatedContentW * scale;
    drawHeight = rotatedContentH * scale;
    drawX = printableX + (printableWidth - drawWidth) / 2;
    drawY = printableY + (printableHeight - drawHeight) / 2;
    isClipped = drawWidth > printableWidth || drawHeight > printableHeight;
  } else if (layout.sizingMode === 'stretch') {
    drawWidth = printableWidth;
    drawHeight = printableHeight;
    drawX = printableX;
    drawY = printableY;
  } else {
    scale = 1.0;
    drawWidth = rotatedContentW;
    drawHeight = rotatedContentH;
    drawX = printableX + (printableWidth - drawWidth) / 2;
    drawY = printableY + (printableHeight - drawHeight) / 2;
    isClipped = drawWidth > printableWidth || drawHeight > printableHeight;
  }

  return {
    paperWidth: paperW,
    paperHeight: paperH,
    printableX,
    printableY,
    printableWidth,
    printableHeight,
    drawX,
    drawY,
    drawWidth,
    drawHeight,
    contentAspect,
    paperAspect,
    isClipped,
    scale,
  };
}

/**
 * Render a complete WYSIWYG sheet on an HTML5 canvas.
 */
export function drawWysiwygPageToCanvas(
  sourceCanvasOrImage: HTMLCanvasElement | HTMLImageElement,
  page: PageItem,
  targetCanvas: HTMLCanvasElement,
  options: {
    showMarginGuides?: boolean;
    scaleMultiplier?: number;
    pageIndex?: number;
    totalPages?: number;
    numbering?: PageNumberingOptions;
    watermark?: WatermarkOptions;
  } = {}
) {
  const geom = calculatePageGeometry(
    page.width,
    page.height,
    page.rotation,
    page.crop,
    page.layout
  );

  const scale = options.scaleMultiplier || 1.0;
  const canvasW = Math.max(1, Math.round(geom.paperWidth * scale));
  const canvasH = Math.max(1, Math.round(geom.paperHeight * scale));

  targetCanvas.width = canvasW;
  targetCanvas.height = canvasH;

  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  // 1. Draw Paper Sheet Background (Pure White)
  ctx.fillStyle = page.layout.backgroundColor || '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // 2. Draw Optional Margin Guide
  if (options.showMarginGuides && page.layout.marginPt > 0) {
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(
      geom.printableX * scale,
      geom.printableY * scale,
      geom.printableWidth * scale,
      geom.printableHeight * scale
    );
    ctx.setLineDash([]);
  }

  // 3. Prepare content (cropped)
  const srcW = 'naturalWidth' in sourceCanvasOrImage ? sourceCanvasOrImage.naturalWidth : sourceCanvasOrImage.width;
  const srcH = 'naturalHeight' in sourceCanvasOrImage ? sourceCanvasOrImage.naturalHeight : sourceCanvasOrImage.height;

  let cropX = 0;
  let cropY = 0;
  let cropW = srcW;
  let cropH = srcH;

  if (page.crop) {
    cropX = Math.round(page.crop.x * srcW);
    cropY = Math.round(page.crop.y * srcH);
    cropW = Math.round(page.crop.width * srcW);
    cropH = Math.round(page.crop.height * srcH);
  }

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = Math.max(1, cropW);
  cropCanvas.height = Math.max(1, cropH);
  const cropCtx = cropCanvas.getContext('2d');
  if (cropCtx) {
    cropCtx.fillStyle = '#ffffff';
    cropCtx.fillRect(0, 0, cropW, cropH);
    cropCtx.drawImage(sourceCanvasOrImage, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    // Apply Real-time Image Filter (Clean Scan, Grayscale, High Contrast, Invert)
    if (page.filter && page.filter !== 'none') {
      applyImageFilterToCanvas(cropCanvas, page.filter);
    }
  }

  // 4. Clip to printable area
  ctx.save();
  ctx.beginPath();
  ctx.rect(
    geom.printableX * scale,
    geom.printableY * scale,
    geom.printableWidth * scale,
    geom.printableHeight * scale
  );
  ctx.clip();

  // 5. Position and draw content on sheet
  const destX = geom.drawX * scale;
  const destY = geom.drawY * scale;
  const destW = geom.drawWidth * scale;
  const destH = geom.drawHeight * scale;

  ctx.save();
  ctx.translate(destX + destW / 2, destY + destH / 2);
  const rot = ((page.rotation % 360) + 360) % 360;
  ctx.rotate((rot * Math.PI) / 180);

  const isRot90 = rot === 90 || rot === 270;
  const drawContentW = isRot90 ? destH : destW;
  const drawContentH = isRot90 ? destW : destH;

  ctx.drawImage(
    cropCanvas,
    -drawContentW / 2,
    -drawContentH / 2,
    drawContentW,
    drawContentH
  );
  ctx.restore();
  ctx.restore(); // Restore clip

  // 6. Draw Optional Watermark
  if (options.watermark && options.watermark.enabled && options.watermark.text) {
    drawWatermark(ctx, canvasW, canvasH, scale, options.watermark);
  }

  // 7. Draw Optional Page Numbering Stamp
  if (
    options.numbering &&
    options.numbering.enabled &&
    options.pageIndex !== undefined &&
    options.totalPages !== undefined
  ) {
    drawPageNumbering(
      ctx,
      canvasW,
      canvasH,
      scale,
      options.pageIndex,
      options.totalPages,
      options.numbering
    );
  }
}

function drawWatermark(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  scale: number,
  wm: WatermarkOptions
) {
  ctx.save();
  ctx.translate(canvasW / 2, canvasH / 2);
  ctx.rotate(((wm.rotationDeg || -45) * Math.PI) / 180);

  const fontSize = (wm.fontSizePt || 48) * scale;
  ctx.font = `900 ${fontSize}px monospace`;
  ctx.fillStyle = `rgba(0, 0, 0, ${wm.opacity || 0.15})`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(wm.text.toUpperCase(), 0, 0);

  ctx.restore();
}

function drawPageNumbering(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  scale: number,
  pageIndex: number,
  totalPages: number,
  num: PageNumberingOptions
) {
  const currentNum = (num.startNumber || 1) + pageIndex;
  let text = `${currentNum}`;
  if (num.format === 'page-n-of-total') {
    text = `Page ${currentNum} of ${totalPages}`;
  } else if (num.format === 'page-n') {
    text = `Page ${currentNum}`;
  }

  const fontSize = (num.fontSizePt || 10) * scale;
  const padding = 20 * scale;

  ctx.save();
  ctx.font = `600 ${fontSize}px monospace`;
  ctx.fillStyle = '#000000';

  let x = canvasW / 2;
  let y = canvasH - padding;
  let align: CanvasTextAlign = 'center';
  let baseline: CanvasTextBaseline = 'bottom';

  switch (num.position) {
    case 'bottom-left':
      x = padding;
      y = canvasH - padding;
      align = 'left';
      baseline = 'bottom';
      break;
    case 'bottom-center':
      x = canvasW / 2;
      y = canvasH - padding;
      align = 'center';
      baseline = 'bottom';
      break;
    case 'bottom-right':
      x = canvasW - padding;
      y = canvasH - padding;
      align = 'right';
      baseline = 'bottom';
      break;
    case 'top-left':
      x = padding;
      y = padding;
      align = 'left';
      baseline = 'top';
      break;
    case 'top-center':
      x = canvasW / 2;
      y = padding;
      align = 'center';
      baseline = 'top';
      break;
    case 'top-right':
      x = canvasW - padding;
      y = padding;
      align = 'right';
      baseline = 'top';
      break;
  }

  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
  ctx.restore();
}
