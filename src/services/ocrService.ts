import { createWorker, Worker } from 'tesseract.js';
import type { PageItem, SourceFile } from '../types';
import { getPdfDocument, renderPdfPageToCanvas } from './pdfRenderService';

let workerInstance: Worker | null = null;
let currentLanguage = 'eng';

/**
 * Initialize or get cached Tesseract worker
 */
export async function getOcrWorker(
  language = 'eng',
  onProgress?: (progress: number, status: string) => void
): Promise<Worker> {
  if (workerInstance && currentLanguage === language) {
    return workerInstance;
  }

  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
  }

  workerInstance = await createWorker(language, 1, {
    logger: (m) => {
      if (onProgress && m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100), m.status);
      }
    },
  });

  currentLanguage = language;
  return workerInstance;
}

/**
 * Run OCR recognition on a canvas, URL, or image blob
 */
export async function recognizeTextFromImage(
  imageSource: HTMLCanvasElement | Blob | string,
  language = 'eng',
  onProgress?: (progress: number, status: string) => void
): Promise<string> {
  const worker = await getOcrWorker(language, onProgress);
  const result = await worker.recognize(imageSource);
  return result.data.text ? result.data.text.trim() : '';
}

/**
 * Recognize text from a PageItem (handles both PDF and image pages)
 */
export async function recognizePageText(
  page: PageItem,
  sourceFile?: SourceFile,
  onProgress?: (progress: number, status: string) => void
): Promise<string> {
  if (page.fileType === 'pdf' && sourceFile) {
    const buf = await sourceFile.file.arrayBuffer();
    const doc = await getPdfDocument(sourceFile.id, buf);
    const canvas = await renderPdfPageToCanvas(doc, page.originalPageIndex, 2.0, 0);
    return await recognizeTextFromImage(canvas, 'eng', onProgress);
  }
  if (page.thumbnailUrl) {
    return await recognizeTextFromImage(page.thumbnailUrl, 'eng', onProgress);
  }
  return await recognizeTextFromImage(page.blob, 'eng', onProgress);
}

/**
 * Terminate OCR worker to free memory
 */
export async function terminateOcrWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
  }
}
