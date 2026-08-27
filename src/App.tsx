import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  PageItem,
  SourceFile,
  PdfMetadata,
  CompressionSettings,
  ViewMode,
  ProgressState,
  CropRect,
  PageLayoutOptions,
  PageFormat,
  PageOrientation,
  SizingMode,
  ExportOptions,
} from './types';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { PageGrid } from './components/PageGrid';
import { FileGroupView } from './components/FileGroupView';
import { SelectionBar } from './components/SelectionBar';
import { BottomActionBar } from './components/BottomActionBar';
import { RangeSelectorModal } from './components/RangeSelectorModal';
import { CropModal } from './components/CropModal';
import { ResizeModal } from './components/ResizeModal';
import { MetadataModal } from './components/MetadataModal';
import { CompressModal } from './components/CompressModal';
import { ExportModal } from './components/ExportModal';
import { ProgressModal } from './components/ProgressModal';
import { PreviewModal } from './components/PreviewModal';
import { MarqueeSelection } from './components/MarqueeSelection';

import {
  processSingleFile,
  extractFilesFromDataTransfer,
} from './services/fileReaderService';
import {
  generateMergedPdf,
  generateSplitPdfs,
} from './services/pdfService';
import {
  getPdfDocument,
  renderPdfPageToCanvas,
  clearPdfCache,
} from './services/pdfRenderService';
import {
  loadImageFromBlob,
  canvasToBlob,
} from './services/imageService';
import { drawWysiwygPageToCanvas } from './services/layoutEngine';
import { triggerFileDownload, downloadAsZip } from './services/zipService';
import {
  saveWorkspaceSession,
  loadWorkspaceSession,
  clearWorkspaceSession,
} from './services/storageService';
import { playTickSound, playSuccessSound } from './services/soundService';

