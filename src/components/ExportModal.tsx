import React, { useState } from 'react';
import {
  ExportOptions,
  CompressionSettings,
  PdfMetadata,
  PageNumberingOptions,
  WatermarkOptions,
  PageNumberPosition,
  PageNumberFormat,
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
  Hash,
  ScanText,
  Lock,
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
  const [activeTab, setActiveTab] = useState<'format' | 'stamps' | 'ocr' | 'security'>('format');
  const [format, setFormat] = useState<ExportOptions['format']>('pdf');
  const [scope, setScope] = useState<'all' | 'selected'>(
    selectedCount > 0 && initialScope === 'selected' ? 'selected' : 'all'
  );
  const [outputFileName, setOutputFileName] = useState('document');
  const [imageQuality, setImageQuality] = useState(0.85);
  const [imageScale, setImageScale] = useState(2);
  const [splitMode, setSplitMode] = useState<'single-page' | 'by-file' | 'every-n-pages'>('single-page');
  const [splitChunkSize, setSplitChunkSize] = useState(5);

  // Page Numbers
  const [numberingEnabled, setNumberingEnabled] = useState(false);
  const [numberingFormat, setNumberingFormat] = useState<PageNumberFormat>('page-n-of-total');
  const [numberingPos, setNumberingPos] = useState<PageNumberPosition>('bottom-center');
  const [numberingStart, setNumberingStart] = useState(1);

  // Watermark
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.15);
  const [watermarkAngle, setWatermarkAngle] = useState(-45);

  // OCR
  const [ocrSearchable, setOcrSearchable] = useState(false);

  // Security
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState('');

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

    const numbering: PageNumberingOptions = {
      enabled: numberingEnabled,
      format: numberingFormat,
      position: numberingPos,
      fontSizePt: 10,
      startNumber: numberingStart,
    };

    const watermark: WatermarkOptions = {
      enabled: watermarkEnabled,
      text: watermarkText,
      opacity: watermarkOpacity,
      rotationDeg: watermarkAngle,
      fontSizePt: 48,
    };

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
      numbering: numberingEnabled ? numbering : undefined,
      watermark: watermarkEnabled ? watermark : undefined,
      ocrSearchable,
      security: passwordEnabled && password ? { password } : undefined,
    };

    onExport(exportOptions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in font-mono text-xs">
      <div className="bg-white border-2 border-black max-w-xl w-full p-6 sm:p-7 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black mb-4">
          <div className="flex items-center gap-2">
            <Download size={18} />
            <h2 className="text-base font-black uppercase tracking-tight">
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

        {/* Tab Navigation */}
        <div className="flex border-2 border-black mb-5 bg-neutral-100">
          <button
            onClick={() => setActiveTab('format')}
            className={`flex-1 py-1.5 font-bold uppercase transition-colors flex items-center justify-center gap-1 text-[11px] ${
              activeTab === 'format' ? 'bg-black text-white' : 'hover:bg-neutral-200'
            }`}
          >
            <FileText size={12} />
            <span>FORMAT</span>
          </button>
          <button
            onClick={() => setActiveTab('stamps')}
            className={`flex-1 py-1.5 font-bold uppercase transition-colors border-l-2 border-black flex items-center justify-center gap-1 text-[11px] ${
              activeTab === 'stamps' ? 'bg-black text-white' : 'hover:bg-neutral-200'
            }`}
          >
            <Hash size={12} />
            <span>STAMPS & NUMBERS</span>
          </button>
          <button
            onClick={() => setActiveTab('ocr')}
            className={`flex-1 py-1.5 font-bold uppercase transition-colors border-l-2 border-black flex items-center justify-center gap-1 text-[11px] ${
              activeTab === 'ocr' ? 'bg-black text-white' : 'hover:bg-neutral-200'
            }`}
          >
            <ScanText size={12} />
            <span>OCR</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-1.5 font-bold uppercase transition-colors border-l-2 border-black flex items-center justify-center gap-1 text-[11px] ${
              activeTab === 'security' ? 'bg-black text-white' : 'hover:bg-neutral-200'
            }`}
          >
            <Lock size={12} />
            <span>PASSWORD</span>
          </button>
        </div>

        {/* TAB 1: FORMAT */}
        {activeTab === 'format' && (
          <div>
            {selectedCount > 0 && (
              <div className="mb-4">
                <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                  EXPORT SCOPE
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setScope('selected')}
                    className={`flex-1 py-1.5 border-2 font-bold uppercase transition-colors ${
                      scope === 'selected'
                        ? 'border-black bg-black text-white'
                        : 'border-neutral-300 bg-white text-black hover:border-black'
                    }`}
                  >
                    {selectedCount} Selected {selectedCount === 1 ? 'Page' : 'Pages'}
                  </button>
                  <button
                    onClick={() => setScope('all')}
                    className={`flex-1 py-1.5 border-2 font-bold uppercase transition-colors ${
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

            <div className="mb-5">
              <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1.5">
                SELECT FORMAT
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => setFormat('pdf')}
                  className={`p-2.5 border-2 text-left transition-colors flex flex-col justify-between ${
                    format === 'pdf'
                      ? 'border-black bg-black text-white'
                      : 'border-neutral-300 bg-white hover:border-black text-black'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <FileText size={16} />
                    <span className="text-[9px] uppercase font-bold">1 FILE</span>
                  </div>
                  <div className="font-bold">PDF DOCUMENT</div>
                  <div className={`text-[9px] ${format === 'pdf' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    Merged PDF
                  </div>
                </button>

                <button
                  onClick={() => setFormat('jpg')}
                  className={`p-2.5 border-2 text-left transition-colors flex flex-col justify-between ${
                    format === 'jpg'
                      ? 'border-black bg-black text-white'
                      : 'border-neutral-300 bg-white hover:border-black text-black'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <ImageIcon size={16} />
                    <span className="text-[9px] uppercase font-bold">{targetCount > 1 ? 'ZIP' : 'JPG'}</span>
                  </div>
                  <div className="font-bold">JPG IMAGES</div>
                  <div className={`text-[9px] ${format === 'jpg' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    High-quality JPEG
                  </div>
                </button>

                <button
                  onClick={() => setFormat('png')}
                  className={`p-2.5 border-2 text-left transition-colors flex flex-col justify-between ${
                    format === 'png'
                      ? 'border-black bg-black text-white'
                      : 'border-neutral-300 bg-white hover:border-black text-black'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <ImageIcon size={16} />
                    <span className="text-[9px] uppercase font-bold">{targetCount > 1 ? 'ZIP' : 'PNG'}</span>
                  </div>
                  <div className="font-bold">PNG IMAGES</div>
                  <div className={`text-[9px] ${format === 'png' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    Lossless PNG
                  </div>
                </button>

                <button
                  onClick={() => setFormat('webp')}
                  className={`p-2.5 border-2 text-left transition-colors flex flex-col justify-between ${
                    format === 'webp'
                      ? 'border-black bg-black text-white'
                      : 'border-neutral-300 bg-white hover:border-black text-black'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <ImageIcon size={16} />
                    <span className="text-[9px] uppercase font-bold">{targetCount > 1 ? 'ZIP' : 'WEBP'}</span>
                  </div>
                  <div className="font-bold">WEBP IMAGES</div>
                  <div className={`text-[9px] ${format === 'webp' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    Modern WebP
                  </div>
                </button>

                <button
                  onClick={() => setFormat('split-pdf')}
                  className={`p-2.5 border-2 text-left transition-colors flex flex-col justify-between ${
                    format === 'split-pdf'
                      ? 'border-black bg-black text-white'
                      : 'border-neutral-300 bg-white hover:border-black text-black'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <FileArchive size={16} />
                    <span className="text-[9px] uppercase font-bold">ZIP</span>
                  </div>
                  <div className="font-bold">SPLIT PDF</div>
                  <div className={`text-[9px] ${format === 'split-pdf' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    Separate PDFs
                  </div>
                </button>

                <button
                  onClick={() => setFormat('txt')}
                  className={`p-2.5 border-2 text-left transition-colors flex flex-col justify-between ${
                    format === 'txt'
                      ? 'border-black bg-black text-white'
                      : 'border-neutral-300 bg-white hover:border-black text-black'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <FileCode size={16} />
                    <span className="text-[9px] uppercase font-bold">TXT</span>
                  </div>
                  <div className="font-bold">EXTRACT TEXT</div>
                  <div className={`text-[9px] ${format === 'txt' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    Plain text
                  </div>
                </button>
              </div>
            </div>

            {format === 'pdf' && (
              <div className="p-3 border-2 border-black bg-neutral-50 mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 font-bold">
                    <Sliders size={13} /> Compression: {currentCompression.preset.toUpperCase()}
                  </span>
                  <button onClick={onOpenCompress} className="underline text-[11px] hover:text-neutral-600">
                    Change Settings
                  </button>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-neutral-200">
                  <span className="flex items-center gap-1 font-bold">
                    <Tag size={13} /> Metadata: {metadata.title ? metadata.title : 'Default'}
                  </span>
                  <button onClick={onOpenMetadata} className="underline text-[11px] hover:text-neutral-600">
                    Edit Metadata
                  </button>
                </div>
              </div>
            )}

            {(format === 'jpg' || format === 'webp') && (
              <div className="p-3 border-2 border-black bg-neutral-50 mb-4 space-y-3">
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
                    <span className="font-bold">{imageScale}×</span>
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
              <div className="p-3 border-2 border-black bg-neutral-50 mb-4 space-y-2">
                <label className="font-bold uppercase text-neutral-600 block text-[10px]">SPLIT METHOD</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="splitMode"
                      checked={splitMode === 'single-page'}
                      onChange={() => setSplitMode('single-page')}
                      className="accent-black"
                    />
                    <span>1 PDF for every page ({targetCount} files in ZIP)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="splitMode"
                      checked={splitMode === 'by-file'}
                      onChange={() => setSplitMode('by-file')}
                      className="accent-black"
                    />
                    <span>Split by source file</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="splitMode"
                      checked={splitMode === 'every-n-pages'}
                      onChange={() => setSplitMode('every-n-pages')}
                      className="accent-black"
                    />
                    <span>Chunk into:</span>
                    <input
                      type="number"
                      min="2"
                      max="100"
                      value={splitChunkSize}
                      onChange={(e) => setSplitChunkSize(Math.max(2, Number(e.target.value)))}
                      className="w-12 px-1 py-0.5 border border-black bg-white"
                    />
                    <span>pages per file</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PAGE NUMBERS & WATERMARK */}
        {activeTab === 'stamps' && (
          <div className="space-y-5 mb-5">
            {/* Page Numbers */}
            <div className="p-3.5 border-2 border-black bg-neutral-50 space-y-3">
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={numberingEnabled}
                  onChange={(e) => setNumberingEnabled(e.target.checked)}
                  className="w-4 h-4 accent-black"
                />
                <span>ADD PAGE NUMBERS</span>
              </label>

              {numberingEnabled && (
                <div className="space-y-2.5 pt-2 border-t border-neutral-300">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] block mb-1 text-neutral-500 font-bold">FORMAT</label>
                      <select
                        value={numberingFormat}
                        onChange={(e) => setNumberingFormat(e.target.value as PageNumberFormat)}
                        className="w-full p-1.5 border border-black bg-white"
                      >
                        <option value="page-n-of-total">Page 1 of {targetCount}</option>
                        <option value="page-n">Page 1</option>
                        <option value="number-only">1 (Number only)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] block mb-1 text-neutral-500 font-bold">POSITION</label>
                      <select
                        value={numberingPos}
                        onChange={(e) => setNumberingPos(e.target.value as PageNumberPosition)}
                        className="w-full p-1.5 border border-black bg-white"
                      >
                        <option value="bottom-center">Bottom Center</option>
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="top-center">Top Center</option>
                        <option value="top-right">Top Right</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-neutral-500 font-bold">START AT PAGE:</label>
                    <input
                      type="number"
                      min="1"
                      value={numberingStart}
                      onChange={(e) => setNumberingStart(Math.max(1, Number(e.target.value)))}
                      className="w-16 p-1 border border-black bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Watermark Stamp */}
            <div className="p-3.5 border-2 border-black bg-neutral-50 space-y-3">
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={watermarkEnabled}
                  onChange={(e) => setWatermarkEnabled(e.target.checked)}
                  className="w-4 h-4 accent-black"
                />
                <span>ADD WATERMARK STAMP</span>
              </label>

              {watermarkEnabled && (
                <div className="space-y-2.5 pt-2 border-t border-neutral-300">
                  <div>
                    <label className="text-[10px] block mb-1 text-neutral-500 font-bold">WATERMARK TEXT</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="CONFIDENTIAL"
                      className="w-full p-1.5 border border-black bg-white uppercase font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                        <span>OPACITY</span>
                        <span>{Math.round(watermarkOpacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="80"
                        step="5"
                        value={Math.round(watermarkOpacity * 100)}
                        onChange={(e) => setWatermarkOpacity(Number(e.target.value) / 100)}
                        className="w-full accent-black"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] block mb-1 text-neutral-500 font-bold">ROTATION</label>
                      <select
                        value={watermarkAngle}
                        onChange={(e) => setWatermarkAngle(Number(e.target.value))}
                        className="w-full p-1.5 border border-black bg-white"
                      >
                        <option value={-45}>-45° Diagonal</option>
                        <option value={0}>0° Horizontal</option>
                        <option value={-90}>-90° Vertical</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SEARCHABLE OCR */}
        {activeTab === 'ocr' && (
          <div className="p-4 border-2 border-black bg-neutral-50 space-y-3 mb-5">
            <div className="flex items-center gap-2">
              <ScanText size={18} />
              <h3 className="font-bold uppercase">100% LOCAL OCR ENGINE (TESSERACT.JS)</h3>
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Extract selectable and copyable text from scanned documents and phone camera images directly inside your browser.
            </p>

            <label className="flex items-center gap-2 font-bold cursor-pointer pt-2 border-t border-neutral-200">
              <input
                type="checkbox"
                checked={ocrSearchable}
                onChange={(e) => setOcrSearchable(e.target.checked)}
                className="w-4 h-4 accent-black"
              />
              <span>MAKE EXPORTED PDF SEARCHABLE & EXTRACT TEXT</span>
            </label>
          </div>
        )}

        {/* TAB 4: SECURITY & PASSWORD */}
        {activeTab === 'security' && (
          <div className="p-4 border-2 border-black bg-neutral-50 space-y-3 mb-5">
            <div className="flex items-center gap-2">
              <Lock size={18} />
              <h3 className="font-bold uppercase">PDF PASSWORD PROTECTION</h3>
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Protect your exported PDF with a password. Anyone opening the PDF will be prompted for this password.
            </p>

            <label className="flex items-center gap-2 font-bold cursor-pointer pt-2 border-t border-neutral-200">
              <input
                type="checkbox"
                checked={passwordEnabled}
                onChange={(e) => setPasswordEnabled(e.target.checked)}
                className="w-4 h-4 accent-black"
              />
              <span>ENCRYPT WITH PASSWORD</span>
            </label>

            {passwordEnabled && (
              <div className="pt-2">
                <label className="text-[10px] block mb-1 text-neutral-500 font-bold">ENTER PASSWORD</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Secret password..."
                  className="w-full p-2 border border-black bg-white text-xs"
                />
              </div>
            )}
          </div>
        )}

        {/* Output File Name */}
        <div className="mb-5">
          <label className="font-bold uppercase text-neutral-700 block mb-1 text-[10px]">
            OUTPUT FILENAME (WITHOUT EXTENSION)
          </label>
          <input
            type="text"
            value={outputFileName}
            onChange={(e) => setOutputFileName(e.target.value)}
            placeholder="document"
            className="w-full px-3 py-1.5 border-2 border-black font-mono text-xs focus:outline-none focus:bg-neutral-50"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-black">
          <span className="font-bold">
            {targetCount} {targetCount === 1 ? 'PAGE' : 'PAGES'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-black bg-white hover:bg-neutral-100 text-xs font-bold uppercase transition-colors"
            >
              CANCEL
            </button>
            <button
              onClick={handleStartExport}
              className="px-6 py-2 bg-black text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
