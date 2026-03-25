/**
 * Accessible Dialog Component
 *
 * Demonstrates best practices for accessible dialog implementation
 * using the accessibility enhancement system.
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { useFocusManagement, useKeyboardShortcuts } from '@/hooks/useAccessibility';
import { generateDialogARIA, generateButtonARIA } from '@/lib/accessibility';
import { cn } from '@/lib/utils';

interface AccessibleDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    closeButtonLabel?: string;
    className?: string;
}

/**
 * Accessible Dialog Component
 *
 * Features:
 * - Focus trapping within dialog
 * - Keyboard navigation (Escape to close)
 * - Proper ARIA attributes
 * - Focus restoration on close
 * - Screen reader support
 */
export const AccessibleDialog = React.forwardRef<HTMLDivElement, AccessibleDialogProps>(
    (
        {
            isOpen,
            onClose,
            title,
            description,
            children,
            closeButtonLabel = 'Close',
            className,
        },
        ref
    ) => {
        const containerRef = useFocusManagement({
            trapFocus: true,
            restoreFocus: true,
        });

        const titleId = useRef(`dialog-title-${Math.random().toString(36).substr(2, 9)}`).current;
        const descriptionId = useRef(`dialog-description-${Math.random().toString(36).substr(2, 9)}`).current;

        // Handle Escape key to close dialog
        useKeyboardShortcuts([
            {
                key: 'Escape',
                handler: onClose,
            },
        ]);

        if (!isOpen) return null;

        return (
            <>
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={onClose}
                    aria-hidden="true"
                />

                {/* Dialog */}
                <div
                    className={cn(
                        'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
                        'bg-white rounded-lg shadow-lg p-6 max-w-md w-full',
                        'focus:outline-none',
                        className
                    )}
                    {...generateDialogARIA({
                        label: title,
                        labelledBy: titleId,
                        describedBy: description ? descriptionId : undefined,
                        modal: true,
                    })}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h2
                            id={titleId}
                            className="text-lg font-semibold text-gray-900"
                        >
                            {title}
                        </h2>
                        <button
                            {...generateButtonARIA({
                                label: closeButtonLabel,
                            })}
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Description */}
                    {description && (
                        <p
                            id={descriptionId}
                            className="text-sm text-gray-600 mb-4"
                        >
                            {description}
                        </p>
                    )}

                    {/* Content */}
                    <div className="mb-6">
                        {children}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3">
                        <button
                            {...generateButtonARIA({
                                label: 'Cancel',
                            })}
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            {...generateButtonARIA({
                                label: 'Confirm',
                            })}
                            onClick={onClose}
                            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </>
        );
    }
);

AccessibleDialog.displayName = 'AccessibleDialog';
