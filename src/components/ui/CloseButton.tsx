import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'danger' | 'subtle';
  isDark?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const variantClasses = {
  default: {
    light: 'hover:bg-slate-200 text-slate-500 hover:text-slate-700',
    dark: 'hover:bg-slate-700 text-slate-400 hover:text-slate-200',
  },
  danger: {
    light: 'hover:bg-red-100 text-slate-500 hover:text-red-600',
    dark: 'hover:bg-red-900/30 text-slate-400 hover:text-red-400',
  },
  subtle: {
    light: 'hover:bg-slate-100 text-slate-400 hover:text-slate-600',
    dark: 'hover:bg-slate-800 text-slate-500 hover:text-slate-300',
  },
};

export const CloseButton = React.forwardRef<HTMLButtonElement, CloseButtonProps>(
  ({ className, size = 'md', variant = 'default', isDark = false, ...props }, ref) => {
    const sizeClass = sizeClasses[size];
    const variantClass = isDark ? variantClasses[variant].dark : variantClasses[variant].light;

    return (
      <button
        ref={ref}
        className={cn(
          'flex items-center justify-center rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
          sizeClass,
          variantClass,
          className
        )}
        {...props}
      >
        <X className={sizeClass} />
      </button>
    );
  }
);

CloseButton.displayName = 'CloseButton';
