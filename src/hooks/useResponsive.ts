import { useState, useEffect, useCallback } from 'react';
import { 
    Breakpoint, 
    BreakpointConfig, 
    breakpoints as DEFAULT_BREAKPOINTS 
} from '@/lib/design-tokens';

export type { Breakpoint, BreakpointConfig };

export function useResponsive(breakpoints: BreakpointConfig = DEFAULT_BREAKPOINTS) {
    const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    const determineBreakpoint = useCallback((width: number): Breakpoint => {
        if (width <= breakpoints.mobile.max) return 'mobile';
        if (width >= breakpoints.tablet.min && width <= breakpoints.tablet.max) return 'tablet';
        return 'desktop';
    }, [breakpoints]);

    useEffect(() => {
        // Set initial size
        if (typeof window !== 'undefined') {
            const width = window.innerWidth;
            const height = window.innerHeight;
            setWindowSize({ width, height });
            setBreakpoint(determineBreakpoint(width));
        }

        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            setWindowSize({ width, height });
            setBreakpoint(determineBreakpoint(width));
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [determineBreakpoint]);

    return {
        breakpoint,
        windowSize,
        isMobile: breakpoint === 'mobile',
        isTablet: breakpoint === 'tablet',
        isDesktop: breakpoint === 'desktop',
        isSmallScreen: breakpoint === 'mobile' || breakpoint === 'tablet',
    };
}

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);

        const handleChange = (e: MediaQueryListEvent) => {
            setMatches(e.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [query]);

    return matches;
}
