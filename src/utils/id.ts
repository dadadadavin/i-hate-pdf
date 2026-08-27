/**
 * Deterministic-ish ID generator for pages/files.
 * Uses crypto.randomUUID when available for collision resistance,
 * otherwise falls back to timestamp + random.
 */
export function generateId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${(crypto as Crypto).randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function generatePageId(): string {
  return generateId('page');
}

export function generateFileId(): string {
  return generateId('file');
}

export function generateDupId(): string {
  return generateId('page_dup');
}
