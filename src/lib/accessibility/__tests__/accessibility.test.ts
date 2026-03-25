/**
 * Accessibility Enhancement System Tests
 *
 * Tests for ARIA attribute management, keyboard navigation, and focus management
 * Validates: Requirements 2.1, 2.2, 2.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import {
    generateButtonARIA,
    generateLinkARIA,
    generateDialogARIA,
    generateTabARIA,
    generateCheckboxARIA,
    generateSliderARIA,
    ariaAttributesToHTMLAttributes,
    ARIA_ROLES,
} from '../aria';
import {
    isKeyboardEventMatch,
    getFocusableElements,
    getFirstFocusableElement,
    getLastFocusableElement,
    focusNextElement,
    focusPreviousElement,
    trapFocus,
    handleArrowKeyNavigation,
    isKeyboardAccessible,
    makeKeyboardAccessible,
    KEYBOARD_KEYS,
} from '../keyboard';
import {
    saveFocusedElement,
    restoreFocusedElement,
    focusElement,
    isElementFocused,
    getFocusedElement,
    isFocusWithin,
    FocusManager,
    FocusVisibilityManager,
    announceToScreenReader,
} from '../focus';

describe('Accessibility Enhancement System', () => {
    describe('ARIA Attribute Management', () => {
        it('should generate button ARIA attributes', () => {
            const aria = generateButtonARIA({
                label: 'Save',
                disabled: false,
            });

            expect(aria.role).toBe(ARIA_ROLES.BUTTON);
            expect(aria.ariaLabel).toBe('Save');
            expect(aria.ariaDisabled).toBe(false);
        });

        it('should generate link ARIA attributes', () => {
            const aria = generateLinkARIA({
                label: 'Home',
                current: true,
            });

            expect(aria.role).toBe(ARIA_ROLES.LINK);
            expect(aria.ariaLabel).toBe('Home');
            expect(aria.ariaCurrentPage).toBe(true);
        });

        it('should generate dialog ARIA attributes', () => {
            const aria = generateDialogARIA({
                label: 'Confirm Action',
                modal: true,
            });

            expect(aria.role).toBe(ARIA_ROLES.DIALOG);
            expect(aria.ariaLabel).toBe('Confirm Action');
            expect(aria.ariaModal).toBe(true);
        });

        it('should generate tab ARIA attributes', () => {
            const aria = generateTabARIA({
                selected: true,
                label: 'Tab 1',
                panelId: 'panel-1',
            });

            expect(aria.role).toBe(ARIA_ROLES.TAB);
            expect(aria.ariaSelected).toBe(true);
            expect(aria.ariaControls).toBe('panel-1');
        });

        it('should generate checkbox ARIA attributes', () => {
            const aria = generateCheckboxARIA({
                checked: true,
                label: 'Accept terms',
            });

            expect(aria.ariaChecked).toBe(true);
            expect(aria.ariaLabel).toBe('Accept terms');
        });

        it('should generate slider ARIA attributes', () => {
            const aria = generateSliderARIA({
                min: 0,
                max: 100,
                value: 50,
                label: 'Volume',
            });

            expect(aria.role).toBe(ARIA_ROLES.SLIDER);
            expect(aria.ariaValuemin).toBe(0);
            expect(aria.ariaValuemax).toBe(100);
            expect(aria.ariaValuenow).toBe(50);
        });

        it('should convert ARIA attributes to HTML attributes', () => {
            const aria = generateButtonARIA({
                label: 'Click me',
                disabled: false,
            });

            const htmlAttrs = ariaAttributesToHTMLAttributes(aria);

            expect(htmlAttrs['role']).toBe('button');
            expect(htmlAttrs['aria-label']).toBe('Click me');
            expect(htmlAttrs['aria-disabled']).toBe(false);
        });

        // Property-based test for ARIA attributes
        it('should generate valid ARIA attributes for any label', () => {
            fc.assert(
                fc.property(fc.string(), (label) => {
                    const aria = generateButtonARIA({ label });
                    expect(aria.role).toBe(ARIA_ROLES.BUTTON);
                    expect(aria.ariaLabel).toBe(label);
                })
            );
        });

        // Property-based test for ARIA attribute conversion
        it('should convert all ARIA attributes to HTML attributes', () => {
            fc.assert(
                fc.property(fc.string(), (label) => {
                    const aria = generateButtonARIA({ label });
                    const htmlAttrs = ariaAttributesToHTMLAttributes(aria);

                    expect(htmlAttrs['role']).toBeDefined();
                    expect(htmlAttrs['aria-label']).toBe(label);
                })
            );
        });
    });

    describe('Keyboard Navigation Support', () => {
        let container: HTMLElement;

        beforeEach(() => {
            container = document.createElement('div');
            document.body.appendChild(container);
        });

        afterEach(() => {
            document.body.removeChild(container);
        });

        it('should detect keyboard event matches', () => {
            const event = new KeyboardEvent('keydown', {
                key: 'Enter',
                ctrlKey: false,
            });

            expect(isKeyboardEventMatch(event, { key: 'Enter' })).toBe(true);
            expect(isKeyboardEventMatch(event, { key: 'Space' })).toBe(false);
        });

        it('should detect keyboard event with modifiers', () => {
            const event = new KeyboardEvent('keydown', {
                key: 'S',
                ctrlKey: true,
            });

            expect(isKeyboardEventMatch(event, { key: 'S', ctrl: true })).toBe(true);
            expect(isKeyboardEventMatch(event, { key: 'S', ctrl: false })).toBe(false);
        });

        it('should get focusable elements', () => {
            container.innerHTML = `
        <button>Button 1</button>
        <input type="text" />
        <a href="#">Link</a>
        <div>Not focusable</div>
      `;

            const focusable = getFocusableElements(container);
            expect(focusable.length).toBe(3);
        });

        it('should get first focusable element', () => {
            container.innerHTML = `
        <button>Button 1</button>
        <button>Button 2</button>
      `;

            const first = getFirstFocusableElement(container);
            expect(first?.textContent).toBe('Button 1');
        });

        it('should get last focusable element', () => {
            container.innerHTML = `
        <button>Button 1</button>
        <button>Button 2</button>
      `;

            const last = getLastFocusableElement(container);
            expect(last?.textContent).toBe('Button 2');
        });

        it('should move focus to next element', () => {
            container.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
      `;

            const btn1 = container.querySelector('#btn1') as HTMLElement;
            btn1.focus();

            focusNextElement(container, btn1);

            const btn2 = container.querySelector('#btn2') as HTMLElement;
            expect(document.activeElement).toBe(btn2);
        });

        it('should move focus to previous element', () => {
            container.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
      `;

            const btn2 = container.querySelector('#btn2') as HTMLElement;
            btn2.focus();

            focusPreviousElement(container, btn2);

            const btn1 = container.querySelector('#btn1') as HTMLElement;
            expect(document.activeElement).toBe(btn1);
        });

        it('should trap focus within container', () => {
            container.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
      `;

            const btn2 = container.querySelector('#btn2') as HTMLElement;
            btn2.focus();

            const event = new KeyboardEvent('keydown', {
                key: 'Tab',
                shiftKey: false,
            });

            trapFocus(container, event);

            const btn1 = container.querySelector('#btn1') as HTMLElement;
            expect(document.activeElement).toBe(btn1);
        });

        it('should handle arrow key navigation', () => {
            container.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
        <button id="btn3">Button 3</button>
      `;

            const items = Array.from(container.querySelectorAll('button')) as HTMLElement[];

            const event = new KeyboardEvent('keydown', {
                key: 'ArrowDown',
            });

            const newIndex = handleArrowKeyNavigation(event, items, 0, { vertical: true });
            expect(newIndex).toBe(1);
        });

        it('should check if element is keyboard accessible', () => {
            container.innerHTML = `
        <button id="btn1">Button</button>
        <div id="div1">Not accessible</div>
        <div id="div2" tabindex="0">Accessible</div>
      `;

            const btn = container.querySelector('#btn1') as HTMLElement;
            const div1 = container.querySelector('#div1') as HTMLElement;
            const div2 = container.querySelector('#div2') as HTMLElement;

            expect(isKeyboardAccessible(btn)).toBe(true);
            expect(isKeyboardAccessible(div1)).toBe(false);
            expect(isKeyboardAccessible(div2)).toBe(true);
        });

        it('should make element keyboard accessible', () => {
            container.innerHTML = '<div id="div1">Not accessible</div>';

            const div = container.querySelector('#div1') as HTMLElement;
            makeKeyboardAccessible(div);

            expect(isKeyboardAccessible(div)).toBe(true);
            expect(div.getAttribute('tabindex')).toBe('0');
        });

        // Property-based test for keyboard event matching
        it('should match keyboard events with any key', () => {
            fc.assert(
                fc.property(fc.string(), (key) => {
                    const event = new KeyboardEvent('keydown', { key });
                    const matches = isKeyboardEventMatch(event, { key });
                    expect(matches).toBe(true);
                })
            );
        });

        // Property-based test for focusable elements
        it('should find all focusable elements regardless of order', () => {
            fc.assert(
                fc.property(fc.integer({ min: 1, max: 10 }), (count) => {
                    container.innerHTML = Array.from({ length: count })
                        .map((_, i) => `<button id="btn${i}">Button ${i}</button>`)
                        .join('');

                    const focusable = getFocusableElements(container);
                    expect(focusable.length).toBe(count);
                })
            );
        });
    });

    describe('Focus Management', () => {
        let container: HTMLElement;

        beforeEach(() => {
            container = document.createElement('div');
            document.body.appendChild(container);
        });

        afterEach(() => {
            document.body.removeChild(container);
        });

        it('should save and restore focused element', () => {
            container.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
      `;

            const btn1 = container.querySelector('#btn1') as HTMLElement;
            btn1.focus();

            saveFocusedElement();

            const btn2 = container.querySelector('#btn2') as HTMLElement;
            btn2.focus();

            expect(document.activeElement).toBe(btn2);

            restoreFocusedElement();

            expect(document.activeElement).toBe(btn1);
        });

        it('should focus element', () => {
            container.innerHTML = '<button id="btn1">Button 1</button>';

            const btn = container.querySelector('#btn1') as HTMLElement;
            focusElement(btn);

            expect(isElementFocused(btn)).toBe(true);
        });

        it('should check if element is focused', () => {
            container.innerHTML = '<button id="btn1">Button 1</button>';

            const btn = container.querySelector('#btn1') as HTMLElement;
            btn.focus();

            expect(isElementFocused(btn)).toBe(true);
        });

        it('should get focused element', () => {
            container.innerHTML = '<button id="btn1">Button 1</button>';

            const btn = container.querySelector('#btn1') as HTMLElement;
            btn.focus();

            expect(getFocusedElement()).toBe(btn);
        });

        it('should check if focus is within container', () => {
            container.innerHTML = '<button id="btn1">Button 1</button>';

            const btn = container.querySelector('#btn1') as HTMLElement;
            btn.focus();

            expect(isFocusWithin(container)).toBe(true);
        });

        it('should manage focus with FocusManager', () => {
            container.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
      `;

            const manager = new FocusManager(container);
            manager.activate();

            const btn1 = container.querySelector('#btn1') as HTMLElement;
            expect(document.activeElement).toBe(btn1);

            manager.destroy();
        });

        it('should trap focus with FocusManager', () => {
            container.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
      `;

            const manager = new FocusManager(container);
            manager.activate({ trapFocus: true });

            const btn2 = container.querySelector('#btn2') as HTMLElement;
            btn2.focus();

            const event = new KeyboardEvent('keydown', {
                key: 'Tab',
                shiftKey: false,
            });

            container.dispatchEvent(event);

            manager.destroy();
        });

        it('should announce to screen reader', () => {
            const spy = vi.spyOn(document.body, 'appendChild');

            announceToScreenReader('Test announcement');

            expect(spy).toHaveBeenCalled();

            spy.mockRestore();
        });

        // Property-based test for focus management
        it('should focus any valid element', () => {
            fc.assert(
                fc.property(fc.integer({ min: 1, max: 5 }), (count) => {
                    container.innerHTML = Array.from({ length: count })
                        .map((_, i) => `<button id="btn${i}">Button ${i}</button>`)
                        .join('');

                    const buttons = Array.from(container.querySelectorAll('button')) as HTMLElement[];
                    const randomButton = buttons[Math.floor(Math.random() * buttons.length)];

                    focusElement(randomButton);

                    expect(isElementFocused(randomButton)).toBe(true);
                })
            );
        });
    });

    describe('FocusVisibilityManager', () => {
        it('should create FocusVisibilityManager', () => {
            const manager = new FocusVisibilityManager();
            expect(manager).toBeDefined();
            manager.destroy();
        });

        it('should show focus indicators on keyboard', () => {
            const manager = new FocusVisibilityManager('focus-visible');

            const event = new KeyboardEvent('keydown', { key: 'Tab' });
            document.dispatchEvent(event);

            expect(document.documentElement.classList.contains('focus-visible')).toBe(true);

            manager.destroy();
        });
    });

    describe('Accessibility Compliance', () => {
        // Property: All interactive elements should have proper ARIA attributes
        it('should ensure all interactive elements have ARIA attributes', () => {
            fc.assert(
                fc.property(fc.string(), (label) => {
                    const aria = generateButtonARIA({ label });

                    expect(aria.role).toBeDefined();
                    expect(aria.ariaLabel).toBe(label);
                })
            );
        });

        // Property: Keyboard navigation should work for all focusable elements
        it('should support keyboard navigation for all focusable elements', () => {
            fc.assert(
                fc.property(fc.integer({ min: 1, max: 10 }), (count) => {
                    const container = document.createElement('div');
                    document.body.appendChild(container);

                    container.innerHTML = Array.from({ length: count })
                        .map((_, i) => `<button id="btn${i}">Button ${i}</button>`)
                        .join('');

                    const focusable = getFocusableElements(container);
                    expect(focusable.length).toBe(count);

                    document.body.removeChild(container);
                })
            );
        });

        // Property: Focus should be manageable and restorable
        it('should manage and restore focus correctly', () => {
            fc.assert(
                fc.property(fc.integer({ min: 1, max: 5 }), (count) => {
                    const container = document.createElement('div');
                    document.body.appendChild(container);

                    container.innerHTML = Array.from({ length: count })
                        .map((_, i) => `<button id="btn${i}">Button ${i}</button>`)
                        .join('');

                    const buttons = Array.from(container.querySelectorAll('button')) as HTMLElement[];
                    const randomButton = buttons[Math.floor(Math.random() * buttons.length)];

                    focusElement(randomButton);
                    saveFocusedElement();

                    const anotherButton = buttons[(buttons.indexOf(randomButton) + 1) % buttons.length];
                    focusElement(anotherButton);

                    restoreFocusedElement();

                    expect(isElementFocused(randomButton)).toBe(true);

                    document.body.removeChild(container);
                })
            );
        });
    });
});
