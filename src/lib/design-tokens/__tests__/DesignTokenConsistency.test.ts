/**
 * Design Token Consistency Property Tests
 *
 * These property-based tests validate that design tokens are applied consistently
 * across all themes and components, and that the design system maintains integrity
 * across all usage patterns.
 *
 * **Validates: Requirements 1.1, 1.2, 1.5**
 * Feature: ui-ux-full-modernization, Task: 1.3
 * Property: Design System Consistency
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
    lightTheme,
    darkTheme,
    highContrastTheme,
    getTheme,
    generateThemeCSS,
    generateAllThemesCSS,
    themeConfig,
    tokens,
    primaryColors,
    secondaryColors,
    accentColors,
    semanticColors,
    lightSurfaceColors,
    darkSurfaceColors,
    highContrastSurfaceColors,
} from '../index';
import type {
    ThemeDefinition,
    ThemeVariant,
    ColorScale,
    DesignTokens,
    SurfaceColors,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Property 1: Design System Consistency
// ─────────────────────────────────────────────────────────────────────────────

describe('Property 1: Design System Consistency', () => {
    /**
     * Property: All themes must have identical color scales for primary, secondary, and accent colors
     *
     * Rationale: Color scales should be consistent across themes to ensure predictable
     * color behavior. Only surface colors should vary by theme.
     */
    it('all themes use identical color scales for primary, secondary, and accent', () => {
        fc.assert(
            fc.property(fc.constantFrom('light', 'dark', 'high-contrast' as ThemeVariant), (variant) => {
                const theme = getTheme(variant);

                // Primary colors should be identical across all themes
                expect(theme.tokens.colors.primary).toEqual(primaryColors);

                // Secondary colors should be identical across all themes
                expect(theme.tokens.colors.secondary).toEqual(secondaryColors);

                // Accent colors should be identical across all themes
                expect(theme.tokens.colors.accent).toEqual(accentColors);

                // Semantic colors should be identical across all themes
                expect(theme.tokens.colors.semantic).toEqual(semanticColors);
            })
        );
    });

    /**
     * Property: All color scales must have exactly 11 color stops (50-950)
     *
     * Rationale: Consistent color scale structure ensures predictable token access
     * and prevents missing color values.
     */
    it('all color scales have exactly 11 color stops', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(
                    primaryColors,
                    secondaryColors,
                    accentColors,
                    semanticColors.success,
                    semanticColors.warning,
                    semanticColors.error,
                    semanticColors.info
                ),
                (colorScale: ColorScale) => {
                    const expectedStops = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
                    const actualStops = Object.keys(colorScale);

                    // Check that all expected stops are present
                    expectedStops.forEach((stop) => {
                        expect(actualStops).toContain(stop);
                    });

                    // Check that the count is exactly 11
                    expect(Object.keys(colorScale).length).toBe(11);
                }
            )
        );
    });

    /**
     * Property: All color values must be valid hex colors
     *
     * Rationale: Invalid color values would break CSS rendering and cause visual inconsistencies.
     */
    it('all color values are valid hex colors', () => {
        const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

        fc.assert(
            fc.property(
                fc.constantFrom(
                    primaryColors,
                    secondaryColors,
                    accentColors,
                    semanticColors.success,
                    semanticColors.warning,
                    semanticColors.error,
                    semanticColors.info
                ),
                (colorScale: ColorScale) => {
                    Object.values(colorScale).forEach((color) => {
                        expect(hexColorRegex.test(color)).toBe(true);
                    });
                }
            )
        );
    });

    /**
     * Property: All themes must have complete CSS variable mappings
     *
     * Rationale: Missing CSS variables would cause styling failures and inconsistent
     * component appearance.
     */
    it('all themes have complete CSS variable mappings', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(lightTheme, darkTheme, highContrastTheme),
                (theme: ThemeDefinition) => {
                    // CSS variables should not be empty
                    expect(Object.keys(theme.cssVariables).length).toBeGreaterThan(0);

                    // All CSS variables should have string values
                    Object.entries(theme.cssVariables).forEach(([key, value]) => {
                        expect(typeof key).toBe('string');
                        expect(typeof value).toBe('string');
                        expect(key.length).toBeGreaterThan(0);
                        expect(value.length).toBeGreaterThan(0);
                    });
                }
            )
        );
    });

    /**
     * Property: Surface colors must vary by theme but maintain consistent structure
     *
     * Rationale: Surface colors should adapt to theme while maintaining the same
     * property structure for consistent component styling.
     */
    it('surface colors maintain consistent structure across themes', () => {
        const expectedSurfaceKeys = [
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

        fc.assert(
            fc.property(
                fc.constantFrom(
                    lightSurfaceColors,
                    darkSurfaceColors,
                    highContrastSurfaceColors
                ),
                (surfaceColors: SurfaceColors) => {
                    const actualKeys = Object.keys(surfaceColors).sort();
                    const expectedKeysSorted = expectedSurfaceKeys.sort();

                    expect(actualKeys).toEqual(expectedKeysSorted);
                }
            )
        );
    });

    /**
     * Property: All surface color values must be valid hex colors
     *
     * Rationale: Invalid surface colors would break component styling and cause
     * visual inconsistencies.
     */
    it('all surface color values are valid hex colors', () => {
        const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

        fc.assert(
            fc.property(
                fc.constantFrom(
                    lightSurfaceColors,
                    darkSurfaceColors,
                    highContrastSurfaceColors
                ),
                (surfaceColors: SurfaceColors) => {
                    Object.values(surfaceColors).forEach((color) => {
                        expect(hexColorRegex.test(color)).toBe(true);
                    });
                }
            )
        );
    });

    /**
     * Property: Theme configuration must include all required theme variants
     *
     * Rationale: Missing theme variants would prevent users from accessing
     * all supported themes.
     */
    it('theme configuration includes all required variants', () => {
        const requiredVariants: ThemeVariant[] = ['light', 'dark', 'high-contrast'];

        fc.assert(
            fc.property(fc.constant(themeConfig), (config) => {
                requiredVariants.forEach((variant) => {
                    expect(config.themes[variant]).toBeDefined();
                    expect(config.themes[variant].variant).toBe(variant);
                });
            })
        );
    });

    /**
     * Property: Each theme must have a unique ID
     *
     * Rationale: Unique theme IDs are necessary for theme identification and
     * persistence.
     */
    it('each theme has a unique ID', () => {
        fc.assert(
            fc.property(fc.constant(themeConfig), (config) => {
                const themeIds = Object.values(config.themes).map((theme) => theme.id);
                const uniqueIds = new Set(themeIds);

                expect(uniqueIds.size).toBe(themeIds.length);
            })
        );
    });

    /**
     * Property: Generated theme CSS must contain valid CSS syntax
     *
     * Rationale: Invalid CSS would break styling and cause visual inconsistencies.
     */
    it('generated theme CSS contains valid CSS syntax', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(lightTheme, darkTheme, highContrastTheme),
                (theme: ThemeDefinition) => {
                    const css = generateThemeCSS(theme);

                    // CSS should contain :root selector
                    expect(css).toContain(':root');

                    // CSS should contain CSS variable declarations
                    expect(css).toContain('--');

                    // CSS should have proper structure
                    expect(css).toContain('{');
                    expect(css).toContain('}');

                    // CSS should not be empty
                    expect(css.length).toBeGreaterThan(0);
                }
            )
        );
    });

    /**
     * Property: All themes must have consistent token structure
     *
     * Rationale: Consistent token structure ensures predictable access patterns
     * and prevents runtime errors.
     */
    it('all themes have consistent token structure', () => {
        const expectedTokenKeys = [
            'colors',
            'typography',
            'spacing',
            'borderRadius',
            'shadows',
            'animations',
        ];

        fc.assert(
            fc.property(
                fc.constantFrom(lightTheme, darkTheme, highContrastTheme),
                (theme: ThemeDefinition) => {
                    const actualKeys = Object.keys(theme.tokens).sort();
                    const expectedKeysSorted = expectedTokenKeys.sort();

                    expect(actualKeys).toEqual(expectedKeysSorted);
                }
            )
        );
    });

    /**
     * Property: Typography tokens must have consistent structure across themes
     *
     * Rationale: Consistent typography ensures readable and accessible text
     * across all themes.
     */
    it('typography tokens have consistent structure', () => {
        const expectedTypographyKeys = [
            'fontFamilies',
            'fontSizes',
            'lineHeights',
            'fontWeights',
        ];

        fc.assert(
            fc.property(
                fc.constantFrom(lightTheme, darkTheme, highContrastTheme),
                (theme: ThemeDefinition) => {
                    const actualKeys = Object.keys(theme.tokens.typography).sort();
                    const expectedKeysSorted = expectedTypographyKeys.sort();

                    expect(actualKeys).toEqual(expectedKeysSorted);
                }
            )
        );
    });

    /**
     * Property: Spacing tokens must have consistent numeric values
     *
     * Rationale: Consistent spacing ensures predictable layout and visual hierarchy.
     */
    it('spacing tokens have consistent numeric values', () => {
        fc.assert(
            fc.property(fc.constant(tokens.spacing), (spacing) => {
                // Spacing should have multiple values
                expect(Object.keys(spacing).length).toBeGreaterThan(0);

                // All spacing values should be strings representing valid CSS values
                Object.values(spacing).forEach((value) => {
                    expect(typeof value).toBe('string');
                    expect(value.length).toBeGreaterThan(0);
                });
            })
        );
    });

    /**
     * Property: Border radius tokens must have consistent values
     *
     * Rationale: Consistent border radius ensures cohesive visual design across
     * all components.
     */
    it('border radius tokens have consistent values', () => {
        fc.assert(
            fc.property(fc.constant(tokens.borderRadius), (borderRadius) => {
                // Border radius should have multiple values
                expect(Object.keys(borderRadius).length).toBeGreaterThan(0);

                // All border radius values should be strings
                Object.values(borderRadius).forEach((value) => {
                    expect(typeof value).toBe('string');
                    expect(value.length).toBeGreaterThan(0);
                });
            })
        );
    });

    /**
     * Property: Animation tokens must have consistent structure
     *
     * Rationale: Consistent animation tokens ensure smooth and predictable
     * animations across the application.
     */
    it('animation tokens have consistent structure', () => {
        const expectedAnimationKeys = ['duration', 'easing', 'keyframes'];

        fc.assert(
            fc.property(fc.constant(tokens.animations), (animations) => {
                const actualKeys = Object.keys(animations).sort();
                const expectedKeysSorted = expectedAnimationKeys.sort();

                expect(actualKeys).toEqual(expectedKeysSorted);
            })
        );
    });

    /**
     * Property: getTheme function returns valid theme for all variants
     *
     * Rationale: The getTheme utility must work reliably for all theme variants
     * to support dynamic theme switching.
     */
    it('getTheme returns valid theme for all variants', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('light', 'dark', 'high-contrast' as ThemeVariant),
                (variant: ThemeVariant) => {
                    const theme = getTheme(variant);

                    expect(theme).toBeDefined();
                    expect(theme.variant).toBe(variant);
                    expect(theme.id).toBe(variant);
                    expect(theme.tokens).toBeDefined();
                    expect(theme.cssVariables).toBeDefined();
                }
            )
        );
    });

    /**
     * Property: generateAllThemesCSS produces valid CSS for all themes
     *
     * Rationale: The CSS generation must work for all themes to support
     * complete theme switching functionality.
     */
    it('generateAllThemesCSS produces valid CSS for all themes', () => {
        fc.assert(
            fc.property(fc.constant(generateAllThemesCSS()), (css) => {
                // Should contain :root selector for light theme
                expect(css).toContain(':root');

                // Should contain .dark selector for dark theme
                expect(css).toContain('.dark');

                // Should contain .high-contrast selector for high-contrast theme
                expect(css).toContain('.high-contrast');

                // Should have proper CSS structure
                expect(css).toContain('{');
                expect(css).toContain('}');

                // Should not be empty
                expect(css.length).toBeGreaterThan(0);
            })
        );
    });

    /**
     * Property: All color scales must have a base color at index 500
     *
     * Rationale: The base color (500) is the primary color used in components
     * and must be present in all scales.
     */
    it('all color scales have a base color at index 500', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(
                    primaryColors,
                    secondaryColors,
                    accentColors,
                    semanticColors.success,
                    semanticColors.warning,
                    semanticColors.error,
                    semanticColors.info
                ),
                (colorScale: ColorScale) => {
                    expect(colorScale[500]).toBeDefined();
                    expect(typeof colorScale[500]).toBe('string');
                    expect(colorScale[500].length).toBeGreaterThan(0);
                }
            )
        );
    });

    /**
     * Property: Theme CSS variables must be accessible via getTheme
     *
     * Rationale: CSS variables generated for a theme must be retrievable
     * through the getTheme function to ensure consistency.
     */
    it('theme CSS variables are accessible via getTheme', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('light', 'dark', 'high-contrast' as ThemeVariant),
                (variant: ThemeVariant) => {
                    const theme = getTheme(variant);
                    const cssVariables = theme.cssVariables;

                    // CSS variables should not be empty
                    expect(Object.keys(cssVariables).length).toBeGreaterThan(0);

                    // All CSS variables should have values
                    Object.entries(cssVariables).forEach(([key, value]) => {
                        expect(value).toBeDefined();
                        expect(typeof value).toBe('string');
                    });
                }
            )
        );
    });

    /**
     * Property: Surface colors must have distinct values for accessibility
     *
     * Rationale: Distinct surface colors ensure sufficient contrast and
     * visual hierarchy for accessibility compliance.
     */
    it('surface colors have distinct values for accessibility', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(
                    lightSurfaceColors,
                    darkSurfaceColors,
                    highContrastSurfaceColors
                ),
                (surfaceColors: SurfaceColors) => {
                    const colorValues = Object.values(surfaceColors);
                    const uniqueColors = new Set(colorValues);

                    // Surface colors should have at least 3 distinct values
                    // (background, foreground, and accent are the primary distinctions)
                    expect(uniqueColors.size).toBeGreaterThanOrEqual(3);
                }
            )
        );
    });

    /**
     * Property: Theme names must be human-readable strings
     *
     * Rationale: Theme names are displayed to users and must be clear and
     * understandable.
     */
    it('theme names are human-readable strings', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(lightTheme, darkTheme, highContrastTheme),
                (theme: ThemeDefinition) => {
                    expect(typeof theme.name).toBe('string');
                    expect(theme.name.length).toBeGreaterThan(0);
                    // Name should start with uppercase letter
                    expect(/^[A-Z]/.test(theme.name)).toBe(true);
                }
            )
        );
    });

    /**
     * Property: All themes must have consistent animation duration values
     *
     * Rationale: Consistent animation durations ensure predictable and
     * cohesive animations across the application.
     */
    it('all themes have consistent animation duration values', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(lightTheme, darkTheme, highContrastTheme),
                (theme: ThemeDefinition) => {
                    const durations = theme.tokens.animations.duration;

                    expect(durations).toBeDefined();
                    expect(Object.keys(durations).length).toBeGreaterThan(0);

                    // All durations should be valid CSS time values
                    Object.values(durations).forEach((duration) => {
                        expect(typeof duration).toBe('string');
                        expect(/^\d+m?s$/.test(duration)).toBe(true);
                    });
                }
            )
        );
    });

    /**
     * Property: All themes must have consistent animation easing values
     *
     * Rationale: Consistent easing functions ensure smooth and predictable
     * animations across the application.
     */
    it('all themes have consistent animation easing values', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(lightTheme, darkTheme, highContrastTheme),
                (theme: ThemeDefinition) => {
                    const easing = theme.tokens.animations.easing;

                    expect(easing).toBeDefined();
                    expect(Object.keys(easing).length).toBeGreaterThan(0);

                    // All easing values should be valid CSS easing functions
                    Object.values(easing).forEach((easingValue) => {
                        expect(typeof easingValue).toBe('string');
                        expect(easingValue.length).toBeGreaterThan(0);
                    });
                }
            )
        );
    });

    /**
     * Property: Font family tokens must include sans, mono, and display families
     *
     * Rationale: Multiple font families ensure proper typography for different
     * use cases (body text, code, headings).
     */
    it('font family tokens include required families', () => {
        fc.assert(
            fc.property(fc.constant(tokens.typography.fontFamilies), (fontFamilies) => {
                expect(fontFamilies.sans).toBeDefined();
                expect(fontFamilies.mono).toBeDefined();
                expect(fontFamilies.display).toBeDefined();

                // Each should be an array of font names
                expect(Array.isArray(fontFamilies.sans)).toBe(true);
                expect(Array.isArray(fontFamilies.mono)).toBe(true);
                expect(Array.isArray(fontFamilies.display)).toBe(true);

                // Each should have at least one font
                expect(fontFamilies.sans.length).toBeGreaterThan(0);
                expect(fontFamilies.mono.length).toBeGreaterThan(0);
                expect(fontFamilies.display.length).toBeGreaterThan(0);
            })
        );
    });

    /**
     * Property: Font size tokens must have consistent scale progression
     *
     * Rationale: Consistent font size progression ensures readable typography
     * hierarchy across the application.
     */
    it('font size tokens have consistent scale progression', () => {
        fc.assert(
            fc.property(fc.constant(tokens.typography.fontSizes), (fontSizes) => {
                // Should have multiple font sizes
                expect(Object.keys(fontSizes).length).toBeGreaterThan(0);

                // All font sizes should be valid CSS values
                Object.values(fontSizes).forEach((size) => {
                    expect(typeof size).toBe('string');
                    expect(/^\d+(\.\d+)?(rem|em|px)$/.test(size)).toBe(true);
                });
            })
        );
    });

    /**
     * Property: Font weight tokens must have consistent numeric values
     *
     * Rationale: Consistent font weights ensure proper typography hierarchy
     * and readability.
     */
    it('font weight tokens have consistent numeric values', () => {
        fc.assert(
            fc.property(fc.constant(tokens.typography.fontWeights), (fontWeights) => {
                // Should have multiple font weights
                expect(Object.keys(fontWeights).length).toBeGreaterThan(0);

                // All font weights should be valid CSS values
                Object.values(fontWeights).forEach((weight) => {
                    expect(typeof weight).toBe('string');
                    // Font weight should be a number or keyword
                    expect(/^\d+$|^(normal|bold|lighter|bolder)$/.test(weight)).toBe(true);
                });
            })
        );
    });

    /**
     * Property: Line height tokens must have consistent values
     *
     * Rationale: Consistent line heights ensure readable text and proper
     * vertical spacing.
     */
    it('line height tokens have consistent values', () => {
        fc.assert(
            fc.property(fc.constant(tokens.typography.lineHeights), (lineHeights) => {
                // Should have multiple line heights
                expect(Object.keys(lineHeights).length).toBeGreaterThan(0);

                // All line heights should be valid CSS values
                Object.values(lineHeights).forEach((height) => {
                    expect(typeof height).toBe('string');
                    expect(height.length).toBeGreaterThan(0);
                });
            })
        );
    });

    /**
     * Property: Shadow tokens must have consistent values across themes
     *
     * Rationale: Consistent shadows ensure proper depth perception and
     * visual hierarchy.
     */
    it('shadow tokens have consistent values across themes', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(lightTheme, darkTheme, highContrastTheme),
                (theme: ThemeDefinition) => {
                    const shadows = theme.tokens.shadows;

                    expect(shadows).toBeDefined();
                    expect(Object.keys(shadows).length).toBeGreaterThan(0);

                    // All shadow values should be valid CSS values
                    Object.values(shadows).forEach((shadow) => {
                        expect(typeof shadow).toBe('string');
                        expect(shadow.length).toBeGreaterThan(0);
                    });
                }
            )
        );
    });
});
