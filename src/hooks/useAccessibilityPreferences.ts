/**
 * Hook for Managing Accessibility Preferences
 *
 * Provides React hooks for managing accessibility preferences including
 * high-contrast mode, reduced motion, and font size scaling.
 */

import { useEffect, useState, useCallback } from 'react';
import {
    AccessibilityPreferences,
    detectHighContrast,
    detectReducedMotion,
    loadAccessibilityPreferences,
    saveAccessibilityPreferences,
    applyAccessibilityPreferences,
    setupAccessibilityListeners,
    injectAccessibilityCSS,
} from '@/lib/accessibility/preferences';

/**
 * Hook for managing accessibility preferences
 */
export function useAccessibilityPreferences() {
    const [preferences, setPreferences] = useState<AccessibilityPreferences | null>(null);
    const [initialized, setInitialized] = useState(false);

    // Initialize preferences on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Inject accessibility CSS
        injectAccessibilityCSS();

        // Load preferences
        const loaded = loadAccessibilityPreferences();
        setPreferences(loaded);
        applyAccessibilityPreferences(loaded);

        // Setup system preference listeners
        const unsubscribe = setupAccessibilityListeners(
            (highContrast) => {
                setPreferences(prev => {
                    if (!prev) return null;
                    const updated = { ...prev, highContrast };
                    saveAccessibilityPreferences(updated);
                    applyAccessibilityPreferences(updated);
                    return updated;
                });
            },
            (reducedMotion) => {
                setPreferences(prev => {
                    if (!prev) return null;
                    const updated = { ...prev, reducedMotion };
                    saveAccessibilityPreferences(updated);
                    applyAccessibilityPreferences(updated);
                    return updated;
                });
            }
        );

        setInitialized(true);

        return () => {
            unsubscribe();
        };
    }, []);

    const updatePreferences = useCallback((updates: Partial<AccessibilityPreferences>) => {
        setPreferences(prev => {
            if (!prev) return null;
            const updated = { ...prev, ...updates };
            saveAccessibilityPreferences(updated);
            applyAccessibilityPreferences(updated);
            return updated;
        });
    }, []);

    const setHighContrast = useCallback((enabled: boolean) => {
        updatePreferences({ highContrast: enabled });
    }, [updatePreferences]);

    const setReducedMotion = useCallback((enabled: boolean) => {
        updatePreferences({ reducedMotion: enabled });
    }, [updatePreferences]);

    const setFontSize = useCallback((size: 'normal' | 'large' | 'extra-large') => {
        updatePreferences({ fontSize: size });
    }, [updatePreferences]);

    const setFocusIndicators = useCallback((style: 'standard' | 'enhanced') => {
        updatePreferences({ focusIndicators: style });
    }, [updatePreferences]);

    const setScreenReader = useCallback((enabled: boolean) => {
        updatePreferences({ screenReader: enabled });
    }, [updatePreferences]);

    return {
        preferences,
        initialized,
        updatePreferences,
        setHighContrast,
        setReducedMotion,
        setFontSize,
        setFocusIndicators,
        setScreenReader,
    };
}

/**
 * Hook for detecting high-contrast preference
 */
export function useHighContrast() {
    const [highContrast, setHighContrast] = useState(false);

    useEffect(() => {
        setHighContrast(detectHighContrast());

        const unsubscribe = setupAccessibilityListeners(
            (enabled) => setHighContrast(enabled),
            undefined
        );

        return unsubscribe;
    }, []);

    return highContrast;
}

/**
 * Hook for detecting reduced motion preference
 */
export function useReducedMotion() {
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        setReducedMotion(detectReducedMotion());

        const unsubscribe = setupAccessibilityListeners(
            undefined,
            (enabled) => setReducedMotion(enabled)
        );

        return unsubscribe;
    }, []);

    return reducedMotion;
}

/**
 * Hook for getting animation duration based on reduced motion preference
 */
export function useAnimationDuration(normalDuration: number): number {
    const reducedMotion = useReducedMotion();
    return reducedMotion ? 0 : normalDuration;
}

/**
 * Hook for getting animation timing based on reduced motion preference
 */
export function useAnimationTiming(normalTiming: string): string {
    const reducedMotion = useReducedMotion();
    return reducedMotion ? '0ms' : normalTiming;
}

/**
 * Hook for conditional animation based on reduced motion preference
 */
export function useConditionalAnimation(shouldAnimate: boolean): boolean {
    const reducedMotion = useReducedMotion();
    return shouldAnimate && !reducedMotion;
}
