import React, { memo, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageItem, CardDensity } from '../types';
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
  density: CardDensity;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onRotateCw: (id: string) => void;
  onRotateCcw: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onOpenCrop: (page: PageItem) => void;
  onOpenResize: (page: PageItem) => void;
  onOpenPreview: (index: number) => void;
}

export const PageCard: React.FC<PageCardProps> = memo(({
  page,
  displayIndex,
  isSelected,
  density,
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
  } = useSortable({ id: page.id });

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
        const thumbScale = density === 'compact' ? 0.35 : density === 'large' ? 0.65 : 0.45;
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
  }, [page, density]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.35 : 1,
  };

  const cardWidthClass =
    density === 'compact'
      ? 'w-40 sm:w-48'
      : density === 'large'
      ? 'w-72 sm:w-88'
      : 'w-56 sm:w-64';

  const previewHeightClass =
    density === 'compact'
      ? 'h-52 sm:h-60'
      : density === 'large'
      ? 'h-88 sm:h-104'
      : 'h-68 sm:h-76';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col bg-white border-2 transition-all select-none ${cardWidthClass} ${
        isSelected
          ? 'border-black ring-4 ring-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
          : 'border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]'
      }`}
      onClick={(e) => onSelect(page.id, e)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpenPreview(displayIndex - 1);
      }}
    >
      {/* Top Meta Bar */}
      <div
        className={`flex items-center justify-between px-2.5 py-1.5 border-b border-black text-xs font-mono transition-colors ${
          isSelected ? 'bg-black text-white' : 'bg-white text-black'
        }`}
      >
        <div className="flex items-center gap-1.5">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className={`cursor-grab active:cursor-grabbing p-0.5 -ml-1 ${
              isSelected ? 'text-neutral-300 hover:text-white' : 'text-neutral-600 hover:text-black'
            }`}
            title="Drag to reorder"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={14} />
          </div>

          {/* Page index badge */}
          <span
            className={`font-bold px-1.5 py-0.2 text-[11px] ${
              isSelected ? 'bg-white text-black' : 'bg-black text-white'
            }`}
          >
            {displayIndex}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Preview Icon */}
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

          {/* Selection Checkbox */}
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
        </div>
      </div>

      {/* WYSIWYG Sheet Preview Container */}
      <div
        className={`relative w-full ${previewHeightClass} bg-neutral-200/80 flex items-center justify-center p-3 sm:p-4 overflow-hidden cursor-pointer`}
      >
        {/* Paper Sheet Preview with Shadow and Border */}
        <div className="relative shadow-[0_4px_12px_rgba(0,0,0,0.18)] border border-neutral-400 bg-white flex items-center justify-center max-w-full max-h-full">
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
        <div
          className="absolute inset-x-0 bottom-0 p-1.5 bg-white/95 border-t border-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-around gap-1 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onOpenPreview(displayIndex - 1)}
            className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
            title="Preview full page"
          >
            <Eye size={13} />
          </button>
          <button
            onClick={() => onRotateCcw(page.id)}
            className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
            title="Rotate Left (-90°)"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={() => onRotateCw(page.id)}
            className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
            title="Rotate Right (+90°)"
          >
            <RotateCw size={13} />
          </button>
          <button
            onClick={() => onOpenCrop(page)}
            className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
            title="Crop page"
          >
            <CropIcon size={13} />
          </button>
          <button
            onClick={() => onOpenResize(page)}
            className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
            title="Layout & Page Sizing"
          >
            <Maximize2 size={13} />
          </button>
          <button
            onClick={() => onDuplicate(page.id)}
            className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
            title="Duplicate page"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={() => onDelete(page.id)}
            className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
            title="Delete page"
          >
            <Trash2 size={13} />
          </button>
        </div>
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
