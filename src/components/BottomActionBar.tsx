import React from 'react';
import { Sliders, Download } from 'lucide-react';
import { CompressionSettings } from '../types';

interface BottomActionBarProps {
  pageCount: number;
  fileCount: number;
  compression: CompressionSettings;
  onOpenCompress: () => void;
  onOpenExport: () => void;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  pageCount,
  fileCount,
  compression,
  onOpenCompress,
  onOpenExport,
}) => {
  const isCompressed = compression.preset !== 'lossless';

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 bg-white border-t-2 border-black px-4 sm:px-8 py-3.5 shadow-[0px_-4px_0px_0px_rgba(0,0,0,0.06)] select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Summary */}
        <div className="flex items-center gap-3">
          <div className="text-base sm:text-lg font-black font-mono tracking-tight uppercase">
            {pageCount} {pageCount === 1 ? 'PAGE' : 'PAGES'}
          </div>
          <span className="hidden sm:inline text-xs font-mono text-neutral-500">
            ({fileCount} {fileCount === 1 ? 'FILE' : 'FILES'})
          </span>

          {isCompressed && (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-black text-white px-2 py-0.5">
              COMPRESS: {compression.preset.toUpperCase()}
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCompress}
            className={`px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider border border-black transition-all flex items-center gap-2 ${
              isCompressed
                ? 'bg-black text-white hover:bg-neutral-800'
                : 'bg-white text-black hover:bg-neutral-100'
            }`}
          >
            <Sliders size={15} />
            <span>COMPRESS</span>
          </button>

          <button
            onClick={onOpenExport}
            className="px-6 sm:px-8 py-2.5 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider bg-black text-white border border-black hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
          >
            <Download size={15} />
            <span>EXPORT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
