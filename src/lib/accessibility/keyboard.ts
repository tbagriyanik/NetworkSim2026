/**
 * Keyboard Navigation Support System
 *
 * Provides utilities for implementing keyboard navigation patterns
 * including focus management, keyboard event handling, and navigation shortcuts.
 */

/**
 * Keyboard event keys
 */
export const KEYBOARD_KEYS = {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    TAB: 'Tab',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown',
    DELETE: 'Delete',
    BACKSPACE: 'Backspace',
    A: 'a',
    C: 'c',
    V: 'v',
    X: 'x',
    Z: 'z',
} as const;

/**
 * Keyboard modifier keys
 */
export const KEYBOARD_MODIFIERS = {
    CTRL: 'ctrlKey',
    SHIFT: 'shiftKey',
    ALT: 'altKey',
    META: 'metaKey',
} as const;

/**
 * Common keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
    SAVE: { key: 'S', ctrl: true },
    UNDO: { key: 'Z', ctrl: true },
    REDO: { key: 'Z', ctrl: true, shift: true },
    COPY: { key: 'C', ctrl: true },
    PASTE: { key: 'V', ctrl: true },
    CUT: { key: 'X', ctrl: true },
    SELECT_ALL: { key: 'A', ctrl: true },
    DELETE: { key: 'Delete' },
    ESCAPE: { key: 'Escape' },
} as const;

/**
 * Interface for keyboard event options
 */
export interface KeyboardEventOptions {
    key?: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    preventDefault?: boolean;
    stopPropagation?: boolean;
}

/**
 * Checks if a keyboard event matches the specified options
 */
export function isKeyboardEventMatch(
    event: KeyboardEvent,
    options: KeyboardEventOptions
): boolean {
    const keyMatches = !options.key || event.key === options.key || event.key.toLowerCase() === options.key.toLowerCase();
    const ctrlMatches = options.ctrl === undefined || event.ctrlKey === options.ctrl;
    const shiftMatches = options.shift === undefined || event.shiftKey === options.shift;
    const altMatches = options.alt === undefined || event.altKey === options.alt;
    const metaMatches = options.meta === undefined || event.metaKey === options.meta;

    return keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches;
}

/**
 * Handles keyboard event with optional preventDefault and stopPropagation
 */
export function handleKeyboardEvent(
    event: KeyboardEvent,
    options: KeyboardEventOptions,
    callback: (event: KeyboardEvent) => void
): void {
    if (isKeyboardEventMatch(event, options)) {
        if (options.preventDefault !== false) {
            event.preventDefault();
        }
        if (options.stopPropagation) {
            event.stopPropagation();
        }
        callback(event);
    }
}

/**
 * Gets all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        'audio[controls]',
        'video[controls]',
    ].join(',');

    return Array.from(container.querySelectorAll(focusableSelectors)).filter(
        (element) => {
            const style = window.getComputedStyle(element);
            return style.display !== 'none' && style.visibility !== 'hidden';
        }
    ) as HTMLElement[];
}

/**
 * Gets the first focusable element within a container
 */
export function getFirstFocusableElement(container: HTMLElement): HTMLElement | null {
    const focusableElements = getFocusableElements(container);
    return focusableElements.length > 0 ? focusableElements[0] : null;
}

/**
 * Gets the last focusable element within a container
 */
export function getLastFocusableElement(container: HTMLElement): HTMLElement | null {
    const focusableElements = getFocusableElements(container);
    return focusableElements.length > 0 ? focusableElements[focusableElements.length - 1] : null;
}

/**
 * Moves focus to the next focusable element
 */
export function focusNextElement(container: HTMLElement, currentElement?: HTMLElement): void {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length === 0) return;

    let nextIndex = 0;
    if (currentElement) {
        const currentIndex = focusableElements.indexOf(currentElement);
        nextIndex = (currentIndex + 1) % focusableElements.length;
    }

    focusableElements[nextIndex]?.focus();
}

/**
 * Moves focus to the previous focusable element
 */
export function focusPreviousElement(container: HTMLElement, currentElement?: HTMLElement): void {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length === 0) return;

    let prevIndex = focusableElements.length - 1;
    if (currentElement) {
        const currentIndex = focusableElements.indexOf(currentElement);
        prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
    }

    focusableElements[prevIndex]?.focus();
}

/**
 * Traps focus within a container (for modals, dialogs, etc.)
 */
