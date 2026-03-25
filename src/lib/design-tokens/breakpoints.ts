/**
 * Breakpoint Tokens
 * 
 * Standard breakpoints used across the application for responsive design.
 */

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface BreakpointConfig {
  mobile: { max: number };
  tablet: { min: number; max: number };
  desktop: { min: number };
}

export const breakpoints: BreakpointConfig = {
  mobile: { max: 640 },
  tablet: { min: 641, max: 1024 },
  desktop: { min: 1025 },
};

/**
 * Common media queries as string constants for use in CSS-in-JS or styled components
 */
export const mediaQueries = {
  mobile: `(max-width: ${breakpoints.mobile.max}px)`,
  tablet: `(min-width: ${breakpoints.tablet.min}px) and (max-width: ${breakpoints.tablet.max}px)`,
  desktop: `(min-width: ${breakpoints.desktop.min}px)`,
  smallScreen: `(max-width: ${breakpoints.tablet.max}px)`,
  notMobile: `(min-width: ${breakpoints.tablet.min}px)`,
};

/**
 * Utility to get breakpoint based on width
 */
export function getBreakpointFromWidth(width: number): Breakpoint {
  if (width <= breakpoints.mobile.max) return 'mobile';
  if (width >= breakpoints.tablet.min && width <= breakpoints.tablet.max) return 'tablet';
  return 'desktop';
}
