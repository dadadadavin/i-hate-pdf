import React, { memo, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageItem } from '../types';
import { drawWysiwygPageToCanvas } from '../services/layoutEngine';
import {
  RotateCw,
  RotateCcw,
  Trash2,
  Copy,
  Crop as CropIcon,
  Maximize2,
  GripVertical,
  Check,
  Eye,
} from 'lucide-react';

interface PageCardProps {
  page: PageItem;
  displayIndex: number;
  isSelected: boolean;
  selectedCount?: number;
  zoomScale?: number;
  isOverlay?: boolean;
  onSelect?: (id: string, e: React.MouseEvent) => void;
  onRotateCw?: (id: string) => void;
  onRotateCcw?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onOpenCrop?: (page: PageItem) => void;
  onOpenResize?: (page: PageItem) => void;
  onOpenPreview?: (index: number) => void;
}

export const PageCard: React.FC<PageCardProps> = memo(({
  page,
  displayIndex,
  isSelected,
  selectedCount = 0,
  zoomScale = 1.0,
  isOverlay = false,
  onSelect,
  onRotateCw,
  onRotateCcw,
  onDelete,
  onDuplicate,
  onOpenCrop,
  onOpenResize,
  onOpenPreview,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: page.id,
    disabled: isOverlay,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCacheRef = useRef<HTMLImageElement | null>(null);

  // Render true WYSIWYG page layout to canvas
  useEffect(() => {
    let active = true;

    async function renderPage() {
      if (!canvasRef.current) return;

      if (!imageCacheRef.current) {
        const img = new Image();
        img.src = page.thumbnailUrl;
        await new Promise((res) => {
          img.onload = () => res(null);
          img.onerror = () => res(null);
        });
        imageCacheRef.current = img;
      }

      if (active && imageCacheRef.current && canvasRef.current) {
        const thumbScale = 0.45 * Math.max(0.6, Math.min(1.5, zoomScale));
        drawWysiwygPageToCanvas(imageCacheRef.current, page, canvasRef.current, {
          scaleMultiplier: thumbScale,
          showMarginGuides: page.layout.marginPt > 0,
        });
      }
    }

    renderPage();

    return () => {
      active = false;
    };
  }, [page, zoomScale]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : isOverlay ? 100 : 1,
    opacity: isDragging ? 0.25 : 1,
    width: `${Math.round(230 * zoomScale)}px`,
  };

  const previewHeight = `${Math.round(270 * zoomScale)}px`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!isOverlay ? attributes : {})}
      {...(!isOverlay ? listeners : {})}
      data-page-id={page.id}
      className={`group relative flex flex-col bg-white border-2 select-none cursor-grab active:cursor-grabbing transition-shadow duration-150 ${
        isOverlay
          ? 'border-black ring-4 ring-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rotate-2 scale-105 pointer-events-none'
          : isSelected
          ? 'border-black ring-4 ring-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -translate-y-1'
          : 'border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] hover:-translate-y-0.5'
      }`}
      onClick={(e) => {
        if (!isOverlay && onSelect) {
          onSelect(page.id, e);
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!isOverlay && onOpenPreview) {
          onOpenPreview(displayIndex - 1);
        }
      }}
    >
      {/* Multi-Item Drag Badge (when dragging multiple selected pages) */}
      {isOverlay && selectedCount > 1 && (
        <div className="absolute -top-3 -right-3 z-30 bg-black text-white text-xs font-mono font-black px-2.5 py-1 border-2 border-white shadow-lg animate-bounce">
          +{selectedCount} PAGES
        </div>
      )}

      {/* Top Meta Bar */}
      <div
        className={`flex items-center justify-between px-2.5 py-1.5 border-b border-black text-xs font-mono transition-colors ${
          isSelected ? 'bg-black text-white' : 'bg-white text-black'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <div
            className={`p-0.5 -ml-1 ${
              isSelected ? 'text-neutral-300' : 'text-neutral-500'
            }`}
            title="Drag anywhere on card to reorder"
          >
            <GripVertical size={14} />
          </div>

          <span
            className={`font-bold px-1.5 py-0.2 text-[11px] ${
              isSelected ? 'bg-white text-black' : 'bg-black text-white'
            }`}
          >
            {displayIndex}
          </span>
        </div>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {/* Quick Preview Icon */}
          {onOpenPreview && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPreview(displayIndex - 1);
              }}
              className={`p-0.5 transition-colors ${
                isSelected ? 'text-neutral-300 hover:text-white' : 'text-neutral-500 hover:text-black'
              }`}
              title="Preview full page (or double-click)"
            >
              <Eye size={13} />
            </button>
          )}

          {/* Selection Checkbox */}
          {onSelect && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(page.id, e);
              }}
              className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-white text-black border-white'
                  : 'bg-white text-black border-black hover:bg-neutral-100'
              }`}
              aria-label="Select page"
            >
              {isSelected && <Check size={12} strokeWidth={3.5} />}
            </button>
          )}
        </div>
      </div>

      {/* WYSIWYG Sheet Preview Container */}
      <div
        className="relative w-full bg-neutral-200/90 flex items-center justify-center p-3 sm:p-4 overflow-hidden"
        style={{ height: previewHeight }}
      >
        {/* Paper Sheet Preview with Shadow and Border */}
        <div className="relative shadow-[0_4px_14px_rgba(0,0,0,0.18)] border border-neutral-400 bg-white flex items-center justify-center max-w-full max-h-full transition-transform duration-100 group-hover:scale-[1.02]">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain block pointer-events-none"
          />

          {/* Indicators for modifications */}
          <div className="absolute bottom-1 right-1 flex items-center gap-1 pointer-events-none">
            {page.crop && (
              <span className="bg-black text-white text-[8px] font-mono px-1 py-0.2 uppercase">
                CROP
              </span>
            )}
            {page.rotation !== 0 && (
              <span className="bg-black text-white text-[8px] font-mono px-1 py-0.2">
                {page.rotation}°
              </span>
            )}
          </div>
        </div>

        {/* Hover Quick Actions Overlay */}
        {!isOverlay && (
          <div
            className="absolute inset-x-0 bottom-0 p-1.5 bg-white/95 border-t border-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-around gap-1 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {onOpenPreview && (
              <button
                onClick={() => onOpenPreview(displayIndex - 1)}
                className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
                title="Preview full page"
              >
                <Eye size={13} />
              </button>
            )}
            {onRotateCcw && (
              <button
                onClick={() => onRotateCcw(page.id)}
                className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
                title="Rotate Left (-90°)"
              >
                <RotateCcw size={13} />
              </button>
            )}
            {onRotateCw && (
              <button
                onClick={() => onRotateCw(page.id)}
                className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
                title="Rotate Right (+90°)"
              >
                <RotateCw size={13} />
              </button>
            )}
            {onOpenCrop && (
              <button
                onClick={() => onOpenCrop(page)}
                className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
                title="Crop page"
              >
                <CropIcon size={13} />
              </button>
            )}
            {onOpenResize && (
              <button
                onClick={() => onOpenResize(page)}
                className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
                title="Layout & Page Sizing"
              >
                <Maximize2 size={13} />
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={() => onDuplicate(page.id)}
                className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
                title="Duplicate page"
              >
                <Copy size={13} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(page.id)}
                className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
                title="Delete page"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Info Bar */}
      <div className="px-2.5 py-1.5 border-t border-black bg-white flex flex-col gap-0.5 text-[10px] font-mono text-neutral-700">
        <div className="flex items-center justify-between font-bold text-black">
          <span className="uppercase">
            {page.layout.format.toUpperCase()} · {page.layout.sizingMode.toUpperCase()}
          </span>
          {page.layout.marginPt > 0 && (
            <span className="text-[9px] text-neutral-500">
              {Math.round(page.layout.marginPt / 2.835)}mm MARGIN
            </span>
          )}
        </div>
        <div className="truncate text-neutral-500 text-[9px]" title={page.fileName}>
          {page.fileName}
        </div>
      </div>
    </div>
  );
});
