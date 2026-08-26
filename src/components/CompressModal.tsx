import React, { useState, useEffect } from 'react';
import { CompressionSettings, CompressionPreset } from '../types';
import { X, Check, Sliders, ChevronDown, ChevronUp } from 'lucide-react';

interface CompressModalProps {
  isOpen: boolean;
  currentSettings: CompressionSettings;
  originalEstimatedBytes: number;
  onClose: () => void;
  onApply: (settings: CompressionSettings) => void;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const CompressModal: React.FC<CompressModalProps> = ({
  isOpen,
  currentSettings,
  originalEstimatedBytes,
  onClose,
  onApply,
}) => {
  const [settings, setSettings] = useState<CompressionSettings>({ ...currentSettings });
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings({ ...currentSettings });
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  // Preset definitions
  const selectPreset = (preset: CompressionPreset) => {
    if (preset === 'lossless') {
      setSettings({
        preset: 'lossless',
        imageQuality: 0.95,
        maxDpi: 0,
        removeMetadata: false,
        optimizeStreams: true,
      });
    } else if (preset === 'high') {
      setSettings({
        preset: 'high',
        imageQuality: 0.85,
        maxDpi: 200,
        removeMetadata: false,
        optimizeStreams: true,
      });
    } else if (preset === 'balanced') {
      setSettings({
        preset: 'balanced',
        imageQuality: 0.70,
        maxDpi: 150,
        removeMetadata: true,
        optimizeStreams: true,
      });
    } else if (preset === 'small') {
      setSettings({
        preset: 'small',
        imageQuality: 0.50,
        maxDpi: 100,
        removeMetadata: true,
        optimizeStreams: true,
      });
    }
  };

  // Estimate output size based on chosen preset/quality
  let reductionFactor = 1.0;
  if (settings.preset === 'lossless') reductionFactor = 0.95;
  else if (settings.preset === 'high') reductionFactor = 0.65;
  else if (settings.preset === 'balanced') reductionFactor = 0.38;
  else if (settings.preset === 'small') reductionFactor = 0.22;
  else {
    // Custom calculation
    reductionFactor = Math.max(0.15, (settings.imageQuality * 0.7) * (settings.maxDpi > 0 ? Math.min(1, settings.maxDpi / 200) : 1));
  }

  const estimatedCompressedBytes = Math.round(originalEstimatedBytes * reductionFactor);

  const handleApply = () => {
    onApply(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border-2 border-black max-w-md w-full p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black mb-5">
          <div className="flex items-center gap-2">
            <Sliders size={18} />
            <h2 className="text-base font-mono font-black uppercase tracking-tight">
              COMPRESSION
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Presets List */}
        <div className="space-y-2 mb-6">
          {[
            { id: 'lossless', name: 'Lossless', desc: 'No quality reduction · metadata preserved' },
            { id: 'high', name: 'High Quality', desc: 'Slight compression (~85% quality, 200 DPI)' },
            { id: 'balanced', name: 'Balanced', desc: 'Recommended (~70% quality, 150 DPI)' },
            { id: 'small', name: 'Smallest Size', desc: 'Maximum compression (~50% quality, 100 DPI)' },
          ].map((item) => {
            const isSelected = settings.preset === item.id;
            return (
              <label
                key={item.id}
                onClick={() => selectPreset(item.id as CompressionPreset)}
                className={`flex items-start gap-3 p-3 border-2 cursor-pointer font-mono transition-colors ${
                  isSelected
                    ? 'border-black bg-black text-white'
                    : 'border-neutral-200 bg-white hover:border-black text-black'
                }`}
              >
                <input
                  type="radio"
                  name="compressionPreset"
                  checked={isSelected}
                  onChange={() => selectPreset(item.id as CompressionPreset)}
                  className="mt-0.5 accent-black"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold uppercase">{item.name}</div>
                  <div className={`text-[11px] ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    {item.desc}
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        {/* Estimated Size Comparison */}
        <div className="p-3.5 border-2 border-black bg-neutral-50 mb-6 font-mono text-xs">
          <div className="text-[11px] uppercase font-bold text-neutral-500 mb-1">
            ESTIMATED OUTPUT SIZE
          </div>
          <div className="flex items-center justify-between font-bold text-sm">
            <span className="line-through text-neutral-500">
              {formatBytes(originalEstimatedBytes)}
            </span>
            <span className="text-black font-black">
              → ~{formatBytes(estimatedCompressedBytes)}
            </span>
            <span className="text-[11px] bg-black text-white px-1.5 py-0.2">
              -{Math.round((1 - reductionFactor) * 100)}%
            </span>
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <div className="mb-6 border border-black">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-3 py-2 text-xs font-mono font-bold uppercase flex items-center justify-between bg-neutral-100 hover:bg-neutral-200 transition-colors"
          >
            <span>ADVANCED SETTINGS</span>
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showAdvanced && (
            <div className="p-3.5 space-y-3.5 bg-white font-mono text-xs border-t border-black animate-fade-in">
              {/* Quality slider */}
              <div>
                <div className="flex justify-between mb-1">
                  <span>Image Quality</span>
                  <span className="font-bold">{Math.round(settings.imageQuality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={Math.round(settings.imageQuality * 100)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      preset: 'custom',
                      imageQuality: Number(e.target.value) / 100,
                    })
                  }
                  className="w-full accent-black"
                />
              </div>

              {/* Max DPI */}
              <div>
                <div className="flex justify-between mb-1">
                  <span>Maximum DPI</span>
                  <span className="font-bold">
                    {settings.maxDpi === 0 ? 'Original' : `${settings.maxDpi} DPI`}
                  </span>
                </div>
                <select
                  value={settings.maxDpi}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      preset: 'custom',
                      maxDpi: Number(e.target.value),
                    })
                  }
                  className="w-full px-2 py-1 border border-black text-xs bg-white"
                >
                  <option value={0}>Keep Original DPI</option>
                  <option value={300}>300 DPI (High Resolution Print)</option>
                  <option value={200}>200 DPI (Standard Documents)</option>
                  <option value={150}>150 DPI (Fast Viewing / Web)</option>
                  <option value={100}>100 DPI (Compact File)</option>
                  <option value={72}>72 DPI (Minimum Screen Size)</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-neutral-200 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Remove Document Metadata</span>
                  <input
                    type="checkbox"
                    checked={settings.removeMetadata}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        preset: 'custom',
                        removeMetadata: e.target.checked,
                      })
                    }
                    className="accent-black w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span>Optimize PDF Streams</span>
                  <input
                    type="checkbox"
                    checked={settings.optimizeStreams}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        preset: 'custom',
                        optimizeStreams: e.target.checked,
                      })
                    }
                    className="accent-black w-4 h-4"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-black">
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
  );
};
