import React, { useState } from 'react';
import {
  ExportFormat,
  ExportOptions,
  CompressionSettings,
  PdfMetadata,
} from '../types';
import {
  X,
  Download,
  FileText,
  Image as ImageIcon,
  FileArchive,
  FileCode,
  Tag,
  Sliders,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  selectedCount: number;
  totalCount: number;
  currentCompression: CompressionSettings;
  metadata: PdfMetadata;
  initialScope?: 'all' | 'selected';
  onClose: () => void;
  onOpenMetadata: () => void;
  onOpenCompress: () => void;
  onExport: (options: ExportOptions) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  selectedCount,
  totalCount,
  currentCompression,
  metadata,
  initialScope = 'all',
  onClose,
  onOpenMetadata,
  onOpenCompress,
  onExport,
}) => {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [scope, setScope] = useState<'all' | 'selected'>(
    selectedCount > 0 && initialScope === 'selected' ? 'selected' : 'all'
  );
  const [outputFileName, setOutputFileName] = useState('document');
  const [imageQuality, setImageQuality] = useState(0.85);
  const [imageScale, setImageScale] = useState(2); // 2x default for crisp image export
  const [splitMode, setSplitMode] = useState<'single-page' | 'by-file' | 'every-n-pages'>('single-page');
  const [splitChunkSize, setSplitChunkSize] = useState(5);

  if (!isOpen) return null;

  const targetCount = scope === 'selected' && selectedCount > 0 ? selectedCount : totalCount;

  const handleStartExport = () => {
    let ext = 'pdf';
    if (format === 'jpg') ext = 'jpg';
    if (format === 'png') ext = 'png';
    if (format === 'webp') ext = 'webp';
    if (format === 'txt') ext = 'txt';
    if (format === 'csv') ext = 'csv';
    if (format === 'split-pdf' || (['jpg', 'png', 'webp'].includes(format) && targetCount > 1)) {
      ext = 'zip';
    }

    const cleanBaseName = outputFileName.trim().replace(/\.[^/.]+$/, '') || 'document';
    const finalName = `${cleanBaseName}.${ext}`;

    const exportOptions: ExportOptions = {
      format,
      scope: selectedCount > 0 ? scope : 'all',
      imageQuality,
      imageScale,
      splitMode,
      splitChunkSize,
      compression: currentCompression,
      metadata,
      outputFileName: finalName,
    };

    onExport(exportOptions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white border-2 border-black max-w-xl w-full p-6 sm:p-7 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black mb-5">
          <div className="flex items-center gap-2">
            <Download size={18} />
            <h2 className="text-base font-mono font-black uppercase tracking-tight">
              EXPORT & CONVERT
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scope Selector (All vs Selected) */}
        {selectedCount > 0 && (
          <div className="mb-5">
            <label className="text-[11px] font-mono font-bold uppercase text-neutral-500 block mb-1.5">
              EXPORT SCOPE
            </label>
            <div className="flex gap-2 text-xs font-mono">
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
        )}

        {/* Export Format Grid */}
        <div className="mb-6">
          <label className="text-[11px] font-mono font-bold uppercase text-neutral-500 block mb-2">
            SELECT FORMAT
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
            <button
              onClick={() => setFormat('pdf')}
              className={`p-3 border-2 text-left transition-colors flex flex-col justify-between ${
                format === 'pdf'
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-300 bg-white hover:border-black text-black'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <FileText size={18} />
                <span className="text-[10px] uppercase font-bold">1 FILE</span>
              </div>
              <div className="font-bold">PDF DOCUMENT</div>
              <div className={`text-[10px] ${format === 'pdf' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                Merged PDF file
              </div>
            </button>

            <button
              onClick={() => setFormat('jpg')}
              className={`p-3 border-2 text-left transition-colors flex flex-col justify-between ${
                format === 'jpg'
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-300 bg-white hover:border-black text-black'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <ImageIcon size={18} />
                <span className="text-[10px] uppercase font-bold">{targetCount > 1 ? 'ZIP' : 'JPG'}</span>
              </div>
              <div className="font-bold">JPG IMAGES</div>
              <div className={`text-[10px] ${format === 'jpg' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                High-quality JPEG
              </div>
            </button>

            <button
              onClick={() => setFormat('png')}
              className={`p-3 border-2 text-left transition-colors flex flex-col justify-between ${
                format === 'png'
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-300 bg-white hover:border-black text-black'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <ImageIcon size={18} />
                <span className="text-[10px] uppercase font-bold">{targetCount > 1 ? 'ZIP' : 'PNG'}</span>
              </div>
              <div className="font-bold">PNG IMAGES</div>
              <div className={`text-[10px] ${format === 'png' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                Lossless graphics
              </div>
            </button>

            <button
              onClick={() => setFormat('webp')}
              className={`p-3 border-2 text-left transition-colors flex flex-col justify-between ${
                format === 'webp'
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-300 bg-white hover:border-black text-black'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <ImageIcon size={18} />
                <span className="text-[10px] uppercase font-bold">{targetCount > 1 ? 'ZIP' : 'WEBP'}</span>
              </div>
              <div className="font-bold">WEBP IMAGES</div>
              <div className={`text-[10px] ${format === 'webp' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                Modern compressed
              </div>
            </button>

            <button
              onClick={() => setFormat('split-pdf')}
              className={`p-3 border-2 text-left transition-colors flex flex-col justify-between ${
                format === 'split-pdf'
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-300 bg-white hover:border-black text-black'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <FileArchive size={18} />
                <span className="text-[10px] uppercase font-bold">ZIP</span>
              </div>
              <div className="font-bold">SPLIT PDF</div>
              <div className={`text-[10px] ${format === 'split-pdf' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                Individual PDFs
              </div>
            </button>

            <button
              onClick={() => setFormat('txt')}
              className={`p-3 border-2 text-left transition-colors flex flex-col justify-between ${
                format === 'txt'
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-300 bg-white hover:border-black text-black'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <FileCode size={18} />
                <span className="text-[10px] uppercase font-bold">TXT</span>
              </div>
              <div className="font-bold">EXTRACT TEXT</div>
              <div className={`text-[10px] ${format === 'txt' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                Plain text content
              </div>
            </button>
          </div>
        </div>

        {/* Format Specific Configurations */}
        {format === 'pdf' && (
          <div className="p-3.5 border-2 border-black bg-neutral-50 mb-6 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 font-bold">
                <Sliders size={13} /> Compression: {currentCompression.preset.toUpperCase()}
              </span>
              <button
                onClick={onOpenCompress}
                className="underline text-[11px] hover:text-neutral-600"
              >
                Change Settings
              </button>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
              <span className="flex items-center gap-1 font-bold">
                <Tag size={13} /> Metadata: {metadata.title ? metadata.title : 'Default'}
              </span>
              <button
                onClick={onOpenMetadata}
                className="underline text-[11px] hover:text-neutral-600"
              >
                Edit Metadata
              </button>
            </div>
          </div>
        )}

        {(format === 'jpg' || format === 'webp') && (
          <div className="p-3.5 border-2 border-black bg-neutral-50 mb-6 font-mono text-xs space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span>Image Quality</span>
                <span className="font-bold">{Math.round(imageQuality * 100)}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={Math.round(imageQuality * 100)}
                onChange={(e) => setImageQuality(Number(e.target.value) / 100)}
                className="w-full accent-black"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Resolution Scale</span>
                <span className="font-bold">{imageScale}× (Crisp)</span>
              </div>
              <div className="flex gap-2">
                {[1, 1.5, 2, 3].map((s) => (
                  <button
                    key={s}
                    onClick={() => setImageScale(s)}
                    className={`flex-1 py-1 border font-bold ${
                      imageScale === s ? 'bg-black text-white border-black' : 'bg-white border-black'
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {format === 'split-pdf' && (
          <div className="p-3.5 border-2 border-black bg-neutral-50 mb-6 font-mono text-xs space-y-3">
            <label className="font-bold uppercase text-neutral-600 block">SPLIT METHOD</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="splitMode"
                  checked={splitMode === 'single-page'}
                  onChange={() => setSplitMode('single-page')}
                  className="accent-black"
                />
                <span>Separate PDF for every page ({targetCount} PDFs in ZIP)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="splitMode"
                  checked={splitMode === 'by-file'}
                  onChange={() => setSplitMode('by-file')}
                  className="accent-black"
                />
                <span>Split by original source files</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="splitMode"
                  checked={splitMode === 'every-n-pages'}
                  onChange={() => setSplitMode('every-n-pages')}
                  className="accent-black"
                />
                <span>Chunk into fixed size:</span>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={splitChunkSize}
                  onChange={(e) => setSplitChunkSize(Math.max(2, Number(e.target.value)))}
                  className="w-14 px-1.5 py-0.5 border border-black bg-white text-xs"
                />
                <span>pages per PDF</span>
              </label>
            </div>
          </div>
        )}

        {/* Output File Name */}
        <div className="mb-6 font-mono text-xs">
          <label className="font-bold uppercase text-neutral-700 block mb-1">
            OUTPUT FILENAME (WITHOUT EXTENSION)
          </label>
          <input
            type="text"
            value={outputFileName}
            onChange={(e) => setOutputFileName(e.target.value)}
            placeholder="document"
            className="w-full px-3 py-2 border-2 border-black font-mono text-xs focus:outline-none focus:bg-neutral-50"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-black">
          <span className="text-xs font-mono font-bold">
            {targetCount} {targetCount === 1 ? 'PAGE' : 'PAGES'} TO EXPORT
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-black bg-white hover:bg-neutral-100 text-xs font-mono font-bold uppercase transition-colors"
            >
              CANCEL
            </button>
            <button
              onClick={handleStartExport}
              className="px-6 py-2.5 bg-black text-white hover:bg-neutral-800 text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <Download size={14} />
              <span>DOWNLOAD NOW</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
