'use client';

import { useEffect } from 'react';

const STORAGE_PREFIX = 'draggable_position_';

export function DraggableDialogManager() {
    useEffect(() => {
        const draggableElements = new Map<string, { x: number; y: number }>();
        let animationFrameId: number;

        const handleMouseDown = (e: MouseEvent) => {
            const dragHandle = (e.target as HTMLElement).closest('[data-drag-handle]');
            if (!dragHandle) return;

            const dialog = dragHandle.closest('[data-draggable-id]') as HTMLElement;
            if (!dialog) return;

            const dialogId = dialog.getAttribute('data-draggable-id');
            if (!dialogId) return;

            // Get current position
            const rect = dialog.getBoundingClientRect();
            const startX = e.clientX;
            const startY = e.clientY;
            const offsetX = rect.left;
            const offsetY = rect.top;

            draggableElements.set(dialogId, { x: offsetX, y: offsetY });

            // Set grabbing cursor on document
            document.body.style.cursor = 'grabbing';

            const handleMouseMove = (moveEvent: MouseEvent) => {
                if (animationFrameId) cancelAnimationFrame(animationFrameId);

                animationFrameId = requestAnimationFrame(() => {
                    const deltaX = moveEvent.clientX - startX;
                    const deltaY = moveEvent.clientY - startY;

                    const newX = offsetX + deltaX;
                    const newY = offsetY + deltaY;

                    dialog.style.position = 'fixed';
                    dialog.style.left = `${newX}px`;
                    dialog.style.top = `${newY}px`;
                    dialog.style.transform = 'none';
                    dialog.style.willChange = 'left, top';

                    draggableElements.set(dialogId, { x: newX, y: newY });
                });
            };

            const handleMouseUp = () => {
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                dialog.style.willChange = '';

                // Reset cursor
                document.body.style.cursor = '';

                // Save position to localStorage
                const finalPos = draggableElements.get(dialogId);
                if (finalPos) {
                    try {
                        localStorage.setItem(`${STORAGE_PREFIX}${dialogId}`, JSON.stringify(finalPos));
                    } catch (e) {
                        // Ignore storage errors
                    }
                }

                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove, { passive: true });
            document.addEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousedown', handleMouseDown);

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    return null;
}
