import { useState, useRef, useEffect, useCallback } from 'react';

export interface ModalPosition { x: number; y: number }
export interface ModalSize { width: number; height: number }

interface DragState {
    active: boolean;
    type: 'drag' | 'resize';
    modal: 'tasks' | 'cli';
    direction?: string;
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
    startW: number;
    startH: number;
    raf: number | null;
}

const STORAGE_KEYS = {
    tasks: { position: 'tasks-modal-position', size: 'tasks-modal-size' },
    cli: { position: 'cli-modal-position', size: 'cli-modal-size' },
} as const;

function loadModalLayout(modal: 'tasks' | 'cli', defaultSize: ModalSize) {
    if (typeof window === 'undefined') return { position: null, size: defaultSize };
    const maxW = window.innerWidth - 40;
    const maxH = window.innerHeight - 40;
    const keys = STORAGE_KEYS[modal];

    let size = { ...defaultSize };
    const savedSize = localStorage.getItem(keys.size);
    if (savedSize) {
        const p = JSON.parse(savedSize);
        size = { width: Math.min(p.width, maxW), height: Math.min(p.height, maxH) };
    } else {
        size = { width: Math.min(maxW, defaultSize.width), height: Math.min(maxH, defaultSize.height) };
    }

    let position: ModalPosition | null = null;
    const savedPos = localStorage.getItem(keys.position);
    if (savedPos) {
        const p = JSON.parse(savedPos);
        position = {
            x: Math.max(0, Math.min(p.x, window.innerWidth - size.width)),
            y: Math.max(0, Math.min(p.y, window.innerHeight - size.height)),
        };
    } else {
        position = {
            x: Math.max(0, (window.innerWidth - size.width) / 2),
            y: Math.max(0, (window.innerHeight - size.height) / 2),
        };
    }

    return { position, size };
}

