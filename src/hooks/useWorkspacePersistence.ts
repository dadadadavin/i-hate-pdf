import { useEffect, useState, useRef, useCallback } from 'react';
import type { PageItem, SourceFile, PdfMetadata, CompressionSettings } from '../types';
import {
  saveWorkspaceSession,
  loadWorkspaceSession,
  clearWorkspaceSession,
} from '../services/storageService';
import { DEFAULT_PAGE_LAYOUT } from '../constants/app';
import { WORKSPACE_AUTOSAVE_DELAY_MS } from '../constants/app';

interface UseWorkspacePersistenceOptions {
  pages: PageItem[];
  files: SourceFile[];
  metadata: PdfMetadata;
  compression: CompressionSettings;
  onRestore: (pages: PageItem[], files: SourceFile[], metadata?: PdfMetadata, compression?: CompressionSettings) => void;
}

export function useWorkspacePersistence({
  pages,
  files,
  metadata,
  compression,
  onRestore,
}: UseWorkspacePersistenceOptions) {
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const hasRestoredRef = useRef(false);

  // Initial restore (once)
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      try {
        const stored = await loadWorkspaceSession();
        if (cancelled) return;
        if (stored && stored.pages.length > 0) {
          const upgradedPages = stored.pages.map((p) => ({
            ...p,
            layout: p.layout || { ...DEFAULT_PAGE_LAYOUT },
          }));
          onRestore(upgradedPages, stored.files, stored.metadata, stored.compression);
          setRestoreNotice(`Restored previous workspace session (${upgradedPages.length} pages).`);
        }
      } catch (err) {
        console.warn('Failed to restore session:', err);
      } finally {
        if (!cancelled) setIsRestoring(false);
        hasRestoredRef.current = true;
      }
    }
    restore();
    return () => {
      cancelled = true;
    };
    // onRestore is stable via useCallback in caller; we want run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced auto-save
  useEffect(() => {
    if (!hasRestoredRef.current) return;
    if (pages.length === 0 && files.length === 0) return;

    const timer = window.setTimeout(() => {
      saveWorkspaceSession(pages, files, metadata, compression).catch((e) =>
        console.warn('Auto-save failed:', e)
      );
    }, WORKSPACE_AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [pages, files, metadata, compression]);

  const clearSession = useCallback(async () => {
    await clearWorkspaceSession();
    setRestoreNotice(null);
  }, []);

  const dismissNotice = useCallback(() => setRestoreNotice(null), []);

  return {
    restoreNotice,
    isRestoring,
    dismissNotice,
    clearSession,
  };
}
