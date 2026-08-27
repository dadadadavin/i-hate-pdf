import React, { useState } from 'react';
import {
  PageFormat,
  PageOrientation,
  SizingMode,
  ImageFilterType,
} from '../types';
import {
  RotateCw,
  RotateCcw,
  Trash2,
  Copy,
  Crop as CropIcon,
  ArrowUpDown,
  Download,
  ListFilter,
  X,
  ChevronDown,
  LayoutTemplate,
  Wand2,
  ScanText,
} from 'lucide-react';

interface SelectionBarProps {
  selectedCount: number;
  totalCount: number;
  onRotateCw: () => void;
  onRotateCcw: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onReverseOrder: () => void;
  onOpenCrop: () => void;
  onOpenResize: () => void;
  onExtract: () => void;
  onOpenRangeSelector: () => void;
  onSelectOdd: () => void;
  onSelectEven: () => void;
  onSelectAll: () => void;
  onInvertSelection: () => void;
  onDeselectAll: () => void;
  onBulkSetFormat: (format: PageFormat) => void;
  onBulkSetSizing: (mode: SizingMode) => void;
  onBulkSetOrientation: (orientation: PageOrientation) => void;
  onBulkSetMargin: (marginMm: number) => void;
  onBulkSetFilter?: (filter: ImageFilterType) => void;
  onBulkRecognizeOcr?: () => void;
}

