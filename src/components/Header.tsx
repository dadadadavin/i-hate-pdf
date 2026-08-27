import React, { useState } from 'react';
import type { ViewMode } from '../types';
import {
  LayoutGrid,
  FolderTree,
  Plus,
  RotateCcw,
  ShieldCheck,
  Tag,
  ClipboardPaste,
  ZoomIn,
  ZoomOut,
  Volume2,
  VolumeX,
  HelpCircle,
} from 'lucide-react';
import { toggleMute, getMuteState, playTickSound } from '../services/soundService';
import { GRID_ZOOM_MIN, GRID_ZOOM_MAX, GRID_ZOOM_STEP } from '../constants/app';

interface HeaderProps {
  pageCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  zoomScale: number;
  onZoomChange: (scale: number) => void;
  onAddFilesClick: () => void;
  onPasteClick: () => void;
  onResetClick: () => void;
  onOpenMetadata: () => void;
  onOpenShortcuts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pageCount,
  viewMode,
  onViewModeChange,
  zoomScale,
  onZoomChange,
  onAddFilesClick,
  onPasteClick,
  onResetClick,
  onOpenMetadata,
  onOpenShortcuts,
}) => {
  const [isMuted, setIsMuted] = useState(getMuteState());

  const handleToggleMute = () => {
    const next = toggleMute();
    setIsMuted(next);
    if (!next) playTickSound();
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b-2 border-black select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Left: Brand & Local Badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          <h1 className="text-xl sm:text-2xl font-black tracking-tighter uppercase font-mono">
            I HATE PDF
          </h1>
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono uppercase px-2 py-0.5 border border-black bg-neutral-100 text-black font-semibold">
            <ShieldCheck size={13} /> 100% Local Engine
          </span>
        </div>

        {/* Right: Actions & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {pageCount > 0 && (
            <>
              {/* Grid Zoom Slider */}
              <div className="hidden lg:flex items-center border border-black px-2 py-1 bg-neutral-50 gap-1.5 font-mono text-xs">
                <button
                  onClick={() => onZoomChange(Math.max(GRID_ZOOM_MIN, zoomScale - GRID_ZOOM_STEP))}
                  className="p-0.5 hover:bg-black hover:text-white transition-colors"
                  title="Zoom Out Grid"
                >
                  <ZoomOut size={13} />
                </button>
                <input
                  type="range"
                  min={Math.round(GRID_ZOOM_MIN * 100)}
                  max={Math.round(GRID_ZOOM_MAX * 100)}
                  step={Math.round(GRID_ZOOM_STEP * 100)}
                  value={Math.round(zoomScale * 100)}
                  onChange={(e) => onZoomChange(Number(e.target.value) / 100)}
                  className="w-16 h-1 bg-neutral-300 accent-black cursor-pointer"
                  title={`Grid Scale: ${Math.round(zoomScale * 100)}%`}
                />
                <button
                  onClick={() => onZoomChange(Math.min(GRID_ZOOM_MAX, zoomScale + GRID_ZOOM_STEP))}
                  className="p-0.5 hover:bg-black hover:text-white transition-colors"
                  title="Zoom In Grid"
                >
                  <ZoomIn size={13} />
                </button>
                <span className="text-[10px] font-bold min-w-8 text-right">
                  {Math.round(zoomScale * 100)}%
                </span>
              </div>

              {/* Sound Effects Toggle */}
              <button
                onClick={handleToggleMute}
                className="p-1.5 border border-black bg-white hover:bg-neutral-100 transition-colors text-black"
                title={isMuted ? 'Unmute UI sounds' : 'Mute UI sounds'}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>

              {/* Shortcuts Helper */}
              {onOpenShortcuts && (
                <button
                  onClick={onOpenShortcuts}
                  className="p-1.5 border border-black bg-white hover:bg-neutral-100 transition-colors text-black"
                  title="Keyboard Shortcuts Guide (?)"
                >
                  <HelpCircle size={14} />
                </button>
              )}

              {/* Metadata editor trigger */}
              <button
                onClick={onOpenMetadata}
                className="hidden md:inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1.5 border border-black bg-white hover:bg-neutral-100 transition-colors"
                title="Edit PDF Document Metadata"
              >
                <Tag size={13} />
                <span>METADATA</span>
              </button>

              {/* View Mode Toggle */}
              <div className="hidden sm:flex items-center border border-black">
                <button
                  onClick={() => onViewModeChange('unified')}
                  className={`px-2.5 py-1.5 text-xs font-mono flex items-center gap-1 transition-colors font-bold ${
                    viewMode === 'unified' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
                  }`}
                  title="Unified Page Grid"
                >
                  <LayoutGrid size={13} />
                  <span>GRID</span>
                </button>
                <button
                  onClick={() => onViewModeChange('grouped')}
                  className={`px-2.5 py-1.5 text-xs font-mono flex items-center gap-1 transition-colors border-l border-black font-bold ${
                    viewMode === 'grouped' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
                  }`}
                  title="Group Pages by Source File"
                >
                  <FolderTree size={13} />
                  <span>FILES</span>
                </button>
              </div>

              {/* Quick Paste Button */}
              <button
                onClick={onPasteClick}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-bold border border-black bg-white hover:bg-neutral-100 transition-colors"
                title="Paste image/file from clipboard (Cmd+V / Ctrl+V)"
              >
                <ClipboardPaste size={13} />
                <span>PASTE</span>
              </button>

              {/* Add Files */}
              <button
                onClick={onAddFilesClick}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-black bg-black text-white border border-black hover:bg-neutral-800 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
              >
                <Plus size={14} />
                <span>+ ADD FILES</span>
              </button>

              {/* Reset / New Workspace */}
              <button
                onClick={onResetClick}
                className="p-1.5 text-black border border-black bg-white hover:bg-neutral-100 transition-colors"
                title="Clear workspace / start fresh"
              >
                <RotateCcw size={14} />
              </button>
            </>
          )}

          {pageCount === 0 && onOpenShortcuts && (
            <button
              onClick={onOpenShortcuts}
              className="p-1.5 border border-black bg-white hover:bg-neutral-100 transition-colors text-black font-mono text-xs flex items-center gap-1"
              title="Keyboard Shortcuts Guide (?)"
            >
              <HelpCircle size={14} />
              <span className="hidden sm:inline">SHORTCUTS</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
