'use client';

import { useEffect } from 'react';

export function DraggableDialogManager() {
    useEffect(() => {
        const draggableElements = new Map<string, { x: number; y: number }>();

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

            const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;

                const newX = offsetX + deltaX;
                const newY = offsetY + deltaY;

                dialog.style.position = 'fixed';
                dialog.style.left = `${newX}px`;
                dialog.style.top = `${newY}px`;
                dialog.style.transform = 'none';

                draggableElements.set(dialogId, { x: newX, y: newY });
            };

            const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove, { passive: true });
            document.addEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousedown', handleMouseDown);

        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    return null;
}
