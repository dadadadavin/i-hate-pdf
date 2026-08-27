import type { CompressionPreset, CompressionSettings } from '../types';

export const COMPRESSION_PRESETS: Record<CompressionPreset, CompressionSettings> = {
  lossless: { preset: 'lossless', imageQuality: 0.95, maxDpi: 0,   removeMetadata: false, optimizeStreams: true },
  high:     { preset: 'high',     imageQuality: 0.85, maxDpi: 200, removeMetadata: false, optimizeStreams: true },
  balanced: { preset: 'balanced', imageQuality: 0.70, maxDpi: 150, removeMetadata: true,  optimizeStreams: true },
  small:    { preset: 'small',    imageQuality: 0.50, maxDpi: 100, removeMetadata: true,  optimizeStreams: true },
  custom:   { preset: 'custom',   imageQuality: 0.85, maxDpi: 200, removeMetadata: false, optimizeStreams: true },
};

export const COMPRESSION_LABELS: Record<CompressionPreset, { name: string; desc: string }> = {
  lossless: { name: 'Lossless',      desc: 'No quality reduction · metadata preserved' },
  high:     { name: 'High Quality',  desc: 'Slight compression (~85% quality, 200 DPI)' },
  balanced: { name: 'Balanced',      desc: 'Recommended (~70% quality, 150 DPI)' },
  small:    { name: 'Smallest Size', desc: 'Maximum compression (~50% quality, 100 DPI)' },
  custom:   { name: 'Custom',        desc: 'Manual settings' },
};

export function estimateReductionFactor(settings: CompressionSettings): number {
  switch (settings.preset) {
    case 'lossless': return 0.95;
    case 'high':     return 0.65;
    case 'balanced': return 0.38;
    case 'small':    return 0.22;
    default: {
      const q = Math.max(0.15, settings.imageQuality * 0.7);
      const dpiFactor = settings.maxDpi > 0 ? Math.min(1, settings.maxDpi / 200) : 1;
      return Math.max(0.15, q * dpiFactor);
    }
  }
}
