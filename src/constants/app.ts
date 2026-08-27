export const APP_NAME = 'I HATE PDF';
export const APP_CREATOR = 'I HATE PDF';
export const APP_PRODUCER = 'I HATE PDF (Local Workspace)';

export const ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.txt,.csv';
export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml',
  'text/plain', 'text/csv'
] as const;

export const WORKSPACE_AUTOSAVE_DELAY_MS = 1000;

export const DEFAULT_COMPRESSION = {
  preset: 'high' as const,
  imageQuality: 0.85,
  maxDpi: 200,
  removeMetadata: false,
  optimizeStreams: true,
};

export const DEFAULT_METADATA = {
  title: '',
  author: '',
  subject: '',
  keywords: '',
  creator: APP_CREATOR,
};

export const DEFAULT_PAGE_LAYOUT = {
  format: 'a4' as const,
  orientation: 'auto' as const,
  sizingMode: 'fit' as const,
  marginPt: 0,
};

export const GRID_ZOOM_MIN = 0.6;
export const GRID_ZOOM_MAX = 1.4;
export const GRID_ZOOM_STEP = 0.15;

export const CANVAS_CARD_BASE_WIDTH = 230;
export const CANVAS_CARD_BASE_HEIGHT = 270;
