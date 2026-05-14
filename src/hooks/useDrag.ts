'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DragPosition { x: number; y: number }
export interface DragSize { width: number; height: number }

type DragMode = 'drag-only' | 'drag-resize';
type OriginCorner = 'top-left' | 'bottom-right';

export interface UseDragOptions {
  /** Unique key for localStorage persistence */
  storageKey?: string;
  /** Default position */
  defaultPosition?: DragPosition;
  /** Default size (required for drag-resize mode) */
  defaultSize?: DragSize;
  /** Minimum size for resizing */
  minSize?: DragSize;
  /** Mode: drag-only or drag-resize */
  mode?: DragMode;
  /** Which corner the position is relative to (for positioning style) */
  origin?: OriginCorner;
  /** Whether to skip elements with data-modal-content attribute */
  skipModalContent?: boolean;
}

export interface UseDragReturn {
  mode: DragMode;
  position: DragPosition;
  size: DragSize;
  setPosition: (pos: DragPosition) => void;
  setSize: (size: DragSize) => void;
  /** For drag-only mode: ref to attach to the draggable element */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** For drag-only mode: whether currently dragging */
  isDragging: boolean;
  /** For drag-only mode: call on mousedown on the drag handle */
  handleDragStart: (e: React.MouseEvent | React.PointerEvent) => void;
  /** For drag-resize mode: call on pointerdown on the modal header */
  handlePointerDown: (e: React.PointerEvent, id: string) => void;
  /** For drag-resize mode: call on pointerdown on resize handles */
  handleResizeStart: (e: React.PointerEvent, direction: string, id: string) => void;
}

// ─── Instance state ref (shared across all hook instances) ───────────────────

interface DragInstanceState {
  active: boolean;
  id: string;
  type: 'drag' | 'resize';
  direction?: string;
  mode: DragMode;
  origin: OriginCorner;
  startX: number;
  startY: number;
  startPosX: number;
  startPosY: number;
  startW: number;
  startH: number;
  element: HTMLElement | null;
  storageKey?: string;
  minSize: DragSize;
}

// ─── Main hook ───────────────────────────────────────────────────────────────

