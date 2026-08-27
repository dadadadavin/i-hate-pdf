import { PDFDocument } from 'pdf-lib';
import type {
  PageItem,
  SourceFile,
  PdfMetadata,
  CompressionSettings,
} from '../types';
import { getPdfDocument, renderPdfPageToCanvas } from './pdfRenderService';
import type * as pdfjs from 'pdfjs-dist';
type PDFDocumentProxy = pdfjs.PDFDocumentProxy;
import { loadImageFromBlob, canvasToBlob } from './imageService';
import { calculatePageGeometry, drawWysiwygPageToCanvas } from './layoutEngine';
import { stripExtension } from '../utils/fileType';

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

function resolveDpiScale(compression: CompressionSettings): number {
  if (compression.maxDpi > 0) return Math.min(3.0, Math.max(1.0, compression.maxDpi / 72));
  switch (compression.preset) {
    case 'small': return 1.2;
    case 'balanced': return 1.6;
    case 'lossless': return 2.5;
    default: return 2.0;
  }
}

function resolveJpegQuality(compression: CompressionSettings): number {
  if (compression.imageQuality > 0) return compression.imageQuality;
  switch (compression.preset) {
    case 'small': return 0.50;
    case 'balanced': return 0.72;
    case 'high': return 0.88;
    case 'lossless': return 0.96;
    default: return 0.85;
  }
}

async function createSourceCanvas(
  pageItem: PageItem,
  sourceFile: SourceFile | undefined,
  dpiScale: number
): Promise<HTMLCanvasElement> {
  if (pageItem.fileType === 'pdf' && sourceFile) {
    const buffer = await sourceFile.file.arrayBuffer();
    const pdfJsDoc: PDFDocumentProxy = await getPdfDocument(sourceFile.id, buffer);
    return renderPdfPageToCanvas(pdfJsDoc, pageItem.originalPageIndex, dpiScale, 0);
  }
  const img = await loadImageFromBlob(pageItem.blob);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  }
  return canvas;
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
  const dpiScale = resolveDpiScale(compression);
  const sourceCanvas = await createSourceCanvas(pageItem, sourceFile, dpiScale);

  const targetCanvas = document.createElement('canvas');
  drawWysiwygPageToCanvas(sourceCanvas, pageItem, targetCanvas, {
    scaleMultiplier: dpiScale,
    showMarginGuides: false,
  });

  const quality = resolveJpegQuality(compression);
  const imageBlob = await canvasToBlob(targetCanvas, 'image/jpeg', quality);
  const imageBytes = new Uint8Array(await imageBlob.arrayBuffer());
  const embeddedImage = await outputDoc.embedJpg(imageBytes);

  const geom = calculatePageGeometry(
    pageItem.width,
    pageItem.height,
    pageItem.rotation,
    pageItem.crop,
    pageItem.layout
  );

  const page = outputDoc.addPage([geom.paperWidth, geom.paperHeight]);
  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width: geom.paperWidth,
    height: geom.paperHeight,
  });
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
      const baseName = stripExtension(pages[i].fileName);
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
      const baseName = stripExtension(groupPages[0].fileName);
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
