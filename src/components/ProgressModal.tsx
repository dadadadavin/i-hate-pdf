import React from 'react';
import { ProgressState } from '../types';
import { Loader2, X } from 'lucide-react';

interface ProgressModalProps {
  progress: ProgressState;
  onCancel?: () => void;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  progress,
  onCancel,
}) => {
  if (!progress.isOpen) return null;

  const percentage =
    progress.total > 0
      ? Math.min(100, Math.round((progress.current / progress.total) * 100))
      : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white border-2 border-black max-w-md w-full p-6 sm:p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 size={20} className="animate-spin text-black" />
          <h3 className="text-base font-mono font-black uppercase tracking-tight">
            {progress.title}
          </h3>
        </div>

        <p className="text-xs font-mono text-neutral-600 mb-4 truncate">
          {progress.statusText || `Processing item ${progress.current} of ${progress.total}...`}
        </p>

        {/* Progress Bar */}
        <div className="w-full h-4 border-2 border-black bg-white p-0.5 mb-3">
          <div
            className="h-full bg-black transition-all duration-150"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-mono font-bold mb-6">
          <span>{percentage}% COMPLETE</span>
          <span>{progress.current} / {progress.total}</span>
        </div>

        {/* Cancel Button if enabled */}
        {progress.canCancel && onCancel && (
          <div className="flex justify-end pt-3 border-t border-black">
            <button
              onClick={onCancel}
              className="px-4 py-1.5 border border-black bg-white hover:bg-neutral-100 text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1"
            >
              <X size={13} />
              <span>CANCEL</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
