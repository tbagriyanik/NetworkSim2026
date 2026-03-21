'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { buttonVariants } from './button';

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    loading?: boolean;
    label?: string; // For screen readers when icon-only buttons
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
    ({ className, variant, size, loading, disabled, label, children, title, ...props }, ref) => {
        const isIconOnly = !children && !!label;

        return (
            <button
                ref={ref}
                className={cn(buttonVariants({ variant, size, className }))}
                disabled={disabled || loading}
                aria-label={label}
                aria-busy={loading}
                title={title || label}
                {...props}
            >
                {loading ? (
                    <span className="flex items-center gap-2" aria-hidden="true">
                        <svg
                            className="animate-spin h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span className="sr-only">Loading</span>
                    </span>
                ) : (
                    children
                )}
                {isIconOnly && <span className="sr-only">{label}</span>}
            </button>
        );
    }
);

AccessibleButton.displayName = 'AccessibleButton';

export { AccessibleButton };