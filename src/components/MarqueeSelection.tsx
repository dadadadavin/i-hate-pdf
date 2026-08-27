import React, { useState, useEffect, useRef } from 'react';

interface MarqueeSelectionProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onSelectPages: (pageIds: string[], isAdditive: boolean) => void;
  children: React.ReactNode;
}

export const MarqueeSelection: React.FC<MarqueeSelectionProps> = ({
  containerRef,
  onSelectPages,
  children,
}) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const isAdditiveRef = useRef(false);
  const selectionBoxRef = useRef(selectionBox);
  const isSelectingRef = useRef(isSelecting);

  // Keep refs in sync without re-subscribing listeners
  useEffect(() => {
    selectionBoxRef.current = selectionBox;
  }, [selectionBox]);
  useEffect(() => {
    isSelectingRef.current = isSelecting;
  }, [isSelecting]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('[data-page-id]') ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('select') ||
        e.button !== 0
      ) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const startX = e.clientX - rect.left + container.scrollLeft;
      const startY = e.clientY - rect.top + container.scrollTop;

      isAdditiveRef.current = e.shiftKey || e.metaKey || e.ctrlKey;

      setSelectionBox({ startX, startY, currentX: startX, currentY: startY });
      setIsSelecting(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isSelectingRef.current || !selectionBoxRef.current) return;

      const box = selectionBoxRef.current;
      const rect = container.getBoundingClientRect();
      const currentX = e.clientX - rect.left + container.scrollLeft;
      const currentY = e.clientY - rect.top + container.scrollTop;

      setSelectionBox((prev) => (prev ? { ...prev, currentX, currentY } : null));

      const boxLeft = Math.min(box.startX, currentX);
      const boxTop = Math.min(box.startY, currentY);
      const boxRight = Math.max(box.startX, currentX);
      const boxBottom = Math.max(box.startY, currentY);

      if (Math.abs(currentX - box.startX) > 8 || Math.abs(currentY - box.startY) > 8) {
        const pageCards = container.querySelectorAll<HTMLElement>('[data-page-id]');
        const matchedIds: string[] = [];

        pageCards.forEach((card) => {
          const cardRect = card.getBoundingClientRect();
          const cardLeft = cardRect.left - rect.left + container.scrollLeft;
          const cardTop = cardRect.top - rect.top + container.scrollTop;
          const cardRight = cardLeft + cardRect.width;
          const cardBottom = cardTop + cardRect.height;

          const overlaps =
            boxLeft < cardRight && boxRight > cardLeft && boxTop < cardBottom && boxBottom > cardTop;

          if (overlaps) {
            const pageId = card.getAttribute('data-page-id');
            if (pageId) matchedIds.push(pageId);
          }
        });

        onSelectPages(matchedIds, isAdditiveRef.current);
      }
    };

    const handleMouseUp = () => {
      setIsSelecting(false);
      setSelectionBox(null);
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef, onSelectPages]);

  const boxStyle = selectionBox
    ? {
        left: `${Math.min(selectionBox.startX, selectionBox.currentX)}px`,
        top: `${Math.min(selectionBox.startY, selectionBox.currentY)}px`,
        width: `${Math.abs(selectionBox.currentX - selectionBox.startX)}px`,
        height: `${Math.abs(selectionBox.currentY - selectionBox.startY)}px`,
      }
    : null;

  return (
    <div className="relative w-full min-h-full">
      {children}

      {/* Marquee Selection Rectangle Box */}
      {isSelecting && boxStyle && (
        <div
          style={boxStyle}
          className="absolute z-40 border-2 border-dashed border-black bg-black/10 pointer-events-none transition-none shadow-sm"
        />
      )}
    </div>
  );
};
