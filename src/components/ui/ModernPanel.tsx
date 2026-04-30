'use client';

import React, { ReactNode, useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, GripHorizontal, Minimize2, Maximize2 } from 'lucide-react';
import { useLayout } from '@/contexts/LayoutContext';
import { useTheme } from '@/contexts/ThemeContext';

export interface ModernPanelProps {
    id: string;
    title: string;
    children: ReactNode;
    onClose?: () => void;
    resizable?: boolean;
    collapsible?: boolean;
    defaultWidth?: number;
    defaultHeight?: number;
    minWidth?: number;
    minHeight?: number;
    className?: string;
    style?: React.CSSProperties;
    headerAction?: ReactNode;
    noPadding?: boolean;
    headerStart?: ReactNode;
    footer?: ReactNode;
    mobileAutoHeight?: boolean;
    hideTitle?: boolean;
    hideHeader?: boolean;
}

export function ModernPanel({
    id,
    title,
    children,
    onClose,
    resizable = true,
    collapsible = true,
    defaultWidth = 400,
    defaultHeight = 600,
    minWidth = 250,
    minHeight = 300,
    className,
    style,
    headerAction,
    headerStart,
    footer,
    mobileAutoHeight = false,
    noPadding = false,
    hideTitle = false,
    hideHeader = false,
}: ModernPanelProps) {
    const { panelLayout } = useLayout();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [width, setWidth] = useState(defaultWidth);
    const [height, setHeight] = useState(defaultHeight);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return;
        }

        const mediaQuery = window.matchMedia('(max-width: 1023px)');
        const updateIsMobile = () => setIsMobile(mediaQuery.matches);

        updateIsMobile();
        mediaQuery.addEventListener('change', updateIsMobile);

        return () => {
            mediaQuery.removeEventListener('change', updateIsMobile);
        };
    }, []);

    // Use ref for resize to avoid React re-renders during resize
    const panelRef = useRef<HTMLDivElement>(null);
    const isResizingRef = useRef(false);
    const isDraggingRef = useRef(false);
    const resizeStateRef = useRef({
        startX: 0,
        startY: 0,
        startWidth: defaultWidth,
        startHeight: defaultHeight,
    });

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isResizingRef.current = true;

        if (!panelRef.current) return;

        // Set cursor immediately via class on body or parent
        document.body.style.cursor = 'se-resize';
        document.body.style.userSelect = 'none';

        resizeStateRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startWidth: panelRef.current.offsetWidth,
            startHeight: panelRef.current.offsetHeight,
        };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!panelRef.current || !isResizingRef.current) return;

            const deltaX = moveEvent.clientX - resizeStateRef.current.startX;
            const deltaY = moveEvent.clientY - resizeStateRef.current.startY;

            const newWidth = Math.max(minWidth, resizeStateRef.current.startWidth + deltaX);
            const newHeight = Math.max(minHeight, resizeStateRef.current.startHeight + deltaY);

            // Direct DOM update - no rAF, no React state
            panelRef.current.style.width = `${newWidth}px`;
            panelRef.current.style.height = `${newHeight}px`;
        };

        const handleMouseUp = () => {
            isResizingRef.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            if (panelRef.current) {
                const finalWidth = panelRef.current.offsetWidth;
                const finalHeight = panelRef.current.offsetHeight;
                setWidth(finalWidth);
                setHeight(finalHeight);
            }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('mouseup', handleMouseUp, { once: true });
    };

    const isOverlay = panelLayout === 'overlay';
    const isStacked = panelLayout === 'stacked';
    const canResize = resizable && isOverlay && !isMobile;
    const canCollapse = collapsible && !isMobile;
    const overlayMobileStyle: React.CSSProperties = {};
    if (isOverlay && isMobile) {
        overlayMobileStyle.width = 'calc(100vw - 10px)';
        overlayMobileStyle.left = "5px";
        overlayMobileStyle.right = "5px";
        overlayMobileStyle.top = "5px";
        overlayMobileStyle.bottom = "5px";
        overlayMobileStyle.maxHeight = 'calc(100vh - 10px)';
    }

    // Drag handling with performance optimization - uses top/left instead of transform
    const dragStateRef = useRef({ startX: 0, startY: 0, startLeft: 0, startTop: 0 });

    const handleDragStart = (e: React.MouseEvent) => {
        if (!isOverlay || isMobile) return;
        const target = e.target as HTMLElement;
        const isHeader = target.closest('[data-drag-handle]') || target.closest('[data-drag-header]');
        if (!isHeader) return;

        e.preventDefault();
        isDraggingRef.current = true;

        // Set cursor immediately
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';

        if (!panelRef.current) return;

        const rect = panelRef.current.getBoundingClientRect();
        dragStateRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startLeft: rect.left,
            startTop: rect.top,
        };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!panelRef.current || !isDraggingRef.current) return;

            const deltaX = moveEvent.clientX - dragStateRef.current.startX;
            const deltaY = moveEvent.clientY - dragStateRef.current.startY;

            const newLeft = dragStateRef.current.startLeft + deltaX;
            const newTop = dragStateRef.current.startTop + deltaY;

            // Direct DOM update - no rAF, no React state
            panelRef.current.style.left = `${newLeft}px`;
            panelRef.current.style.top = `${newTop}px`;
        };

        const handleMouseUp = () => {
            isDraggingRef.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('mouseup', handleMouseUp, { once: true });
    };

    // Touch handling for mobile (simplified, no drag on mobile)
    const handleTouchStart = (e: React.TouchEvent) => {
        if (!isOverlay || isMobile) return;
        // Mobile doesn't support drag, just handle resize
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isOverlay) return;
        e.preventDefault();
    };

    const handleTouchEnd = () => {
        // No-op
    };

    return (
        <div
            ref={panelRef}
            className={cn(
                'flex flex-col border rounded-lg shadow-lg overflow-hidden',
                isDark ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200',
                isOverlay && 'fixed z-40',
                isStacked && 'relative',
                className
            )}
            style={{
                width: isOverlay ? (isMobile ? 'calc(100vw - 10px)' : width) : '100%',
                height: isMobile ? 'calc(100vh - 10px)' : height,
                maxHeight: isMobile ? 'calc(100vh - 10px)' : undefined,
                ...overlayMobileStyle,
                ...style
            }}
            onMouseDown={handleDragStart}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Header - Simple, no effects */}
            {!hideHeader && (
                <div
                    data-drag-header
                    className={cn(
                        "flex items-center justify-between gap-2 p-4 border-b cursor-grab active:cursor-grabbing",
                        isDark ? "bg-slate-800 border-slate-700" : "bg-muted/50",
                        isMobile && "p-3 min-h-[48px] touch-manipulation"
                    )}
                    style={{ touchAction: 'none' }}
                >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        {canResize && (
                            <GripHorizontal className={cn("w-4 h-4 cursor-grab", isDark ? "text-slate-400" : "text-muted-foreground")} />
                        )}
                        {headerStart}
                        {!hideTitle && (
                            <h2 className={cn(
                                "font-semibold flex-1 truncate",
                                isMobile ? "text-sm" : "text-sm",
                                isDark ? "text-slate-100" : "text-slate-900"
                            )}>{title}</h2>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5">
                        {headerAction}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className={cn(
                                    "p-1.5 rounded-lg",
                                    isDark
                                        ? "text-slate-400 hover:text-rose-400"
                                        : "text-slate-500 hover:text-rose-600",
                                    isMobile && "p-2 min-w-[40px] min-h-[40px]"
                                )}
                                aria-label="Close panel"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        {canCollapse && (
                            <button
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className={cn(
                                    "p-1.5 rounded-lg",
                                    isDark
                                        ? "text-slate-400 hover:text-slate-200"
                                        : "text-slate-500 hover:text-slate-700",
                                    isMobile && "p-2 min-w-[40px] min-h-[40px]"
                                )}
                                aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
                                aria-expanded={!isCollapsed}
                            >
                                {isCollapsed ? (
                                    <Maximize2 className="w-4 h-4" />
                                ) : (
                                    <Minimize2 className="w-4 h-4" />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Content - No animation */}
            <div
                className={cn(
                    "flex-1 min-h-0",
                    isCollapsed ? "max-h-0 opacity-0" : "max-h-full opacity-100",
                    noPadding ? "overflow-hidden p-0" : "overflow-y-auto overflow-x-hidden p-4"
                )}
                aria-hidden={isCollapsed}
            >
                {!isCollapsed && (
                    <>
                        {children}
                        {footer && <div className="mt-4 border-t pt-3">{footer}</div>}
                    </>
                )}
            </div>

            {/* Resize Handle - Simple, no effects */}
            {canResize && (
                <div
                    onMouseDown={handleResizeStart}
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                    style={{
                        background: 'linear-gradient(135deg, transparent 50%, currentColor 50%)',
                        color: 'var(--color-border)',
                    }}
                    aria-label="Resize panel"
                />
            )}
        </div>
    );
}

export interface PanelContainerProps {
    panels: Array<{
        id: string;
        title: string;
        content: ReactNode;
        onClose?: () => void;
    }>;
    className?: string;
}

export function PanelContainer({ panels, className }: PanelContainerProps) {
    const { panelLayout } = useLayout();

    if (panelLayout === 'overlay') {
        return (
            <div className={cn('relative w-full h-full', className)}>
                {panels.map((panel, index) => (
                    <ModernPanel
                        key={panel.id}
                        id={panel.id}
                        title={panel.title}
                        onClose={panel.onClose}
                        className="absolute"
                        style={{
                            right: `${index * 20}px`,
                            top: `${index * 20}px`,
                        } as React.CSSProperties}
                    >
                        {panel.content}
                    </ModernPanel>
                ))}
            </div>
        );
    }

    if (panelLayout === 'stacked') {
        return (
            <div className={cn('flex flex-col gap-2', className)}>
                {panels.map((panel) => (
                    <ModernPanel
                        key={panel.id}
                        id={panel.id}
                        title={panel.title}
                        onClose={panel.onClose}
                        defaultHeight={200}
                    >
                        {panel.content}
                    </ModernPanel>
                ))}
            </div>
        );
    }

    // Docked layout
    return (
        <div className={cn('flex gap-2', className)}>
            {panels.map((panel) => (
                <ModernPanel
                    key={panel.id}
                    id={panel.id}
                    title={panel.title}
                    onClose={panel.onClose}
                    defaultWidth={300}
                    resizable={false}
                >
                    {panel.content}
                </ModernPanel>
            ))}
        </div>
    );
}
