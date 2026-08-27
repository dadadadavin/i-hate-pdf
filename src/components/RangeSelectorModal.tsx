import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { parseRangeExpression } from '../utils/rangeParser';

interface RangeSelectorModalProps {
  isOpen: boolean;
  totalCount: number;
  onClose: () => void;
  onApplyRange: (selectedIndices: number[]) => void;
}

export const RangeSelectorModal: React.FC<RangeSelectorModalProps> = ({
  isOpen,
  totalCount,
  onClose,
  onApplyRange,
}) => {
  const [rangeInput, setRangeInput] = useState('');
  const [parsedCount, setParsedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const parse = (text: string) => parseRangeExpression(text, totalCount);

  useEffect(() => {
    if (isOpen) {
      const parsed = parse(rangeInput);
      setParsedCount(parsed.length);
      setErrorMessage(null);
    }
  }, [rangeInput, isOpen, totalCount]);

  if (!isOpen) return null;

  const handleApply = () => {
    const parsed = parse(rangeInput);
    if (parsed.length === 0) {
      setErrorMessage('Please enter a valid page number or range (e.g. 1-5, 8, 10-14)');
      return;
    }
    onApplyRange(parsed);
    onClose();
  };

  const setPreset = (presetText: string) => {
    setRangeInput(presetText);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border-2 border-black max-w-md w-full p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black mb-4">
          <h2 className="text-base font-mono font-black uppercase tracking-tight">
            SELECT PAGE RANGE
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Info */}
        <p className="text-xs font-mono text-neutral-600 mb-4">
          Enter page numbers and ranges separated by commas. (Total: {totalCount} pages)
        </p>

        {/* Input */}
        <div className="mb-4">
          <input
            type="text"
            value={rangeInput}
            onChange={(e) => setRangeInput(e.target.value)}
            placeholder="e.g. 1-5, 8, 10-14"
            className="w-full px-3 py-2 border-2 border-black font-mono text-sm focus:outline-none focus:bg-neutral-50"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleApply();
              if (e.key === 'Escape') onClose();
            }}
          />
          {errorMessage && (
            <p className="text-xs font-mono text-red-600 mt-1.5">{errorMessage}</p>
          )}
        </div>

        {/* Presets */}
        <div className="mb-6">
          <span className="text-[11px] font-mono font-bold uppercase text-neutral-500 block mb-2">
            QUICK PRESETS
          </span>
          <div className="flex flex-wrap gap-1.5 text-xs font-mono">
            <button
              onClick={() => setPreset(`1-${totalCount}`)}
              className="px-2 py-1 border border-black hover:bg-neutral-100 transition-colors"
            >
              All (1-{totalCount})
            </button>
            <button
              onClick={() => {
                const oddPages = Array.from({ length: totalCount }, (_, i) => i + 1)
                  .filter((p) => p % 2 !== 0)
                  .join(', ');
                setPreset(oddPages);
              }}
              className="px-2 py-1 border border-black hover:bg-neutral-100 transition-colors"
            >
              Odd Pages
            </button>
            <button
              onClick={() => {
                const evenPages = Array.from({ length: totalCount }, (_, i) => i + 1)
                  .filter((p) => p % 2 === 0)
                  .join(', ');
                setPreset(evenPages);
              }}
              className="px-2 py-1 border border-black hover:bg-neutral-100 transition-colors"
            >
              Even Pages
            </button>
            {totalCount > 5 && (
              <>
                <button
                  onClick={() => setPreset('1-5')}
                  className="px-2 py-1 border border-black hover:bg-neutral-100 transition-colors"
                >
                  First 5
                </button>
                <button
                  onClick={() => setPreset(`${Math.max(1, totalCount - 4)}-${totalCount}`)}
                  className="px-2 py-1 border border-black hover:bg-neutral-100 transition-colors"
                >
                  Last 5
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-black">
          <span className="text-xs font-mono font-bold">
            {parsedCount} {parsedCount === 1 ? 'PAGE' : 'PAGES'} MATCHED
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-black bg-white hover:bg-neutral-100 text-xs font-mono font-bold uppercase transition-colors"
            >
              CANCEL
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 bg-black text-white hover:bg-neutral-800 text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>APPLY</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
