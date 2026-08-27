import { PageItem, SourceFile } from '../types';
import { getPdfDocument, renderPdfPageThumbnail } from './pdfRenderService';
import { processImageFile, renderTextToThumbnail } from './imageService';
import { generateFileId, generatePageId } from '../utils/id';
import { detectFileType } from '../utils/fileType';
import { DEFAULT_PAGE_LAYOUT } from '../constants/app';

export { detectFileType } from '../utils/fileType';

/**
 * Scan dataTransfer items recursively for files and directories (Folder drops)
 */
export async function extractFilesFromDataTransfer(dataTransfer: DataTransfer): Promise<File[]> {
  const files: File[] = [];

  const items = dataTransfer.items;
  if (items && items.length > 0) {
    const queue: Promise<void>[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
        if (entry) {
          queue.push(traverseFileTree(entry, files));
        } else {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
    }
    await Promise.all(queue);
  } else if (dataTransfer.files && dataTransfer.files.length > 0) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      files.push(dataTransfer.files[i]);
    }
  }

  return files;
}

async function traverseFileTree(item: unknown, fileList: File[]): Promise<void> {
  const entry = item as {
    isFile: boolean;
    isDirectory: boolean;
    file: (success: (file: File) => void, error?: () => void) => void;
    createReader: () => { readEntries: (success: (entries: unknown[]) => void, error?: () => void) => void };
  };
  if (entry.isFile) {
    return new Promise<void>((resolve) => {
      entry.file((file: File) => {
        fileList.push(file);
        resolve();
      }, () => resolve());
    });
  }
  if (entry.isDirectory) {
    const dirReader = entry.createReader();
    const readEntries = (): Promise<unknown[]> =>
      new Promise((resolve) => {
        dirReader.readEntries((entries: unknown[]) => resolve(entries), () => resolve([]));
      });

    let entries = await readEntries();
    while (entries.length > 0) {
      await Promise.all(entries.map((e) => traverseFileTree(e, fileList)));
      entries = await readEntries();
    }
  }
}

export interface ProcessedFileInput {
  file: SourceFile;
  pages: PageItem[];
}

/**
 * Process a single File object into a SourceFile record and PageItem array
 */
export async function processSingleFile(
  rawFile: File,
  onPageProgress?: (current: number, total: number) => void
): Promise<ProcessedFileInput | null> {
  const fileType = detectFileType(rawFile);
  if (!fileType) return null;

  const fileId = generateFileId();
  const pages: PageItem[] = [];

  if (fileType === 'pdf') {
    const arrayBuffer = await rawFile.arrayBuffer();
    const pdfDoc = await getPdfDocument(fileId, arrayBuffer);
    const numPages = pdfDoc.numPages;

    for (let i = 0; i < numPages; i++) {
      if (onPageProgress) onPageProgress(i + 1, numPages);
      const renderRes = await renderPdfPageThumbnail(pdfDoc, i);
      
      pages.push({
        id: generatePageId(),
        fileId,
        fileName: rawFile.name,
        fileType: 'pdf',
        originalPageIndex: i,
        thumbnailUrl: renderRes.thumbnailUrl,
        width: renderRes.width,
        height: renderRes.height,
        rotation: 0,
        layout: { ...DEFAULT_PAGE_LAYOUT },
        blob: rawFile,
        textContent: renderRes.textContent,
      });
    }

    const sourceFile: SourceFile = {
      id: fileId,
      name: rawFile.name,
      type: 'pdf',
      size: rawFile.size,
      pageCount: numPages,
      file: rawFile,
      pageIds: pages.map((p) => p.id),
    };

    return { file: sourceFile, pages };
  } else if (fileType === 'image') {
    const imageInfo = await processImageFile(rawFile);
    const pageId = generatePageId();

    pages.push({
      id: pageId,
      fileId,
      fileName: rawFile.name,
      fileType: 'image',
      originalPageIndex: 0,
      thumbnailUrl: imageInfo.thumbnailUrl,
      width: imageInfo.width,
      height: imageInfo.height,
      rotation: 0,
      layout: { ...DEFAULT_PAGE_LAYOUT },
      blob: rawFile,
    });

    const sourceFile: SourceFile = {
      id: fileId,
      name: rawFile.name,
      type: 'image',
      size: rawFile.size,
      pageCount: 1,
      file: rawFile,
      pageIds: [pageId],
    };

    return { file: sourceFile, pages };
  } else if (fileType === 'text') {
    const text = await rawFile.text();
    const textInfo = await renderTextToThumbnail(text);
    const pageId = generatePageId();

    pages.push({
      id: pageId,
      fileId,
      fileName: rawFile.name,
      fileType: 'text',
      originalPageIndex: 0,
      thumbnailUrl: textInfo.thumbnailUrl,
      width: textInfo.width,
      height: textInfo.height,
      rotation: 0,
      layout: { ...DEFAULT_PAGE_LAYOUT },
      blob: textInfo.blob,
      textContent: text,
    });

    const sourceFile: SourceFile = {
      id: fileId,
      name: rawFile.name,
      type: 'text',
      size: rawFile.size,
      pageCount: 1,
      file: rawFile,
      pageIds: [pageId],
    };

    return { file: sourceFile, pages };
  }

  return null;
}
