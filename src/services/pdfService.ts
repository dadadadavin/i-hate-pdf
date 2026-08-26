import { PDFDocument } from 'pdf-lib';
import {
  PageItem,
  SourceFile,
  PdfMetadata,
  CompressionSettings,
} from '../types';
import { getPdfDocument, renderPdfPageToCanvas } from './pdfRenderService';
import { loadImageFromBlob, canvasToBlob } from './imageService';
import { calculatePageGeometry, drawWysiwygPageToCanvas } from './layoutEngine';

/**
 * Apply metadata to a pdf-lib PDFDocument
 */
export function applyPdfMetadata(pdfDoc: PDFDocument, metadata?: Partial<PdfMetadata>) {
  if (!metadata) return;
  if (metadata.title) pdfDoc.setTitle(metadata.title);
  if (metadata.author) pdfDoc.setAuthor(metadata.author);
  if (metadata.subject) pdfDoc.setSubject(metadata.subject);
  if (metadata.keywords) {
    pdfDoc.setKeywords(metadata.keywords.split(',').map((k) => k.trim()));
  }
  pdfDoc.setCreator(metadata.creator || 'I HATE PDF');
  pdfDoc.setProducer('I HATE PDF (Local Workspace)');
  pdfDoc.setModificationDate(new Date());
}

/**
 * Build a merged PDF from a list of PageItems using true WYSIWYG layout
 */
export async function generateMergedPdf(
  pages: PageItem[],
  filesMap: Map<string, SourceFile>,
  compression: CompressionSettings,
  metadata?: PdfMetadata,
  onProgress?: (current: number, total: number) => void
): Promise<Uint8Array> {
  const outputDoc = await PDFDocument.create();

  for (let i = 0; i < pages.length; i++) {
    const pageItem = pages[i];
    if (onProgress) onProgress(i + 1, pages.length);

    const sourceFile = filesMap.get(pageItem.fileId);
    await renderAndEmbedWysiwygPage(outputDoc, pageItem, sourceFile, compression);
  }

  // Set document metadata
  if (!compression.removeMetadata) {
    applyPdfMetadata(outputDoc, metadata);
  }

  return await outputDoc.save({
    useObjectStreams: compression.optimizeStreams ?? true,
  });
}

/**
 * Render a page with exact WYSIWYG layout and embed into PDF
 */
async function renderAndEmbedWysiwygPage(
  outputDoc: PDFDocument,
  pageItem: PageItem,
  sourceFile: SourceFile | undefined,
  compression: CompressionSettings
) {
  let dpiScale = 2.0;
  if (compression.maxDpi > 0) {
    dpiScale = Math.min(3.0, Math.max(1.0, compression.maxDpi / 72));
  } else if (compression.preset === 'small') {
    dpiScale = 1.2;
  } else if (compression.preset === 'balanced') {
    dpiScale = 1.6;
  } else if (compression.preset === 'lossless') {
    dpiScale = 2.5;
  }

  // 1. Get raw content canvas
  let sourceCanvas: HTMLCanvasElement;

  if (pageItem.fileType === 'pdf' && sourceFile) {
    const buffer = await sourceFile.file.arrayBuffer();
    const pdfJsDoc = await getPdfDocument(sourceFile.id, buffer);
    sourceCanvas = await renderPdfPageToCanvas(docSafe(pdfJsDoc), pageItem.originalPageIndex, dpiScale, 0);
  } else {
    const img = await loadImageFromBlob(pageItem.blob);
    sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = img.naturalWidth || img.width;
    sourceCanvas.height = img.naturalHeight || img.height;
    const ctx = sourceCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);
      ctx.drawImage(img, 0, 0);
    }
  }

  // 2. Render complete WYSIWYG sheet to canvas using the shared layout engine
  const targetCanvas = document.createElement('canvas');
  drawWysiwygPageToCanvas(sourceCanvas, pageItem, targetCanvas, {
    scaleMultiplier: dpiScale,
    showMarginGuides: false,
  });

  // 3. Compress canvas to JPEG Blob
  let quality = 0.85;
  if (compression.imageQuality > 0) {
    quality = compression.imageQuality;
  } else if (compression.preset === 'small') {
    quality = 0.50;
  } else if (compression.preset === 'balanced') {
    quality = 0.72;
  } else if (compression.preset === 'high') {
    quality = 0.88;
  } else if (compression.preset === 'lossless') {
    quality = 0.96;
  }

  const imageBlob = await canvasToBlob(targetCanvas, 'image/jpeg', quality);
  const imageBytes = new Uint8Array(await imageBlob.arrayBuffer());
  const embeddedImage = await outputDoc.embedJpg(imageBytes);

  // 4. Calculate paper dimensions in points
  const geom = calculatePageGeometry(
    pageItem.width,
    pageItem.height,
    pageItem.rotation,
    pageItem.crop,
    pageItem.layout
  );

  // 5. Add page with exact paper dimensions
  const page = outputDoc.addPage([geom.paperWidth, geom.paperHeight]);
  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width: geom.paperWidth,
    height: geom.paperHeight,
  });
}

function docSafe(doc: any) {
  return doc;
}

/**
 * Generate split PDF files
 */
export async function generateSplitPdfs(
  pages: PageItem[],
  filesMap: Map<string, SourceFile>,
  compression: CompressionSettings,
  mode: 'single-page' | 'by-file' | 'every-n-pages',
  chunkSize = 1,
  metadata?: PdfMetadata,
  onProgress?: (current: number, total: number) => void
): Promise<{ fileName: string; data: Uint8Array }[]> {
  const results: { fileName: string; data: Uint8Array }[] = [];

  if (mode === 'single-page') {
    for (let i = 0; i < pages.length; i++) {
      if (onProgress) onProgress(i + 1, pages.length);
      const singlePageDoc = await generateMergedPdf(
        [pages[i]],
        filesMap,
        compression,
        metadata
      );
      const baseName = pages[i].fileName.replace(/\.[^/.]+$/, '');
      results.push({
        fileName: `${baseName}_page_${i + 1}.pdf`,
        data: singlePageDoc,
      });
    }
  } else if (mode === 'by-file') {
    const groups = new Map<string, PageItem[]>();
    for (const page of pages) {
      if (!groups.has(page.fileId)) groups.set(page.fileId, []);
      groups.get(page.fileId)!.push(page);
    }

    let count = 0;
    const total = groups.size;
    for (const [, groupPages] of groups.entries()) {
      count++;
      if (onProgress) onProgress(count, total);
      const groupDoc = await generateMergedPdf(
        groupPages,
        filesMap,
        compression,
        metadata
      );
      const baseName = groupPages[0].fileName.replace(/\.[^/.]+$/, '');
      results.push({
        fileName: `${baseName}_export.pdf`,
        data: groupDoc,
      });
    }
  } else {
    let chunkIndex = 1;
    const totalChunks = Math.ceil(pages.length / chunkSize);

    for (let i = 0; i < pages.length; i += chunkSize) {
      if (onProgress) onProgress(chunkIndex, totalChunks);
      const chunkPages = pages.slice(i, i + chunkSize);
      const chunkDoc = await generateMergedPdf(
        chunkPages,
        filesMap,
        compression,
        metadata
      );
      results.push({
        fileName: `document_part_${chunkIndex}.pdf`,
        data: chunkDoc,
      });
      chunkIndex++;
    }
  }

  return results;
}
