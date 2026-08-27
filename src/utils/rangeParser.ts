/**
 * Parse expressions like "1-5, 8, 10-14" into 0-indexed sorted indices.
 * Invalid tokens are ignored; out-of-bounds numbers are clamped.
 */
export function parseRangeExpression(text: string, totalCount: number): number[] {
  if (!text.trim() || totalCount <= 0) return [];

  const indices = new Set<number>();
  // split on commas, semicolons, or whitespace
  const parts = text.split(/[,;\s]+/).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-', 2);
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (Number.isNaN(start) || Number.isNaN(end)) continue;
      const low = Math.max(1, Math.min(start, end));
      const high = Math.min(totalCount, Math.max(start, end));
      for (let i = low; i <= high; i++) indices.add(i - 1);
    } else {
      const num = parseInt(part, 10);
      if (!Number.isNaN(num) && num >= 1 && num <= totalCount) {
        indices.add(num - 1);
      }
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

export function rangesToText(indices: number[]): string {
  if (indices.length === 0) return '';
  const sorted = [...indices].sort((a, b) => a - b);
  // convert to 1-indexed runs
  const runs: string[] = [];
  let start = sorted[0];
  let end = start;
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    if (cur === end + 1) {
      end = cur;
    } else {
      runs.push(start === end ? `${start + 1}` : `${start + 1}-${end + 1}`);
      start = cur;
      end = cur;
    }
  }
  runs.push(start === end ? `${start + 1}` : `${start + 1}-${end + 1}`);
  return runs.join(', ');
}
