'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface ShortcutBadgeProps {
    shortcut: string;
    className?: string;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

/**
 * ShortcutBadge - Displays keyboard shortcuts with attractive styling
 * Examples: "Ctrl+S", "Shift+Alt+N", "⌘+Z"
 */
export function ShortcutBadge({
    shortcut,
    className,
    variant = 'primary'
}: ShortcutBadgeProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Parse shortcut into individual keys
    const keys = shortcut.split('+').map(k => k.trim());

    // Color variants
    const variantStyles = {
        default: isDark
            ? 'bg-slate-700 text-slate-200 border-slate-600'
            : 'bg-slate-200 text-slate-700 border-slate-300',
        primary: isDark
            ? 'bg-blue-900/60 text-blue-200 border-blue-700/60'
            : 'bg-blue-100 text-blue-700 border-blue-300',
        success: isDark
            ? 'bg-green-900/60 text-green-200 border-green-700/60'
            : 'bg-green-100 text-green-700 border-green-300',
        warning: isDark
            ? 'bg-amber-900/60 text-amber-200 border-amber-700/60'
            : 'bg-amber-100 text-amber-700 border-amber-300',
        danger: isDark
            ? 'bg-red-900/60 text-red-200 border-red-700/60'
            : 'bg-red-100 text-red-700 border-red-300',
    };

    return (
        <kbd
            className={cn(
                'inline-flex items-center gap-0.5 px-2 py-1 rounded text-xs font-mono font-semibold',
                'border border-current/30 shadow-sm',
                'transition-all duration-200',
                'hover:shadow-md hover:scale-105',
                variantStyles[variant],
                className
            )}
            title={`Keyboard shortcut: ${shortcut}`}
        >
            {keys.map((key, index) => (
                <React.Fragment key={index}>
                    {index > 0 && (
                        <span className="opacity-60 mx-0.5">+</span>
                    )}
                    <span className="inline-block min-w-[1.2em] text-center">
                        {key}
                    </span>
                </React.Fragment>
            ))}
        </kbd>
    );
}

export default ShortcutBadge;
