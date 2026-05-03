'use client';

import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConfirmationDialogVariant = 'default' | 'warning' | 'danger' | 'info';

interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmationDialogVariant;
    isLoading?: boolean;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    children?: React.ReactNode;
}

export function ConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    isLoading = false,
    onConfirm,
    onCancel,
    children,
}: ConfirmationDialogProps) {
    const [isConfirming, setIsConfirming] = React.useState(false);

    const variantConfig = {
        default: {
            icon: <Info className="w-5 h-5 text-blue-500" />,
            buttonVariant: 'default' as const,
        },
        warning: {
            icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
            buttonVariant: 'default' as const,
        },
        danger: {
            icon: <AlertCircle className="w-5 h-5 text-red-500" />,
            buttonVariant: 'destructive' as const,
        },
        info: {
            icon: <Info className="w-5 h-5 text-blue-500" />,
            buttonVariant: 'default' as const,
        },
    };

    const config = variantConfig[variant];

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            await onConfirm();
            onOpenChange(false);
        } finally {
            setIsConfirming(false);
        }
    };

    const handleCancel = () => {
        onCancel?.();
        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        {config.icon}
                        <AlertDialogTitle>{title}</AlertDialogTitle>
                    </div>
                    {description && (
                        <AlertDialogDescription className="mt-2">
                            {description}
                        </AlertDialogDescription>
                    )}
                </AlertDialogHeader>

                {children && <div className="py-4">{children}</div>}

                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancel} disabled={isConfirming || isLoading}>
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isConfirming || isLoading}
                        className={cn(
                            variant === 'danger' && 'bg-red-600 hover:bg-red-700'
                        )}
                    >
                        {isConfirming || isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                </div>
                                Processing...
                            </div>
                        ) : (
                            confirmText
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

/**
 * Hook for managing confirmation dialog state
 */
export function useConfirmationDialog() {
    const [open, setOpen] = React.useState(false);
    const [config, setConfig] = React.useState<Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>>({
        title: '',
        onConfirm: () => { },
    });

    const confirm = (options: Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>) => {
        setConfig(options);
        setOpen(true);
    };

    return {
        open,
        setOpen,
        confirm,
        ...config,
    };
}
