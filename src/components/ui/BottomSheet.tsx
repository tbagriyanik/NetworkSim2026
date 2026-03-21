'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from './button';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export function BottomSheet({ isOpen, onClose, title, children, className }: BottomSheetProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isMounted) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50 md:hidden"
                        aria-hidden="true"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={cn(
                            'fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-2xl bg-background shadow-2xl md:hidden',
                            className
                        )}
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                    >
                        {/* Handle */}
                        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/30" />

                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-4 py-3 border-b">
                                <h2 className="text-lg font-semibold">{title}</h2>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        )}

                        {/* Content */}
                        <div className="overflow-y-auto p-4 pb-8">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}