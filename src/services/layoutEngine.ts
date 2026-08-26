import { PageItem, PageLayoutOptions } from '../types';

export const STANDARD_PAPER_SIZES: Record<string, { width: number; height: number; name: string }> = {
  a4: { width: 595.28, height: 841.89, name: 'A4' }, // 210 × 297 mm
  letter: { width: 612.0, height: 792.0, name: 'Letter' }, // 8.5 × 11 in
  legal: { width: 612.0, height: 1008.0, name: 'Legal' }, // 8.5 × 14 in
  a3: { width: 841.89, height: 1190.55, name: 'A3' }, // 297 × 420 mm
  a5: { width: 419.53, height: 595.28, name: 'A5' }, // 148 × 210 mm
};

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
  // 1. Calculate effective content dimensions after crop
  let effectiveW = contentWidth || 600;
  let effectiveH = contentHeight || 800;

  if (crop) {
    effectiveW = Math.max(1, crop.width * effectiveW);
    effectiveH = Math.max(1, crop.height * effectiveH);
  }

  // 2. Account for 90 or 270 degree rotation on effective content box
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const isRotated90or270 = normalizedRotation === 90 || normalizedRotation === 270;
  const rotatedContentW = isRotated90or270 ? effectiveH : effectiveW;
  const rotatedContentH = isRotated90or270 ? effectiveW : effectiveH;
  const contentAspect = rotatedContentW / rotatedContentH;

  // 3. Determine Paper Sheet Dimensions
  let paperW = 595.28;
  let paperH = 841.89;

  if (layout.format === 'original') {
    paperW = rotatedContentW + (layout.marginPt || 0) * 2;
    paperH = rotatedContentH + (layout.marginPt || 0) * 2;
  } else if (layout.format === 'custom' && layout.customWidthPt && layout.customHeightPt) {
    paperW = layout.customWidthPt;
    paperH = layout.customHeightPt;
  } else {
    const std = STANDARD_PAPER_SIZES[layout.format] || STANDARD_PAPER_SIZES.a4;
    let baseW = std.width;
    let baseH = std.height;

    if (layout.orientation === 'landscape') {
      paperW = Math.max(baseW, baseH);
      paperH = Math.min(baseW, baseH);
    } else if (layout.orientation === 'portrait') {
      paperW = Math.min(baseW, baseH);
      paperH = Math.max(baseW, baseH);
    } else {
      // Auto: match content orientation
      if (contentAspect >= 1.0) {
        // Landscape content
        paperW = Math.max(baseW, baseH);
        paperH = Math.min(baseW, baseH);
      } else {
        // Portrait content
        paperW = Math.min(baseW, baseH);
        paperH = Math.max(baseW, baseH);
      }
    }
  }

  const paperAspect = paperW / paperH;

  // 4. Calculate Printable Area (inside margins)
  const margin = Math.min(layout.marginPt || 0, Math.min(paperW, paperH) / 3);
  const printableX = margin;
  const printableY = margin;
  const printableWidth = Math.max(1, paperW - margin * 2);
  const printableHeight = Math.max(1, paperH - margin * 2);

  // 5. Position & Scale Content on the Sheet
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
    // Original 1:1 sizing centered
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
 * Renders the paper background, any letterbox margin whitespace, content, and clipping.
 */
export function drawWysiwygPageToCanvas(
  sourceCanvasOrImage: HTMLCanvasElement | HTMLImageElement,
  page: PageItem,
  targetCanvas: HTMLCanvasElement,
  options: {
    showMarginGuides?: boolean;
    scaleMultiplier?: number;
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

  // 3. Prepare content (cropped and rotated)
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

  // Intermediate crop canvas
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = Math.max(1, cropW);
  cropCanvas.height = Math.max(1, cropH);
  const cropCtx = cropCanvas.getContext('2d');
  if (cropCtx) {
    cropCtx.fillStyle = '#ffffff';
    cropCtx.fillRect(0, 0, cropW, cropH);
    cropCtx.drawImage(sourceCanvasOrImage, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  }

  // 4. Clip to printable area if fill/crop occurs
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
}
