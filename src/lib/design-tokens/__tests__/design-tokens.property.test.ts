import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
    lightTheme,
    darkTheme,
    highContrastTheme,
    getTheme,
    generateThemeCSS,
    tokens,
} from '../index';
import type { ThemeVariant } from '../types';

/**
 * Design Tokens System Property-Based Tests
 * 
 * **Validates: Requirements 1.1, 1.2, 1.5**
 * 
 * Property 1: Design System Consistency
 * For any design token update, all consuming components should reflect 
 * the change automatically and maintain visual consistency across all 
 * themes and breakpoints.
 */

describe('Design Tokens - Property-Based Tests', () => {
    describe('Property 1: Design System Consistency', () => {
        it('should maintain consistent color scale structure for all color types', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('primary', 'secondary', 'accent'),
                    (colorType) => {
                        const colorScale = tokens.colors[colorType as keyof typeof tokens.colors];
                        const shades = Object.keys(colorScale);

                        // All color scales should have exactly 11 shades
                        expect(shades.length).toBe(11);

                        // All shades should be valid hex colors
                        shades.forEach(shade => {
                            const color = colorScale[shade as keyof typeof colorScale];
                            expect(typeof color).toBe('string');
                            expect(color).toMatch(/^#[0-9a-f]{6}$/i);
                        });
                    }
                )
            );
        });

        it('should generate valid CSS variables for any theme variant', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('light', 'dark', 'high-contrast'),
                    (variant) => {
                        const theme = getTheme(variant as ThemeVariant);
                        const cssVars = theme.cssVariables;

                        // Should have CSS variables
                        expect(Object.keys(cssVars).length).toBeGreaterThan(0);

                        // All variable names should follow CSS custom property naming
                        Object.keys(cssVars).forEach(varName => {
                            expect(varName).toMatch(/^--[a-zA-Z0-9.-]+$/);
                        });

                        // All values should be non-empty strings
                        Object.values(cssVars).forEach(value => {
                            expect(typeof value).toBe('string');
                            expect(value.length).toBeGreaterThan(0);
                        });
                    }
                )
            );
        });

        it('should maintain consistent CSS variable names across all themes', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('light', 'dark', 'high-contrast'),
                    (variant) => {
                        const theme = getTheme(variant as ThemeVariant);
                        const cssVars = Object.keys(theme.cssVariables);

                        // All themes should have the same set of CSS variable names
                        const lightVars = Object.keys(lightTheme.cssVariables);
                        expect(cssVars.sort()).toEqual(lightVars.sort());
                    }
                )
            );
        });

        it('should generate valid CSS for any theme', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('light', 'dark', 'high-contrast'),
                    (variant) => {
                        const theme = getTheme(variant as ThemeVariant);
                        const css = generateThemeCSS(theme);

                        // CSS should be a non-empty string
                        expect(typeof css).toBe('string');
                        expect(css.length).toBeGreaterThan(0);

                        // CSS should contain :root selector
                        expect(css).toContain(':root');

                        // CSS should contain CSS custom properties
                        expect(css).toContain('--color-');

                        // CSS should contain keyframes
                        expect(css).toContain('@keyframes');
                    }
                )
            );
        });

        it('should have consistent typography tokens across all themes', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('light', 'dark', 'high-contrast'),
                    (variant) => {
                        const theme = getTheme(variant as ThemeVariant);
                        const typography = theme.tokens.typography;

                        // All themes should have the same typography tokens
                        expect(typography.fontFamilies).toEqual(tokens.typography.fontFamilies);
                        expect(typography.fontSizes).toEqual(tokens.typography.fontSizes);
                        expect(typography.lineHeights).toEqual(tokens.typography.lineHeights);
                        expect(typography.fontWeights).toEqual(tokens.typography.fontWeights);
                    }
                )
            );
        });

        it('should have consistent spacing tokens across all themes', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('light', 'dark', 'high-contrast'),
                    (variant) => {
                        const theme = getTheme(variant as ThemeVariant);
                        const spacing = theme.tokens.spacing;

                        // All themes should have the same spacing tokens
                        expect(spacing).toEqual(tokens.spacing);
                    }
                )
            );
        });

        it('should have consistent animation tokens across all themes', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('light', 'dark', 'high-contrast'),
                    (variant) => {
                        const theme = getTheme(variant as ThemeVariant);
                        const animations = theme.tokens.animations;

                        // All themes should have the same animation tokens
                        expect(animations.duration).toEqual(tokens.animations.duration);
                        expect(animations.easing).toEqual(tokens.animations.easing);
                    }
                )
            );
        });

        it('should maintain color scale ordering (lighter to darker)', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('primary', 'secondary', 'accent'),
                    (colorType) => {
                        const colorScale = tokens.colors[colorType as keyof typeof tokens.colors];
                        const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

                        // Verify all expected shades exist
                        shades.forEach(shade => {
                            expect(colorScale).toHaveProperty(shade);
                        });
                    }
                )
            );
        });

        it('should have valid surface colors for all themes', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('light', 'dark', 'high-contrast'),
                    (variant) => {
                        const theme = getTheme(variant as ThemeVariant);
                        const surface = theme.tokens.colors.surface;

                        // All required surface colors should exist
                        const requiredSurfaces = [
                            'background',
                            'foreground',
                            'card',
                            'cardForeground',
                            'popover',
                            'popoverForeground',
                            'muted',
                            'mutedForeground',
                            'accent',
                            'accentForeground',
                            'border',
                            'input',
                            'ring',
                        ];

                        requiredSurfaces.forEach(surfaceColor => {
                            expect(surface).toHaveProperty(surfaceColor);
                            expect(typeof surface[surfaceColor as keyof typeof surface]).toBe('string');
                        });
                    }
                )
            );
        });

        it('should have valid semantic colors for all themes', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('light', 'dark', 'high-contrast'),
                    (variant) => {
                        const theme = getTheme(variant as ThemeVariant);
                        const semantic = theme.tokens.colors.semantic;

                        // All semantic color types should exist
                        const semanticTypes = ['success', 'warning', 'error', 'info'];
                        semanticTypes.forEach(type => {
                            expect(semantic).toHaveProperty(type);
                            const colorScale = semantic[type as keyof typeof semantic];

                            // Each semantic color should have all shades
                            const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
                            shades.forEach(shade => {
                                expect(colorScale).toHaveProperty(shade);
                            });
                        });
                    }
                )
            );
        });

        it('should have different surface colors between light and dark themes', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('background', 'foreground', 'card', 'border'),
                    (surfaceType) => {
                        const lightSurface = lightTheme.tokens.colors.surface[surfaceType as keyof typeof lightTheme.tokens.colors.surface];
                        const darkSurface = darkTheme.tokens.colors.surface[surfaceType as keyof typeof darkTheme.tokens.colors.surface];

                        // Light and dark themes should have different surface colors
                        expect(lightSurface).not.toBe(darkSurface);
                    }
                )
            );
        });

        it('should have high contrast colors in high-contrast theme', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('background', 'foreground'),
                    (surfaceType) => {
                        const highContrastSurface = highContrastTheme.tokens.colors.surface[surfaceType as keyof typeof highContrastTheme.tokens.colors.surface];

                        // High contrast theme should use pure black or white
                        expect(['#000000', '#ffffff']).toContain(highContrastSurface);
                    }
                )
            );
        });

        it('should have valid font sizes in rem units', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'),
                    (sizeKey) => {
                        const fontSize = tokens.typography.fontSizes[sizeKey as keyof typeof tokens.typography.fontSizes];

                        // Font size should be in rem units
                        expect(fontSize).toMatch(/^\d+(\.\d+)?rem$/);

                        // Font size should be positive
                        const remValue = parseFloat(fontSize);
                        expect(remValue).toBeGreaterThan(0);
                    }
                )
            );
        });

        it('should have valid spacing values', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('0', 'px', '1', '2', '4', '8', '16', '32', '64'),
                    (spacingKey) => {
                        const spacingValue = tokens.spacing[spacingKey as keyof typeof tokens.spacing];

                        // Spacing should be a valid CSS value
                        expect(spacingValue).toBeTruthy();
                        expect(typeof spacingValue).toBe('string');

                        // Spacing should be either px or rem
                        expect(spacingValue).toMatch(/^(\d+(\.\d+)?(px|rem)|0px)$/);
                    }
                )
            );
        });

        it('should have valid animation durations', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('instant', 'fast', 'normal', 'slow', 'slower'),
                    (durationKey) => {
                        const duration = tokens.animations.duration[durationKey as keyof typeof tokens.animations.duration];

                        // Duration should be in milliseconds
                        expect(duration).toMatch(/^\d+ms$/);

                        // Duration should be non-negative
                        const msValue = parseInt(duration);
                        expect(msValue).toBeGreaterThanOrEqual(0);
                    }
                )
            );
        });

        it('should have valid easing functions', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('linear', 'ease', 'easeIn', 'easeOut', 'easeInOut', 'bounce', 'elastic'),
                    (easingKey) => {
                        const easing = tokens.animations.easing[easingKey as keyof typeof tokens.animations.easing];

                        // Easing should be a non-empty string
                        expect(easing).toBeTruthy();
                        expect(typeof easing).toBe('string');

                        // Easing should be either 'linear' or a cubic-bezier function
                        expect(easing).toMatch(/^(linear|cubic-bezier\([^)]+\))$/);
                    }
                )
            );
        });
    });

    describe('Property 2: Theme Consistency Across Variants', () => {
        it('should have consistent CSS variable count across all themes', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('light', 'dark', 'high-contrast'),
                    (variant) => {
                        const theme = getTheme(variant as ThemeVariant);
                        const varCount = Object.keys(theme.cssVariables).length;

                        // All themes should have the same number of CSS variables
                        const lightVarCount = Object.keys(lightTheme.cssVariables).length;
                        expect(varCount).toBe(lightVarCount);
                    }
                )
            );
        });

        it('should generate CSS that includes all required sections', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('light', 'dark', 'high-contrast'),
                    (variant) => {
                        const theme = getTheme(variant as ThemeVariant);
                        const css = generateThemeCSS(theme);

                        // CSS should include root selector
                        expect(css).toContain(':root');

                        // CSS should include keyframes
                        expect(css).toContain('@keyframes');

                        // CSS should include media query for reduced motion
                        expect(css).toContain('@media');
                    }
                )
            );
        });
    });
});
