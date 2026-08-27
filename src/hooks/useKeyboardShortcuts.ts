import { useEffect, useCallback } from 'react';

interface ShortcutOptions {
  hasPages: boolean;
  selectedCount: number;
  isPreviewOpen: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
  onOpenPreviewFromSelection: () => void;
  onRotateSelectedCw: () => void;
  onDuplicateSelected: () => void;
  onOpenShortcutsModal?: () => void;
}

function isEditingTarget(target: HTMLElement | null): boolean {
  if (!target) return false;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
}

export function useKeyboardShortcuts({
  hasPages,
  selectedCount,
  isPreviewOpen,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onOpenPreviewFromSelection,
  onRotateSelectedCw,
  onDuplicateSelected,
  onOpenShortcutsModal,
}: ShortcutOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isEditingTarget(e.target as HTMLElement)) return;

    // '?' => open shortcuts cheatsheet
    if (e.key === '?' && onOpenShortcutsModal) {
      e.preventDefault();
      onOpenShortcutsModal();
      return;
    }

    // Ctrl/Cmd + A => select all
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && hasPages) {
      e.preventDefault();
      onSelectAll();
      return;
    }

    // Escape => deselect or close
    if (e.key === 'Escape' && selectedCount > 0) {
      onDeselectAll();
      return;
    }

    // Delete / Backspace => delete selected
    if ((e.key === 'Backspace' || e.key === 'Delete') && selectedCount > 0) {
      e.preventDefault();
      onDeleteSelected();
      return;
    }

    // Space => preview first selected
    if (e.code === 'Space' && selectedCount > 0 && !isPreviewOpen) {
      e.preventDefault();
      onOpenPreviewFromSelection();
      return;
    }

    // R => rotate clockwise
    if (e.key.toLowerCase() === 'r' && selectedCount > 0 && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      onRotateSelectedCw();
      return;
    }

    // D => duplicate
    if (e.key.toLowerCase() === 'd' && selectedCount > 0 && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      onDuplicateSelected();
    }
  }, [
    hasPages, selectedCount, isPreviewOpen,
    onSelectAll, onDeselectAll, onDeleteSelected,
    onOpenPreviewFromSelection, onRotateSelectedCw, onDuplicateSelected,
    onOpenShortcutsModal,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
