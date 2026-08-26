export type FileType = 'pdf' | 'image' | 'text';

export interface CropRect {
  x: number; // 0 to 1 normalized
  y: number; // 0 to 1 normalized
  width: number; // 0 to 1 normalized
  height: number; // 0 to 1 normalized
}

export type PageFormat = 'a4' | 'letter' | 'legal' | 'a3' | 'a5' | 'original' | 'custom';
export type PageOrientation = 'portrait' | 'landscape' | 'auto';
export type SizingMode = 'fit' | 'fill' | 'stretch' | 'original';

export interface PageLayoutOptions {
  format: PageFormat;
  orientation: PageOrientation;
  sizingMode: SizingMode;
  marginPt: number; // Margin in PDF points (72 pt = 1 inch, 28.35 pt = 1 cm)
  customWidthPt?: number;
  customHeightPt?: number;
  backgroundColor?: string;
}

export interface PageItem {
  id: string;
  fileId: string;
  fileName: string;
  fileType: FileType;
  originalPageIndex: number; // 0-indexed for PDFs, 0 for images
  thumbnailUrl: string; // Base thumbnail of the raw content
  width: number; // Source content width in points
  height: number; // Source content height in points
  rotation: number; // 0, 90, 180, 270 degrees
  crop?: CropRect;
  layout: PageLayoutOptions;
  blob: Blob;
  textContent?: string;
  isProcessing?: boolean;
}

export interface SourceFile {
  id: string;
  name: string;
  type: FileType;
  size: number;
  pageCount: number;
  file: File | Blob;
  pageIds: string[];
}

export interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
}

export type CompressionPreset = 'lossless' | 'high' | 'balanced' | 'small' | 'custom';

export interface CompressionSettings {
  preset: CompressionPreset;
  imageQuality: number; // 0.1 to 1.0
  maxDpi: number; // 72, 100, 150, 200, 300, 0 for original
  removeMetadata: boolean;
  optimizeStreams: boolean;
}

export type ExportFormat = 'pdf' | 'jpg' | 'png' | 'webp' | 'split-pdf' | 'txt' | 'csv';

export interface ExportOptions {
  format: ExportFormat;
  scope: 'all' | 'selected';
  imageQuality: number;
  imageScale: number; // 1, 1.5, 2, 3
  splitMode?: 'single-page' | 'by-file' | 'every-n-pages';
  splitChunkSize?: number;
  compression: CompressionSettings;
  metadata: PdfMetadata;
  outputFileName: string;
}

export type ViewMode = 'unified' | 'grouped';
export type CardDensity = 'compact' | 'normal' | 'large';

export interface ProgressState {
  isOpen: boolean;
  title: string;
  current: number;
  total: number;
  statusText: string;
  canCancel?: boolean;
}
