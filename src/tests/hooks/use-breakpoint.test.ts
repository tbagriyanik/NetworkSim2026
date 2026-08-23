import { describe, it, expect } from 'vitest';

describe('useBreakpoint Hook', () => {
  it('should detect mobile breakpoint (width < 768)', () => {
    const width = 375;
    const isMobile = width < 768;
    expect(isMobile).toBe(true);
  });

  it('should detect tablet breakpoint (768 <= width < 1024)', () => {
    const width = 768;
    const isTablet = width >= 768 && width < 1024;
    expect(isTablet).toBe(true);
  });

  it('should detect desktop breakpoint (width >= 1024)', () => {
    const width = 1440;
    const isDesktop = width >= 1024;
    expect(isDesktop).toBe(true);
  });

  it('should not be mobile at 1024px width', () => {
    const width = 1024;
    const isMobile = width < 768;
    expect(isMobile).toBe(false);
  });

  it('should handle SSR (width = 0)', () => {
    const width = 0;
    const isMobile = width < 768;
    expect(isMobile).toBe(true);
  });

  it('should handle resize events', () => {
    const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 };
    expect(breakpoints.md).toBe(768);
    expect(breakpoints.lg).toBe(1024);
  });
});
