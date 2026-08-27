import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { PageItem, SourceFile, PageFormat, PageOrientation } from '../types';
import { getPdfDocument, renderPdfPageToCanvas } from '../services/pdfRenderService';
import { loadImageFromBlob } from '../services/imageService';
import { calculatePageGeometry, drawWysiwygPageToCanvas } from '../services/layoutEngine';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, RotateCw, RotateCcw, Crop as CropIcon, Trash2, Loader2, Grid } from 'lucide-react';

interface PreviewModalProps {
  isOpen: boolean;
  pages: PageItem[];
  files: SourceFile[];
  initialPageIndex: number;
  onClose: () => void;
  onRotateCw: (pageId: string) => void;
  onRotateCcw: (pageId: string) => void;
  onOpenCrop: (page: PageItem) => void;
  onDelete: (pageId: string) => void;
  onUpdatePageLayout: (pageId: string, updates: Partial<PageItem['layout']>) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, pages, files, initialPageIndex, onClose, onRotateCw, onRotateCcw, onOpenCrop, onDelete, onUpdatePageLayout }) => {
  const [currentIndex, setCurrentIndex] = useState(initialPageIndex);
  const [zoom, setZoom] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [showMarginGuides, setShowMarginGuides] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rawContentCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialPageIndex, pages.length - 1)));
      setZoom(1.0);
    }
  }, [isOpen, initialPageIndex, pages.length]);

  const currentPage = pages[currentIndex];
  const currentPageId = currentPage?.id;

  const goToPrev = useCallback(() => setCurrentIndex((i) => Math.max(0, i - 1)), []);
  const goToNext = useCallback(() => setCurrentIndex((i) => Math.min(pages.length - 1, i + 1)), [pages.length]);
  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(3.0, z + 0.25)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(0.5, z - 0.25)), []);
  const handleZoomReset = useCallback(() => setZoom(1.0), []);

  const geom = useMemo(() => currentPage ? calculatePageGeometry(currentPage.width, currentPage.height, currentPage.rotation, currentPage.crop, currentPage.layout) : null, [currentPage]);

  useEffect(() => {
    if (!isOpen || !currentPage) return;
    let isMounted = true;
    setIsLoading(true);
    async function loadHighResPreview() {
      try {
        let sourceCanvas: HTMLCanvasElement;
        const sourceFile = files.find((f) => f.id === currentPage.fileId);
        if (currentPage.fileType === 'pdf' && sourceFile) {
          const buffer = await sourceFile.file.arrayBuffer();
          const doc = await getPdfDocument(sourceFile.id, buffer);
          sourceCanvas = await renderPdfPageToCanvas(doc, currentPage.originalPageIndex, 2.5, 0);
        } else {
          const img = await loadImageFromBlob(currentPage.blob);
          sourceCanvas = document.createElement('canvas');
          sourceCanvas.width = img.naturalWidth || img.width;
          sourceCanvas.height = img.naturalHeight || img.height;
          const ctx = sourceCanvas.getContext('2d');
          if (ctx) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height); ctx.drawImage(img, 0, 0); }
        }
        rawContentCanvasRef.current = sourceCanvas;
        if (isMounted && canvasRef.current) {
          drawWysiwygPageToCanvas(sourceCanvas, currentPage, canvasRef.current, { scaleMultiplier: 2.0, showMarginGuides });
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load high-res preview:', err);
        if (isMounted) setIsLoading(false);
      }
    }
    loadHighResPreview();
    return () => { isMounted = false; };
  }, [isOpen, currentPageId, showMarginGuides, files, currentPage]);

  useEffect(() => {
    if (rawContentCanvasRef.current && canvasRef.current && currentPage) {
      drawWysiwygPageToCanvas(rawContentCanvasRef.current, currentPage, canvasRef.current, { scaleMultiplier: 2.0, showMarginGuides });
    }
  }, [currentPage?.layout, currentPage?.rotation, currentPage?.crop, showMarginGuides, currentPage]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goToPrev();
      else if (e.key === 'ArrowRight') goToNext();
      else if (e.key === '+' || e.key === '=') handleZoomIn();
      else if (e.key === '-' || e.key === '_') handleZoomOut();
      else if (e.key === '0') setZoom(1.0);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goToPrev, goToNext, handleZoomIn, handleZoomOut]);

  if (!isOpen || !currentPage || !geom) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col select-none animate-fade-in text-white font-mono">
      <div className="h-14 px-4 sm:px-6 bg-black border-b border-neutral-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 text-xs">
          <span className="bg-white text-black font-bold px-2 py-0.5">{currentIndex + 1} / {pages.length}</span>
          <span className="text-neutral-200 font-bold truncate max-w-xs" title={currentPage.fileName}>{currentPage.fileName}</span>
          <span className="hidden lg:inline text-neutral-400 text-[11px]">({Math.round(geom.paperWidth * 0.3528)} × {Math.round(geom.paperHeight * 0.3528)} mm · {currentPage.layout.format.toUpperCase()})</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center border border-neutral-700 bg-neutral-900">
            <button onClick={() => onUpdatePageLayout(currentPage.id, { sizingMode: 'fit' })} className={`px-2 py-1 transition-colors ${currentPage.layout.sizingMode === 'fit' ? 'bg-white text-black font-bold' : 'hover:bg-neutral-800'}`}>FIT</button>
            <button onClick={() => onUpdatePageLayout(currentPage.id, { sizingMode: 'fill' })} className={`px-2 py-1 border-l border-neutral-700 transition-colors ${currentPage.layout.sizingMode === 'fill' ? 'bg-white text-black font-bold' : 'hover:bg-neutral-800'}`}>FILL</button>
            <button onClick={() => onUpdatePageLayout(currentPage.id, { sizingMode: 'stretch' })} className={`px-2 py-1 border-l border-neutral-700 transition-colors hidden sm:inline-block ${currentPage.layout.sizingMode === 'stretch' ? 'bg-white text-black font-bold' : 'hover:bg-neutral-800'}`}>STRETCH</button>
          </div>
          <select value={currentPage.layout.format} onChange={(e) => onUpdatePageLayout(currentPage.id, { format: e.target.value as PageFormat })} className="px-2 py-1 border border-neutral-700 bg-neutral-900 text-xs text-white uppercase focus:outline-none">
            <option value="a4">A4</option><option value="letter">Letter</option><option value="legal">Legal</option><option value="a3">A3</option><option value="original">Original</option>
          </select>
          <select value={currentPage.layout.orientation} onChange={(e) => onUpdatePageLayout(currentPage.id, { orientation: e.target.value as PageOrientation })} className="px-2 py-1 border border-neutral-700 bg-neutral-900 text-xs text-white uppercase focus:outline-none hidden sm:inline-block">
            <option value="auto">Auto</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option>
          </select>
          <select value={currentPage.layout.marginPt} onChange={(e) => onUpdatePageLayout(currentPage.id, { marginPt: Number(e.target.value) })} className="px-2 py-1 border border-neutral-700 bg-neutral-900 text-xs text-white focus:outline-none hidden md:inline-block">
            <option value={0}>0 mm Margin</option><option value={17}>6 mm Margin</option><option value={36}>12.7 mm Margin</option><option value={72}>25.4 mm Margin</option>
          </select>
          <button onClick={() => setShowMarginGuides(!showMarginGuides)} className={`p-1.5 border border-neutral-700 text-xs transition-colors hidden lg:flex items-center gap-1 ${showMarginGuides ? 'bg-neutral-800 text-white' : 'bg-neutral-900 text-neutral-400'}`}><Grid size={12} /></button>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 border border-neutral-700 bg-neutral-900 p-0.5 text-xs">
            <button onClick={handleZoomOut} className="p-1 hover:bg-white hover:text-black transition-colors"><ZoomOut size={13} /></button>
            <span className="px-1.5 text-[11px] font-bold min-w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="p-1 hover:bg-white hover:text-black transition-colors"><ZoomIn size={13} /></button>
            <button onClick={handleZoomReset} className="p-1 hover:bg-white hover:text-black transition-colors border-l border-neutral-700"><Maximize size={13} /></button>
          </div>
          <div className="flex items-center border border-neutral-700 bg-neutral-900">
            <button onClick={() => onRotateCcw(currentPage.id)} className="p-1.5 hover:bg-white hover:text-black transition-colors"><RotateCcw size={13} /></button>
            <button onClick={() => onRotateCw(currentPage.id)} className="p-1.5 hover:bg-white hover:text-black border-l border-neutral-700 transition-colors"><RotateCw size={13} /></button>
          </div>
          <button onClick={() => { onClose(); onOpenCrop(currentPage); }} className="p-1.5 border border-neutral-700 bg-neutral-900 hover:bg-white hover:text-black transition-colors text-xs flex items-center gap-1"><CropIcon size={13} /><span className="hidden sm:inline">CROP</span></button>
          <button onClick={() => { onDelete(currentPage.id); if (pages.length <= 1) onClose(); else if (currentIndex >= pages.length - 1) setCurrentIndex(pages.length - 2); }} className="p-1.5 border border-neutral-700 bg-neutral-900 hover:bg-red-600 transition-colors"><Trash2 size={13} /></button>
          <button onClick={onClose} className="p-1.5 ml-2 bg-white text-black hover:bg-neutral-200 transition-colors font-bold"><X size={15} /></button>
        </div>
      </div>
      <div className="flex-1 relative flex items-center justify-center p-4 sm:p-8 overflow-auto bg-neutral-900/90">
        {currentIndex > 0 && <button onClick={goToPrev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/80 hover:bg-white hover:text-black border border-white/30 flex items-center justify-center transition-all cursor-pointer shadow-xl"><ChevronLeft size={24} /></button>}
        {currentIndex < pages.length - 1 && <button onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/80 hover:bg-white hover:text-black border border-white/30 flex items-center justify-center transition-all cursor-pointer shadow-xl"><ChevronRight size={24} /></button>}
        {isLoading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40"><Loader2 size={32} className="animate-spin text-white" /></div>}
        <div className="relative transition-transform duration-100 flex items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.7)] border border-neutral-600 bg-white" style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
          <canvas ref={canvasRef} className="max-h-[calc(100vh-10rem)] max-w-[calc(100vw-10rem)] object-contain block bg-white" />
        </div>
      </div>
      <div className="h-16 px-4 bg-black border-t border-neutral-800 flex items-center justify-center gap-2 overflow-x-auto py-2">
        {pages.map((p, idx) => (
          <button key={p.id} onClick={() => setCurrentIndex(idx)} className={`relative h-11 w-8 sm:w-9 flex-shrink-0 border transition-all overflow-hidden bg-neutral-800 ${idx === currentIndex ? 'border-white ring-2 ring-white scale-105' : 'border-neutral-700 opacity-50 hover:opacity-100'}`}>
            <img src={p.thumbnailUrl} alt="" className="w-full h-full object-cover" style={{ transform: `rotate(${p.rotation || 0}deg)` }} />
            <span className="absolute bottom-0 right-0 bg-black text-white text-[8px] font-mono px-0.5 leading-none">{idx + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