export function useDrag(options: UseDragOptions = {}): UseDragReturn {
  const {
    storageKey,
    defaultPosition = { x: 16, y: 96 },
    defaultSize = { width: 800, height: 600 },
    minSize = { width: 200, height: 150 },
    mode = 'drag-only',
    origin = 'top-left',
    skipModalContent = false,
  } = options;

  // ── State ──
  const [position, setPosition] = useState<DragPosition>(() => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) return JSON.parse(saved);
      } catch { /* ignore */ }
    }
    return defaultPosition;
  });

  const [size, setSize] = useState<DragSize>(() => {
    if (mode === 'drag-resize' && storageKey && typeof window !== 'undefined') {
      try {
        const sizeKey = `${storageKey}-size`;
        const saved = localStorage.getItem(sizeKey);
        if (saved) {
          const p = JSON.parse(saved);
          return { width: Math.max(minSize.width, p.width), height: Math.max(minSize.height, p.height) };
        }
      } catch { /* ignore */ }
    }
    return defaultSize;
  });

  // ── Refs ──
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragInstanceState | null>(null);
  const positionRef = useRef(position);
  const sizeRef = useRef(size);
  const animFrameRef = useRef<number | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { sizeRef.current = size; }, [size]);

  // ── Persistence ──
  const persist = useCallback((pos: DragPosition, sz?: DragSize) => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(pos));
        if (sz) {
          const sizeKey = `${storageKey}-size`;
          localStorage.setItem(sizeKey, JSON.stringify(sz));
        }
      } catch { /* ignore */ }
    }
  }, [storageKey]);

  // ── For drag-only mode (info popovers) ──
  const handleDragStart = useCallback((e: React.MouseEvent | React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) return;

    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;

    const pos = positionRef.current;
    dragRef.current = {
      active: true, id: '', type: 'drag', mode: 'drag-only', origin,
      startX: e.clientX, startY: e.clientY,
      startPosX: pos.x, startPosY: pos.y,
      startW: 0, startH: 0,
      element: el, storageKey, minSize,
    };

    el.style.cursor = 'grabbing';
    el.style.transition = 'none';
    el.style.willChange = origin === 'top-left' ? 'left, top' : 'bottom, right';
    setIsDragging(true);
  }, [origin, storageKey]);

  // ── For drag-resize mode (modals) ──
  const handlePointerDown = useCallback((e: React.PointerEvent, id: string) => {
    const header = (e.target as HTMLElement).closest('[data-modal-header]');
    if (!header) return;
    if ((e.target as HTMLElement).closest('button, input, select, textarea, a')) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const modalElement = (e.currentTarget as HTMLElement).closest('[data-modal-content]') as HTMLElement;
    if (!modalElement) return;

    const pos = positionRef.current;
    dragRef.current = {
      active: true, id, type: 'drag', mode: 'drag-resize', origin,
      startX: e.clientX, startY: e.clientY,
      startPosX: pos.x, startPosY: pos.y,
      startW: 0, startH: 0,
      element: modalElement, storageKey, minSize,
    };
  }, [origin, storageKey]);

  const handleResizeStart = useCallback((e: React.PointerEvent, direction: string, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const modalElement = (e.currentTarget as HTMLElement).closest('[data-modal-content]') as HTMLElement;
    if (!modalElement) return;

    const pos = positionRef.current;
    const sz = sizeRef.current;
    dragRef.current = {
      active: true, id, type: 'resize', direction, mode: 'drag-resize', origin,
      startX: e.clientX, startY: e.clientY,
      startPosX: pos.x, startPosY: pos.y,
      startW: sz.width, startH: sz.height,
      element: modalElement, storageKey, minSize,
    };
  }, [origin, storageKey]);

  // ── Global move/up listeners ──
  useEffect(() => {
    const handleMove = (e: MouseEvent | PointerEvent) => {
      const ds = dragRef.current;
      if (!ds?.active || !ds.element) return;

      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(() => {
        const ds2 = dragRef.current;
        if (!ds2?.active || !ds2.element) return;
        const el = ds2.element;
        const dx = e.clientX - ds2.startX;
        const dy = e.clientY - ds2.startY;

        if (ds2.type === 'drag') {
          if (ds2.mode === 'drag-only' && ds2.origin === 'bottom-right') {
            const newX = ds2.startPosX - dx;
            const newY = ds2.startPosY - dy;
            el.style.right = `${newX}px`;
            el.style.bottom = `${newY}px`;
          } else {
            const newX = ds2.startPosX + dx;
            const newY = ds2.startPosY + dy;
            el.style.left = `${newX}px`;
            el.style.top = `${newY}px`;
            el.style.transform = 'none';
          }
          el.style.willChange = 'left, top';
          el.style.transition = 'none';
        } else if (ds2.type === 'resize' && ds2.direction) {
          const dx2 = e.clientX - ds2.startX;
          const dy2 = e.clientY - ds2.startY;
          let newW = ds2.startW, newH = ds2.startH, newX = ds2.startPosX, newY = ds2.startPosY;

          if (ds2.direction.includes('e')) newW = Math.max(ds2.minSize.width, ds2.startW + dx2);
          if (ds2.direction.includes('s')) newH = Math.max(ds2.minSize.height, ds2.startH + dy2);
          if (ds2.direction.includes('w')) { newW = Math.max(ds2.minSize.width, ds2.startW - dx2); newX = ds2.startPosX + (ds2.startW - newW); }
          if (ds2.direction.includes('n')) { newH = Math.max(ds2.minSize.height, ds2.startH - dy2); newY = ds2.startPosY + (ds2.startH - newH); }

          el.style.willChange = 'width, height, left, top';
          el.style.width = `${newW}px`;
          el.style.height = `${newH}px`;
          el.style.left = `${newX}px`;
          el.style.top = `${newY}px`;
          el.style.transition = 'none';
        }
      });
    };

    const handleUp = () => {
      if (animFrameRef.current !== null) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
      const ds = dragRef.current;
      if (!ds) return;

      if (ds.element) {
        ds.element.style.willChange = '';
        ds.element.style.transition = '';
        ds.element.style.cursor = '';

        let finalX: number, finalY: number;
        let finalW = ds.startW, finalH = ds.startH;

        if (ds.origin === 'bottom-right' && ds.mode === 'drag-only') {
          finalX = parseInt(ds.element.style.right) || ds.startPosX;
          finalY = parseInt(ds.element.style.bottom) || ds.startPosY;
        } else {
          finalX = parseInt(ds.element.style.left) || ds.startPosX;
          finalY = parseInt(ds.element.style.top) || ds.startPosY;
        }

        if (ds.type === 'resize') {
          finalW = parseInt(ds.element.style.width) || ds.startW;
          finalH = parseInt(ds.element.style.height) || ds.startH;
        }

        // Clamp position to viewport
        const margin = 16;
        const elRect = ds.element.getBoundingClientRect();
        const elW = elRect.width || 200;
        const elH = elRect.height || 100;
        let clampedX: number, clampedY: number;
        if (ds.origin === 'bottom-right' && ds.mode === 'drag-only') {
          // finalX is `right`, finalY is `bottom`
          clampedX = Math.max(0, Math.min(finalX, window.innerWidth - elW));
          clampedY = Math.max(0, Math.min(finalY, window.innerHeight - elH));
        } else {
          clampedX = Math.max(margin - elW, Math.min(finalX, window.innerWidth - margin));
          clampedY = Math.max(margin - elH, Math.min(finalY, window.innerHeight - margin));
        }
        const finalPos = { x: clampedX, y: clampedY };
        const finalSize = { width: Math.max(ds.minSize.width, finalW), height: Math.max(ds.minSize.height, finalH) };

        setPosition(finalPos);
        persist(finalPos, ds.type === 'resize' ? finalSize : undefined);

        if (ds.type === 'resize') {
          setSize(finalSize);
        }
      }

      setIsDragging(false);
      dragRef.current = null;
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);

    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [persist]);

  return {
    mode,
    position,
    size,
    setPosition,
    setSize,
    containerRef: containerRef as React.RefObject<HTMLDivElement | null>,
    isDragging,
    handleDragStart,
    handlePointerDown,
    handleResizeStart,
  };
}

