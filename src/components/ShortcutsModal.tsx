import React, { useEffect } from 'react';
import { X, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUT_GROUPS = [
  {
    category: 'WORKSPACE & NAVIGATION',
    items: [
      { key: '⌘ / Ctrl + V', desc: 'Paste copied image or file from clipboard' },
      { key: '⌘ / Ctrl + A', desc: 'Select all pages in workspace' },
      { key: 'Esc', desc: 'Deselect all or close open modal' },
      { key: '?', desc: 'Show keyboard shortcuts guide' },
    ],
  },
  {
    category: 'PAGE SELECTION & MANIPULATION',
    items: [
      { key: 'Click', desc: 'Select single page' },
      { key: 'Shift + Click', desc: 'Select continuous range of pages' },
      { key: '⌘ / Ctrl + Click', desc: 'Toggle page into multi-selection' },
      { key: 'Drag Rectangle', desc: 'Lasso / Marquee select multiple pages' },
      { key: 'Space', desc: 'Instant high-res full page preview' },
      { key: 'R', desc: 'Rotate selected pages clockwise (+90°)' },
      { key: 'D', desc: 'Duplicate selected pages' },
      { key: 'Backspace / Delete', desc: 'Delete selected pages' },
    ],
  },
  {
    category: 'PREVIEW VIEWER',
    items: [
      { key: '← / →', desc: 'Previous / Next page in preview' },
      { key: '+ / -', desc: 'Zoom in / Zoom out' },
      { key: '0', desc: 'Reset zoom to 100%' },
    ],
  },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-white border-2 border-black max-w-lg w-full p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-mono text-xs max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black text-white flex items-center justify-center">
              <Command size={14} />
            </div>
            <h2 className="text-sm font-black uppercase tracking-tight">
              KEYBOARD SHORTCUTS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Shortcut Groups */}
        <div className="space-y-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category} className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-neutral-500 border-b border-neutral-200 pb-1">
                {group.category}
              </h3>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-1 px-2 bg-neutral-50 border border-neutral-200"
                  >
                    <span className="text-neutral-700 text-[11px]">{item.desc}</span>
                    <kbd className="px-2 py-0.5 bg-white border border-black text-black font-bold text-[10px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-black flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-black text-white text-xs font-bold uppercase hover:bg-neutral-800 transition-colors"
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
};
