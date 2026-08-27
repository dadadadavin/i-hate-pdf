import type { PageFormat } from '../types';

export const PT_PER_MM = 72 / 25.4; // 2.8346
export const PT_PER_INCH = 72;

export const STANDARD_PAPER_SIZES: Record<Exclude<PageFormat, 'custom' | 'original'>, { width: number; height: number; name: string; mmW: number; mmH: number }> = {
  a4:     { width: 595.28, height: 841.89, name: 'A4',     mmW: 210, mmH: 297 },
  letter: { width: 612.0,  height: 792.0,  name: 'Letter', mmW: 216, mmH: 279 },
  legal:  { width: 612.0,  height: 1008.0, name: 'Legal',  mmW: 216, mmH: 356 },
  a3:     { width: 841.89, height: 1190.55, name: 'A3',    mmW: 297, mmH: 420 },
  a5:     { width: 419.53, height: 595.28, name: 'A5',     mmW: 148, mmH: 210 },
};

export const MARGIN_PRESETS: { label: string; mm: number }[] = [
  { label: 'None',   mm: 0 },
  { label: 'Small',  mm: 6 },
  { label: 'Normal', mm: 12.7 },
  { label: 'Large',  mm: 25.4 },
];

export const PAGE_FORMAT_OPTIONS: { value: PageFormat; label: string }[] = [
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Letter' },
  { value: 'legal', label: 'Legal' },
  { value: 'a3', label: 'A3' },
  { value: 'a5', label: 'A5' },
  { value: 'original', label: 'Original' },
  { value: 'custom', label: 'Custom' },
];
