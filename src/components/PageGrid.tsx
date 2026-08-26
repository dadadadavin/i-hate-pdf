import React from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { PageItem, CardDensity } from '../types';
import { PageCard } from './PageCard';
import { Plus } from 'lucide-react';

interface PageGridProps {
  pages: PageItem[];
  selectedIds: Set<string>;
  density: CardDensity;
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
}

export const PageGrid: React.FC<PageGridProps> = ({
  pages,
  selectedIds,
  density,
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
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  };

  const cardWidthClass =
    density === 'compact'
      ? 'w-36 sm:w-44'
      : density === 'large'
      ? 'w-64 sm:w-80'
      : 'w-48 sm:w-56';

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
        <div className="flex flex-wrap gap-4 sm:gap-6 justify-start items-start pb-32">
          {pages.map((page, index) => (
            <PageCard
              key={page.id}
              page={page}
              displayIndex={index + 1}
              isSelected={selectedIds.has(page.id)}
              density={density}
              onSelect={onSelect}
              onRotateCw={onRotateCw}
              onRotateCcw={onRotateCcw}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onOpenCrop={onOpenCrop}
              onOpenResize={onOpenResize}
              onOpenPreview={onOpenPreview}
            />
          ))}

          {/* "+ Add More Files" End Card */}
          <button
            type="button"
            onClick={onAddFilesClick}
            className={`${cardWidthClass} flex flex-col items-center justify-center border-2 border-dashed border-neutral-400 hover:border-black bg-white hover:bg-neutral-50 transition-all p-6 text-center group cursor-pointer`}
            style={{ minHeight: density === 'compact' ? '240px' : density === 'large' ? '380px' : '300px' }}
          >
            <div className="w-12 h-12 rounded-none border border-black flex items-center justify-center mb-3 bg-white group-hover:bg-black group-hover:text-white transition-colors">
              <Plus size={24} />
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-black">
              + ADD FILES
            </span>
            <span className="text-[10px] font-mono text-neutral-500 mt-1">
              Drop, paste, or click to append
            </span>
          </button>
        </div>
      </SortableContext>
    </DndContext>
  );
};
