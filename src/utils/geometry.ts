import type { PageItem } from '../types';

export function getPageGlobalIndex(pages: PageItem[], pageId: string): number {
  return pages.findIndex(p => p.id === pageId);
}

export function sortPageIdsByOrder(pages: PageItem[], ids: Set<string>): string[] {
  return pages.filter(p => ids.has(p.id)).map(p => p.id);
}

export function reorderPages<T extends { id: string }>(list: T[], activeId: string, overId: string): T[] {
  const oldIndex = list.findIndex(i => i.id === activeId);
  const newIndex = list.findIndex(i => i.id === overId);
  if (oldIndex === -1 || newIndex === -1) return list;
  const next = [...list];
  const [moved] = next.splice(oldIndex, 1);
  next.splice(newIndex, 0, moved);
  return next;
}

export function reorderMultiple<T extends { id: string }>(
  list: T[],
  overId: string,
  selectedIds: Set<string>
): T[] {
  const targetIndex = list.findIndex(i => i.id === overId);
  if (targetIndex === -1) return list;
  const selected = list.filter(i => selectedIds.has(i.id));
  const unselected = list.filter(i => !selectedIds.has(i.id));
  // Find where the target lies in the unselected list
  const targetInUnselected = unselected.findIndex(i => i.id === overId);
  // If target is itself selected, insert at its original relative spot among unselected
  // Otherwise insert at targetInUnselected position
  const insertAt = targetInUnselected !== -1 ? targetInUnselected : Math.min(targetIndex, unselected.length);
  const result = [...unselected];
  result.splice(insertAt, 0, ...selected);
  return result;
}

export function normalizeRotation(rotation: number): 0 | 90 | 180 | 270 {
  const n = ((rotation % 360) + 360) % 360;
  if (n === 90) return 90;
  if (n === 180) return 180;
  if (n === 270) return 270;
  return 0;
}
