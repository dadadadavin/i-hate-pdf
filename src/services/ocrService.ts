import { createWorker, Worker } from 'tesseract.js';

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
 * Run OCR recognition on a canvas or blob image
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
 * Terminate OCR worker to free memory
 */
export async function terminateOcrWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
  }
}
