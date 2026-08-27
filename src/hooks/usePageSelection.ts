import { useState, useCallback } from 'react';
import type { PageItem } from '../types';
import { playTickSound } from '../services/soundService';

export interface UsePageSelectionReturn {
  selectedIds: Set<string>;
  lastSelectedIndex: number | null;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectAll: () => void;
  deselectAll: () => void;
  selectOdd: () => void;
  selectEven: () => void;
  invertSelection: () => void;
  handlePageSelect: (id: string, e: React.MouseEvent, pages: PageItem[]) => void;
  handleMarqueeSelect: (matchedIds: string[], isAdditive: boolean) => void;
  applyRangeIndices: (indices: number[], pages: PageItem[]) => void;
  selectFilePages: (fileId: string, pages: PageItem[]) => void;
  deleteFromSelection: (id: string) => void;
}

export function usePageSelection(pages: PageItem[]): UsePageSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(pages.map((p) => p.id)));
    playTickSound();
  }, [pages]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedIndex(null);
  }, []);

  const selectOdd = useCallback(() => {
    const odds = pages.filter((_, i) => i % 2 === 0).map((p) => p.id);
    setSelectedIds(new Set(odds));
    playTickSound();
  }, [pages]);

  const selectEven = useCallback(() => {
    const evens = pages.filter((_, i) => i % 2 !== 0).map((p) => p.id);
    setSelectedIds(new Set(evens));
    playTickSound();
  }, [pages]);

  const invertSelection = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      pages.forEach((p) => {
        if (!prev.has(p.id)) next.add(p.id);
      });
      return next;
    });
    playTickSound();
  }, [pages]);

  const handlePageSelect = useCallback(
    (id: string, e: React.MouseEvent, currentPages: PageItem[]) => {
      const clickedIndex = currentPages.findIndex((p) => p.id === id);
      if (clickedIndex === -1) return;
      playTickSound();

      if (e.shiftKey && lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, clickedIndex);
        const end = Math.max(lastSelectedIndex, clickedIndex);
        const rangeIds = currentPages.slice(start, end + 1).map((p) => p.id);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          rangeIds.forEach((item) => next.add(item));
          return next;
        });
      } else if (e.metaKey || e.ctrlKey) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
        setLastSelectedIndex(clickedIndex);
      } else {
        setSelectedIds((prev) => {
          if (prev.has(id) && prev.size === 1) return new Set();
          return new Set([id]);
        });
        setLastSelectedIndex(clickedIndex);
      }
    },
    [lastSelectedIndex]
  );

  const handleMarqueeSelect = useCallback((matchedIds: string[], isAdditive: boolean) => {
    setSelectedIds((prev) => {
      const next = isAdditive ? new Set(prev) : new Set<string>();
      matchedIds.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const applyRangeIndices = useCallback((indices: number[], currentPages: PageItem[]) => {
    const targetIds = indices.map((idx) => currentPages[idx]?.id).filter(Boolean) as string[];
    setSelectedIds(new Set(targetIds));
    playTickSound();
  }, []);

  const selectFilePages = useCallback((fileId: string, currentPages: PageItem[]) => {
    const filePageIds = currentPages.filter((p) => p.fileId === fileId).map((p) => p.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filePageIds.forEach((id) => next.add(id));
      return next;
    });
    playTickSound();
  }, []);

  const deleteFromSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  return {
    selectedIds,
    lastSelectedIndex,
    setSelectedIds,
    selectAll,
    deselectAll,
    selectOdd,
    selectEven,
    invertSelection,
    handlePageSelect,
    handleMarqueeSelect,
    applyRangeIndices,
    selectFilePages,
    deleteFromSelection,
  };
}
