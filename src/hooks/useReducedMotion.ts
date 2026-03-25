/**
 * Hook for detecting user's reduced motion preference
 *
 * This hook detects if the user has enabled reduced motion preferences
 * in their system settings and provides a way to respect this preference
 * in animations and transitions.
 */

import { useEffect, useState } from 'react';

/**
 * Detects if the user prefers reduced motion
 */
function detectReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;

    try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
        return false;
    }
}

/**
 * Hook that returns whether the user prefers reduced motion
 *
 * @returns boolean indicating if reduced motion is preferred
 *
 * @example
 * const prefersReducedMotion = useReducedMotion();
 * const duration = prefersReducedMotion ? 0 : 300;
 */
export function useReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        // Detect initial preference
        setPrefersReducedMotion(detectReducedMotion());
        setInitialized(true);

        try {
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

            const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
                setPrefersReducedMotion(e.matches);
            };

            // Use addEventListener for better compatibility
            mediaQuery.addEventListener('change', handleChange);

            return () => {
                mediaQuery.removeEventListener('change', handleChange);
            };
        } catch {
            // Reduced motion detection not supported
        }
    }, []);

    return prefersReducedMotion;
}
