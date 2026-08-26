import React, { useState, useRef, useEffect } from 'react';
import { PageItem, CropRect } from '../types';
import { X, Check, RotateCcw, Crop as CropIcon } from 'lucide-react';

interface CropModalProps {
  isOpen: boolean;
  page: PageItem | null;
  onClose: () => void;
  onApplyCrop: (pageId: string, crop: CropRect | undefined) => void;
}

type AspectRatio = 'free' | '1:1' | '4:3' | '16:9' | 'a4' | 'letter';

export const CropModal: React.FC<CropModalProps> = ({
  isOpen,
  page,
  onClose,
  onApplyCrop,
}) => {
  const [crop, setCrop] = useState<CropRect>({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('free');
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; crop: CropRect }>({
    x: 0,
    y: 0,
    crop: { x: 0, y: 0, width: 1, height: 1 },
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (page && isOpen) {
      if (page.crop) {
        setCrop({ ...page.crop });
      } else {
        setCrop({ x: 0.05, y: 0.05, width: 0.9, height: 0.9 });
      }
      setAspectRatio('free');
    }
  }, [page, isOpen]);

  if (!isOpen || !page) return null;

  const handlePointerDown = (handle: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragHandle(handle);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      crop: { ...crop },
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragHandle || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = (e.clientX - dragStart.x) / rect.width;
    const deltaY = (e.clientY - dragStart.y) / rect.height;

    let newCrop = { ...dragStart.crop };

    if (dragHandle === 'move') {
      newCrop.x = Math.max(0, Math.min(1 - newCrop.width, dragStart.crop.x + deltaX));
      newCrop.y = Math.max(0, Math.min(1 - newCrop.height, dragStart.crop.y + deltaY));
    } else {
      if (dragHandle.includes('r')) {
        newCrop.width = Math.max(0.1, Math.min(1 - newCrop.x, dragStart.crop.width + deltaX));
      }
      if (dragHandle.includes('l')) {
        const potentialWidth = dragStart.crop.width - deltaX;
        if (potentialWidth >= 0.1 && dragStart.crop.x + deltaX >= 0) {
          newCrop.x = dragStart.crop.x + deltaX;
          newCrop.width = potentialWidth;
        }
      }
      if (dragHandle.includes('b')) {
        newCrop.height = Math.max(0.1, Math.min(1 - newCrop.y, dragStart.crop.height + deltaY));
      }
      if (dragHandle.includes('t')) {
        const potentialHeight = dragStart.crop.height - deltaY;
        if (potentialHeight >= 0.1 && dragStart.crop.y + deltaY >= 0) {
          newCrop.y = dragStart.crop.y + deltaY;
          newCrop.height = potentialHeight;
        }
      }
    }

    setCrop(newCrop);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragHandle(null);
  };

  const setRatio = (ratio: AspectRatio) => {
    setAspectRatio(ratio);
    if (ratio === 'free') return;

    let targetRatio = 1.0;
    if (ratio === '1:1') targetRatio = 1.0;
    if (ratio === '4:3') targetRatio = 4 / 3;
    if (ratio === '16:9') targetRatio = 16 / 9;
    if (ratio === 'a4') targetRatio = 1 / 1.414;
    if (ratio === 'letter') targetRatio = 8.5 / 11;

    // Calculate crop dimensions to match target ratio relative to page dimensions
    const pageAspect = (page.width || 1) / (page.height || 1);
    let newWidth = 0.8;
    let newHeight = (newWidth * pageAspect) / targetRatio;

    if (newHeight > 0.8) {
      newHeight = 0.8;
      newWidth = (newHeight * targetRatio) / pageAspect;
    }

    newWidth = Math.min(0.9, Math.max(0.1, newWidth));
    newHeight = Math.min(0.9, Math.max(0.1, newHeight));

    setCrop({
      x: (1 - newWidth) / 2,
      y: (1 - newHeight) / 2,
      width: newWidth,
      height: newHeight,
    });
  };

  const handleReset = () => {
    onApplyCrop(page.id, undefined);
    onClose();
  };

  const handleSave = () => {
    onApplyCrop(page.id, crop);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="bg-white border-2 border-black max-w-2xl w-full p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black mb-4">
          <div className="flex items-center gap-2">
            <CropIcon size={18} />
            <h2 className="text-base font-mono font-black uppercase tracking-tight">
              CROP PAGE ({page.fileName})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 text-xs font-mono">
          <span className="text-neutral-500 font-bold uppercase mr-1">RATIO:</span>
          {(['free', '1:1', '4:3', '16:9', 'a4', 'letter'] as AspectRatio[]).map((r) => (
            <button
              key={r}
              onClick={() => setRatio(r)}
              className={`px-2.5 py-1 border border-black uppercase transition-colors ${
                aspectRatio === r ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Interactive Crop Preview Box */}
        <div className="relative flex-1 min-h-[340px] max-h-[500px] bg-neutral-900 border-2 border-black flex items-center justify-center p-4 overflow-hidden">
          <div
            ref={containerRef}
            className="relative max-h-full max-w-full inline-block select-none"
          >
            <img
              ref={imageRef}
              src={page.thumbnailUrl}
              alt="Crop preview"
              className="max-h-[420px] max-w-full object-contain pointer-events-none"
              style={{
                transform: `rotate(${page.rotation || 0}deg)`,
              }}
            />

            {/* Darkened Overlay around crop */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top mask */}
              <div
                className="absolute inset-x-0 top-0 bg-black/60"
                style={{ height: `${crop.y * 100}%` }}
              />
              {/* Bottom mask */}
              <div
                className="absolute inset-x-0 bottom-0 bg-black/60"
                style={{ height: `${(1 - (crop.y + crop.height)) * 100}%` }}
              />
              {/* Left mask */}
              <div
                className="absolute left-0 bg-black/60"
                style={{
                  top: `${crop.y * 100}%`,
                  height: `${crop.height * 100}%`,
                  width: `${crop.x * 100}%`,
                }}
              />
              {/* Right mask */}
              <div
                className="absolute right-0 bg-black/60"
                style={{
                  top: `${crop.y * 100}%`,
                  height: `${crop.height * 100}%`,
                  width: `${(1 - (crop.x + crop.width)) * 100}%`,
                }}
              />
            </div>

            {/* Crop Box */}
            <div
              className="absolute border-2 border-white cursor-move shadow-[0_0_0_1px_rgba(0,0,0,1)]"
              style={{
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.width * 100}%`,
                height: `${crop.height * 100}%`,
              }}
              onPointerDown={(e) => handlePointerDown('move', e)}
            >
              {/* Grid 3x3 lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-white/40">
                <div className="border-r border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-b border-white/30" />
                <div className="border-r border-white/30" />
                <div className="border-r border-white/30" />
                <div />
              </div>

              {/* 8 Drag Handles */}
              <div
                className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-black border-2 border-white cursor-nwse-resize"
                onPointerDown={(e) => handlePointerDown('tl', e)}
              />
              <div
                className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-black border-2 border-white cursor-nesw-resize"
                onPointerDown={(e) => handlePointerDown('tr', e)}
              />
              <div
                className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-black border-2 border-white cursor-nesw-resize"
                onPointerDown={(e) => handlePointerDown('bl', e)}
              />
              <div
                className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-black border-2 border-white cursor-nwse-resize"
                onPointerDown={(e) => handlePointerDown('br', e)}
              />
              <div
                className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-4 bg-black border border-white cursor-ew-resize"
                onPointerDown={(e) => handlePointerDown('l', e)}
              />
              <div
                className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-4 bg-black border border-white cursor-ew-resize"
                onPointerDown={(e) => handlePointerDown('r', e)}
              />
              <div
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-3 bg-black border border-white cursor-ns-resize"
                onPointerDown={(e) => handlePointerDown('t', e)}
              />
              <div
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-3 bg-black border border-white cursor-ns-resize"
                onPointerDown={(e) => handlePointerDown('b', e)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-black">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-black bg-white hover:bg-neutral-100 text-xs font-mono flex items-center gap-1 transition-colors"
          >
            <RotateCcw size={13} />
            <span>RESET TO FULL PAGE</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-black bg-white hover:bg-neutral-100 text-xs font-mono font-bold uppercase transition-colors"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-black text-white hover:bg-neutral-800 text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>APPLY CROP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
