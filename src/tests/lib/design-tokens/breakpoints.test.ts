import { describe, it, expect } from 'vitest';
import { getBreakpointFromWidth, breakpoints, mediaQueries } from '@/lib/design-tokens/breakpoints';

describe('breakpoints', () => {
  it('should define mobile max at 640', () => {
    expect(breakpoints.mobile.max).toBe(640);
  });

  it('should define tablet range 641-1024', () => {
    expect(breakpoints.tablet.min).toBe(641);
    expect(breakpoints.tablet.max).toBe(1024);
  });

  it('should define desktop min at 1025', () => {
    expect(breakpoints.desktop.min).toBe(1025);
  });
});

describe('mediaQueries', () => {
  it('should generate correct mobile query', () => {
    expect(mediaQueries.mobile).toBe('(max-width: 640px)');
  });

  it('should generate correct tablet query', () => {
    expect(mediaQueries.tablet).toBe('(min-width: 641px) and (max-width: 1024px)');
  });

  it('should generate correct desktop query', () => {
    expect(mediaQueries.desktop).toBe('(min-width: 1025px)');
  });
});

describe('getBreakpointFromWidth', () => {
  it('should return mobile for width <= 640', () => {
    expect(getBreakpointFromWidth(320)).toBe('mobile');
    expect(getBreakpointFromWidth(640)).toBe('mobile');
  });

  it('should return tablet for width 641-1024', () => {
    expect(getBreakpointFromWidth(768)).toBe('tablet');
    expect(getBreakpointFromWidth(1024)).toBe('tablet');
  });

  it('should return desktop for width >= 1025', () => {
    expect(getBreakpointFromWidth(1025)).toBe('desktop');
    expect(getBreakpointFromWidth(1920)).toBe('desktop');
  });
});