export function trapFocus(
    container: HTMLElement,
    event: KeyboardEvent
): void {
    if (event.key !== KEYBOARD_KEYS.TAB) return;

    const focusableElements = getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement;

    if (event.shiftKey) {
        // Shift + Tab
        if (activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        }
    } else {
        // Tab
        if (activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    }
}

/**
 * Handles arrow key navigation for list-like components
 */
export function handleArrowKeyNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    options?: {
        vertical?: boolean;
        horizontal?: boolean;
        wrap?: boolean;
    }
): number {
    const { vertical = true, horizontal = false, wrap = true } = options || {};
    let newIndex = currentIndex;

    if (vertical && (event.key === KEYBOARD_KEYS.ARROW_DOWN || event.key === KEYBOARD_KEYS.ARROW_UP)) {
        event.preventDefault();
        if (event.key === KEYBOARD_KEYS.ARROW_DOWN) {
            newIndex = wrap ? (currentIndex + 1) % items.length : Math.min(currentIndex + 1, items.length - 1);
        } else {
            newIndex = wrap ? (currentIndex - 1 + items.length) % items.length : Math.max(currentIndex - 1, 0);
        }
    }

    if (horizontal && (event.key === KEYBOARD_KEYS.ARROW_RIGHT || event.key === KEYBOARD_KEYS.ARROW_LEFT)) {
        event.preventDefault();
        if (event.key === KEYBOARD_KEYS.ARROW_RIGHT) {
            newIndex = wrap ? (currentIndex + 1) % items.length : Math.min(currentIndex + 1, items.length - 1);
        } else {
            newIndex = wrap ? (currentIndex - 1 + items.length) % items.length : Math.max(currentIndex - 1, 0);
        }
    }

    if (event.key === KEYBOARD_KEYS.HOME) {
        event.preventDefault();
        newIndex = 0;
    }

    if (event.key === KEYBOARD_KEYS.END) {
        event.preventDefault();
        newIndex = items.length - 1;
    }

    if (newIndex !== currentIndex) {
        items[newIndex]?.focus();
    }

    return newIndex;
}

/**
 * Handles character key navigation (first letter navigation)
 */
export function handleCharacterKeyNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    getItemLabel: (item: HTMLElement) => string,
    currentIndex: number
): number {
    const char = event.key.toLowerCase();
    if (!/^[a-z0-9]$/.test(char)) return currentIndex;

    event.preventDefault();

    // Start searching from the next item
    let searchIndex = (currentIndex + 1) % items.length;
    let attempts = 0;

    while (attempts < items.length) {
        const label = getItemLabel(items[searchIndex]).toLowerCase();
        if (label.startsWith(char)) {
            items[searchIndex]?.focus();
            return searchIndex;
        }
        searchIndex = (searchIndex + 1) % items.length;
        attempts++;
    }

    return currentIndex;
}

/**
 * Interface for keyboard shortcut handler
 */
export interface KeyboardShortcutHandler {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    handler: (event: KeyboardEvent) => void;
}

/**
 * Registers keyboard shortcuts on an element
 */
export function registerKeyboardShortcuts(
    element: HTMLElement,
    shortcuts: KeyboardShortcutHandler[]
): () => void {
    const handleKeyDown = (event: KeyboardEvent) => {
        for (const shortcut of shortcuts) {
            if (isKeyboardEventMatch(event, shortcut)) {
                event.preventDefault();
                shortcut.handler(event);
                break;
            }
        }
    };

    element.addEventListener('keydown', handleKeyDown);

    return () => {
        element.removeEventListener('keydown', handleKeyDown);
    };
}

/**
 * Checks if an element is keyboard accessible
 */
export function isKeyboardAccessible(element: HTMLElement): boolean {
    const tabindex = element.getAttribute('tabindex');
    const isNaturallyFocusable = [
        'A',
        'BUTTON',
        'INPUT',
        'SELECT',
        'TEXTAREA',
        'AUDIO',
        'VIDEO',
    ].includes(element.tagName);

    if (isNaturallyFocusable) {
        return !element.hasAttribute('disabled');
    }

    if (tabindex !== null) {
        const tabindexValue = parseInt(tabindex, 10);
        return tabindexValue >= 0;
    }

    return false;
}

/**
 * Makes an element keyboard accessible
 */
export function makeKeyboardAccessible(element: HTMLElement, tabindex: number = 0): void {
    if (!isKeyboardAccessible(element)) {
        element.setAttribute('tabindex', tabindex.toString());
    }
}

/**
 * Removes keyboard accessibility from an element
 */
export function removeKeyboardAccessibility(element: HTMLElement): void {
    element.removeAttribute('tabindex');
}

/**
 * Gets the current focus trap stack
 */
let focusTrapStack: HTMLElement[] = [];

/**
 * Pushes a focus trap onto the stack
 */
export function pushFocusTrap(element: HTMLElement): void {
    focusTrapStack.push(element);
}

/**
 * Pops a focus trap from the stack
 */
export function popFocusTrap(): HTMLElement | undefined {
    return focusTrapStack.pop();
}

/**
 * Gets the current focus trap
 */
export function getCurrentFocusTrap(): HTMLElement | undefined {
    return focusTrapStack[focusTrapStack.length - 1];
}

/**
 * Clears all focus traps
 */
export function clearFocusTraps(): void {
    focusTrapStack = [];
}