// ─── Global drag manager (replaces DraggableDialogManager) ────────────────────

/**
 * Renders nothing. Mount once in the app tree.
 * Listens for mousedown/pointerdown on [data-drag-handle] elements
 * and handles dragging of parent [data-draggable-id] elements.
 */
export function GlobalDragManager() {
  const dragRef = useRef<{
    active: boolean;
    el: HTMLElement | null;
    startX: number; startY: number;
    offsetX: number; offsetY: number;
    animFrame: number | null;
    id: string | null;
  }>({
    active: false, el: null,
    startX: 0, startY: 0,
    offsetX: 0, offsetY: 0,
    animFrame: null, id: null,
  });

  useEffect(() => {
    const state = dragRef.current;

    const handleDown = (e: MouseEvent) => {
      if (state.active) return;
      const handle = (e.target as HTMLElement).closest('[data-drag-handle]');
      if (!handle) return;
      const dialog = (handle as HTMLElement).closest('[data-draggable-id]') as HTMLElement;
      if (!dialog) return;
      const id = dialog.getAttribute('data-draggable-id');
      if (!id) return;
      if (dialog.hasAttribute('data-modal-content')) return;

      e.preventDefault();
      e.stopPropagation();
      const rect = dialog.getBoundingClientRect();
      state.active = true;
      state.el = dialog;
      state.id = id;
      state.startX = e.clientX;
      state.startY = e.clientY;
      state.offsetX = rect.left;
      state.offsetY = rect.top;
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    };

    const handleMove = (e: MouseEvent) => {
      if (!state.active || !state.el) return;
      if (state.animFrame !== null) cancelAnimationFrame(state.animFrame);
      state.animFrame = requestAnimationFrame(() => {
        if (!state.active || !state.el) return;
        const newX = state.offsetX + (e.clientX - state.startX);
        const newY = state.offsetY + (e.clientY - state.startY);
        state.el.style.position = 'fixed';
        state.el.style.left = `${newX}px`;
        state.el.style.top = `${newY}px`;
        state.el.style.transform = 'none';
        state.el.style.willChange = 'left, top';
        state.el.style.transition = 'none';
      });
    };

    const handleUp = () => {
      if (state.animFrame !== null) { cancelAnimationFrame(state.animFrame); state.animFrame = null; }
      if (!state.active || !state.el) { state.active = false; return; }
      state.el.style.willChange = '';
      state.el.style.transition = '';
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      const finalLeft = parseInt(state.el.style.left) || state.offsetX;
      const finalTop = parseInt(state.el.style.top) || state.offsetY;
      const margin = 16;
      const rect = state.el.getBoundingClientRect();
      const clampedLeft = Math.max(margin - rect.width, Math.min(finalLeft, window.innerWidth - margin));
      const clampedTop = Math.max(margin - rect.height, Math.min(finalTop, window.innerHeight - margin));
      state.el.style.left = `${clampedLeft}px`;
      state.el.style.top = `${clampedTop}px`;
      if (state.id) {
        try { localStorage.setItem(`draggable_position_${state.id}`, JSON.stringify({ x: clampedLeft, y: clampedTop })); } catch { }
      }
      state.active = false;
      state.el = null;
      state.id = null;
    };

    document.addEventListener('mousedown', handleDown);
    document.addEventListener('mousemove', handleMove, { passive: true });
    document.addEventListener('mouseup', handleUp);

    return () => {
      if (state.animFrame !== null) cancelAnimationFrame(state.animFrame);
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, []);

  return null;
}
