import type { PageItem, SourceFile, ExportOptions, ProgressState } from '../types';
import { getPdfDocument, renderPdfPageToCanvas } from './pdfRenderService';
import { loadImageFromBlob, canvasToBlob } from './imageService';
import { drawWysiwygPageToCanvas } from './layoutEngine';
import { generateMergedPdf, generateSplitPdfs } from './pdfService';
import { triggerFileDownload, downloadAsZip } from './zipService';
import { stripExtension } from '../utils/fileType';
import { recognizeTextFromImage } from './ocrService';

type ProgressSetter = (updater: (prev: ProgressState) => ProgressState) => void;
type ProgressCallback = (current: number, total: number) => void;

function makeProgressCallback(setProgress: ProgressSetter, title: string): ProgressCallback {
  return (current, total) => {
    setProgress((prev) => ({ ...prev, current, total, statusText: `${title} ${current} of ${total}...` }));
  };
}

export async function executeExport(
  options: ExportOptions,
  pages: PageItem[],
  files: SourceFile[],
  selectedIds: Set<string>,
  setProgress: ProgressSetter
): Promise<void> {
  const targetPages =
    options.scope === 'selected' && selectedIds.size > 0
      ? pages.filter((p) => selectedIds.has(p.id))
      : pages;

  if (targetPages.length === 0) throw new Error('No pages to export.');

  const filesMap = new Map<string, SourceFile>(files.map((f) => [f.id, f]));

  setProgress(() => ({
    isOpen: true,
    title: `EXPORTING AS ${options.format.toUpperCase()}`,
    current: 0,
    total: targetPages.length,
    statusText: 'Initializing conversion...',
    canCancel: false,
  }));

  try {
    // If OCR Searchable option is turned on and textContent is missing, run OCR on images
    if (options.ocrSearchable) {
      for (let i = 0; i < targetPages.length; i++) {
        const page = targetPages[i];
        if (!page.textContent || page.textContent.length < 5) {
          setProgress((prev) => ({
            ...prev,
            statusText: `Running OCR on page ${i + 1} of ${targetPages.length}...`,
          }));
          try {
            const recognized = await recognizeTextFromImage(page.blob);
            page.textContent = recognized;
          } catch (ocrErr) {
            console.warn('OCR error on page', i + 1, ocrErr);
          }
        }
      }
    }

    if (options.format === 'pdf') {
      const pdfBytes = await generateMergedPdf(
        targetPages,
        filesMap,
        options.compression,
        options.metadata,
        options.numbering,
        options.watermark,
        makeProgressCallback(setProgress, 'Rendering WYSIWYG page')
      );
      triggerFileDownload(pdfBytes, options.outputFileName);
      return;
    }

    if (['jpg', 'png', 'webp'].includes(options.format)) {
      await exportAsImages(options, targetPages, filesMap, setProgress);
      return;
    }

    if (options.format === 'split-pdf') {
      const splitPdfs = await generateSplitPdfs(
        targetPages,
        filesMap,
        options.compression,
        options.splitMode || 'single-page',
        options.splitChunkSize || 1,
        options.metadata,
        options.numbering,
        options.watermark,
        makeProgressCallback(setProgress, 'Splitting document chunk')
      );
      downloadAsZip(splitPdfs.map((s) => ({ name: s.fileName, data: s.data })), options.outputFileName);
      return;
    }

    if (options.format === 'txt' || options.format === 'csv') {
      const textParts = targetPages.map((p, idx) => {
        const header = `--- PAGE ${idx + 1} (${p.fileName}) ---\n`;
        return header + (p.textContent || '[No extractable text content on this page]');
      });
      const combinedText = textParts.join('\n\n');
      const blob = new Blob([combinedText], { type: 'text/plain;charset=utf-8' });
      triggerFileDownload(blob, options.outputFileName);
    }
  } finally {
    setProgress(() => ({
      isOpen: false,
      title: '',
      current: 0,
      total: 0,
      statusText: '',
    }));
  }
}

async function exportAsImages(
  options: ExportOptions,
  targetPages: PageItem[],
  filesMap: Map<string, SourceFile>,
  setProgress: ProgressSetter
) {
  const ext = options.format;
  const mimeType =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const renderedImages: { name: string; data: Uint8Array }[] = [];

  for (let i = 0; i < targetPages.length; i++) {
    const page = targetPages[i];
    setProgress((prev) => ({
      ...prev,
      current: i + 1,
      total: targetPages.length,
      statusText: `Rendering WYSIWYG page ${i + 1} of ${targetPages.length} to ${ext.toUpperCase()}...`,
    }));

    let rawCanvas: HTMLCanvasElement;
    const sourceFile = filesMap.get(page.fileId);

    if (page.fileType === 'pdf' && sourceFile) {
      const buf = await sourceFile.file.arrayBuffer();
      const doc = await getPdfDocument(sourceFile.id, buf);
      rawCanvas = await renderPdfPageToCanvas(doc, page.originalPageIndex, options.imageScale * 1.5, 0);
    } else {
      const img = await loadImageFromBlob(page.blob);
      rawCanvas = document.createElement('canvas');
      rawCanvas.width = img.naturalWidth || img.width;
      rawCanvas.height = img.naturalHeight || img.height;
      const ctx = rawCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rawCanvas.width, rawCanvas.height);
        ctx.drawImage(img, 0, 0);
      }
    }

    const targetCanvas = document.createElement('canvas');
    drawWysiwygPageToCanvas(rawCanvas, page, targetCanvas, {
      scaleMultiplier: options.imageScale,
      showMarginGuides: false,
      pageIndex: i,
      totalPages: targetPages.length,
      numbering: options.numbering,
      watermark: options.watermark,
    });

    const blob = await canvasToBlob(targetCanvas, mimeType as 'image/jpeg' | 'image/png' | 'image/webp', options.imageQuality);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const baseName = stripExtension(page.fileName);
    renderedImages.push({ name: `${baseName}_page_${i + 1}.${ext}`, data: bytes });
  }

  if (renderedImages.length === 1) {
    triggerFileDownload(renderedImages[0].data, renderedImages[0].name);
  } else {
    downloadAsZip(renderedImages, options.outputFileName);
  }
}