export const App: React.FC = () => {
  // Main State
  const [pages, setPages] = useState<PageItem[]>([]);
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  // Settings & Canvas View
  const [viewMode, setViewMode] = useState<ViewMode>('unified');
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [compression, setCompression] = useState<CompressionSettings>({
    preset: 'high',
    imageQuality: 0.85,
    maxDpi: 200,
    removeMetadata: false,
    optimizeStreams: true,
  });
  const [metadata, setMetadata] = useState<PdfMetadata>({
    title: '',
    author: '',
    subject: '',
    keywords: '',
    creator: 'I HATE PDF',
  });

  // UI / Modals State
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isRangeSelectorOpen, setIsRangeSelectorOpen] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropTargetPage, setCropTargetPage] = useState<PageItem | null>(null);
  const [isResizeOpen, setIsResizeOpen] = useState(false);
  const [resizeTargetPage, setResizeTargetPage] = useState<PageItem | null>(null);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [isCompressOpen, setIsCompressOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportInitialScope, setExportInitialScope] = useState<'all' | 'selected'>('all');
  const [sessionRestoredNotice, setSessionRestoredNotice] = useState<string | null>(null);

  // Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);

  // Progress State
  const [progress, setProgress] = useState<ProgressState>({
    isOpen: false,
    title: '',
    current: 0,
    total: 0,
    statusText: '',
    canCancel: false,
  });

  const fileInputTriggerRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef<number>(0);
  const pasteCountRef = useRef<number>(1);
  const workspaceContainerRef = useRef<HTMLDivElement | null>(null);

  // 1. Session Restoration on initial mount
  useEffect(() => {
    async function restore() {
      const stored = await loadWorkspaceSession();
      if (stored && stored.pages.length > 0) {
        const upgradedPages = stored.pages.map((p) => ({
          ...p,
          layout: p.layout || {
            format: 'a4',
            orientation: 'auto',
            sizingMode: 'fit',
            marginPt: 0,
          },
        }));
        setPages(upgradedPages);
        setFiles(stored.files);
        if (stored.metadata) setMetadata(stored.metadata);
        if (stored.compression) setCompression(stored.compression);
        setSessionRestoredNotice(
          `Restored previous workspace session (${upgradedPages.length} pages).`
        );
      }
    }
    restore();
  }, []);

  // 2. Auto-save session on changes (debounced)
  useEffect(() => {
    if (pages.length === 0 && files.length === 0) return;
    const timer = setTimeout(() => {
      saveWorkspaceSession(pages, files, metadata, compression);
    }, 1000);
    return () => clearTimeout(timer);
  }, [pages, files, metadata, compression]);

  // Ingestion: Processing dropped / selected / pasted files
  const handleFilesAdded = useCallback(async (newFiles: File[]) => {
    if (newFiles.length === 0) return;

    setProgress({
      isOpen: true,
      title: 'IMPORTING FILES',
      current: 0,
      total: newFiles.length,
      statusText: 'Reading files locally...',
      canCancel: false,
    });

    const addedPages: PageItem[] = [];
    const addedFiles: SourceFile[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      setProgress((prev) => ({
        ...prev,
        current: i + 1,
        statusText: `Processing ${file.name} (${i + 1} of ${newFiles.length})...`,
      }));

      await new Promise((resolve) => setTimeout(resolve, 0));

      try {
        const result = await processSingleFile(file);
        if (result) {
          addedFiles.push(result.file);
          addedPages.push(...result.pages);
        }
      } catch (err) {
        console.error(`Error processing file ${file.name}:`, err);
      }
    }

    setPages((prev) => [...prev, ...addedPages]);
    setFiles((prev) => [...prev, ...addedFiles]);
    playSuccessSound();

    setProgress({
      isOpen: false,
      title: '',
      current: 0,
      total: 0,
      statusText: '',
    });
  }, []);

  // 3. Global Drag & Drop Handlers for File Ingestion
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current += 1;
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsDraggingOver(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        setIsDraggingOver(false);
        dragCounterRef.current = 0;
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      dragCounterRef.current = 0;
      if (e.dataTransfer) {
        const extractedFiles = await extractFilesFromDataTransfer(e.dataTransfer);
        if (extractedFiles.length > 0) {
          handleFilesAdded(extractedFiles);
        }
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleFilesAdded]);

  // 4. Global Clipboard Paste Listener (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) {
        return;
      }

      if (!e.clipboardData) return;

      const items = e.clipboardData.items;
      const extractedFiles: File[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            let fileName = file.name;
            if (!fileName || fileName === 'image.png' || fileName === 'blob') {
              fileName = `screenshot_${pasteCountRef.current++}.png`;
            }
            const namedFile = new File([file], fileName, { type: file.type || 'image/png' });
            extractedFiles.push(namedFile);
          }
        } else if (item.kind === 'string' && item.type === 'text/plain') {
          item.getAsString((text) => {
            if (text && text.trim().length > 0 && extractedFiles.length === 0) {
              const textFile = new File(
                [text],
                `pasted_text_${pasteCountRef.current++}.txt`,
                { type: 'text/plain' }
              );
              handleFilesAdded([textFile]);
            }
          });
        }
      }

      if (extractedFiles.length > 0) {
        e.preventDefault();
        handleFilesAdded(extractedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFilesAdded]);

  const handlePasteButtonClick = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();
        const extractedFiles: File[] = [];

        for (const item of clipboardItems) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type);
              const file = new File(
                [blob],
                `screenshot_${pasteCountRef.current++}.png`,
                { type }
              );
              extractedFiles.push(file);
            }
          }
        }

        if (extractedFiles.length > 0) {
          handleFilesAdded(extractedFiles);
          return;
        }
      }

      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().length > 0) {
          const textFile = new File(
            [text],
            `pasted_text_${pasteCountRef.current++}.txt`,
            { type: 'text/plain' }
          );
          handleFilesAdded([textFile]);
          return;
        }
      }

      alert('Clipboard is empty or does not contain image/text data. Press Cmd+V / Ctrl+V directly.');
    } catch {
      alert('Press Cmd+V (Mac) or Ctrl+V (Windows) anywhere on the page to paste.');
    }
  };

  // Selection Logic
  const selectAllPages = useCallback(() => {
    setSelectedIds(new Set(pages.map((p) => p.id)));
    playTickSound();
  }, [pages]);

  const deselectAllPages = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedIndex(null);
  }, []);

  const deleteSelectedPages = useCallback(() => {
    setPages((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
    setLastSelectedIndex(null);
    playTickSound();
  }, [selectedIds]);

  // Page Operations
  const handleRotateSinglePageCw = useCallback((id: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, rotation: ((p.rotation + 90) % 360) } : p
      )
    );
    playTickSound();
  }, []);

  const handleRotateSinglePageCcw = useCallback((id: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, rotation: (((p.rotation - 90) % 360) + 360) % 360 } : p
      )
    );
    playTickSound();
  }, []);

  const handleRotateSelectedCw = useCallback(() => {
    setPages((prev) =>
      prev.map((p) =>
        selectedIds.has(p.id) ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
    playTickSound();
  }, [selectedIds]);

  const handleRotateSelectedCcw = useCallback(() => {
    setPages((prev) =>
      prev.map((p) =>
        selectedIds.has(p.id)
          ? { ...p, rotation: (((p.rotation - 90) % 360) + 360) % 360 }
          : p
      )
    );
    playTickSound();
  }, [selectedIds]);

  const handleDuplicateSelected = useCallback(() => {
    setPages((prev) => {
      const next: PageItem[] = [];
      for (const p of prev) {
        next.push(p);
        if (selectedIds.has(p.id)) {
          next.push({
            ...p,
            id: `page_dup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          });
        }
      }
      return next;
    });
    playTickSound();
  }, [selectedIds]);

  // 5. Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && pages.length > 0) {
        e.preventDefault();
        selectAllPages();
      }

      if (e.key === 'Escape') {
        if (selectedIds.size > 0) {
          deselectAllPages();
        }
      }

      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedIds.size > 0) {
        e.preventDefault();
        deleteSelectedPages();
      }

      if (e.code === 'Space' && selectedIds.size > 0 && !isPreviewOpen) {
        e.preventDefault();
        const firstSelectedId = Array.from(selectedIds)[0];
        const idx = pages.findIndex((p) => p.id === firstSelectedId);
        if (idx !== -1) {
          setPreviewPageIndex(idx);
          setIsPreviewOpen(true);
        }
      }

      // 'R' key: Quick rotate selected clockwise
      if (e.key.toLowerCase() === 'r' && selectedIds.size > 0 && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleRotateSelectedCw();
      }

      // 'D' key: Quick duplicate selected
      if (e.key.toLowerCase() === 'd' && selectedIds.size > 0 && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleDuplicateSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    pages,
    selectedIds,
    isPreviewOpen,
    selectAllPages,
    deselectAllPages,
    deleteSelectedPages,
    handleRotateSelectedCw,
    handleDuplicateSelected,
  ]);

  // Reorder Single Page
  const handleReorderPages = (activeId: string, overId: string) => {
    setPages((currentPages) => {
      const oldIndex = currentPages.findIndex((p) => p.id === activeId);
      const newIndex = currentPages.findIndex((p) => p.id === overId);
      if (oldIndex === -1 || newIndex === -1) return currentPages;

      const updated = [...currentPages];
      const [moved] = updated.splice(oldIndex, 1);
      updated.splice(newIndex, 0, moved);
      return updated;
    });
  };

  // Reorder Multiple Selected Pages together
  const handleReorderMultiple = (
    _draggedId: string,
    overId: string,
    selectedIdSet: Set<string>
  ) => {
    setPages((currentPages) => {
      const targetIndex = currentPages.findIndex((p) => p.id === overId);
      if (targetIndex === -1) return currentPages;

      const selectedPages = currentPages.filter((p) => selectedIdSet.has(p.id));
      const unselectedPages = currentPages.filter((p) => !selectedIdSet.has(p.id));

      const newInsertIndex = Math.min(targetIndex, unselectedPages.length);
      const result = [...unselectedPages];
      result.splice(newInsertIndex, 0, ...selectedPages);
      return result;
    });
  };

  // Multi-Select Card Handler
  const handlePageSelect = useCallback(
    (id: string, e: React.MouseEvent) => {
      const clickedIndex = pages.findIndex((p) => p.id === id);
      if (clickedIndex === -1) return;
      playTickSound();

      if (e.shiftKey && lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, clickedIndex);
        const end = Math.max(lastSelectedIndex, clickedIndex);
        const rangeIds = pages.slice(start, end + 1).map((p) => p.id);

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
          const next = new Set(prev);
          if (next.has(id) && next.size === 1) {
            next.clear();
          } else {
            next.clear();
            next.add(id);
          }
          return next;
        });
        setLastSelectedIndex(clickedIndex);
      }
    },
    [pages, lastSelectedIndex]
  );

  // Marquee Selection Box Handler (drag rectangle over cards)
  const handleMarqueeSelect = useCallback((matchedIds: string[], isAdditive: boolean) => {
    setSelectedIds((prev) => {
      const next = isAdditive ? new Set(prev) : new Set<string>();
      matchedIds.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const selectOddPages = () => {
    const odds = pages.filter((_, i) => i % 2 === 0).map((p) => p.id);
    setSelectedIds(new Set(odds));
    playTickSound();
  };

  const selectEvenPages = () => {
    const evens = pages.filter((_, i) => i % 2 !== 0).map((p) => p.id);
    setSelectedIds(new Set(evens));
    playTickSound();
  };

  const invertSelection = () => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      pages.forEach((p) => {
        if (!prev.has(p.id)) next.add(p.id);
      });
      return next;
    });
    playTickSound();
  };

  const handleApplyRangeSelection = (indices: number[]) => {
    const targetIds = indices.map((idx) => pages[idx]?.id).filter(Boolean);
    setSelectedIds(new Set(targetIds));
    playTickSound();
  };

  const handleDeleteSinglePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    playTickSound();
  };

  const handleDuplicateSinglePage = (id: string) => {
    setPages((prev) => {
      const index = prev.findIndex((p) => p.id === id);
      if (index === -1) return prev;
      const original = prev[index];
      const clone: PageItem = {
        ...original,
        id: `page_dup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      };
      const next = [...prev];
      next.splice(index + 1, 0, clone);
      return next;
    });
    playTickSound();
  };

  const handleReverseOrder = () => {
    if (selectedIds.size > 1) {
      setPages((prev) => {
        const selectedIndices = prev
          .map((p, idx) => (selectedIds.has(p.id) ? idx : -1))
          .filter((idx) => idx !== -1);
        const reversedSelectedPages = selectedIndices.map((idx) => prev[idx]).reverse();

        const updated = [...prev];
        selectedIndices.forEach((origIdx, i) => {
          updated[origIdx] = reversedSelectedPages[i];
        });
        return updated;
      });
    } else {
      setPages((prev) => [...prev].reverse());
    }
    playTickSound();
  };

  // Bulk Quick Layout Actions
  const handleBulkSetFormat = (format: PageFormat) => {
    setPages((prev) =>
      prev.map((p) =>
        selectedIds.has(p.id) ? { ...p, layout: { ...p.layout, format } } : p
      )
    );
    playTickSound();
  };

  const handleBulkSetSizing = (sizingMode: SizingMode) => {
    setPages((prev) =>
      prev.map((p) =>
        selectedIds.has(p.id) ? { ...p, layout: { ...p.layout, sizingMode } } : p
      )
    );
    playTickSound();
  };

  const handleBulkSetOrientation = (orientation: PageOrientation) => {
    setPages((prev) =>
      prev.map((p) =>
        selectedIds.has(p.id) ? { ...p, layout: { ...p.layout, orientation } } : p
      )
    );
    playTickSound();
  };

  const handleBulkSetMargin = (marginMm: number) => {
    const ptPerMm = 72 / 25.4;
    const marginPt = Math.round(marginMm * ptPerMm);
    setPages((prev) =>
      prev.map((p) =>
        selectedIds.has(p.id) ? { ...p, layout: { ...p.layout, marginPt } } : p
      )
    );
    playTickSound();
  };

  const handleUpdatePageLayout = (pageId: string, updates: Partial<PageLayoutOptions>) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId ? { ...p, layout: { ...p.layout, ...updates } } : p
      )
    );
  };

  // Preview Handler
  const handleOpenPreview = (index: number) => {
    setPreviewPageIndex(index);
    setIsPreviewOpen(true);
  };

  // Crop & Resize Handlers
  const handleOpenCropModal = (page?: PageItem) => {
    if (page) {
      setCropTargetPage(page);
    } else if (selectedIds.size === 1) {
      const pageId = Array.from(selectedIds)[0];
      const found = pages.find((p) => p.id === pageId);
      if (found) setCropTargetPage(found);
    }
    setIsCropOpen(true);
  };

  const handleApplyCrop = (pageId: string, crop: CropRect | undefined) => {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, crop } : p))
    );
    playTickSound();
  };

  const handleOpenResizeModal = (page?: PageItem) => {
    setResizeTargetPage(page || null);
    setIsResizeOpen(true);
  };

  const handleApplyLayout = (layout: PageLayoutOptions, scope: 'selected' | 'all') => {
    setPages((prev) =>
      prev.map((p) => {
        if (scope === 'all' || selectedIds.has(p.id) || (resizeTargetPage && p.id === resizeTargetPage.id)) {
          return { ...p, layout };
        }
        return p;
      })
    );
    playSuccessSound();
  };

  // File Group View Helpers
  const handleSelectFilePages = (fileId: string) => {
    const filePageIds = pages.filter((p) => p.fileId === fileId).map((p) => p.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filePageIds.forEach((id) => next.add(id));
      return next;
    });
    playTickSound();
  };

  const handleRotateFilePages = (fileId: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.fileId === fileId ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
    playTickSound();
  };

  const handleRemoveFile = (fileId: string) => {
    setPages((prev) => prev.filter((p) => p.fileId !== fileId));
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    clearPdfCache(fileId);
    playTickSound();
  };

  const handleExtractSelected = () => {
    setExportInitialScope('selected');
    setIsExportOpen(true);
  };

  const handleResetWorkspace = async () => {
    if (window.confirm('Clear all pages and start a fresh empty workspace?')) {
      clearPdfCache();
      await clearWorkspaceSession();
      setPages([]);
      setFiles([]);
      setSelectedIds(new Set());
      setLastSelectedIndex(null);
      setSessionRestoredNotice(null);
      pasteCountRef.current = 1;
    }
  };

  const totalOriginalBytes = files.reduce((acc, f) => acc + f.size, 0) || pages.length * 150000;

  // Export Execution
  const handleExecuteExport = async (options: ExportOptions) => {
    const targetPages =
      options.scope === 'selected' && selectedIds.size > 0
        ? pages.filter((p) => selectedIds.has(p.id))
        : pages;

    if (targetPages.length === 0) {
      alert('No pages to export.');
      return;
    }

    const filesMap = new Map<string, SourceFile>();
    files.forEach((f) => filesMap.set(f.id, f));

    setProgress({
      isOpen: true,
      title: `EXPORTING AS ${options.format.toUpperCase()}`,
      current: 0,
      total: targetPages.length,
      statusText: 'Initializing conversion...',
      canCancel: false,
    });

    try {
      if (options.format === 'pdf') {
        const pdfBytes = await generateMergedPdf(
          targetPages,
          filesMap,
          options.compression,
          options.metadata,
          (current, total) => {
            setProgress((prev) => ({
              ...prev,
              current,
              total,
              statusText: `Rendering WYSIWYG page ${current} of ${total}...`,
            }));
          }
        );
        triggerFileDownload(pdfBytes, options.outputFileName);
        playSuccessSound();
      } else if (['jpg', 'png', 'webp'].includes(options.format)) {
        const mimeType =
          options.format === 'png'
            ? 'image/png'
            : options.format === 'webp'
            ? 'image/webp'
            : 'image/jpeg';
        const ext = options.format;

        const renderedImages: { name: string; data: Uint8Array }[] = [];

        for (let i = 0; i < targetPages.length; i++) {
          const page = targetPages[i];
          setProgress((prev) => ({
            ...prev,
            current: i + 1,
            total: targetPages.length,
            statusText: `Rendering WYSIWYG page ${i + 1} of ${targetPages.length} to ${ext.toUpperCase()}...`,
          }));

          let rawCanvas: HTMLCanvasElement;
          const sourceFile = filesMap.get(page.fileId);

          if (page.fileType === 'pdf' && sourceFile) {
            const buf = await sourceFile.file.arrayBuffer();
            const doc = await getPdfDocument(sourceFile.id, buf);
            rawCanvas = await renderPdfPageToCanvas(doc, page.originalPageIndex, options.imageScale * 1.5, 0);
          } else {
            const img = await loadImageFromBlob(page.blob);
            rawCanvas = document.createElement('canvas');
            rawCanvas.width = img.naturalWidth || img.width;
            rawCanvas.height = img.naturalHeight || img.height;
            const ctx = rawCanvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, rawCanvas.width, rawCanvas.height);
              ctx.drawImage(img, 0, 0);
            }
          }

          const targetCanvas = document.createElement('canvas');
          drawWysiwygPageToCanvas(rawCanvas, page, targetCanvas, {
            scaleMultiplier: options.imageScale,
            showMarginGuides: false,
          });

          const blob = await canvasToBlob(targetCanvas, mimeType, options.imageQuality);
          const bytes = new Uint8Array(await blob.arrayBuffer());
          const baseName = page.fileName.replace(/\.[^/.]+$/, '');
          renderedImages.push({
            name: `${baseName}_page_${i + 1}.${ext}`,
            data: bytes,
          });
        }

        if (renderedImages.length === 1) {
          triggerFileDownload(renderedImages[0].data, renderedImages[0].name);
        } else {
          downloadAsZip(renderedImages, options.outputFileName);
        }
        playSuccessSound();
      } else if (options.format === 'split-pdf') {
        const splitPdfs = await generateSplitPdfs(
          targetPages,
          filesMap,
          options.compression,
          options.splitMode || 'single-page',
          options.splitChunkSize || 1,
          options.metadata,
          (current, total) => {
            setProgress((prev) => ({
              ...prev,
              current,
              total,
              statusText: `Splitting document chunk ${current} of ${total}...`,
            }));
          }
        );
        downloadAsZip(
          splitPdfs.map((s) => ({ name: s.fileName, data: s.data })),
          options.outputFileName
        );
        playSuccessSound();
      } else if (options.format === 'txt' || options.format === 'csv') {
        const textParts = targetPages.map((p, idx) => {
          const header = `--- PAGE ${idx + 1} (${p.fileName}) ---\n`;
          return header + (p.textContent || '[No extractable text content on this page]');
        });
        const combinedText = textParts.join('\n\n');
        const blob = new Blob([combinedText], { type: 'text/plain;charset=utf-8' });
        triggerFileDownload(blob, options.outputFileName);
        playSuccessSound();
      }
    } catch (err) {
      console.error('Export execution error:', err);
      alert('An error occurred while exporting: ' + String(err));
    } finally {
      setProgress({
        isOpen: false,
        title: '',
        current: 0,
        total: 0,
        statusText: '',
      });
    }
  };

  return (
    <div
      className="min-h-screen bg-[#fafafa] text-black flex flex-col font-sans selection:bg-black selection:text-white"
      onClick={(e) => {
        // Deselect if clicking on empty workspace background
        const target = e.target as HTMLElement;
        if (!target.closest('[data-page-id]') && !target.closest('button') && !target.closest('input') && !target.closest('select')) {
          if (selectedIds.size > 0) {
            deselectAllPages();
          }
        }
      }}
    >
      {/* Hidden File Input for Add Files button */}
      <input
        ref={fileInputTriggerRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.txt,.csv"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesAdded(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
      />

      {/* Global Header */}
      <Header
        pageCount={pages.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        zoomScale={zoomScale}
        onZoomChange={setZoomScale}
        onAddFilesClick={() => fileInputTriggerRef.current?.click()}
        onPasteClick={handlePasteButtonClick}
        onResetClick={handleResetWorkspace}
        onOpenMetadata={() => setIsMetadataOpen(true)}
      />

      {/* Workspace Restored Notification Banner */}
      {sessionRestoredNotice && pages.length > 0 && (
        <div className="bg-black text-white px-4 py-2 text-xs font-mono flex items-center justify-between">
          <span>{sessionRestoredNotice}</span>
          <button
            onClick={() => setSessionRestoredNotice(null)}
            className="text-[11px] underline ml-3 hover:text-neutral-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* DropZone & Drag Overlay */}
      <DropZone
        isDraggingOver={isDraggingOver}
        onFilesSelected={handleFilesAdded}
        onPasteClick={handlePasteButtonClick}
        isEmpty={pages.length === 0}
      />

      {/* Active Workspace View */}
      {pages.length > 0 && (
        <main
          ref={workspaceContainerRef}
          className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4"
        >
          {/* Floating/Sticky Selection Toolbar */}
          <SelectionBar
            selectedCount={selectedIds.size}
            totalCount={pages.length}
            onRotateCw={handleRotateSelectedCw}
            onRotateCcw={handleRotateSelectedCcw}
            onDelete={deleteSelectedPages}
            onDuplicate={handleDuplicateSelected}
            onReverseOrder={handleReverseOrder}
            onOpenCrop={() => handleOpenCropModal()}
            onOpenResize={() => handleOpenResizeModal()}
            onExtract={handleExtractSelected}
            onOpenRangeSelector={() => setIsRangeSelectorOpen(true)}
            onSelectOdd={selectOddPages}
            onSelectEven={selectEvenPages}
            onSelectAll={selectAllPages}
            onInvertSelection={invertSelection}
            onDeselectAll={deselectAllPages}
            onBulkSetFormat={handleBulkSetFormat}
            onBulkSetSizing={handleBulkSetSizing}
            onBulkSetOrientation={handleBulkSetOrientation}
            onBulkSetMargin={handleBulkSetMargin}
          />

          {/* Marquee Lasso Drag-to-Select wrapper over Grid */}
          <div className="mt-6">
            <MarqueeSelection
              containerRef={workspaceContainerRef}
              onSelectPages={handleMarqueeSelect}
            >
              {viewMode === 'unified' ? (
                <PageGrid
                  pages={pages}
                  selectedIds={selectedIds}
                  zoomScale={zoomScale}
                  onReorder={handleReorderPages}
                  onReorderMultiple={handleReorderMultiple}
                  onSelect={handlePageSelect}
                  onRotateCw={handleRotateSinglePageCw}
                  onRotateCcw={handleRotateSinglePageCcw}
                  onDelete={handleDeleteSinglePage}
                  onDuplicate={handleDuplicateSinglePage}
                  onOpenCrop={handleOpenCropModal}
                  onOpenResize={handleOpenResizeModal}
                  onOpenPreview={handleOpenPreview}
                  onAddFilesClick={() => fileInputTriggerRef.current?.click()}
                />
              ) : (
                <FileGroupView
                  pages={pages}
                  files={files}
                  selectedIds={selectedIds}
                  zoomScale={zoomScale}
                  onReorder={handleReorderPages}
                  onSelect={handlePageSelect}
                  onRotateCw={handleRotateSinglePageCw}
                  onRotateCcw={handleRotateSinglePageCcw}
                  onDelete={handleDeleteSinglePage}
                  onDuplicate={handleDuplicateSinglePage}
                  onOpenCrop={handleOpenCropModal}
                  onOpenResize={handleOpenResizeModal}
                  onOpenPreview={handleOpenPreview}
                  onAddFilesClick={() => fileInputTriggerRef.current?.click()}
                  onSelectFilePages={handleSelectFilePages}
                  onRotateFilePages={handleRotateFilePages}
                  onRemoveFile={handleRemoveFile}
                  onFlattenToUnified={() => setViewMode('unified')}
                />
              )}
            </MarqueeSelection>
          </div>
        </main>
      )}

      {/* Persistent Bottom Action Bar */}
      {pages.length > 0 && (
        <BottomActionBar
          pageCount={pages.length}
          fileCount={files.length}
          compression={compression}
          onOpenCompress={() => setIsCompressOpen(true)}
          onOpenExport={() => {
            setExportInitialScope('all');
            setIsExportOpen(true);
          }}
        />
      )}

      {/* Modals */}
      <RangeSelectorModal
        isOpen={isRangeSelectorOpen}
        totalCount={pages.length}
        onClose={() => setIsRangeSelectorOpen(false)}
        onApplyRange={handleApplyRangeSelection}
      />

      <CropModal
        isOpen={isCropOpen}
        page={cropTargetPage}
        onClose={() => {
          setIsCropOpen(false);
          setCropTargetPage(null);
        }}
        onApplyCrop={handleApplyCrop}
      />

      <ResizeModal
        isOpen={isResizeOpen}
        selectedCount={selectedIds.size}
        totalCount={pages.length}
        initialLayout={resizeTargetPage?.layout}
        onClose={() => {
          setIsResizeOpen(false);
          setResizeTargetPage(null);
        }}
        onApplyLayout={handleApplyLayout}
      />

      <MetadataModal
        isOpen={isMetadataOpen}
        metadata={metadata}
        onClose={() => setIsMetadataOpen(false)}
        onSave={setMetadata}
      />

      <CompressModal
        isOpen={isCompressOpen}
        currentSettings={compression}
        originalEstimatedBytes={totalOriginalBytes}
        onClose={() => setIsCompressOpen(false)}
        onApply={setCompression}
      />

      <ExportModal
        isOpen={isExportOpen}
        selectedCount={selectedIds.size}
        totalCount={pages.length}
        currentCompression={compression}
        metadata={metadata}
        initialScope={exportInitialScope}
        onClose={() => setIsExportOpen(false)}
        onOpenMetadata={() => setIsMetadataOpen(true)}
        onOpenCompress={() => setIsCompressOpen(true)}
        onExport={handleExecuteExport}
      />

      <PreviewModal
        isOpen={isPreviewOpen}
        pages={pages}
        files={files}
        initialPageIndex={previewPageIndex}
        onClose={() => setIsPreviewOpen(false)}
        onRotateCw={handleRotateSinglePageCw}
        onRotateCcw={handleRotateSinglePageCcw}
        onOpenCrop={(p) => {
          setIsPreviewOpen(false);
          handleOpenCropModal(p);
        }}
        onDelete={handleDeleteSinglePage}
        onUpdatePageLayout={handleUpdatePageLayout}
      />

      <ProgressModal
        progress={progress}
      />
    </div>
  );
};
