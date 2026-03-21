'use client';

import { motion } from 'framer-motion';

interface LoadingOverlayProps {
    message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
        >
            <div className="flex flex-col items-center gap-3">
                <div className="relative">
                    <div className="w-10 h-10 border-4 border-muted rounded-full" />
                    <div className="absolute inset-0 w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <span className="text-sm text-muted-foreground">{message}</span>
            </div>
        </motion.div>
    );
}