import React, { useRef } from 'react';
import { Upload, FolderUp, ClipboardPaste } from 'lucide-react';

interface DropZoneProps {
  isDraggingOver: boolean;
  onFilesSelected: (files: File[]) => void;
  onPasteClick: () => void;
  isEmpty: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  isDraggingOver,
  onFilesSelected,
  onPasteClick,
  isEmpty,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const triggerFolderSelect = () => {
    folderInputRef.current?.click();
  };

  return (
    <>
      {/* Hidden file & folder inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.txt,.csv"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore - directory attributes
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Global Dragging Overlay */}
      {isDraggingOver && (
        <div className="fixed inset-0 z-50 bg-black/90 text-white flex flex-col items-center justify-center p-6 backdrop-blur-sm pointer-events-none animate-fade-in">
          <div className="border-2 border-dashed border-white p-12 max-w-xl w-full text-center flex flex-col items-center">
            <Upload size={48} className="mb-4 animate-bounce" />
            <h2 className="text-3xl font-black uppercase font-mono tracking-tight mb-2">
              DROP FILES ANYWHERE
            </h2>
            <p className="text-sm font-mono text-neutral-300">
              PDFs, Images, or whole folders. Processing remains 100% on your device.
            </p>
          </div>
        </div>
      )}

      {/* Landing Empty State */}
      {isEmpty && (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 max-w-3xl mx-auto text-center">
          <div className="w-full border-2 border-black p-8 sm:p-14 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="inline-block px-3 py-1 bg-black text-white text-xs font-mono font-bold tracking-widest uppercase mb-6">
              LOCAL FILE WORKSPACE
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase font-mono mb-4">
              I HATE PDF
            </h1>

            <p className="text-lg sm:text-xl font-mono text-neutral-700 mb-8 max-w-lg mx-auto">
              Drop files anywhere, paste screenshots, or choose files below.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 flex-wrap">
              <button
                onClick={triggerFileSelect}
                className="w-full sm:w-auto px-8 py-3.5 bg-black text-white text-sm font-mono font-bold uppercase tracking-wider hover:bg-neutral-800 transition-all active:translate-y-0.5"
              >
                [ CHOOSE FILES ]
              </button>

              <button
                onClick={onPasteClick}
                className="w-full sm:w-auto px-6 py-3.5 bg-white text-black text-sm font-mono font-bold uppercase tracking-wider border-2 border-black hover:bg-neutral-100 transition-all flex items-center justify-center gap-2"
                title="Paste image or text from clipboard (Ctrl+V / Cmd+V)"
              >
                <ClipboardPaste size={16} />
                <span>PASTE CLIPBOARD</span>
              </button>

              <button
                onClick={triggerFolderSelect}
                className="w-full sm:w-auto px-6 py-3.5 bg-white text-black text-sm font-mono font-bold uppercase tracking-wider border border-black hover:bg-neutral-100 transition-all flex items-center justify-center gap-2"
              >
                <FolderUp size={16} />
                <span>DROP FOLDER</span>
              </button>
            </div>

            <div className="pt-6 border-t border-black/10 flex flex-col items-center gap-2">
              <div className="text-xs font-mono font-semibold tracking-widest text-neutral-500 uppercase">
                PDF · JPG · PNG · WEBP · CSV · TXT
              </div>
              <div className="text-xs font-mono text-neutral-400">
                Supports continuous clipboard pasting (Cmd+V), multi-page PDFs, and 100+ images.
              </div>
            </div>
          </div>

          <div className="mt-8 text-xs font-mono text-neutral-500 flex items-center gap-2 flex-wrap justify-center">
            <span>● FAST</span>
            <span>● 100% PRIVATE</span>
            <span>● CLIENT-SIDE ONLY</span>
            <span>● Cmd+V PASTE READY</span>
          </div>
        </div>
      )}
    </>
  );
};
