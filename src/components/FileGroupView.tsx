import React from 'react';
import { PageItem, SourceFile } from '../types';
import { PageGrid } from './PageGrid';
import { FileText, Image as ImageIcon, FileCode, RotateCw, Trash2, CheckSquare, Layers } from 'lucide-react';

interface FileGroupViewProps {
  pages: PageItem[];
  files: SourceFile[];
  selectedIds: Set<string>;
  zoomScale: number;
  onReorder: (activeId: string, overId: string) => void;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onRotateCw: (id: string) => void;
  onRotateCcw: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onOpenCrop: (page: PageItem) => void;
  onOpenResize: (page: PageItem) => void;
  onOpenPreview: (index: number) => void;
  onAddFilesClick: () => void;
  onSelectFilePages: (fileId: string) => void;
  onRotateFilePages: (fileId: string) => void;
  onRemoveFile: (fileId: string) => void;
  onFlattenToUnified: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const FileGroupView: React.FC<FileGroupViewProps> = ({
  pages,
  files,
  selectedIds,
  zoomScale,
  onReorder,
  onSelect,
  onRotateCw,
  onRotateCcw,
  onDelete,
  onDuplicate,
  onOpenCrop,
  onOpenResize,
  onOpenPreview,
  onAddFilesClick,
  onSelectFilePages,
  onRotateFilePages,
  onRemoveFile,
  onFlattenToUnified,
}) => {
  const fileGroups = files.map((file) => {
    const filePages = pages.filter((p) => p.fileId === file.id);
    return {
      file,
      pages: filePages,
    };
  }).filter((g) => g.pages.length > 0);

  return (
    <div className="space-y-12 pb-32">
      {/* Top Banner to Merge All */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-2 border-black bg-neutral-50 gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <h2 className="text-sm font-mono font-black uppercase tracking-tight">
            GROUPED BY SOURCE FILE ({fileGroups.length} FILES)
          </h2>
          <p className="text-xs font-mono text-neutral-600">
            Reorder pages within each file or flatten all into a single unified stream.
          </p>
        </div>

        <button
          onClick={onFlattenToUnified}
          className="px-4 py-2 bg-black text-white text-xs font-mono font-black uppercase border-2 border-black hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <Layers size={14} />
          <span>[ MERGE ALL INTO SINGLE STREAM ]</span>
        </button>
      </div>

      {/* List of File Groups */}
      {fileGroups.map((group) => {
        const { file, pages: groupPages } = group;
        const isPdf = file.type === 'pdf';
        const isImage = file.type === 'image';

        return (
          <section key={file.id} className="border-2 border-black bg-white p-4 sm:p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            {/* Group Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-6 border-b-2 border-black gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 border-2 border-black flex items-center justify-center bg-black text-white">
                  {isPdf ? <FileText size={18} /> : isImage ? <ImageIcon size={18} /> : <FileCode size={18} />}
                </div>

                <div>
                  <h3 className="text-sm font-mono font-black truncate max-w-md sm:max-w-xl text-black" title={file.name}>
                    {file.name}
                  </h3>
                  <div className="text-[11px] font-mono text-neutral-500 flex items-center gap-2">
                    <span className="font-bold">{groupPages.length} {groupPages.length === 1 ? 'PAGE' : 'PAGES'}</span>
                    <span>·</span>
                    <span>{formatBytes(file.size)}</span>
                    <span>·</span>
                    <span className="uppercase font-semibold">{file.type}</span>
                  </div>
                </div>
              </div>

              {/* Group Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onSelectFilePages(file.id)}
                  className="px-3 py-1 text-xs font-mono border border-black bg-white hover:bg-neutral-100 transition-colors flex items-center gap-1 font-bold"
                  title="Select all pages from this file"
                >
                  <CheckSquare size={13} />
                  <span>SELECT ALL</span>
                </button>

                <button
                  onClick={() => onRotateFilePages(file.id)}
                  className="px-3 py-1 text-xs font-mono border border-black bg-white hover:bg-neutral-100 transition-colors flex items-center gap-1 font-bold"
                  title="Rotate all pages in this file +90°"
                >
                  <RotateCw size={13} />
                  <span>ROTATE ALL</span>
                </button>

                <button
                  onClick={() => onRemoveFile(file.id)}
                  className="px-3 py-1 text-xs font-mono border border-black text-black bg-white hover:bg-neutral-100 transition-colors flex items-center gap-1 font-bold"
                  title="Remove this entire file"
                >
                  <Trash2 size={13} />
                  <span>REMOVE FILE</span>
                </button>
              </div>
            </div>

            {/* Grid for this file */}
            <PageGrid
              pages={groupPages}
              selectedIds={selectedIds}
              zoomScale={zoomScale}
              onReorder={onReorder}
              onSelect={onSelect}
              onRotateCw={onRotateCw}
              onRotateCcw={onRotateCcw}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onOpenCrop={onOpenCrop}
              onOpenResize={onOpenResize}
              onOpenPreview={(idx) => {
                const targetPage = groupPages[idx];
                const globalIdx = pages.findIndex((p) => p.id === targetPage?.id);
                onOpenPreview(globalIdx !== -1 ? globalIdx : 0);
              }}
              onAddFilesClick={onAddFilesClick}
            />
          </section>
        );
      })}
    </div>
  );
};