export function useModalDragResize(defaultSize: ModalSize = { width: 1200, height: 700 }) {
    const [tasksModalPosition, setTasksModalPosition] = useState<ModalPosition>({ x: 20, y: 20 });
    const [tasksModalSize, setTasksModalSize] = useState<ModalSize>(defaultSize);
    const [cliModalPosition, setCliModalPosition] = useState<ModalPosition>({ x: 20, y: 20 });
    const [cliModalSize, setCliModalSize] = useState<ModalSize>(defaultSize);

    // Load persisted layout after hydration
    useEffect(() => {
        const tasks = loadModalLayout('tasks', defaultSize);
        if (tasks.position) setTasksModalPosition(tasks.position);
        setTasksModalSize(tasks.size);

        const cli = loadModalLayout('cli', defaultSize);
        if (cli.position) setCliModalPosition(cli.position);
        setCliModalSize(cli.size);
    }, []);

    // Persist on change - Optimized to only save occasionally or on mouse up
    // We'll move the actual saving to handlePointerUp to avoid synchronous localStorage hits during drag
    const persistLayout = useCallback((modal: 'tasks' | 'cli', pos: ModalPosition, size: ModalSize) => {
        localStorage.setItem(STORAGE_KEYS[modal].position, JSON.stringify(pos));
        localStorage.setItem(STORAGE_KEYS[modal].size, JSON.stringify(size));
    }, []);

    // Refs to always hold latest values for drag handlers
    const dragStateRef = useRef<DragState | null>(null);
    const pendingMoveRef = useRef<{ x: number; y: number } | null>(null);
    const tasksModalPositionRef = useRef(tasksModalPosition);
    const tasksModalSizeRef = useRef(tasksModalSize);
    const cliModalPositionRef = useRef(cliModalPosition);
    const cliModalSizeRef = useRef(cliModalSize);

    useEffect(() => { tasksModalPositionRef.current = tasksModalPosition; }, [tasksModalPosition]);
    useEffect(() => { tasksModalSizeRef.current = tasksModalSize; }, [tasksModalSize]);
    useEffect(() => { cliModalPositionRef.current = cliModalPosition; }, [cliModalPosition]);
    useEffect(() => { cliModalSizeRef.current = cliModalSize; }, [cliModalSize]);

    const handlePointerDown = useCallback((e: React.PointerEvent, modalType: 'tasks' | 'cli') => {
        const header = (e.target as HTMLElement).closest('[data-modal-header]');
        if (!header) return;
        if ((e.target as HTMLElement).closest('button, input, select, textarea, a')) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        // Capture pointer for smoother dragging across the whole screen
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

        const pos = modalType === 'tasks' ? tasksModalPositionRef.current : cliModalPositionRef.current;
        const size = modalType === 'tasks' ? tasksModalSizeRef.current : cliModalSizeRef.current;
        
        dragStateRef.current = {
            active: true, type: 'drag', modal: modalType,
            startX: e.clientX, startY: e.clientY,
            startPosX: pos.x, startPosY: pos.y,
            startW: size.width, startH: size.height, raf: null,
        };
    }, []);

    const handleResizeStart = useCallback((
        e: React.PointerEvent,
        direction: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw',
        modalType: 'tasks' | 'cli',
    ) => {
        e.preventDefault();
        e.stopPropagation();

        // Capture pointer
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

        const pos = modalType === 'tasks' ? tasksModalPositionRef.current : cliModalPositionRef.current;
        const size = modalType === 'tasks' ? tasksModalSizeRef.current : cliModalSizeRef.current;
        
        dragStateRef.current = {
            active: true, type: 'resize', modal: modalType, direction,
            startX: e.clientX, startY: e.clientY,
            startPosX: pos.x, startPosY: pos.y,
            startW: size.width, startH: size.height, raf: null,
        };
    }, []);

    useEffect(() => {
        const handlePointerMove = (e: PointerEvent) => {
            const ds = dragStateRef.current;
            if (!ds?.active) return;

            pendingMoveRef.current = { x: e.clientX, y: e.clientY };
            if (ds.raf) return;

            ds.raf = requestAnimationFrame(() => {
                const ds2 = dragStateRef.current;
                if (!ds2?.active) return;
                const move = pendingMoveRef.current;
                if (!move) return;
                
                const setPosition = ds2.modal === 'tasks' ? setTasksModalPosition : setCliModalPosition;
                const setSize = ds2.modal === 'tasks' ? setTasksModalSize : setCliModalSize;

                if (ds2.type === 'drag') {
                    setPosition({
                        x: ds2.startPosX + (move.x - ds2.startX),
                        y: ds2.startPosY + (move.y - ds2.startY),
                    });
                } else if (ds2.type === 'resize' && ds2.direction) {
                    const dx = move.x - ds2.startX;
                    const dy = move.y - ds2.startY;
                    let newW = ds2.startW, newH = ds2.startH, newX = ds2.startPosX, newY = ds2.startPosY;
                    
                    if (ds2.direction.includes('e')) newW = Math.max(400, ds2.startW + dx);
                    if (ds2.direction.includes('s')) newH = Math.max(300, ds2.startH + dy);
                    if (ds2.direction.includes('w')) { 
                        newW = Math.max(400, ds2.startW - dx); 
                        newX = ds2.startPosX + (ds2.startW - newW); 
                    }
                    if (ds2.direction.includes('n')) { 
                        newH = Math.max(300, ds2.startH - dy); 
                        newY = ds2.startPosY + (ds2.startH - newH); 
                    }
                    
                    setSize({ width: newW, height: newH });
                    setPosition({ x: newX, y: newY });
                }

                ds2.raf = null;
            });
        };

        const handlePointerUp = (e: PointerEvent) => {
            const ds = dragStateRef.current;
            if (!ds) return;

            if (ds.raf) cancelAnimationFrame(ds.raf);
            pendingMoveRef.current = null;
            
            // Persist the final position/size to localStorage
            const finalPos = ds.modal === 'tasks' ? tasksModalPositionRef.current : cliModalPositionRef.current;
            const finalSize = ds.modal === 'tasks' ? tasksModalSizeRef.current : cliModalSizeRef.current;
            persistLayout(ds.modal, finalPos, finalSize);

            dragStateRef.current = null;
        };

        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
        
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };
    }, [persistLayout]);

    return {
        tasksModalPosition,
        tasksModalSize,
        cliModalPosition,
        cliModalSize,
        handlePointerDown,
        handleResizeStart,
    };
}
