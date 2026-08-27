import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { PageItem } from '../types';
import { PageCard } from './PageCard';
import { Plus } from 'lucide-react';
import { playTickSound, playSnapSound } from '../services/soundService';

interface PageGridProps {
  pages: PageItem[];
  selectedIds: Set<string>;
  zoomScale: number;
  onReorder: (activeId: string, overId: string) => void;
  onReorderMultiple?: (draggedId: string, overId: string, selectedIds: Set<string>) => void;
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
  zoomScale,
  onReorder,
  onReorderMultiple,
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
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required to distinguish click/select from drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
    playTickSound();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    playSnapSound();

    if (over && active.id !== over.id) {
      if (selectedIds.has(String(active.id)) && selectedIds.size > 1 && onReorderMultiple) {
        onReorderMultiple(String(active.id), String(over.id), selectedIds);
      } else {
        onReorder(String(active.id), String(over.id));
      }
    }
  };

  const activePage = pages.find((p) => p.id === activeDragId);
  const activeIndex = activePage ? pages.findIndex((p) => p.id === activeDragId) : 0;

  const cardWidth = `${Math.round(230 * zoomScale)}px`;
  const minCardHeight = `${Math.round(330 * zoomScale)}px`;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
        <div className="flex flex-wrap gap-5 sm:gap-7 justify-start items-start pb-32">
          {pages.map((page, index) => (
            <PageCard
              key={page.id}
              page={page}
              displayIndex={index + 1}
              isSelected={selectedIds.has(page.id)}
              zoomScale={zoomScale}
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
            style={{ width: cardWidth, minHeight: minCardHeight }}
            className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-400 hover:border-black bg-white hover:bg-neutral-50 transition-all p-6 text-center group cursor-pointer shadow-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 select-none"
          >
            <div className="w-12 h-12 rounded-none border-2 border-black flex items-center justify-center mb-3 bg-white group-hover:bg-black group-hover:text-white transition-all group-hover:rotate-90">
              <Plus size={24} />
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-black">
              + ADD FILES
            </span>
            <span className="text-[10px] font-mono text-neutral-500 mt-1">
              Drop, paste, or click
            </span>
          </button>
        </div>
      </SortableContext>

      {/* Floating Drag Overlay */}
      <DragOverlay
        dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.4',
              },
            },
          }),
        }}
      >
        {activePage ? (
          <PageCard
            page={activePage}
            displayIndex={activeIndex + 1}
            isSelected={selectedIds.has(activePage.id)}
            selectedCount={selectedIds.size}
            zoomScale={zoomScale}
            isOverlay={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
