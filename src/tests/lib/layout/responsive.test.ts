import { describe, it, expect } from 'vitest';
import {
  getResponsiveValue,
  calculateLayoutDimensions,
  DEFAULT_LAYOUT_CONFIG,
} from '@/lib/layout/responsive';

describe('getResponsiveValue', () => {
  it('should return value directly for non-responsive values', () => {
    const result = getResponsiveValue(42, 'mobile');
    expect(result).toBe(42);
  });

  it('should return mobile value for mobile breakpoint', () => {
    const result = getResponsiveValue({ mobile: 10, tablet: 20, desktop: 30 }, 'mobile');
    expect(result).toBe(10);
  });

  it('should return tablet value for tablet breakpoint', () => {
    const result = getResponsiveValue({ mobile: 10, tablet: 20, desktop: 30 }, 'tablet');
    expect(result).toBe(20);
  });

  it('should return desktop value for desktop breakpoint', () => {
    const result = getResponsiveValue({ mobile: 10, tablet: 20, desktop: 30 }, 'desktop');
    expect(result).toBe(30);
  });

  it('should fall back to desktop when tablet value is missing', () => {
    const result = getResponsiveValue({ mobile: 10, desktop: 30 }, 'tablet');
    expect(result).toBe(30);
  });

  it('should return the object itself for empty responsive value', () => {
    const val = {};
    const result = getResponsiveValue(val, 'mobile');
    expect(result).toBe(val);
  });
});

describe('calculateLayoutDimensions', () => {
  it('should calculate dimensions for desktop', () => {
    const result = calculateLayoutDimensions(DEFAULT_LAYOUT_CONFIG, 'desktop', 1920, 1080);
    expect(result.header.width).toBe(1920);
    expect(result.header.height).toBe(80);
    expect(result.sidebar.width).toBe(320);
    expect(result.footer.height).toBe(80);
  });

  it('should calculate dimensions for mobile', () => {
    const result = calculateLayoutDimensions(DEFAULT_LAYOUT_CONFIG, 'mobile', 375, 667);
    expect(result.header.height).toBe(60);
    expect(result.sidebar.width).toBe(0);
    expect(result.main.padding).toBe(16);
  });

  it('should calculate main area dimensions correctly', () => {
    const result = calculateLayoutDimensions(DEFAULT_LAYOUT_CONFIG, 'desktop', 1920, 1080);
    const mainPadding = getResponsiveValue(DEFAULT_LAYOUT_CONFIG.regions.main.padding, 'desktop') || 16;
    const expectedMainWidth = 1920 - 320 - mainPadding * 2;
    const expectedMainHeight = 1080 - 80 - 80 - mainPadding * 2;
    expect(result.main.width).toBe(expectedMainWidth);
    expect(result.main.height).toBe(expectedMainHeight);
  });

  it('should handle custom config', () => {
    const customConfig = {
      ...DEFAULT_LAYOUT_CONFIG,
      regions: {
        ...DEFAULT_LAYOUT_CONFIG.regions,
        header: { height: { mobile: 50, tablet: 60, desktop: 70 }, sticky: true, zIndex: 1 },
      },
    };
    const result = calculateLayoutDimensions(customConfig, 'mobile', 400, 800);
    expect(result.header.height).toBe(50);
  });
});
