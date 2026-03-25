/**
 * Focus Management Utilities
 *
 * Provides utilities for managing focus within the application,
 * including focus restoration, focus trapping, and focus visibility.
 */

/**
 * Interface for focus management options
 */
export interface FocusManagementOptions {
    restoreFocus?: boolean;
    trapFocus?: boolean;
    initialFocus?: HTMLElement | (() => HTMLElement | null);
    returnFocus?: HTMLElement | (() => HTMLElement | null);
}

/**
 * Stores the previously focused element
 */
let previouslyFocusedElement: HTMLElement | null = null;

/**
 * Saves the currently focused element
 */
export function saveFocusedElement(): void {
    previouslyFocusedElement = document.activeElement as HTMLElement;
}

/**
 * Restores focus to the previously focused element
 */
export function restoreFocusedElement(): void {
    if (previouslyFocusedElement && previouslyFocusedElement !== document.body) {
        previouslyFocusedElement.focus();
    }
}

/**
 * Gets the previously focused element
 */
export function getPreviouslyFocusedElement(): HTMLElement | null {
    return previouslyFocusedElement;
}

/**
 * Clears the previously focused element
 */
export function clearPreviouslyFocusedElement(): void {
    previouslyFocusedElement = null;
}

/**
 * Focuses an element with optional scroll behavior
 */
export function focusElement(
    element: HTMLElement | null,
    options?: {
        preventScroll?: boolean;
        smooth?: boolean;
    }
): void {
    if (!element) return;

    try {
        element.focus({ preventScroll: options?.preventScroll });

        if (options?.smooth && element.scrollIntoView) {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    } catch (error) {
        // Focus may fail in some contexts
        console.warn('Failed to focus element:', error);
    }
}

/**
 * Checks if an element is currently focused
 */
export function isElementFocused(element: HTMLElement): boolean {
    return document.activeElement === element;
}

/**
 * Gets the currently focused element
 */
export function getFocusedElement(): HTMLElement | null {
    return document.activeElement as HTMLElement;
}

/**
 * Checks if focus is within a container
 */
export function isFocusWithin(container: HTMLElement): boolean {
    return container.contains(document.activeElement);
}

/**
 * Moves focus to the first focusable element in a container
 */
export function focusFirstElement(container: HTMLElement): void {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
        focusElement(focusableElements[0]);
    }
}

/**
 * Moves focus to the last focusable element in a container
 */
