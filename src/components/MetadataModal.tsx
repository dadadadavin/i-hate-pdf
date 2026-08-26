import React, { useState, useEffect } from 'react';
import { PdfMetadata } from '../types';
import { X, Check, Tag } from 'lucide-react';

interface MetadataModalProps {
  isOpen: boolean;
  metadata: PdfMetadata;
  onClose: () => void;
  onSave: (metadata: PdfMetadata) => void;
}

export const MetadataModal: React.FC<MetadataModalProps> = ({
  isOpen,
  metadata,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<PdfMetadata>({ ...metadata });

  useEffect(() => {
    if (isOpen) {
      setForm({ ...metadata });
    }
  }, [isOpen, metadata]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border-2 border-black max-w-lg w-full p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black mb-4">
          <div className="flex items-center gap-2">
            <Tag size={18} />
            <h2 className="text-base font-mono font-black uppercase tracking-tight">
              DOCUMENT METADATA
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs font-mono text-neutral-600 mb-4">
          These properties are embedded into the output PDF document header.
        </p>

        <div className="space-y-3.5 mb-6 font-mono text-xs">
          <div>
            <label className="block font-bold uppercase text-neutral-700 mb-1">
              DOCUMENT TITLE
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Annual Financial Report 2026"
              className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:bg-neutral-50"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-neutral-700 mb-1">
              AUTHOR / CREATOR
            </label>
            <input
              type="text"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              placeholder="e.g. John Doe / Design Team"
              className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:bg-neutral-50"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-neutral-700 mb-1">
              SUBJECT / DESCRIPTION
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="e.g. Final draft for stakeholder review"
              className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:bg-neutral-50"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-neutral-700 mb-1">
              KEYWORDS (COMMA SEPARATED)
            </label>
            <input
              type="text"
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              placeholder="e.g. report, finance, summary, 2026"
              className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:bg-neutral-50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-black">
          <button
            onClick={() => setForm({ title: '', author: '', subject: '', keywords: '', creator: '' })}
            className="text-xs font-mono underline hover:text-neutral-600"
          >
            Clear Fields
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-black bg-white hover:bg-neutral-100 text-xs font-mono font-bold uppercase transition-colors"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-black text-white hover:bg-neutral-800 text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>SAVE METADATA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
