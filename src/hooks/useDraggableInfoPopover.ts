'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { errorHandler, STORAGE_ERRORS } from '@/lib/errors/errorHandler';

interface UseDraggableInfoPopoverOptions {
  storageKey: string;
  defaultPosition?: { x: number; y: number };
  panelWidth?: number;
  panelHeight?: number;
}

export function useDraggableInfoPopover({
  storageKey,
  defaultPosition = { x: 16, y: 96 },
  panelWidth = 300,
  panelHeight = 500,
}: UseDraggableInfoPopoverOptions) {
  const [position, setPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (err) {
          errorHandler.logError(
            STORAGE_ERRORS.LOAD_FAILED({
              operation: `parse${storageKey}`,
              savedValue: saved,
              error: String(err),
            })
          );
        }
      }
    }
    return defaultPosition;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const positionRef = useRef(position);
  const isDraggingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const [isDraggingUI, setIsDraggingUI] = useState(false);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) return;

    e.preventDefault();
    isDraggingRef.current = true;
    setIsDraggingUI(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: positionRef.current.x,
      posY: positionRef.current.y,
    };

    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
      containerRef.current.style.transition = 'none';
      containerRef.current.style.willChange = 'bottom, right';
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(() => {
        if (!isDraggingRef.current || !containerRef.current) return;
        const dx = moveEvent.clientX - dragStartRef.current.x;
        const dy = dragStartRef.current.y - moveEvent.clientY;
        const newX = dragStartRef.current.posX - dx;
        const newY = dragStartRef.current.posY + dy;
        containerRef.current.style.right = `${newX}px`;
        containerRef.current.style.bottom = `${newY}px`;
      });
    };

    const handleMouseUp = () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      isDraggingRef.current = false;
      setIsDraggingUI(false);
      if (containerRef.current) {
        containerRef.current.style.cursor = '';
        containerRef.current.style.transition = '';
        containerRef.current.style.willChange = '';
        const finalX = parseInt(containerRef.current.style.right);
        const finalY = parseInt(containerRef.current.style.bottom);
        const margin = 16;
        const safeX = Math.max(margin, Math.min(finalX, window.innerWidth - panelWidth - margin));
        const safeY = Math.max(margin, Math.min(finalY, window.innerHeight - panelHeight - margin));
        const clampedPos = { x: safeX, y: safeY };
        setPosition(clampedPos);
        localStorage.setItem(storageKey, JSON.stringify(clampedPos));
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);
  }, [storageKey, defaultPosition, panelWidth, panelHeight]);

  return {
    containerRef,
    isDraggingUI,
    handleDragStart,
    position,
  };
}
