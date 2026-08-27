import React, { useState, useRef, useCallback } from 'react';
import type {
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
  ImageFilterType,
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
import { ShortcutsModal } from './components/ShortcutsModal';
import { MarqueeSelection } from './components/MarqueeSelection';

import { usePageSelection } from './hooks/usePageSelection';
import { useFileIngestion } from './hooks/useFileIngestion';
import { useGlobalDragDrop } from './hooks/useGlobalDragDrop';
import { useClipboardPaste } from './hooks/useClipboardPaste';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useWorkspacePersistence } from './hooks/useWorkspacePersistence';

import { clearPdfCache } from './services/pdfRenderService';
import { executeExport } from './services/exportService';
import { recognizeTextFromImage } from './services/ocrService';
import { playTickSound, playSuccessSound } from './services/soundService';

import { generateDupId } from './utils/id';
import { reorderPages, reorderMultiple, normalizeRotation } from './utils/geometry';
import { estimateTotalBytes } from './utils/bytes';
import { PT_PER_MM } from './constants/paper';
import { DEFAULT_COMPRESSION, DEFAULT_METADATA, ACCEPTED_FILE_TYPES } from './constants/app';

export const App: React.FC = () => {
  // Core workspace state
  const [pages, setPages] = useState<PageItem[]>([]);
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('unified');
  const [zoomScale, setZoomScale] = useState(1.0);
  const [compression, setCompression] = useState<CompressionSettings>({ ...DEFAULT_COMPRESSION });
  const [metadata, setMetadata] = useState<PdfMetadata>({ ...DEFAULT_METADATA });

  // Selection
  const selection = usePageSelection(pages);

  // Progress (shared between ingestion & export & OCR)
  const [progress, setProgress] = useState<ProgressState>({
    isOpen: false, title: '', current: 0, total: 0, statusText: '', canCancel: false,
  });

  // Modals
  const [isRangeSelectorOpen, setIsRangeSelectorOpen] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropTargetPage, setCropTargetPage] = useState<PageItem | null>(null);
  const [isResizeOpen, setIsResizeOpen] = useState(false);
  const [resizeTargetPage, setResizeTargetPage] = useState<PageItem | null>(null);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [isCompressOpen, setIsCompressOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportInitialScope, setExportInitialScope] = useState<'all' | 'selected'>('all');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const fileInputTriggerRef = useRef<HTMLInputElement>(null);
  const workspaceContainerRef = useRef<HTMLDivElement | null>(null);

  // Persistence
  const handleRestore = useCallback((restoredPages: PageItem[], restoredFiles: SourceFile[], restoredMeta?: PdfMetadata, restoredComp?: CompressionSettings) => {
    setPages(restoredPages);
    setFiles(restoredFiles);
    if (restoredMeta) setMetadata(restoredMeta);
    if (restoredComp) setCompression(restoredComp);
  }, []);

  const { restoreNotice, dismissNotice, clearSession } = useWorkspacePersistence({
    pages, files, metadata, compression, onRestore: handleRestore,
  });

  // Ingestion
  const handlePagesAdded = useCallback((addedPages: PageItem[], addedFiles: SourceFile[]) => {
    setPages(prev => [...prev, ...addedPages]);
    setFiles(prev => [...prev, ...addedFiles]);
  }, []);

  const ingestion = useFileIngestion(handlePagesAdded, progress, setProgress);

  // Global drag & paste
  const { isDraggingOver } = useGlobalDragDrop(ingestion.extractAndAddFromDataTransfer);
  const { handlePasteButtonClick, resetCounter } = useClipboardPaste(ingestion.handleFilesAdded);

  // ---- Page operations ----
  const rotateSingleCw = useCallback((id: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, rotation: normalizeRotation((p.rotation + 90) % 360) } : p));
    playTickSound();
  }, []);

  const rotateSingleCcw = useCallback((id: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, rotation: normalizeRotation(((p.rotation - 90) % 360 + 360) % 360) } : p));
    playTickSound();
  }, []);

  const rotateSelectedCw = useCallback(() => {
    setPages(prev => prev.map(p => selection.selectedIds.has(p.id) ? { ...p, rotation: normalizeRotation((p.rotation + 90) % 360) } : p));
    playTickSound();
  }, [selection.selectedIds]);

  const rotateSelectedCcw = useCallback(() => {
    setPages(prev => prev.map(p => selection.selectedIds.has(p.id) ? { ...p, rotation: normalizeRotation(((p.rotation - 90) % 360 + 360) % 360) } : p));
    playTickSound();
  }, [selection.selectedIds]);

  const duplicateSingle = useCallback((id: string) => {
    setPages(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx + 1, 0, { ...prev[idx], id: generateDupId() });
      return next;
    });
    playTickSound();
  }, []);

  const duplicateSelected = useCallback(() => {
    setPages(prev => {
      const next: PageItem[] = [];
      for (const p of prev) {
        next.push(p);
        if (selection.selectedIds.has(p.id)) next.push({ ...p, id: generateDupId() });
      }
      return next;
    });
    playTickSound();
  }, [selection.selectedIds]);

  const deleteSingle = useCallback((id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
    selection.deleteFromSelection(id);
    playTickSound();
  }, [selection]);

  const deleteSelected = useCallback(() => {
    setPages(prev => prev.filter(p => !selection.selectedIds.has(p.id)));
    selection.deselectAll();
    playTickSound();
  }, [selection]);

  const reverseOrder = useCallback(() => {
    if (selection.selectedIds.size > 1) {
      setPages(prev => {
        const indices = prev.map((p, idx) => selection.selectedIds.has(p.id) ? idx : -1).filter(idx => idx !== -1);
        const reversed = indices.map(idx => prev[idx]).reverse();
        const updated = [...prev];
        indices.forEach((origIdx, i) => { updated[origIdx] = reversed[i]; });
        return updated;
      });
    } else {
      setPages((prev) => [...prev].reverse());
    }
    playTickSound();
  }, [selection.selectedIds]);

  const handleReorder = useCallback((activeId: string, overId: string) => {
    setPages(prev => reorderPages(prev, activeId, overId));
  }, []);

  const handleReorderMultiple = useCallback((_draggedId: string, overId: string, ids: Set<string>) => {
    setPages(prev => reorderMultiple(prev, overId, ids));
  }, []);

  const handlePageSelect = useCallback((id: string, e: React.MouseEvent) => {
    selection.handlePageSelect(id, e, pages);
  }, [pages, selection]);

  const bulkSetFormat = useCallback((format: PageFormat) => {
    setPages(prev => prev.map(p => selection.selectedIds.has(p.id) ? { ...p, layout: { ...p.layout, format } } : p));
    playTickSound();
  }, [selection.selectedIds]);

  const bulkSetSizing = useCallback((sizingMode: SizingMode) => {
    setPages(prev => prev.map(p => selection.selectedIds.has(p.id) ? { ...p, layout: { ...p.layout, sizingMode } } : p));
    playTickSound();
  }, [selection.selectedIds]);

  const bulkSetOrientation = useCallback((orientation: PageOrientation) => {
    setPages(prev => prev.map(p => selection.selectedIds.has(p.id) ? { ...p, layout: { ...p.layout, orientation } } : p));
    playTickSound();
  }, [selection.selectedIds]);

  const bulkSetMargin = useCallback((marginMm: number) => {
    const marginPt = Math.round(marginMm * PT_PER_MM);
    setPages(prev => prev.map(p => selection.selectedIds.has(p.id) ? { ...p, layout: { ...p.layout, marginPt } } : p));
    playTickSound();
  }, [selection.selectedIds]);

  const bulkSetFilter = useCallback((filter: ImageFilterType) => {
    setPages(prev => prev.map(p => selection.selectedIds.has(p.id) ? { ...p, filter } : p));
    playSuccessSound();
  }, [selection.selectedIds]);

  const handleBulkRecognizeOcr = useCallback(async () => {
    const targetPages = pages.filter(p => selection.selectedIds.has(p.id));
    if (targetPages.length === 0) return;

    setProgress({
      isOpen: true,
      title: 'LOCAL OCR (TEXT RECOGNITION)',
      current: 0,
      total: targetPages.length,
      statusText: 'Initializing Tesseract WebAssembly...',
      canCancel: false,
    });

    for (let i = 0; i < targetPages.length; i++) {
      const page = targetPages[i];
      setProgress(prev => ({
        ...prev,
        current: i + 1,
        statusText: `Recognizing text on page ${i + 1} of ${targetPages.length}...`,
      }));

      try {
        const text = await recognizeTextFromImage(page.blob);
        setPages(prev => prev.map(p => p.id === page.id ? { ...p, textContent: text } : p));
      } catch (err) {
        console.error('OCR recognition error:', err);
      }
    }

    playSuccessSound();
    setProgress({ isOpen: false, title: '', current: 0, total: 0, statusText: '' });
  }, [pages, selection.selectedIds]);

  const updatePageLayout = useCallback((pageId: string, updates: Partial<PageLayoutOptions>) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, layout: { ...p.layout, ...updates } } : p));
  }, []);

  const handleOpenCrop = useCallback((page?: PageItem) => {
    if (page) setCropTargetPage(page);
    else if (selection.selectedIds.size === 1) {
      const id = Array.from(selection.selectedIds)[0];
      const found = pages.find(p => p.id === id);
      if (found) setCropTargetPage(found);
    }
    setIsCropOpen(true);
  }, [pages, selection.selectedIds]);

  const handleApplyCrop = useCallback((pageId: string, crop: CropRect | undefined) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, crop } : p));
    playTickSound();
  }, []);

  const handleOpenResize = useCallback((page?: PageItem) => {
    setResizeTargetPage(page || null);
    setIsResizeOpen(true);
  }, []);

  const handleApplyLayout = useCallback((layout: PageLayoutOptions, scope: 'selected' | 'all') => {
    setPages(prev => prev.map(p => {
      if (scope === 'all' || selection.selectedIds.has(p.id) || (resizeTargetPage && p.id === resizeTargetPage.id)) {
        return { ...p, layout };
      }
      return p;
    }));
    playSuccessSound();
  }, [selection.selectedIds, resizeTargetPage]);

  const handleSelectFilePages = useCallback((fileId: string) => {
    selection.selectFilePages(fileId, pages);
  }, [pages, selection]);

  const handleRotateFilePages = useCallback((fileId: string) => {
    setPages(prev => prev.map(p => p.fileId === fileId ? { ...p, rotation: normalizeRotation((p.rotation + 90) % 360) } : p));
    playTickSound();
  }, []);

  const handleRemoveFile = useCallback((fileId: string) => {
    setPages(prev => prev.filter(p => p.fileId !== fileId));
    setFiles(prev => prev.filter(f => f.id !== fileId));
    clearPdfCache(fileId);
    playTickSound();
  }, []);

  const handleOpenPreview = useCallback((index: number) => {
    setPreviewPageIndex(index);
    setIsPreviewOpen(true);
  }, []);

  const handleResetWorkspace = useCallback(async () => {
    if (!window.confirm('Clear all pages and start a fresh empty workspace?')) return;
    clearPdfCache();
    await clearSession();
    setPages([]);
    setFiles([]);
    selection.deselectAll();
    resetCounter();
  }, [clearSession, selection, resetCounter]);

  const handleExecuteExport = useCallback(async (options: ExportOptions) => {
    try {
      await executeExport(options, pages, files, selection.selectedIds, setProgress);
      playSuccessSound();
    } catch (err) {
      console.error('Export error:', err);
      alert('An error occurred while exporting: ' + String(err));
    }
  }, [pages, files, selection.selectedIds]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    hasPages: pages.length > 0,
    selectedCount: selection.selectedIds.size,
    isPreviewOpen,
    onSelectAll: selection.selectAll,
    onDeselectAll: selection.deselectAll,
    onDeleteSelected: deleteSelected,
    onOpenPreviewFromSelection: () => {
      const firstId = Array.from(selection.selectedIds)[0];
      const idx = pages.findIndex(p => p.id === firstId);
      if (idx !== -1) { setPreviewPageIndex(idx); setIsPreviewOpen(true); }
    },
    onRotateSelectedCw: rotateSelectedCw,
    onDuplicateSelected: duplicateSelected,
    onOpenShortcutsModal: () => setIsShortcutsOpen(true),
  });

  const totalOriginalBytes = estimateTotalBytes(pages.length, files.reduce((a, f) => a + f.size, 0));

  return (
    <div
      className="min-h-screen bg-[#fafafa] text-black flex flex-col font-sans selection:bg-black selection:text-white"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-page-id]') && !target.closest('button') && !target.closest('input') && !target.closest('select')) {
          if (selection.selectedIds.size > 0) selection.deselectAll();
        }
      }}
    >
      <input
        ref={fileInputTriggerRef}
        type="file"
        multiple
        accept={ACCEPTED_FILE_TYPES}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            ingestion.handleFilesAdded(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
      />

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
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {restoreNotice && pages.length > 0 && (
        <div className="bg-black text-white px-4 py-2 text-xs font-mono flex items-center justify-between">
          <span>{restoreNotice}</span>
          <button onClick={dismissNotice} className="text-[11px] underline ml-3 hover:text-neutral-300">Dismiss</button>
        </div>
      )}

      <DropZone
        isDraggingOver={isDraggingOver}
        onFilesSelected={ingestion.handleFilesAdded}
        onPasteClick={handlePasteButtonClick}
        isEmpty={pages.length === 0}
      />

      {pages.length > 0 && (
        <main ref={workspaceContainerRef} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4">
          <SelectionBar
            selectedCount={selection.selectedIds.size}
            totalCount={pages.length}
            onRotateCw={rotateSelectedCw}
            onRotateCcw={rotateSelectedCcw}
            onDelete={deleteSelected}
            onDuplicate={duplicateSelected}
            onReverseOrder={reverseOrder}
            onOpenCrop={() => handleOpenCrop()}
            onOpenResize={() => handleOpenResize()}
            onExtract={() => { setExportInitialScope('selected'); setIsExportOpen(true); }}
            onOpenRangeSelector={() => setIsRangeSelectorOpen(true)}
            onSelectOdd={selection.selectOdd}
            onSelectEven={selection.selectEven}
            onSelectAll={selection.selectAll}
            onInvertSelection={selection.invertSelection}
            onDeselectAll={selection.deselectAll}
            onBulkSetFormat={bulkSetFormat}
            onBulkSetSizing={bulkSetSizing}
            onBulkSetOrientation={bulkSetOrientation}
            onBulkSetMargin={bulkSetMargin}
            onBulkSetFilter={bulkSetFilter}
            onBulkRecognizeOcr={handleBulkRecognizeOcr}
          />

          <div className="mt-6">
            <MarqueeSelection containerRef={workspaceContainerRef} onSelectPages={selection.handleMarqueeSelect}>
              {viewMode === 'unified' ? (
                <PageGrid
                  pages={pages}
                  selectedIds={selection.selectedIds}
                  zoomScale={zoomScale}
                  onReorder={handleReorder}
                  onReorderMultiple={handleReorderMultiple}
                  onSelect={handlePageSelect}
                  onRotateCw={rotateSingleCw}
                  onRotateCcw={rotateSingleCcw}
                  onDelete={deleteSingle}
                  onDuplicate={duplicateSingle}
                  onOpenCrop={handleOpenCrop}
                  onOpenResize={handleOpenResize}
                  onOpenPreview={handleOpenPreview}
                  onAddFilesClick={() => fileInputTriggerRef.current?.click()}
                />
              ) : (
                <FileGroupView
                  pages={pages}
                  files={files}
                  selectedIds={selection.selectedIds}
                  zoomScale={zoomScale}
                  onReorder={handleReorder}
                  onSelect={handlePageSelect}
                  onRotateCw={rotateSingleCw}
                  onRotateCcw={rotateSingleCcw}
                  onDelete={deleteSingle}
                  onDuplicate={duplicateSingle}
                  onOpenCrop={handleOpenCrop}
                  onOpenResize={handleOpenResize}
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

      {pages.length > 0 && (
        <BottomActionBar
          pageCount={pages.length}
          fileCount={files.length}
          compression={compression}
          onOpenCompress={() => setIsCompressOpen(true)}
          onOpenExport={() => { setExportInitialScope('all'); setIsExportOpen(true); }}
        />
      )}

      <RangeSelectorModal
        isOpen={isRangeSelectorOpen}
        totalCount={pages.length}
        onClose={() => setIsRangeSelectorOpen(false)}
        onApplyRange={(indices) => selection.applyRangeIndices(indices, pages)}
      />

      <CropModal
        isOpen={isCropOpen}
        page={cropTargetPage}
        onClose={() => { setIsCropOpen(false); setCropTargetPage(null); }}
        onApplyCrop={handleApplyCrop}
      />

      <ResizeModal
        isOpen={isResizeOpen}
        selectedCount={selection.selectedIds.size}
        totalCount={pages.length}
        initialLayout={resizeTargetPage?.layout}
        onClose={() => { setIsResizeOpen(false); setResizeTargetPage(null); }}
        onApplyLayout={handleApplyLayout}
      />

      <MetadataModal isOpen={isMetadataOpen} metadata={metadata} onClose={() => setIsMetadataOpen(false)} onSave={setMetadata} />

      <CompressModal
        isOpen={isCompressOpen}
        currentSettings={compression}
        originalEstimatedBytes={totalOriginalBytes}
        onClose={() => setIsCompressOpen(false)}
        onApply={setCompression}
      />

      <ExportModal
        isOpen={isExportOpen}
        selectedCount={selection.selectedIds.size}
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
        onRotateCw={rotateSingleCw}
        onRotateCcw={rotateSingleCcw}
        onOpenCrop={(p) => { setIsPreviewOpen(false); handleOpenCrop(p); }}
        onDelete={deleteSingle}
        onUpdatePageLayout={updatePageLayout}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <ProgressModal progress={progress} />
    </div>
  );
};
