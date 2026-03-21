'use client';

import { cn } from '@/lib/utils';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
    return (
        <div className={cn('relative', sizes[size], className)}>
            <div className={cn('absolute inset-0 border-2 border-muted rounded-full')} />
            <div className={cn(
                'absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin',
                size === 'sm' && 'border-[2px]',
                size === 'md' && 'border-[2.5px]',
                size === 'lg' && 'border-3'
            )} />
        </div>
    );
}