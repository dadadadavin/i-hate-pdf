import { useCallback } from 'react';
import type { PageItem, SourceFile, PageFormat, PageOrientation, SizingMode, PageLayoutOptions, CropRect } from '../types';
import { generateDupId } from '../utils/id';
import { playTickSound, playSuccessSound } from '../services/soundService';
import { clearPdfCache } from '../services/pdfRenderService';
import { reorderPages, reorderMultiple, normalizeRotation } from '../utils/geometry';
import { PT_PER_MM } from '../constants/paper';

export function useWorkspaceActions(
  _pages: PageItem[],
  _files: SourceFile[],
  selectedIds: Set<string>,
  setPages: React.Dispatch<React.SetStateAction<PageItem[]>>,
  setFiles: React.Dispatch<React.SetStateAction<SourceFile[]>>,
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>,
  setLastSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>
) {
  void _pages;
  void _files;
  const rotateSingleCw = useCallback((id: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, rotation: normalizeRotation((p.rotation + 90) % 360) } : p));
    playTickSound();
  }, [setPages]);

  const rotateSingleCcw = useCallback((id: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, rotation: normalizeRotation(((p.rotation - 90) % 360 + 360) % 360) } : p));
    playTickSound();
  }, [setPages]);

  const rotateSelectedCw = useCallback(() => {
    setPages(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, rotation: normalizeRotation((p.rotation + 90) % 360) } : p));
    playTickSound();
  }, [selectedIds, setPages]);

  const rotateSelectedCcw = useCallback(() => {
    setPages(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, rotation: normalizeRotation(((p.rotation - 90) % 360 + 360) % 360) } : p));
    playTickSound();
  }, [selectedIds, setPages]);

  const duplicateSingle = useCallback((id: string) => {
    setPages(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx === -1) return prev;
      const clone: PageItem = { ...prev[idx], id: generateDupId() };
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
    playTickSound();
  }, [setPages]);

  const duplicateSelected = useCallback(() => {
    setPages(prev => {
      const next: PageItem[] = [];
      for (const p of prev) {
        next.push(p);
        if (selectedIds.has(p.id)) next.push({ ...p, id: generateDupId() });
      }
      return next;
    });
    playTickSound();
  }, [selectedIds, setPages]);

  const deleteSingle = useCallback((id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    playTickSound();
  }, [setPages, setSelectedIds]);

  const deleteSelected = useCallback(() => {
    setPages(prev => prev.filter(p => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
    setLastSelectedIndex(null);
    playTickSound();
  }, [selectedIds, setPages, setSelectedIds, setLastSelectedIndex]);

  const reverseOrder = useCallback(() => {
    if (selectedIds.size > 1) {
      setPages(prev => {
        const indices = prev.map((p, idx) => selectedIds.has(p.id) ? idx : -1).filter(idx => idx !== -1);
        const reversed = indices.map(idx => prev[idx]).reverse();
        const updated = [...prev];
        indices.forEach((origIdx, i) => { updated[origIdx] = reversed[i]; });
        return updated;
      });
    } else {
      setPages(prev => [...prev].reverse());
    }
    playTickSound();
  }, [selectedIds, setPages]);

  const reorderSingle = useCallback((activeId: string, overId: string) => {
    setPages(prev => reorderPages(prev, activeId, overId));
  }, [setPages]);

  const reorderMany = useCallback((_draggedId: string, overId: string, ids: Set<string>) => {
    setPages(prev => reorderMultiple(prev, overId, ids));
  }, [setPages]);

  const bulkSetFormat = useCallback((format: PageFormat) => {
    setPages(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, layout: { ...p.layout, format } } : p));
    playTickSound();
  }, [selectedIds, setPages]);

  const bulkSetSizing = useCallback((sizingMode: SizingMode) => {
    setPages(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, layout: { ...p.layout, sizingMode } } : p));
    playTickSound();
  }, [selectedIds, setPages]);

  const bulkSetOrientation = useCallback((orientation: PageOrientation) => {
    setPages(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, layout: { ...p.layout, orientation } } : p));
    playTickSound();
  }, [selectedIds, setPages]);

  const bulkSetMargin = useCallback((marginMm: number) => {
    const marginPt = Math.round(marginMm * PT_PER_MM);
    setPages(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, layout: { ...p.layout, marginPt } } : p));
    playTickSound();
  }, [selectedIds, setPages]);

  const updatePageLayout = useCallback((pageId: string, updates: Partial<PageLayoutOptions>) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, layout: { ...p.layout, ...updates } } : p));
  }, [setPages]);

  const applyCrop = useCallback((pageId: string, crop: CropRect | undefined) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, crop } : p));
    playTickSound();
  }, [setPages]);

  const applyLayout = useCallback((layout: PageLayoutOptions, scope: 'selected' | 'all', resizeTargetPage: PageItem | null) => {
    setPages(prev => prev.map(p => {
      if (scope === 'all' || selectedIds.has(p.id) || (resizeTargetPage && p.id === resizeTargetPage.id)) {
        return { ...p, layout };
      }
      return p;
    }));
    playSuccessSound();
  }, [selectedIds, setPages]);

  const removeFile = useCallback((fileId: string) => {
    setPages(prev => prev.filter(p => p.fileId !== fileId));
    setFiles(prev => prev.filter(f => f.id !== fileId));
    clearPdfCache(fileId);
    playTickSound();
  }, [setFiles, setPages]);

  const rotateFilePages = useCallback((fileId: string) => {
    setPages(prev => prev.map(p => p.fileId === fileId ? { ...p, rotation: normalizeRotation((p.rotation + 90) % 360) } : p));
    playTickSound();
  }, [setPages]);

  return {
    rotateSingleCw, rotateSingleCcw,
    rotateSelectedCw, rotateSelectedCcw,
    duplicateSingle, duplicateSelected,
    deleteSingle, deleteSelected,
    reverseOrder,
    reorderSingle, reorderMany,
    bulkSetFormat, bulkSetSizing, bulkSetOrientation, bulkSetMargin,
    updatePageLayout, applyCrop, applyLayout,
    removeFile, rotateFilePages,
  };
}
