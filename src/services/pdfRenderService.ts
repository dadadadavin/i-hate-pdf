import * as pdfjsLib from 'pdfjs-dist';

// Use Vite's URL import for the worker script
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch {
  // Fallback worker URL if needed
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

// In-memory cache of parsed PDF documents to speed up multi-page operations
const docCache = new Map<string, pdfjsLib.PDFDocumentProxy>();

export async function getPdfDocument(fileId: string, arrayBuffer: ArrayBuffer): Promise<pdfjsLib.PDFDocumentProxy> {
  if (docCache.has(fileId)) {
    return docCache.get(fileId)!;
  }
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
    isEvalSupported: false,
  });
  const doc = await loadingTask.promise;
  docCache.set(fileId, doc);
  return doc;
}

export function clearPdfCache(fileId?: string) {
  if (fileId) {
    const doc = docCache.get(fileId);
    if (doc) {
      doc.destroy();
      docCache.delete(fileId);
    }
  } else {
    docCache.forEach(doc => doc.destroy());
    docCache.clear();
  }
}

export interface RenderPageResult {
  thumbnailUrl: string;
  width: number;
  height: number;
  rotation: number;
  textContent: string;
}

/**
 * Render a single page to a thumbnail data URL and retrieve metadata
 */
export async function renderPdfPageThumbnail(
  doc: pdfjsLib.PDFDocumentProxy,
  pageIndex: number,
  targetWidth = 320
): Promise<RenderPageResult> {
  const page = await doc.getPage(pageIndex + 1); // 1-indexed in PDF.js
  const baseViewport = page.getViewport({ scale: 1.0 });
  const scale = targetWidth / baseViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Failed to get 2d context for PDF rendering');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise;

  // Extract text content if available
  let textContent = '';
  try {
    const textData = await page.getTextContent();
    textContent = textData.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim();
  } catch {
    // Non-fatal if text extraction fails on some scanned PDFs
  }

  const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);

  return {
    thumbnailUrl,
    width: baseViewport.width,
    height: baseViewport.height,
    rotation: baseViewport.rotation || 0,
    textContent,
  };
}

/**
 * Render a PDF page at custom resolution scale for image export
 */
export async function renderPdfPageToCanvas(
  doc: pdfjsLib.PDFDocumentProxy,
  pageIndex: number,
  scale = 2.0,
  rotation = 0
): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale, rotation });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Failed to create canvas context');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise;

  return canvas;
}
