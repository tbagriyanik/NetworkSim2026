'use client';

import { cn } from '@/lib/utils';

interface FocusRingProps {
    children: React.ReactNode;
    className?: string;
    color?: 'cyan' | 'blue' | 'green' | 'red';
}

const focusColors = {
    cyan: 'focus-visible:ring-cyan-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    blue: 'focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    green: 'focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    red: 'focus-visible:ring-red-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
};

export function FocusRing({ children, className, color = 'cyan' }: FocusRingProps) {
    return (
        <div className={cn('outline-none', focusColors[color], className)}>
            {children}
        </div>
    );
}