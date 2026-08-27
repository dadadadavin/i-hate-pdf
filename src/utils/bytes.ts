export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(1))} ${sizes[idx]}`;
}

export function estimateTotalBytes(
  pageCount: number,
  fileBytes: number,
  fallbackPerPage = 150_000
): number {
  return fileBytes > 0 ? fileBytes : pageCount * fallbackPerPage;
}
