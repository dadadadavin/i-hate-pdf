export type FileType = 'pdf' | 'image' | 'text';

export type PageFormat =
  | 'a4'
  | 'letter'
  | 'legal'
  | 'a3'
  | 'a5'
  | 'original'
  | 'custom';

export type PageOrientation = 'portrait' | 'landscape' | 'auto';

export type SizingMode = 'fit' | 'fill' | 'stretch';

export type ImageFilterType = 'none' | 'clean-scan' | 'grayscale' | 'high-contrast' | 'invert';

export interface PageLayoutOptions {
  format: PageFormat;
  orientation: PageOrientation;
  sizingMode: SizingMode;
  marginPt: number;
  customWidthPt?: number;
  customHeightPt?: number;
  backgroundColor?: string;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PageItem {
  id: string;
  fileId: string;
  fileName: string;
  fileType: FileType;
  originalPageIndex: number;
  thumbnailUrl: string;
  width: number;
  height: number;
  rotation: number;
  crop?: CropRect;
  layout: PageLayoutOptions;
  filter?: ImageFilterType;
  blob: Blob;
  textContent?: string;
}

export interface SourceFile {
  id: string;
  name: string;
  type: FileType;
  size: number;
  pageCount: number;
  file: File;
  pageIds: string[];
}

export type CompressionPreset = 'lossless' | 'high' | 'balanced' | 'small' | 'custom';

export interface CompressionSettings {
  preset: CompressionPreset;
  imageQuality: number;
  maxDpi: number;
  removeMetadata: boolean;
  optimizeStreams: boolean;
}

export interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
}

export type PageNumberPosition =
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'top-right'
  | 'top-left';

export type PageNumberFormat = 'page-n-of-total' | 'page-n' | 'number-only';

export interface PageNumberingOptions {
  enabled: boolean;
  format: PageNumberFormat;
  position: PageNumberPosition;
  fontSizePt: number;
  startNumber: number;
}

export interface WatermarkOptions {
  enabled: boolean;
  text: string;
  opacity: number;
  rotationDeg: number;
  fontSizePt: number;
}

export interface PdfSecurityOptions {
  password?: string;
  ownerPassword?: string;
  permissions?: {
    printing?: boolean;
    copying?: boolean;
    modifying?: boolean;
  };
}

export interface ExportOptions {
  format: 'pdf' | 'jpg' | 'png' | 'webp' | 'split-pdf' | 'txt' | 'csv';
  scope: 'all' | 'selected';
  compression: CompressionSettings;
  metadata?: PdfMetadata;
  imageQuality: number;
  imageScale: number;
  splitMode?: 'single-page' | 'by-file' | 'every-n-pages';
  splitChunkSize?: number;
  outputFileName: string;
  numbering?: PageNumberingOptions;
  watermark?: WatermarkOptions;
  security?: PdfSecurityOptions;
  ocrSearchable?: boolean;
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
