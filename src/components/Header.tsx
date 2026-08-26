import React from 'react';
import { ViewMode, CardDensity } from '../types';
import { LayoutGrid, FolderTree, Plus, RotateCcw, ShieldCheck, Tag, ClipboardPaste } from 'lucide-react';

interface HeaderProps {
  pageCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  cardDensity: CardDensity;
  onCardDensityChange: (density: CardDensity) => void;
  onAddFilesClick: () => void;
  onPasteClick: () => void;
  onResetClick: () => void;
  onOpenMetadata: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pageCount,
  viewMode,
  onViewModeChange,
  cardDensity,
  onCardDensityChange,
  onAddFilesClick,
  onPasteClick,
  onResetClick,
  onOpenMetadata,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-black select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand & Local Badge */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black tracking-tighter uppercase font-mono">
            I HATE PDF
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono uppercase px-2 py-0.5 border border-black bg-white text-black">
            <ShieldCheck size={13} /> 100% Local Engine
          </span>
        </div>

        {/* Right: Actions & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {pageCount > 0 && (
            <>
              {/* Metadata editor trigger */}
              <button
                onClick={onOpenMetadata}
                className="hidden md:inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1.5 border border-black bg-white hover:bg-neutral-100 transition-colors"
                title="Edit PDF Metadata"
              >
                <Tag size={13} />
                <span>METADATA</span>
              </button>

              {/* View Mode Toggle */}
              <div className="hidden sm:flex items-center border border-black">
                <button
                  onClick={() => onViewModeChange('unified')}
                  className={`px-2.5 py-1 text-xs font-mono flex items-center gap-1 transition-colors ${
                    viewMode === 'unified' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
                  }`}
                  title="Unified Grid View"
                >
                  <LayoutGrid size={13} />
                  <span>GRID</span>
                </button>
                <button
                  onClick={() => onViewModeChange('grouped')}
                  className={`px-2.5 py-1 text-xs font-mono flex items-center gap-1 transition-colors border-l border-black ${
                    viewMode === 'grouped' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
                  }`}
                  title="Group by Source File"
                >
                  <FolderTree size={13} />
                  <span>FILES</span>
                </button>
              </div>

              {/* Density Toggle */}
              <div className="hidden lg:flex items-center border border-black">
                <button
                  onClick={() => onCardDensityChange('compact')}
                  className={`px-2 py-1 text-[11px] font-mono transition-colors ${
                    cardDensity === 'compact' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
                  }`}
                  title="Small thumbnails"
                >
                  S
                </button>
                <button
                  onClick={() => onCardDensityChange('normal')}
                  className={`px-2 py-1 text-[11px] font-mono border-l border-r border-black transition-colors ${
                    cardDensity === 'normal' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
                  }`}
                  title="Medium thumbnails"
                >
                  M
                </button>
                <button
                  onClick={() => onCardDensityChange('large')}
                  className={`px-2 py-1 text-[11px] font-mono transition-colors ${
                    cardDensity === 'large' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
                  }`}
                  title="Large thumbnails"
                >
                  L
                </button>
              </div>

              {/* Quick Paste Button */}
              <button
                onClick={onPasteClick}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono border border-black bg-white hover:bg-neutral-100 transition-colors"
                title="Paste image/file from clipboard (Ctrl+V / Cmd+V)"
              >
                <ClipboardPaste size={13} />
                <span>PASTE</span>
              </button>

              {/* Add Files */}
              <button
                onClick={onAddFilesClick}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-bold bg-black text-white border border-black hover:bg-neutral-800 transition-colors"
              >
                <Plus size={14} />
                <span>+ ADD FILES</span>
              </button>

              {/* Reset */}
              <button
                onClick={onResetClick}
                className="p-1.5 text-black border border-black bg-white hover:bg-neutral-100 transition-colors"
                title="Reset workspace"
              >
                <RotateCcw size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
