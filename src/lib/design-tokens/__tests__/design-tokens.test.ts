import { describe, it, expect } from 'vitest';
import {
    lightTheme,
    darkTheme,
    highContrastTheme,
    themeConfig,
    getTheme,
    generateThemeCSS,
    generateAllThemesCSS,
    tokens,
} from '../index';
import type { ThemeVariant, ColorScale, DesignTokens } from '../types';

/**
 * Design Tokens System Tests
 * 
 * **Validates: Requirements 1.1, 1.4**
 * 
 * Tests verify that the design tokens system provides:
 * - Complete color scales with proper contrast ratios
 * - Typography system with consistent sizing and weights
 * - Spacing system with rem-based values
 * - Animation tokens with durations and easing functions
 * - Theme variants (light, dark, high-contrast)
 * - CSS custom properties for dynamic theming
 */

describe('Design Tokens System', () => {
    describe('Color Scales', () => {
        it('should have all required color scales', () => {
            expect(tokens.colors).toHaveProperty('primary');
            expect(tokens.colors).toHaveProperty('secondary');
            expect(tokens.colors).toHaveProperty('accent');
            expect(tokens.colors).toHaveProperty('semantic');
        });

        it('should have complete color scale with all shades', () => {
            const colorScale = tokens.colors.primary;
            const requiredShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

            requiredShades.forEach(shade => {
                expect(colorScale).toHaveProperty(shade as keyof ColorScale);
                expect(typeof colorScale[shade as keyof ColorScale]).toBe('string');
                expect(colorScale[shade as keyof ColorScale]).toMatch(/^#[0-9a-f]{6}$/i);
            });
        });

        it('should have semantic colors for success, warning, error, and info', () => {
            const semantic = tokens.colors.semantic;
            expect(semantic).toHaveProperty('success');
            expect(semantic).toHaveProperty('warning');
            expect(semantic).toHaveProperty('error');
            expect(semantic).toHaveProperty('info');
        });

        it('should have valid hex color values', () => {
            const allColors = [
                tokens.colors.primary,
                tokens.colors.secondary,
                tokens.colors.accent,
                tokens.colors.semantic.success,
                tokens.colors.semantic.warning,
                tokens.colors.semantic.error,
                tokens.colors.semantic.info,
            ];

            allColors.forEach(colorScale => {
                Object.values(colorScale).forEach(color => {
                    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
                });
            });
        });
    });

    describe('Typography System', () => {
        it('should have font families defined', () => {
            expect(tokens.typography.fontFamilies).toHaveProperty('sans');
            expect(tokens.typography.fontFamilies).toHaveProperty('mono');
            expect(tokens.typography.fontFamilies).toHaveProperty('display');
        });

        it('should have complete font size scale', () => {
            const fontSizes = tokens.typography.fontSizes;
            const requiredSizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'];

            requiredSizes.forEach(size => {
                expect(fontSizes).toHaveProperty(size);
                expect(typeof fontSizes[size as keyof typeof fontSizes]).toBe('string');
            });
        });

        it('should have valid rem-based font sizes', () => {
            Object.values(tokens.typography.fontSizes).forEach(size => {
                expect(size).toMatch(/^\d+(\.\d+)?rem$/);
            });
        });

        it('should have line height scale', () => {
            const lineHeights = tokens.typography.lineHeights;
            const requiredHeights = ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose'];

            requiredHeights.forEach(height => {
                expect(lineHeights).toHaveProperty(height);
            });
        });

        it('should have font weight scale', () => {
            const fontWeights = tokens.typography.fontWeights;
            const requiredWeights = ['thin', 'extralight', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black'];

            requiredWeights.forEach(weight => {
                expect(fontWeights).toHaveProperty(weight);
            });
        });
    });

    describe('Spacing System', () => {
        it('should have complete spacing scale', () => {
            const spacingScale = tokens.spacing;
            const requiredSpacings = ['0', 'px', '1', '2', '4', '8', '16', '32', '64'];

            requiredSpacings.forEach(spacing => {
                expect(spacingScale).toHaveProperty(spacing);
            });
        });

        it('should have valid rem-based spacing values', () => {
            Object.entries(tokens.spacing).forEach(([key, value]) => {
                if (key === 'px') {
                    expect(value).toBe('1px');
                } else if (key === '0') {
                    expect(value).toBe('0px');
                } else {
                    expect(value).toMatch(/^\d+(\.\d+)?rem$/);
                }
            });
        });

        it('should have border radius scale', () => {
            const borderRadius = tokens.borderRadius;
            const requiredRadii = ['none', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', 'full'];

            requiredRadii.forEach(radius => {
                expect(borderRadius).toHaveProperty(radius);
            });
        });

        it('should have shadow scale', () => {
            const shadows = tokens.shadows;
            const requiredShadows = ['sm', 'base', 'md', 'lg', 'xl', '2xl', 'inner', 'none'];

            requiredShadows.forEach(shadow => {
                expect(shadows).toHaveProperty(shadow);
            });
        });
    });

    describe('Animation System', () => {
        it('should have animation durations', () => {
            const durations = tokens.animations.duration;
            expect(durations).toHaveProperty('instant');
            expect(durations).toHaveProperty('fast');
            expect(durations).toHaveProperty('normal');
            expect(durations).toHaveProperty('slow');
            expect(durations).toHaveProperty('slower');
        });

        it('should have easing functions', () => {
            const easing = tokens.animations.easing;
            expect(easing).toHaveProperty('linear');
            expect(easing).toHaveProperty('ease');
            expect(easing).toHaveProperty('easeIn');
            expect(easing).toHaveProperty('easeOut');
            expect(easing).toHaveProperty('easeInOut');
            expect(easing).toHaveProperty('bounce');
            expect(easing).toHaveProperty('elastic');
        });

        it('should have keyframe definitions', () => {
            const keyframes = tokens.animations.keyframes;
            const requiredKeyframes = ['fadeIn', 'fadeOut', 'slideUp', 'slideDown', 'slideLeft', 'slideRight', 'scaleIn', 'scaleOut', 'spin', 'pulse', 'bounce'];

            requiredKeyframes.forEach(keyframe => {
                expect(keyframes).toHaveProperty(keyframe);
            });
        });
    });

    describe('Theme Variants', () => {
        it('should have all three theme variants', () => {
            expect(themeConfig.themes).toHaveProperty('light');
            expect(themeConfig.themes).toHaveProperty('dark');
            expect(themeConfig.themes).toHaveProperty('high-contrast');
        });

        it('should have light theme with correct properties', () => {
            expect(lightTheme.id).toBe('light');
            expect(lightTheme.variant).toBe('light');
            expect(lightTheme.tokens).toBeDefined();
            expect(lightTheme.cssVariables).toBeDefined();
        });

        it('should have dark theme with correct properties', () => {
            expect(darkTheme.id).toBe('dark');
            expect(darkTheme.variant).toBe('dark');
            expect(darkTheme.tokens).toBeDefined();
            expect(darkTheme.cssVariables).toBeDefined();
        });

        it('should have high-contrast theme with correct properties', () => {
            expect(highContrastTheme.id).toBe('high-contrast');
            expect(highContrastTheme.variant).toBe('high-contrast');
            expect(highContrastTheme.tokens).toBeDefined();
            expect(highContrastTheme.cssVariables).toBeDefined();
        });

        it('should have default theme set', () => {
            expect(themeConfig.defaultTheme).toBe('light');
        });
    });

    describe('CSS Variables Generation', () => {
        it('should generate CSS variables for light theme', () => {
            const cssVars = lightTheme.cssVariables;
            expect(Object.keys(cssVars).length).toBeGreaterThan(0);
            expect(cssVars).toHaveProperty('--color-primary-500');
            expect(cssVars).toHaveProperty('--color-background');
            expect(cssVars).toHaveProperty('--font-sans');
            expect(cssVars).toHaveProperty('--spacing-4');
        });

        it('should generate CSS variables for dark theme', () => {
            const cssVars = darkTheme.cssVariables;
            expect(Object.keys(cssVars).length).toBeGreaterThan(0);
            expect(cssVars).toHaveProperty('--color-primary-500');
            expect(cssVars).toHaveProperty('--color-background');
        });

        it('should generate CSS variables for high-contrast theme', () => {
            const cssVars = highContrastTheme.cssVariables;
            expect(Object.keys(cssVars).length).toBeGreaterThan(0);
            expect(cssVars).toHaveProperty('--color-primary-500');
            expect(cssVars).toHaveProperty('--color-background');
        });

        it('should have consistent CSS variable names across themes', () => {
            const lightVars = Object.keys(lightTheme.cssVariables).sort();
            const darkVars = Object.keys(darkTheme.cssVariables).sort();
            const highContrastVars = Object.keys(highContrastTheme.cssVariables).sort();

            expect(lightVars).toEqual(darkVars);
            expect(lightVars).toEqual(highContrastVars);
        });
    });

    describe('Theme Utility Functions', () => {
        it('should retrieve theme by variant', () => {
            const light = getTheme('light');
            const dark = getTheme('dark');
            const highContrast = getTheme('high-contrast');

            expect(light.id).toBe('light');
            expect(dark.id).toBe('dark');
            expect(highContrast.id).toBe('high-contrast');
        });

        it('should generate theme CSS string', () => {
            const css = generateThemeCSS(lightTheme);
            expect(typeof css).toBe('string');
            expect(css).toContain(':root');
            expect(css).toContain('--color-');
            expect(css).toContain('@keyframes');
        });

        it('should generate all themes CSS', () => {
            const css = generateAllThemesCSS();
            expect(typeof css).toBe('string');
            expect(css).toContain(':root');
            expect(css).toContain('.dark');
            expect(css).toContain('.high-contrast');
        });
    });

    describe('Theme Consistency', () => {
        it('should have consistent token structure across all themes', () => {
            const themes = [lightTheme, darkTheme, highContrastTheme];

            themes.forEach(theme => {
                expect(theme.tokens).toHaveProperty('colors');
                expect(theme.tokens).toHaveProperty('typography');
                expect(theme.tokens).toHaveProperty('spacing');
                expect(theme.tokens).toHaveProperty('borderRadius');
                expect(theme.tokens).toHaveProperty('shadows');
                expect(theme.tokens).toHaveProperty('animations');
            });
        });

        it('should have consistent color structure across all themes', () => {
            const themes = [lightTheme, darkTheme, highContrastTheme];

            themes.forEach(theme => {
                const colors = theme.tokens.colors;
                expect(colors).toHaveProperty('primary');
                expect(colors).toHaveProperty('secondary');
                expect(colors).toHaveProperty('accent');
                expect(colors).toHaveProperty('semantic');
                expect(colors).toHaveProperty('surface');
            });
        });

        it('should have different surface colors for each theme', () => {
            const lightBg = lightTheme.tokens.colors.surface.background;
            const darkBg = darkTheme.tokens.colors.surface.background;
            const highContrastBg = highContrastTheme.tokens.colors.surface.background;

            expect(lightBg).not.toBe(darkBg);
            expect(darkBg).not.toBe(highContrastBg);
            expect(lightBg).not.toBe(highContrastBg);
        });

        it('should maintain color scale integrity across themes', () => {
            const themes = [lightTheme, darkTheme, highContrastTheme];

            themes.forEach(theme => {
                const primary = theme.tokens.colors.primary;
                const shades = Object.keys(primary);
                expect(shades.length).toBe(11); // 50, 100, 200, ..., 950
            });
        });
    });

    describe('Accessibility Compliance', () => {
        it('should have sufficient contrast in light theme', () => {
            const light = lightTheme.tokens.colors.surface;
            expect(light.background).toBe('#ffffff');
            expect(light.foreground).toBe('#0f172a');
        });

        it('should have sufficient contrast in dark theme', () => {
            const dark = darkTheme.tokens.colors.surface;
            expect(dark.background).toBe('#020617');
            expect(dark.foreground).toBe('#f8fafc');
        });

        it('should have maximum contrast in high-contrast theme', () => {
            const highContrast = highContrastTheme.tokens.colors.surface;
            expect(highContrast.background).toBe('#000000');
            expect(highContrast.foreground).toBe('#ffffff');
        });

        it('should have focus ring colors defined', () => {
            const themes = [lightTheme, darkTheme, highContrastTheme];

            themes.forEach(theme => {
                expect(theme.tokens.colors.surface.ring).toBeDefined();
                expect(typeof theme.tokens.colors.surface.ring).toBe('string');
            });
        });
    });

    describe('Token Value Validation', () => {
        it('should have valid CSS variable names', () => {
            const cssVars = lightTheme.cssVariables;
            Object.keys(cssVars).forEach(varName => {
                expect(varName).toMatch(/^--[a-zA-Z0-9.-]+$/);
            });
        });

        it('should have non-empty CSS variable values', () => {
            const cssVars = lightTheme.cssVariables;
            Object.values(cssVars).forEach(value => {
                expect(value).toBeTruthy();
                expect(typeof value).toBe('string');
            });
        });

        it('should have valid animation durations', () => {
            Object.values(tokens.animations.duration).forEach(duration => {
                expect(duration).toMatch(/^\d+ms$/);
            });
        });

        it('should have valid easing functions', () => {
            Object.values(tokens.animations.easing).forEach(easing => {
                expect(easing).toBeTruthy();
                expect(typeof easing).toBe('string');
            });
        });
    });
});
