'use client';

import React, { ReactNode, useEffect, useState, useRef } from 'react';
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
    const [isResizing, setIsResizing] = useState(false);
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

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = width;
        const startHeight = height;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            const newWidth = Math.max(minWidth, startWidth + deltaX);
            const newHeight = Math.max(minHeight, startHeight + deltaY);

            setWidth(newWidth);
            setHeight(newHeight);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
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

    // Touch handling for mobile
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });

    const handleTouchStart = (e: React.TouchEvent) => {
        if (!isOverlay || isMobile) return;
        const touch = e.touches[0];
        dragStartPos.current = { x: touch.clientX, y: touch.clientY };
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || !isOverlay) return;
        e.preventDefault();
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    return (
        <div
            className={cn(
                'flex flex-col border rounded-lg shadow-lg overflow-hidden transition-all duration-200 ease-out',
                isDark ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200',
                isOverlay && 'fixed z-40 animate-scale-in',
                isStacked && 'relative',
                isResizing && 'select-none',
                className
            )}
            style={{
                width: isOverlay ? (isMobile ? 'calc(100vw - 10px)' : width) : '100%',
                height: isMobile ? 'calc(100vh - 10px)' : '550px',
                maxHeight: isMobile ? 'calc(100vh - 10px)' : undefined,
                ...overlayMobileStyle,
                ...style
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Header */}
            {!hideHeader && (
                <div
                    className={cn(
                        "flex items-center justify-between gap-2 p-4 border-b",
                        isDark ? "bg-slate-800 border-slate-700" : "bg-muted/50",
                        isMobile && "p-3 min-h-[48px] touch-manipulation"
                    )}
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
                                    "p-1.5 rounded-lg transition-all duration-200 focus-ring-animate",
                                    isDark
                                        ? "hover:bg-rose-900/50 text-slate-400 hover:text-rose-400"
                                        : "hover:bg-rose-100 text-slate-500 hover:text-rose-600",
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
                                    "p-1.5 rounded-lg transition-all duration-200 focus-ring-animate",
                                    isDark
                                        ? "hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                                        : "hover:bg-slate-200 text-slate-500 hover:text-slate-700",
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

            {/* Content with smooth animation */}
            <div
                className={cn(
                    "flex-1 min-h-0 transition-all duration-300 ease-in-out",
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

            {/* Resize Handle - Enhanced with visual feedback */}
            {canResize && (
                <div
                    onMouseDown={handleResizeStart}
                    className={cn(
                        'absolute bottom-0 right-0 w-5 h-5 cursor-se-resize transition-all duration-200',
                        'hover:w-6 hover:h-6',
                        isResizing && 'w-6 h-6'
                    )}
                    style={{
                        background: isResizing
                            ? 'linear-gradient(135deg, transparent 45%, hsl(var(--primary)) 45%, hsl(var(--primary)) 55%, transparent 55%)'
                            : 'linear-gradient(135deg, transparent 50%, currentColor 50%)',
                        color: isResizing ? 'transparent' : 'var(--color-border)',
                    }}
                    aria-label="Resize panel"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                        }
                    }}
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
