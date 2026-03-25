'use client';

import React, { ReactNode } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface AppShellProps {
    header?: ReactNode;
    sidebar?: ReactNode;
    main: ReactNode;
    footer?: ReactNode;
    bottomNav?: ReactNode;
    breadcrumbs?: Array<{ label: string; href?: string; active?: boolean }>;
    headerExtras?: ReactNode;
    sidebarFooter?: ReactNode;
    mainBefore?: ReactNode;
    mainAfter?: ReactNode;
    className?: string;
}

export function ModernAppShell({
    header,
    sidebar,
    main,
    footer,
    bottomNav,
    breadcrumbs,
    headerExtras,
    sidebarFooter,
    mainBefore,
    mainAfter,
    className,
}: AppShellProps) {
    const { sidebarCollapsed } = useLayout();
    const { isMobile } = useResponsive();

    const showSidebar = !isMobile && sidebar;
    const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-64';

    return (
        <div className={cn('flex flex-col h-screen bg-background overflow-hidden', className)}>
            {/* Header */}
            {header && (
                <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex flex-col">
                        {header}
                        {headerExtras}
                        {breadcrumbs && breadcrumbs.length > 0 && (
                            <div className="px-4 py-2 border-t bg-muted/30">
                                <ModernBreadcrumbs items={breadcrumbs} />
                            </div>
                        )}
                    </div>
                </header>
            )}

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar */}
                {showSidebar && (
                    <aside
                        className={cn(
                            'border-r bg-background transition-all duration-300 overflow-y-auto hidden md:block',
                            sidebarWidth
                        )}
                    >
                        <div className="flex h-full min-h-0 flex-col">
                            <div className="flex-1 min-h-0">{sidebar}</div>
                            {sidebarFooter && <div className="border-t bg-muted/20">{sidebarFooter}</div>}
                        </div>
                    </aside>
                )}

                {/* Main Content */}
                <main className="flex-1 overflow-hidden flex flex-col relative">
                    {mainBefore}
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {main}
                    </div>
                    
                    {/* Footer within Main for better layout control */}
                    {footer && (
                        <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 hidden md:block">
                            {footer}
                        </footer>
                    )}
                    {mainAfter}
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            {isMobile && bottomNav && (
                <nav className="sticky bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-safe">
                    {bottomNav}
                </nav>
            )}
        </div>
    );
}

/**
 * Breadcrumbs Component
 */
export function ModernBreadcrumbs({ 
    items 
}: { 
    items: Array<{ label: string; href?: string; active?: boolean }> 
}) {
    return (
        <Breadcrumb>
            <BreadcrumbList>
                {items.map((item, index) => (
                    <React.Fragment key={item.label}>
                        <BreadcrumbItem>
                            {item.active ? (
                                <BreadcrumbPage>{item.label}</BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink href={item.href || '#'}>{item.label}</BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                        {index < items.length - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
}

/**
 * Navigation Item Definition
 */
export interface NavigationItem {
    id: string;
    label: string;
    icon?: ReactNode;
    href?: string;
    onClick?: () => void;
    badge?: string | number;
    children?: NavigationItem[];
    active?: boolean;
    color?: string;
}

/**
 * Sidebar/Primary Navigation Component
 */
export function ModernNavigation({
    items,
    onItemClick,
    className,
}: {
    items: NavigationItem[];
    onItemClick?: (item: NavigationItem) => void;
    className?: string;
}) {
    const { sidebarCollapsed } = useLayout();

    return (
        <nav className={cn('flex flex-col gap-1 p-2', className)}>
            {items.map((item) => (
                <NavigationItemComponent
                    key={item.id}
                    item={item}
                    onItemClick={onItemClick}
                    collapsed={sidebarCollapsed}
                />
            ))}
        </nav>
    );
}

/**
 * Mobile Bottom Navigation Component
 */
export function ModernBottomNavigation({
    items,
    onItemClick,
    className,
}: {
    items: NavigationItem[];
    onItemClick?: (item: NavigationItem) => void;
    className?: string;
}) {
    return (
        <div className={cn('flex items-center justify-around h-16', className)}>
            {items.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onItemClick?.(item)}
                    className={cn(
                        'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                        item.active 
                            ? (item.color || 'text-primary') 
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <div className={cn('relative', item.active && 'scale-110 transition-transform')}>
                        {item.icon}
                        {item.badge && (
                            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                                {item.badge}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-medium leading-none">{item.label}</span>
                </button>
            ))}
        </div>
    );
}

/**
 * Internal Navigation Item Component
 */
function NavigationItemComponent({
    item,
    onItemClick,
    collapsed,
    level = 0,
}: {
    item: NavigationItem;
    onItemClick?: (item: NavigationItem) => void;
    collapsed?: boolean;
    level?: number;
}) {
    const [expanded, setExpanded] = React.useState(false);

    const handleClick = () => {
        if (item.children) {
            setExpanded(!expanded);
        }
        if (item.onClick) {
            item.onClick();
        }
        if (onItemClick) {
            onItemClick(item);
        }
    };

    const content = (
        <button
            onClick={handleClick}
            className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                item.active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                level > 0 && !collapsed && 'ml-4',
                collapsed && 'justify-center px-2'
            )}
        >
            {item.icon && <span className={cn('flex-shrink-0', item.active && 'animate-pulse-subtle')}>{item.icon}</span>}
            {!collapsed && (
                <>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge && (
                        <span className="bg-primary/20 text-primary text-[10px] font-bold rounded-full px-1.5 py-0.5">
                            {item.badge}
                        </span>
                    )}
                    {item.children && (
                        <span className={cn('transition-transform duration-200', expanded && 'rotate-180')}>
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </span>
                    )}
                </>
            )}
        </button>
    );

    if (collapsed) {
        return (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    {content}
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                    {item.label}
                    {item.badge && <span className="ml-2 opacity-70">({item.badge})</span>}
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            {content}
            {expanded && item.children && (
                <div className="flex flex-col gap-1 mt-1">
                    {item.children.map((child) => (
                        <NavigationItemComponent
                            key={child.id}
                            item={child}
                            onItemClick={onItemClick}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
