/**
 * Hook for Screen Reader Announcements
 *
 * Provides React hooks for managing screen reader announcements
 * and live region updates.
 */

import { useCallback, useRef, useEffect } from 'react';
import {
    announceToScreenReader,
    announceStatus,
    announceLoading,
    announceCompletion,
    createScreenReaderOnlyElement,
    addScreenReaderText,
    generateScreenReaderLabel,
    AnnouncementOptions,
} from '@/lib/accessibility/screen-reader';

/**
 * Hook for announcing messages to screen readers
 */
export function useScreenReaderAnnouncement() {
    const announce = useCallback((message: string, options?: AnnouncementOptions) => {
        announceToScreenReader(message, options);
    }, []);

    return { announce };
}

/**
 * Hook for announcing status updates
 */
export function useStatusAnnouncement() {
    const announceSuccess = useCallback((action: string, details?: string) => {
        announceStatus(action, 'success', details);
    }, []);

    const announceError = useCallback((action: string, details?: string) => {
        announceStatus(action, 'error', details);
    }, []);

    const announceWarning = useCallback((action: string, details?: string) => {
        announceStatus(action, 'warning', details);
    }, []);

    const announceInfo = useCallback((action: string, details?: string) => {
        announceStatus(action, 'info', details);
    }, []);

    return { announceSuccess, announceError, announceWarning, announceInfo };
}

/**
 * Hook for announcing loading states
 */
export function useLoadingAnnouncement() {
    const announceLoadingStart = useCallback((action: string) => {
        announceLoading(action);
    }, []);

    const announceLoadingComplete = useCallback((action: string) => {
        announceCompletion(action);
    }, []);

    return { announceLoadingStart, announceLoadingComplete };
}

/**
 * Hook for managing screen reader only content
 */
export function useScreenReaderContent() {
    const containerRef = useRef<HTMLElement>(null);

    const addContent = useCallback((text: string) => {
        if (containerRef.current) {
            addScreenReaderText(containerRef.current, text);
        }
    }, []);

    const createElement = useCallback((text: string): HTMLElement => {
        return createScreenReaderOnlyElement(text);
    }, []);

    return { containerRef, addContent, createElement };
}

/**
 * Hook for generating accessible labels
 */
export function useAccessibleLabel() {
    const generateLabel = useCallback((
        label: string,
        context?: string,
        state?: string
    ): string => {
        return generateScreenReaderLabel(label, context, state);
    }, []);

    return { generateLabel };
}

/**
 * Hook for managing live region announcements with automatic cleanup
 */
export function useLiveRegionAnnouncement(regionId: string = 'sr-announcements') {
    const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        announceToScreenReader(message, { priority });
    }, []);

    const announceWithDelay = useCallback((message: string, delay: number, priority: 'polite' | 'assertive' = 'polite') => {
        announceToScreenReader(message, { priority, delay });
    }, []);

    return { announce, announceWithDelay };
}

/**
 * Hook for announcing dynamic content changes
 */
export function useDynamicContentAnnouncement() {
    const announceContentAdded = useCallback((itemName: string, containerName?: string) => {
        const message = containerName
            ? `${itemName} added to ${containerName}`
            : `${itemName} added`;
        announceToScreenReader(message, { priority: 'polite', clear: true });
    }, []);

    const announceContentRemoved = useCallback((itemName: string, containerName?: string) => {
        const message = containerName
            ? `${itemName} removed from ${containerName}`
            : `${itemName} removed`;
        announceToScreenReader(message, { priority: 'polite', clear: true });
    }, []);

    const announceContentUpdated = useCallback((itemName: string, details?: string) => {
        const message = details
            ? `${itemName} updated: ${details}`
            : `${itemName} updated`;
        announceToScreenReader(message, { priority: 'polite', clear: true });
    }, []);

    return { announceContentAdded, announceContentRemoved, announceContentUpdated };
}

/**
 * Hook for announcing form validation results
 */
export function useFormValidationAnnouncement() {
    const announceValidationError = useCallback((fieldName: string, error: string) => {
        const message = `${fieldName}: ${error}`;
        announceToScreenReader(message, { priority: 'assertive' });
    }, []);

    const announceValidationSuccess = useCallback((fieldName: string) => {
        const message = `${fieldName} is valid`;
        announceToScreenReader(message, { priority: 'polite', clear: true });
    }, []);

    return { announceValidationError, announceValidationSuccess };
}

/**
 * Hook for announcing navigation changes
 */
export function useNavigationAnnouncement() {
    const announcePageChange = useCallback((pageName: string) => {
        const message = `Navigated to ${pageName}`;
        announceToScreenReader(message, { priority: 'assertive' });
    }, []);

    const announceTabChange = useCallback((tabName: string) => {
        const message = `${tabName} tab selected`;
        announceToScreenReader(message, { priority: 'polite' });
    }, []);

    return { announcePageChange, announceTabChange };
}
