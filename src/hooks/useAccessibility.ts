/**
 * React Hook for Accessibility Features
 *
 * Provides React hooks for managing accessibility features including
 * ARIA attributes, keyboard navigation, and focus management.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
    FocusManager,
    FocusVisibilityManager,
    FocusRestorationContext,
    focusElement,
    getFocusableElements,
    announceToScreenReader,
} from '@/lib/accessibility';

/**
 * Hook for managing focus within a container
 */
export function useFocusManagement(options?: {
    trapFocus?: boolean;
    initialFocus?: HTMLElement | (() => HTMLElement | null);
    restoreFocus?: boolean;
}) {
    const containerRef = useRef<HTMLElement>(null);
    const focusManagerRef = useRef<FocusManager | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        focusManagerRef.current = new FocusManager(containerRef.current);
        focusManagerRef.current.activate({
            trapFocus: options?.trapFocus,
            initialFocus: options?.initialFocus,
            restoreFocus: options?.restoreFocus,
        });

        return () => {
            focusManagerRef.current?.deactivate({ restoreFocus: options?.restoreFocus });
            focusManagerRef.current?.destroy();
        };
    }, [options?.trapFocus, options?.restoreFocus]);

    return containerRef;
}

/**
 * Hook for managing focus visibility (keyboard vs mouse)
 */
export function useFocusVisibility(focusIndicatorClass?: string) {
    const managerRef = useRef<FocusVisibilityManager | null>(null);

    useEffect(() => {
        managerRef.current = new FocusVisibilityManager(focusIndicatorClass);

        return () => {
            managerRef.current?.destroy();
        };
    }, [focusIndicatorClass]);
}

/**
 * Hook for restoring focus across navigation
 */
export function useFocusRestoration() {
    const contextRef = useRef(new FocusRestorationContext());

    const saveFocus = useCallback((route: string) => {
        contextRef.current.saveFocus(route);
    }, []);

    const restoreFocus = useCallback((route: string) => {
        contextRef.current.restoreFocus(route);
    }, []);

    const clearFocus = useCallback((route: string) => {
        contextRef.current.clearFocus(route);
    }, []);

    return { saveFocus, restoreFocus, clearFocus };
}

/**
 * Hook for announcing messages to screen readers
 */
export function useScreenReaderAnnouncement() {
    const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        announceToScreenReader(message, priority);
    }, []);

    return { announce };
}

/**
 * Hook for keyboard navigation in lists
 */
export function useKeyboardNavigation(items: HTMLElement[], options?: {
    vertical?: boolean;
    horizontal?: boolean;
    wrap?: boolean;
}) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const { vertical = true, horizontal = false, wrap = true } = options || {};
        let newIndex = currentIndex;

        if (vertical && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault();
            if (event.key === 'ArrowDown') {
                newIndex = wrap ? (currentIndex + 1) % items.length : Math.min(currentIndex + 1, items.length - 1);
            } else {
                newIndex = wrap ? (currentIndex - 1 + items.length) % items.length : Math.max(currentIndex - 1, 0);
            }
        }

        if (horizontal && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
            event.preventDefault();
            if (event.key === 'ArrowRight') {
                newIndex = wrap ? (currentIndex + 1) % items.length : Math.min(currentIndex + 1, items.length - 1);
            } else {
                newIndex = wrap ? (currentIndex - 1 + items.length) % items.length : Math.max(currentIndex - 1, 0);
            }
        }

        if (event.key === 'Home') {
            event.preventDefault();
            newIndex = 0;
        }

        if (event.key === 'End') {
            event.preventDefault();
            newIndex = items.length - 1;
        }

        if (newIndex !== currentIndex) {
            setCurrentIndex(newIndex);
            focusElement(items[newIndex]);
        }
    }, [currentIndex, items, options]);

    return { currentIndex, setCurrentIndex, handleKeyDown };
}

/**
 * Hook for managing ARIA live regions
 */
export function useLiveRegion(priority: 'polite' | 'assertive' = 'polite') {
    const regionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!regionRef.current) return;

        regionRef.current.setAttribute('role', 'status');
        regionRef.current.setAttribute('aria-live', priority);
        regionRef.current.setAttribute('aria-atomic', 'true');
    }, [priority]);

    const announce = useCallback((message: string) => {
        if (regionRef.current) {
            regionRef.current.textContent = message;
        }
    }, []);

    return { regionRef, announce };
}

/**
 * Hook for managing focus trap in modals/dialogs
 */
export function useFocusTrap(enabled: boolean = true) {
    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!enabled || !containerRef.current) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return;

            const focusableElements = getFocusableElements(containerRef.current!);
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            const activeElement = document.activeElement as HTMLElement;

            if (event.shiftKey) {
                if (activeElement === firstElement) {
                    event.preventDefault();
                    focusElement(lastElement);
                }
            } else {
                if (activeElement === lastElement) {
                    event.preventDefault();
                    focusElement(firstElement);
                }
            }
        };

        containerRef.current.addEventListener('keydown', handleKeyDown);

        return () => {
            containerRef.current?.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled]);

    return containerRef;
}

/**
 * Hook for detecting screen reader
 */
export function useScreenReaderDetection() {
    const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);

    useEffect(() => {
        // Create a test element to detect screen reader
        const testElement = document.createElement('div');
        testElement.setAttribute('aria-live', 'polite');
        testElement.setAttribute('aria-atomic', 'true');
        testElement.style.position = 'absolute';
        testElement.style.left = '-10000px';
        testElement.textContent = 'Screen reader test';

        document.body.appendChild(testElement);

        // Check if screen reader is active by monitoring for accessibility tree changes
        const observer = new MutationObserver(() => {
            setIsScreenReaderActive(true);
        });

        observer.observe(testElement, {
            attributes: true,
            characterData: true,
            subtree: true,
        });

        // Cleanup
        return () => {
            observer.disconnect();
            testElement.remove();
        };
    }, []);

    return isScreenReaderActive;
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: Array<{
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    handler: (event: KeyboardEvent) => void;
}>) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                const keyMatches = event.key === shortcut.key || event.key.toLowerCase() === shortcut.key.toLowerCase();
                const ctrlMatches = shortcut.ctrl === undefined || event.ctrlKey === shortcut.ctrl;
                const shiftMatches = shortcut.shift === undefined || event.shiftKey === shortcut.shift;
                const altMatches = shortcut.alt === undefined || event.altKey === shortcut.alt;
                const metaMatches = shortcut.meta === undefined || event.metaKey === shortcut.meta;

                if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
                    event.preventDefault();
                    shortcut.handler(event);
                    break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [shortcuts]);
}