export function focusLastElement(container: HTMLElement): void {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
        focusElement(focusableElements[focusableElements.length - 1]);
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
 * Manages focus for a modal or dialog
 */
export class FocusManager {
    private container: HTMLElement;
    private previouslyFocusedElement: HTMLElement | null = null;
    private focusTrapActive: boolean = false;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    /**
     * Activates focus management for the container
     */
    activate(options?: FocusManagementOptions): void {
        // Save the currently focused element
        this.previouslyFocusedElement = document.activeElement as HTMLElement;

        // Move focus to initial element
        if (options?.initialFocus) {
            const initialElement =
                typeof options.initialFocus === 'function'
                    ? options.initialFocus()
                    : options.initialFocus;
            if (initialElement) {
                focusElement(initialElement);
            } else {
                focusFirstElement(this.container);
            }
        } else {
            focusFirstElement(this.container);
        }

        // Setup focus trap if requested
        if (options?.trapFocus) {
            this.setupFocusTrap();
        }
    }

    /**
     * Deactivates focus management for the container
     */
    deactivate(options?: FocusManagementOptions): void {
        // Remove focus trap if active
        if (this.focusTrapActive) {
            this.removeFocusTrap();
        }

        // Restore focus if requested
        if (options?.restoreFocus && this.previouslyFocusedElement) {
            focusElement(this.previouslyFocusedElement);
        } else if (options?.returnFocus) {
            const returnElement =
                typeof options.returnFocus === 'function'
                    ? options.returnFocus()
                    : options.returnFocus;
            if (returnElement) {
                focusElement(returnElement);
            }
        }

        this.previouslyFocusedElement = null;
    }

    /**
     * Sets up focus trap for the container
     */
    private setupFocusTrap(): void {
        this.focusTrapActive = true;
        this.container.addEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Removes focus trap from the container
     */
    private removeFocusTrap(): void {
        this.focusTrapActive = false;
        this.container.removeEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Handles keydown events for focus trapping
     */
    private handleKeyDown = (event: KeyboardEvent): void => {
        if (event.key !== 'Tab') return;

        const focusableElements = getFocusableElements(this.container);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement as HTMLElement;

        if (event.shiftKey) {
            // Shift + Tab
            if (activeElement === firstElement) {
                event.preventDefault();
                focusElement(lastElement);
            }
        } else {
            // Tab
            if (activeElement === lastElement) {
                event.preventDefault();
                focusElement(firstElement);
            }
        }
    };

    /**
     * Cleans up the focus manager
     */
    destroy(): void {
        this.removeFocusTrap();
        this.previouslyFocusedElement = null;
    }
}

/**
 * Focus visibility manager for showing/hiding focus indicators
 */
export class FocusVisibilityManager {
    private showFocusIndicators: boolean = false;
    private focusIndicatorClass: string = 'focus-visible';

    constructor(focusIndicatorClass?: string) {
        if (focusIndicatorClass) {
            this.focusIndicatorClass = focusIndicatorClass;
        }
        this.setupListeners();
    }

    /**
     * Sets up event listeners for focus visibility
     */
    private setupListeners(): void {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('mousedown', this.handleMouseDown);
        document.addEventListener('touchstart', this.handleTouchStart);
    }

    /**
     * Handles keydown events to show focus indicators
     */
    private handleKeyDown = (): void => {
        if (!this.showFocusIndicators) {
            this.showFocusIndicators = true;
            document.documentElement.classList.add(this.focusIndicatorClass);
        }
    };

    /**
     * Handles mousedown events to hide focus indicators
     */
    private handleMouseDown = (): void => {
        if (this.showFocusIndicators) {
            this.showFocusIndicators = false;
            document.documentElement.classList.remove(this.focusIndicatorClass);
        }
    };

    /**
     * Handles touchstart events to hide focus indicators
     */
    private handleTouchStart = (): void => {
        if (this.showFocusIndicators) {
            this.showFocusIndicators = false;
            document.documentElement.classList.remove(this.focusIndicatorClass);
        }
    };

    /**
     * Cleans up the focus visibility manager
     */
    destroy(): void {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('touchstart', this.handleTouchStart);
        document.documentElement.classList.remove(this.focusIndicatorClass);
    }
}

/**
 * Focus restoration context for managing focus across navigation
 */
export class FocusRestorationContext {
    private focusMap: Map<string, HTMLElement | null> = new Map();

    /**
     * Saves focus for a route
     */
    saveFocus(route: string): void {
        this.focusMap.set(route, document.activeElement as HTMLElement);
    }

    /**
     * Restores focus for a route
     */
    restoreFocus(route: string): void {
        const element = this.focusMap.get(route);
        if (element) {
            focusElement(element);
        }
    }

    /**
     * Clears focus for a route
     */
    clearFocus(route: string): void {
        this.focusMap.delete(route);
    }

    /**
     * Clears all saved focus positions
     */
    clear(): void {
        this.focusMap.clear();
    }
}

/**
 * Announces a message to screen readers
 */
export function announceToScreenReader(
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
        announcement.remove();
    }, 1000);
}

/**
 * Creates a focus outline for an element
 */
export function createFocusOutline(
    element: HTMLElement,
    options?: {
        color?: string;
        width?: number;
        offset?: number;
    }
): void {
    const { color = '#4F46E5', width = 2, offset = 2 } = options || {};

    element.style.outline = `${width}px solid ${color}`;
    element.style.outlineOffset = `${offset}px`;
}

/**
 * Removes focus outline from an element
 */
export function removeFocusOutline(element: HTMLElement): void {
    element.style.outline = '';
    element.style.outlineOffset = '';
}