export const SelectionBar: React.FC<SelectionBarProps> = ({
  selectedCount,
  totalCount,
  onRotateCw,
  onRotateCcw,
  onDelete,
  onDuplicate,
  onReverseOrder,
  onOpenCrop,
  onOpenResize,
  onExtract,
  onOpenRangeSelector,
  onSelectOdd,
  onSelectEven,
  onSelectAll,
  onInvertSelection,
  onDeselectAll,
  onBulkSetFormat,
  onBulkSetSizing,
  onBulkSetOrientation,
  onBulkSetMargin,
  onBulkSetFilter,
  onBulkRecognizeOcr,
}) => {
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  return (
    <div className="sticky top-16 z-20 bg-white border-b-2 border-black px-4 py-2.5 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)] animate-fade-in select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        {/* Left: Selection count & range selector tools */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-black text-white px-3 py-1.5 text-xs font-mono font-bold tracking-tight">
            <span>{selectedCount} / {totalCount} SELECTED</span>
            {selectedCount > 0 && (
              <button
                onClick={onDeselectAll}
                className="ml-1 p-0.5 hover:bg-neutral-800 transition-colors"
                title="Deselect all (Esc)"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Quick Select Buttons */}
          <div className="flex items-center border border-black text-xs font-mono">
            <button
              onClick={onSelectAll}
              className="px-2 py-1 bg-white hover:bg-neutral-100 transition-colors font-semibold"
              title="Select all pages (Ctrl/Cmd+A)"
            >
              ALL
            </button>
            <button
              onClick={onSelectOdd}
              className="px-2 py-1 bg-white hover:bg-neutral-100 border-l border-black transition-colors"
              title="Select odd pages (1, 3, 5...)"
            >
              ODD
            </button>
            <button
              onClick={onSelectEven}
              className="px-2 py-1 bg-white hover:bg-neutral-100 border-l border-black transition-colors"
              title="Select even pages (2, 4, 6...)"
            >
              EVEN
            </button>
            <button
              onClick={onInvertSelection}
              className="px-2 py-1 bg-white hover:bg-neutral-100 border-l border-black transition-colors"
              title="Invert selection"
            >
              INVERT
            </button>
            <button
              onClick={onOpenRangeSelector}
              className="px-2.5 py-1 bg-white hover:bg-neutral-100 border-l border-black flex items-center gap-1 transition-colors font-bold"
              title="Select specific page range e.g. 1-5, 8, 10-14"
            >
              <ListFilter size={12} />
              <span>RANGE...</span>
            </button>
          </div>
        </div>

        {/* Right: Bulk Actions when pages are selected */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Quick Filter Menu (Clean Scan / Grayscale / Contrast) */}
            {onBulkSetFilter && (
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="px-2.5 py-1.5 bg-white border border-black hover:bg-neutral-100 text-xs font-mono flex items-center gap-1 transition-colors font-bold"
                  title="Enhance document (Clean Scan, Grayscale, High Contrast)"
                >
                  <Wand2 size={13} />
                  <span>FILTER</span>
                  <ChevronDown size={12} />
                </button>

                {showFilterMenu && (
                  <div
                    className="absolute right-0 mt-1 w-48 bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-2 z-30 font-mono text-xs space-y-1 animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {[
                      { id: 'clean-scan', label: '⚡ Clean Scan (White BG)' },
                      { id: 'grayscale', label: '⬛ Grayscale' },
                      { id: 'high-contrast', label: '🔲 High Contrast' },
                      { id: 'invert', label: '🔄 Invert Colors' },
                      { id: 'none', label: '❌ Original (No Filter)' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          onBulkSetFilter(f.id as ImageFilterType);
                          setShowFilterMenu(false);
                        }}
                        className="w-full text-left px-2 py-1.5 hover:bg-black hover:text-white transition-colors text-[11px]"
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick Sizing Mode Toggle (FIT / FILL / STRETCH) */}
            <div className="flex items-center border border-black text-xs font-mono">
              <button
                onClick={() => onBulkSetSizing('fit')}
                className="px-2 py-1.5 bg-white hover:bg-neutral-100 transition-colors font-bold"
                title="Fit content on page (shows margins/whitespace)"
              >
                FIT
              </button>
              <button
                onClick={() => onBulkSetSizing('fill')}
                className="px-2 py-1.5 bg-white hover:bg-neutral-100 border-l border-black transition-colors font-bold"
                title="Fill page completely (crops bleed)"
              >
                FILL
              </button>
              <button
                onClick={() => onBulkSetSizing('stretch')}
                className="px-2 py-1.5 bg-white hover:bg-neutral-100 border-l border-black transition-colors font-bold hidden md:inline-block"
                title="Stretch to fill"
              >
                STRETCH
              </button>
            </div>

            {/* Quick Format Dropdown / Modal */}
            <div className="relative">
              <button
                onClick={() => setShowLayoutMenu(!showLayoutMenu)}
                className="px-2.5 py-1.5 bg-white border border-black hover:bg-neutral-100 text-xs font-mono flex items-center gap-1 transition-colors font-bold"
                title="Change Paper Size, Orientation, Margins"
              >
                <LayoutTemplate size={13} />
                <span>PAGE LAYOUT</span>
                <ChevronDown size={12} />
              </button>

              {showLayoutMenu && (
                <div
                  className="absolute right-0 mt-1 w-64 bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-3 z-30 font-mono text-xs space-y-3 animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Paper Format */}
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 block mb-1">PAPER SIZE</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['a4', 'letter', 'legal', 'a3', 'original'] as PageFormat[]).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => {
                            onBulkSetFormat(fmt);
                            setShowLayoutMenu(false);
                          }}
                          className="py-1 border border-black hover:bg-black hover:text-white uppercase transition-colors text-[11px]"
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Orientation */}
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 block mb-1">ORIENTATION</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['portrait', 'landscape', 'auto'] as PageOrientation[]).map((ori) => (
                        <button
                          key={ori}
                          onClick={() => {
                            onBulkSetOrientation(ori);
                            setShowLayoutMenu(false);
                          }}
                          className="py-1 border border-black hover:bg-black hover:text-white uppercase transition-colors text-[11px]"
                        >
                          {ori}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Margins */}
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 block mb-1">MARGINS</label>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { label: '0mm', val: 0 },
                        { label: '6mm', val: 6 },
                        { label: '12mm', val: 12 },
                        { label: '25mm', val: 25 },
                      ].map((m) => (
                        <button
                          key={m.label}
                          onClick={() => {
                            onBulkSetMargin(m.val);
                            setShowLayoutMenu(false);
                          }}
                          className="py-1 border border-black hover:bg-black hover:text-white transition-colors text-[11px]"
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-200 flex justify-between items-center">
                    <button
                      onClick={() => {
                        setShowLayoutMenu(false);
                        onOpenResize();
                      }}
                      className="text-[11px] underline hover:text-neutral-600"
                    >
                      Custom Dimensions...
                    </button>
                    <button
                      onClick={() => setShowLayoutMenu(false)}
                      className="px-2 py-0.5 border border-black bg-black text-white text-[10px]"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* OCR Button */}
            {onBulkRecognizeOcr && (
              <button
                onClick={onBulkRecognizeOcr}
                className="px-2.5 py-1.5 bg-white border border-black hover:bg-neutral-100 text-xs font-mono flex items-center gap-1 transition-colors"
                title="Recognize text on selected pages (OCR)"
              >
                <ScanText size={13} />
                <span className="hidden lg:inline">OCR</span>
              </button>
            )}

            {/* Rotate */}
            <div className="flex items-center border border-black">
              <button
                onClick={onRotateCcw}
                className="p-1.5 sm:px-2 bg-white hover:bg-neutral-100 text-xs font-mono flex items-center gap-1 transition-colors"
                title="Rotate selected left (-90°)"
              >
                <RotateCcw size={13} />
                <span className="hidden md:inline">-90°</span>
              </button>
              <button
                onClick={onRotateCw}
                className="p-1.5 sm:px-2 bg-white hover:bg-neutral-100 text-xs font-mono border-l border-black flex items-center gap-1 transition-colors"
                title="Rotate selected right (+90°)"
              >
                <RotateCw size={13} />
                <span className="hidden md:inline">+90°</span>
              </button>
            </div>

            {/* Crop (if 1 page selected) */}
            {selectedCount === 1 && (
              <button
                onClick={onOpenCrop}
                className="px-2.5 py-1.5 bg-white border border-black hover:bg-neutral-100 text-xs font-mono flex items-center gap-1 transition-colors"
                title="Crop selected page"
              >
                <CropIcon size={13} />
                <span className="hidden sm:inline">CROP</span>
              </button>
            )}

            {/* Reverse Order */}
            <button
              onClick={onReverseOrder}
              className="px-2.5 py-1.5 bg-white border border-black hover:bg-neutral-100 text-xs font-mono flex items-center gap-1 transition-colors"
              title="Reverse order of selected pages"
            >
              <ArrowUpDown size={13} />
              <span className="hidden sm:inline">REVERSE</span>
            </button>

            {/* Duplicate */}
            <button
              onClick={onDuplicate}
              className="px-2.5 py-1.5 bg-white border border-black hover:bg-neutral-100 text-xs font-mono flex items-center gap-1 transition-colors"
              title="Duplicate selected pages"
            >
              <Copy size={13} />
              <span className="hidden sm:inline">DUPLICATE</span>
            </button>

            {/* Extract */}
            <button
              onClick={onExtract}
              className="px-2.5 py-1.5 bg-white border border-black hover:bg-neutral-100 text-xs font-mono flex items-center gap-1 transition-colors"
              title="Export only selected pages"
            >
              <Download size={13} />
              <span>EXTRACT</span>
            </button>

            {/* Delete */}
            <button
              onClick={onDelete}
              className="px-2.5 py-1.5 bg-black text-white hover:bg-neutral-800 text-xs font-mono flex items-center gap-1 transition-colors"
              title="Delete selected pages (Backspace/Delete)"
            >
              <Trash2 size={13} />
              <span>DELETE</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
