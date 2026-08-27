import type { FileType } from '../types';

const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'
]);
const TEXT_EXTENSIONS = new Set([
  '.txt', '.csv', '.log', '.json', '.md'
]);

export function detectFileType(file: File): FileType | null {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';

  if (
    type.startsWith('image/') ||
    [...IMAGE_EXTENSIONS].some(ext => name.endsWith(ext))
  ) {
    return 'image';
  }

  if (
    type === 'text/plain' ||
    type === 'text/csv' ||
    [...TEXT_EXTENSIONS].some(ext => name.endsWith(ext))
  ) {
    return 'text';
  }

  return null;
}

export function isSupportedFile(file: File): boolean {
  return detectFileType(file) !== null;
}

export function getFileExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx !== -1 ? name.slice(idx + 1).toLowerCase() : '';
}

export function stripExtension(name: string): string {
  return name.replace(/\.[^/.]+$/, '') || name;
}
