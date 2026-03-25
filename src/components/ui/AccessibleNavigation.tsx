/**
 * Accessible Navigation Component
 *
 * Demonstrates best practices for accessible navigation implementation
 * using the accessibility enhancement system.
 */

'use client';

import React, { useState, useRef } from 'react';
import { useKeyboardNavigation } from '@/hooks/useAccessibility';
import { generateNavigationARIA, generateMenuItemARIA } from '@/lib/accessibility';
import { cn } from '@/lib/utils';

interface NavigationItem {
    id: string;
    label: string;
    href: string;
    icon?: React.ReactNode;
    current?: boolean;
}

interface AccessibleNavigationProps {
    items: NavigationItem[];
    onNavigate?: (item: NavigationItem) => void;
    className?: string;
    label?: string;
}

/**
 * Accessible Navigation Component
 *
 * Features:
 * - Keyboard navigation (arrow keys)
 * - Proper ARIA attributes
 * - Screen reader support
 * - Focus management
 * - Semantic HTML
 */
export const AccessibleNavigation = React.forwardRef<HTMLElement, AccessibleNavigationProps>(
    (
        {
            items,
            onNavigate,
            className,
            label = 'Main Navigation',
        },
        ref
    ) => {
        const [currentIndex, setCurrentIndex] = useState(0);
        const itemRefs = useRef<HTMLAnchorElement[]>([]);

        const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
            const { key } = event;

            if (key === 'ArrowDown' || key === 'ArrowRight') {
                event.preventDefault();
                const newIndex = (currentIndex + 1) % items.length;
                setCurrentIndex(newIndex);
                itemRefs.current[newIndex]?.focus();
            } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
                event.preventDefault();
                const newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
                setCurrentIndex(newIndex);
                itemRefs.current[newIndex]?.focus();
            } else if (key === 'Home') {
                event.preventDefault();
                setCurrentIndex(0);
                itemRefs.current[0]?.focus();
            } else if (key === 'End') {
                event.preventDefault();
                const lastIndex = items.length - 1;
                setCurrentIndex(lastIndex);
                itemRefs.current[lastIndex]?.focus();
            } else if (key === 'Enter' || key === ' ') {
                event.preventDefault();
                const item = items[currentIndex];
                if (item && onNavigate) {
                    onNavigate(item);
                }
            }
        };

        const handleItemClick = (item: NavigationItem, index: number) => {
            setCurrentIndex(index);
            if (onNavigate) {
                onNavigate(item);
            }
        };

        return (
            <nav
                ref={ref}
                className={cn('flex flex-col gap-1', className)}
                {...generateNavigationARIA({
                    label,
                })}
                onKeyDown={handleKeyDown}
            >
                {items.map((item, index) => (
                    <a
                        key={item.id}
                        ref={(el) => {
                            if (el) itemRefs.current[index] = el;
                        }}
                        href={item.href}
                        onClick={(e) => {
                            e.preventDefault();
                            handleItemClick(item, index);
                        }}
                        className={cn(
                            'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
                            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                            index === currentIndex
                                ? 'bg-blue-100 text-blue-900'
                                : 'text-gray-700 hover:bg-gray-100'
                        )}
                        {...generateMenuItemARIA({
                            label: item.label,
                        })}
                        tabIndex={index === currentIndex ? 0 : -1}
                    >
                        {item.icon && (
                            <span className="flex-shrink-0" aria-hidden="true">
                                {item.icon}
                            </span>
                        )}
                        <span className="flex-1">{item.label}</span>
                        {item.current && (
                            <span
                                className="w-2 h-2 bg-blue-600 rounded-full"
                                aria-hidden="true"
                            />
                        )}
                    </a>
                ))}
            </nav>
        );
    }
);

AccessibleNavigation.displayName = 'AccessibleNavigation';
