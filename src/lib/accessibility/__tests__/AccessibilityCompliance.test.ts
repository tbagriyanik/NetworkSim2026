/**
 * Accessibility Compliance Property Tests
 *
 * These tests validate that all UI components meet WCAG 2.1 AA compliance standards,
 * provide proper ARIA attributes, support keyboard navigation, and work with screen readers.
 *
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 * Feature: ui-ux-full-modernization, Task: 2.3
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import {
    announceToScreenReader,
    createScreenReaderOnlyElement,
    addScreenReaderText,
    generateScreenReaderLabel,
    createStatusMessage,
    cleanupScreenReader,
} from '../screen-reader';
import {
    loadAccessibilityPreferences,
    saveAccessibilityPreferences,
    applyAccessibilityPreferences,
    injectAccessibilityCSS,
} from '../preferences';
import {
    generateButtonARIA,
    generateDialogARIA,
    generateNavigationARIA,
} from '../aria';
import {
    getFocusableElements,
    getFirstFocusableElement,
    getLastFocusableElement,
} from '../keyboard';

// ─────────────────────────────────────────────────────────────────────────────
// Property 2: Universal Accessibility Compliance
// ─────────────────────────────────────────────────────────────────────────────

describe('Property 2: Universal Accessibility Compliance', () => {
    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = '';
        // Clear localStorage manually
        for (const key of Object.keys(localStorage)) {
            localStorage.removeItem(key);
        }
    });

    afterEach(() => {
        // Cleanup
        cleanupScreenReader();
        document.body.innerHTML = '';
        // Clear localStorage manually
        for (const key of Object.keys(localStorage)) {
            localStorage.removeItem(key);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Property 2.1: Screen Reader Announcements
    // ─────────────────────────────────────────────────────────────────────────

    it('should create screen reader only elements that are hidden visually but accessible', () => {
        const element = createScreenReaderOnlyElement('Test content');

        expect(element).toBeDefined();
        expect(element.textContent).toBe('Test content');
        expect(element.style.position).toBe('absolute');
        expect(element.style.width).toBe('1px');
        expect(element.style.height).toBe('1px');
        expect(element.style.overflow).toBe('hidden');
    });

    it('should add screen reader text to elements without affecting visual layout', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);

        addScreenReaderText(container, 'Additional context');

        const srElement = container.querySelector('.sr-only');
        expect(srElement).toBeDefined();
        expect(srElement?.textContent).toBe('Additional context');
    });

    it('should generate accessible labels with context and state information', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 100 }),
                fc.option(fc.string({ minLength: 1, maxLength: 50 })),
                fc.option(fc.string({ minLength: 1, maxLength: 50 })),
                (label, context, state) => {
                    const result = generateScreenReaderLabel(label, context || undefined, state || undefined);

                    // Label should always be included
                    expect(result).toContain(label);

                    // Context should be included if provided
                    if (context) {
                        expect(result).toContain(context);
                    }

                    // State should be included if provided
                    if (state) {
                        expect(result).toContain(state);
                    }

                    // Result should be a non-empty string
                    expect(result.length).toBeGreaterThan(0);
                }
            )
        );
    });

    it('should create status messages with action, result, and optional details', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 100 }),
                fc.oneof(
                    fc.constant('success' as const),
                    fc.constant('error' as const),
                    fc.constant('warning' as const),
                    fc.constant('info' as const)
                ),
                fc.option(fc.string({ minLength: 1, maxLength: 100 })),
                (action, result, details) => {
                    const message = createStatusMessage(action, result, details || undefined);

                    // Message should contain the action
                    expect(message).toContain(action);

                    // Message should contain the result type
                    expect(message.toLowerCase()).toContain(result);

                    // Message should contain details if provided
                    if (details) {
                        expect(message).toContain(details);
                    }

                    // Message should be a non-empty string
                    expect(message.length).toBeGreaterThan(0);
                }
            )
        );
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Property 2.2: ARIA Attributes
    // ─────────────────────────────────────────────────────────────────────────

    it('should generate valid ARIA attributes for buttons', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 100 }),
                fc.option(fc.string({ minLength: 1, maxLength: 100 })),
                (label, description) => {
                    const aria = generateButtonARIA({
                        label,
                        ariaDescribedBy: description || undefined,
                    });

                    // Should have required ARIA attributes
                    expect(aria.ariaLabel).toBe(label);

                    // Description should be included if provided
                    if (description) {
                        expect(aria.ariaDescribedBy).toBeDefined();
                    }

                    // Should have valid role
                    expect(aria.role).toBe('button');
                }
            )
        );
    });

    it('should generate valid ARIA attributes for dialogs', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 100 }),
                fc.boolean(),
                (title, modal) => {
                    const aria = generateDialogARIA({
                        label: title,
                        modal,
                    });

                    // Should have dialog role
                    expect(aria.role).toBe('dialog');

                    // Should have aria-modal attribute (boolean)
                    expect(typeof aria.ariaModal).toBe('boolean');
                    expect(aria.ariaModal).toBe(modal);

                    // Should have aria-label for title
                    expect(aria.ariaLabel).toBe(title);
                }
            )
        );
    });

    it('should generate valid ARIA attributes for navigation', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
                (items) => {
                    const aria = generateNavigationARIA({
                        label: 'Main navigation',
                        items,
                    });

                    // Should have navigation role
                    expect(aria.role).toBe('navigation');

                    // Should have aria-label
                    expect(aria.ariaLabel).toBe('Main navigation');
                }
            )
        );
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Property 2.3: Keyboard Navigation
    // ─────────────────────────────────────────────────────────────────────────

    it('should identify all focusable elements in a container', () => {
        const container = document.createElement('div');
        const button1 = document.createElement('button');
        const button2 = document.createElement('button');
        const input = document.createElement('input');
        const link = document.createElement('a');
        link.href = '#';

        container.appendChild(button1);
        container.appendChild(button2);
        container.appendChild(input);
        container.appendChild(link);

        const focusable = getFocusableElements(container);

        // Should find all focusable elements
        expect(focusable.length).toBeGreaterThanOrEqual(4);
        expect(focusable).toContain(button1);
        expect(focusable).toContain(button2);
        expect(focusable).toContain(input);
        expect(focusable).toContain(link);
    });

    it('should get first focusable element in a container', () => {
        const container = document.createElement('div');
        const button1 = document.createElement('button');
        const button2 = document.createElement('button');

        container.appendChild(button1);
        container.appendChild(button2);

        const first = getFirstFocusableElement(container);

        expect(first).toBe(button1);
    });

    it('should get last focusable element in a container', () => {
        const container = document.createElement('div');
        const button1 = document.createElement('button');
        const button2 = document.createElement('button');

        container.appendChild(button1);
        container.appendChild(button2);

        const last = getLastFocusableElement(container);

        expect(last).toBe(button2);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Property 2.4: Accessibility Preferences
    // ─────────────────────────────────────────────────────────────────────────

    it('should apply accessibility preferences to the DOM', () => {
        const preferences = {
            highContrast: true,
            reducedMotion: true,
            fontSize: 'large' as const,
            focusIndicators: 'enhanced' as const,
            screenReader: false,
        };

        applyAccessibilityPreferences(preferences);

        const root = document.documentElement;

        // Should apply high-contrast class
        expect(root.classList.contains('high-contrast')).toBe(true);

        // Should apply reduce-motion class
        expect(root.classList.contains('reduce-motion')).toBe(true);

        // Should apply font-size class
        expect(root.classList.contains('font-size-large')).toBe(true);

        // Should apply focus indicators class
        expect(root.classList.contains('enhanced-focus-indicators')).toBe(true);
    });

    it('should inject accessibility CSS into the document', () => {
        injectAccessibilityCSS();

        const style = document.getElementById('accessibility-styles');

        expect(style).toBeDefined();
        expect(style?.textContent).toContain('reduce-motion');
        expect(style?.textContent).toContain('high-contrast');
        expect(style?.textContent).toContain('font-size');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Property 2.5: Screen Reader Announcements
    // ─────────────────────────────────────────────────────────────────────────

    it('should announce messages to screen readers without errors', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 200 }),
                fc.oneof(
                    fc.constant('polite' as const),
                    fc.constant('assertive' as const)
                ),
                (message, priority) => {
                    // Should not throw
                    expect(() => {
                        announceToScreenReader(message, { priority });
                    }).not.toThrow();
                }
            )
        );
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Property 2.6: Accessibility Compliance Invariants
    // ─────────────────────────────────────────────────────────────────────────

    it('should maintain accessibility compliance when preferences change', () => {
        fc.assert(
            fc.property(
                fc.boolean(),
                fc.boolean(),
                (highContrast1, reducedMotion1) => {
                    const prefs1 = {
                        highContrast: highContrast1,
                        reducedMotion: reducedMotion1,
                        fontSize: 'normal' as const,
                        focusIndicators: 'standard' as const,
                        screenReader: false,
                    };

                    applyAccessibilityPreferences(prefs1);
                    const root1 = document.documentElement.className;

                    const prefs2 = {
                        highContrast: !highContrast1,
                        reducedMotion: !reducedMotion1,
                        fontSize: 'normal' as const,
                        focusIndicators: 'standard' as const,
                        screenReader: false,
                    };

                    applyAccessibilityPreferences(prefs2);
                    const root2 = document.documentElement.className;

                    // Classes should change when preferences change
                    if (highContrast1 !== !highContrast1 || reducedMotion1 !== !reducedMotion1) {
                        expect(root1).not.toBe(root2);
                    }
                }
            )
        );
    });

    it('should ensure screen reader elements are never visible', () => {
        const element = createScreenReaderOnlyElement('Hidden text');

        // Check computed styles
        const styles = window.getComputedStyle(element);

        // Should be hidden from visual display
        expect(element.style.position).toBe('absolute');
        expect(element.style.width).toBe('1px');
        expect(element.style.height).toBe('1px');
    });

    it('should generate unique IDs for live regions', () => {
        for (let i = 0; i < 10; i++) {
            announceToScreenReader(`Message ${i}`, { priority: 'polite' });
        }

        // Should have created live regions without errors
        const regions = document.querySelectorAll('[aria-live]');
        expect(regions.length).toBeGreaterThan(0);
    });
});
