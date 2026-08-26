import React, { useState } from 'react';
import { PageFormat, PageOrientation, SizingMode, PageLayoutOptions } from '../types';
import { STANDARD_PAPER_SIZES } from '../services/layoutEngine';
import { X, Check, LayoutTemplate } from 'lucide-react';

interface ResizeModalProps {
  isOpen: boolean;
  selectedCount: number;
  totalCount: number;
  initialLayout?: PageLayoutOptions;
  onClose: () => void;
  onApplyLayout: (layout: PageLayoutOptions, scope: 'selected' | 'all') => void;
}

export const ResizeModal: React.FC<ResizeModalProps> = ({
  isOpen,
  selectedCount,
  totalCount,
  initialLayout,
  onClose,
  onApplyLayout,
}) => {
  const [format, setFormat] = useState<PageFormat>(initialLayout?.format || 'a4');
  const [orientation, setOrientation] = useState<PageOrientation>(initialLayout?.orientation || 'auto');
  const [sizingMode, setSizingMode] = useState<SizingMode>(initialLayout?.sizingMode || 'fit');
  const [marginMm, setMarginMm] = useState<number>(
    initialLayout?.marginPt ? Math.round(initialLayout.marginPt / 2.8346) : 0
  );
  const [customWidthMm, setCustomWidthMm] = useState<number>(210);
  const [customHeightMm, setCustomHeightMm] = useState<number>(297);
  const [scope, setScope] = useState<'selected' | 'all'>(selectedCount > 0 ? 'selected' : 'all');

  if (!isOpen) return null;

  const handleApply = () => {
    const ptPerMm = 72 / 25.4; // 2.8346 pt per mm
    const marginPt = Math.round(marginMm * ptPerMm);

    const layout: PageLayoutOptions = {
      format,
      orientation,
      sizingMode,
      marginPt,
      customWidthPt: format === 'custom' ? Math.round(customWidthMm * ptPerMm) : undefined,
      customHeightPt: format === 'custom' ? Math.round(customHeightMm * ptPerMm) : undefined,
    };

    onApplyLayout(layout, scope);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white border-2 border-black max-w-xl w-full p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-fade-in max-h-[90vh] overflow-y-auto font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black mb-4">
          <div className="flex items-center gap-2">
            <LayoutTemplate size={18} />
            <h2 className="text-base font-black uppercase tracking-tight">
              PAGE LAYOUT & PAPER FORMAT
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* 1. Paper Size Preset */}
        <div className="space-y-2 mb-5">
          <label className="text-[11px] font-bold uppercase text-neutral-500 block">
            1. PAPER SIZE
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={() => setFormat('original')}
              className={`p-2.5 text-left border-2 transition-colors ${
                format === 'original'
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-200 bg-white hover:border-black text-black'
              }`}
            >
              <div className="font-bold">Original Size</div>
              <div className="text-[10px] opacity-70">Keep raw file dimensions</div>
            </button>

            {Object.entries(STANDARD_PAPER_SIZES).map(([key, info]) => (
              <button
                key={key}
                onClick={() => setFormat(key as PageFormat)}
                className={`p-2.5 text-left border-2 transition-colors ${
                  format === key
                    ? 'border-black bg-black text-white'
                    : 'border-neutral-200 bg-white hover:border-black text-black'
                }`}
              >
                <div className="font-bold">{info.name}</div>
                <div className="text-[10px] opacity-70">
                  {Math.round(info.width * 0.3528)} × {Math.round(info.height * 0.3528)} mm
                </div>
              </button>
            ))}

            <button
              onClick={() => setFormat('custom')}
              className={`p-2.5 text-left border-2 transition-colors ${
                format === 'custom'
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-200 bg-white hover:border-black text-black'
              }`}
            >
              <div className="font-bold">Custom Dimensions</div>
              <div className="text-[10px] opacity-70">Set W × H in mm</div>
            </button>
          </div>

          {format === 'custom' && (
            <div className="grid grid-cols-2 gap-3 p-3 border border-black bg-neutral-50 mt-2">
              <div>
                <label className="text-[10px] block mb-1 font-bold">WIDTH (MM)</label>
                <input
                  type="number"
                  value={customWidthMm}
                  onChange={(e) => setCustomWidthMm(Math.max(10, Number(e.target.value)))}
                  className="w-full px-2 py-1 border border-black text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] block mb-1 font-bold">HEIGHT (MM)</label>
                <input
                  type="number"
                  value={customHeightMm}
                  onChange={(e) => setCustomHeightMm(Math.max(10, Number(e.target.value)))}
                  className="w-full px-2 py-1 border border-black text-xs bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* 2. Orientation */}
        {format !== 'original' && (
          <div className="space-y-2 mb-5">
            <label className="text-[11px] font-bold uppercase text-neutral-500 block">
              2. ORIENTATION
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'auto', name: 'Auto', desc: 'Match content orientation' },
                { id: 'portrait', name: 'Portrait', desc: 'Vertical paper sheet' },
                { id: 'landscape', name: 'Landscape', desc: 'Horizontal paper sheet' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setOrientation(item.id as PageOrientation)}
                  className={`p-2 border-2 text-left transition-colors ${
                    orientation === item.id
                      ? 'border-black bg-black text-white'
                      : 'border-neutral-200 bg-white hover:border-black text-black'
                  }`}
                >
                  <div className="font-bold">{item.name}</div>
                  <div className="text-[9px] opacity-70">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Sizing Mode (Fit vs Fill vs Stretch) */}
        {format !== 'original' && (
          <div className="space-y-2 mb-5">
            <label className="text-[11px] font-bold uppercase text-neutral-500 block">
              3. CONTENT PLACEMENT & SIZING MODE
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: 'fit',
                  name: 'Fit (Letterbox)',
                  desc: 'Scales content to fit inside sheet. Preserves full image without cutting.',
                },
                {
                  id: 'fill',
                  name: 'Fill (Bleed Crop)',
                  desc: 'Fills entire sheet. Cuts off overflow bleed edges.',
                },
                {
                  id: 'stretch',
                  name: 'Stretch',
                  desc: 'Distorts content to fill exact sheet dimensions.',
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSizingMode(item.id as SizingMode)}
                  className={`p-2.5 border-2 text-left transition-colors flex flex-col justify-between ${
                    sizingMode === item.id
                      ? 'border-black bg-black text-white'
                      : 'border-neutral-200 bg-white hover:border-black text-black'
                  }`}
                >
                  <div className="font-bold">{item.name}</div>
                  <div className="text-[9px] opacity-70 mt-1 leading-tight">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. Margins */}
        {format !== 'original' && (
          <div className="space-y-2 mb-5">
            <label className="text-[11px] font-bold uppercase text-neutral-500 block">
              4. MARGINS
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'None (0mm)', val: 0 },
                { label: 'Small (6mm)', val: 6 },
                { label: 'Normal (12.7mm)', val: 12.7 },
                { label: 'Large (25.4mm)', val: 25.4 },
              ].map((m) => (
                <button
                  key={m.label}
                  onClick={() => setMarginMm(m.val)}
                  className={`p-2 border-2 text-center transition-colors ${
                    Math.abs(marginMm - m.val) < 0.5
                      ? 'border-black bg-black text-white'
                      : 'border-neutral-200 bg-white hover:border-black text-black'
                  }`}
                >
                  <div className="font-bold">{m.label.split(' ')[0]}</div>
                  <div className="text-[9px] opacity-70">{m.label.split(' ')[1]}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Target Scope */}
        <div className="space-y-2 mb-6 pt-3 border-t border-neutral-200">
          <label className="text-[11px] font-bold uppercase text-neutral-500 block">
            APPLY TO
          </label>
          <div className="flex gap-2">
            {selectedCount > 0 && (
              <button
                onClick={() => setScope('selected')}
                className={`flex-1 py-2 border-2 font-bold uppercase transition-colors ${
                  scope === 'selected'
                    ? 'border-black bg-black text-white'
                    : 'border-neutral-300 bg-white text-black hover:border-black'
                }`}
              >
                {selectedCount} Selected {selectedCount === 1 ? 'Page' : 'Pages'}
              </button>
            )}
            <button
              onClick={() => setScope('all')}
              className={`flex-1 py-2 border-2 font-bold uppercase transition-colors ${
                scope === 'all'
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-300 bg-white text-black hover:border-black'
              }`}
            >
              All {totalCount} Pages
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-black">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-black bg-white hover:bg-neutral-100 text-xs font-bold uppercase transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 bg-black text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <Check size={14} />
            <span>APPLY LAYOUT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
