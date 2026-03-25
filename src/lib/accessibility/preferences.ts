/**
 * Accessibility Preferences Management
 *
 * Manages user accessibility preferences including:
 * - High-contrast mode
 * - Reduced motion preferences
 * - Font size scaling
 * - Focus indicators
 */

/**
 * Accessibility preferences
 */
export interface AccessibilityPreferences {
    highContrast: boolean;
    reducedMotion: boolean;
    fontSize: 'normal' | 'large' | 'extra-large';
    focusIndicators: 'standard' | 'enhanced';
    screenReader: boolean;
}

/**
 * Default accessibility preferences
 */
const DEFAULT_PREFERENCES: AccessibilityPreferences = {
    highContrast: false,
    reducedMotion: false,
    fontSize: 'normal',
    focusIndicators: 'standard',
    screenReader: false,
};

const PREFERENCES_STORAGE_KEY = 'accessibility-preferences';

/**
 * Detect system high-contrast preference
 */
export function detectHighContrast(): boolean {
    if (typeof window === 'undefined') return false;

    try {
        return window.matchMedia('(prefers-contrast: more)').matches;
    } catch {
        return false;
    }
}

/**
 * Detect system reduced motion preference
 */
export function detectReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;

    try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
        return false;
    }
}

/**
 * Load accessibility preferences from storage
 */
export function loadAccessibilityPreferences(): AccessibilityPreferences {
    if (typeof localStorage === 'undefined') {
        return DEFAULT_PREFERENCES;
    }

    try {
        const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return { ...DEFAULT_PREFERENCES, ...parsed };
        }
    } catch {
        // Ignore parsing errors
    }

    return DEFAULT_PREFERENCES;
}

/**
 * Save accessibility preferences to storage
 */
export function saveAccessibilityPreferences(preferences: Partial<AccessibilityPreferences>): void {
    if (typeof localStorage === 'undefined') return;

    try {
        const current = loadAccessibilityPreferences();
        const updated = { ...current, ...preferences };
        localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
        // Ignore storage errors
    }
}

/**
 * Apply high-contrast theme
 */
export function applyHighContrast(enabled: boolean): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    if (enabled) {
        root.classList.add('high-contrast');
    } else {
        root.classList.remove('high-contrast');
    }
}

/**
 * Apply reduced motion preferences
 */
export function applyReducedMotion(enabled: boolean): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    if (enabled) {
        root.classList.add('reduce-motion');
    } else {
        root.classList.remove('reduce-motion');
    }
}

/**
 * Apply font size scaling
 */
export function applyFontSizeScaling(size: 'normal' | 'large' | 'extra-large'): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // Remove all font size classes
    root.classList.remove('font-size-normal', 'font-size-large', 'font-size-extra-large');

    // Add the appropriate class
    if (size !== 'normal') {
        root.classList.add(`font-size-${size}`);
    }
}

/**
 * Apply focus indicator style
 */
export function applyFocusIndicators(style: 'standard' | 'enhanced'): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    if (style === 'enhanced') {
        root.classList.add('enhanced-focus-indicators');
    } else {
        root.classList.remove('enhanced-focus-indicators');
    }
}

/**
 * Apply all accessibility preferences
 */
export function applyAccessibilityPreferences(preferences: AccessibilityPreferences): void {
    applyHighContrast(preferences.highContrast);
    applyReducedMotion(preferences.reducedMotion);
    applyFontSizeScaling(preferences.fontSize);
    applyFocusIndicators(preferences.focusIndicators);
}

/**
 * Get CSS variable for reduced motion
 */
export function getReducedMotionDuration(normalDuration: number): number {
    if (typeof window === 'undefined') return normalDuration;

    const prefersReducedMotion = detectReducedMotion();
    return prefersReducedMotion ? 0 : normalDuration;
}

/**
 * Get CSS variable for animations
 */
export function getAnimationDuration(normalDuration: string): string {
    if (typeof window === 'undefined') return normalDuration;

    const prefersReducedMotion = detectReducedMotion();
    return prefersReducedMotion ? '0ms' : normalDuration;
}

/**
 * Create CSS for reduced motion
 */
export function createReducedMotionCSS(): string {
    return `
    .reduce-motion,
    .reduce-motion * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  `;
}

/**
 * Create CSS for high-contrast mode
 */
export function createHighContrastCSS(): string {
    return `
    .high-contrast {
      --color-text: #000;
      --color-background: #fff;
      --color-border: #000;
      --color-focus: #000;
      --color-primary: #0000ee;
      --color-secondary: #ee0000;
    }

    .high-contrast * {
      border-width: 2px !important;
      color: var(--color-text) !important;
      background-color: var(--color-background) !important;
    }

    .high-contrast *:focus {
      outline: 3px solid var(--color-focus) !important;
      outline-offset: 2px !important;
    }
  `;
}

/**
 * Create CSS for font size scaling
 */
export function createFontSizeScalingCSS(): string {
    return `
    .font-size-large {
      font-size: 1.125rem;
    }

    .font-size-large * {
      font-size: 1.125em;
    }

    .font-size-extra-large {
      font-size: 1.25rem;
    }

    .font-size-extra-large * {
      font-size: 1.25em;
    }
  `;
}

/**
 * Create CSS for enhanced focus indicators
 */
export function createEnhancedFocusIndicatorsCSS(): string {
    return `
    .enhanced-focus-indicators *:focus {
      outline: 3px solid #4f46e5 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1) !important;
    }

    .enhanced-focus-indicators *:focus-visible {
      outline: 3px solid #4f46e5 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1) !important;
    }
  `;
}

/**
 * Inject accessibility CSS into the document
 */
export function injectAccessibilityCSS(): void {
    if (typeof document === 'undefined') return;

    const styleId = 'accessibility-styles';

    // Check if styles already injected
    if (document.getElementById(styleId)) {
        return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
    ${createReducedMotionCSS()}
    ${createHighContrastCSS()}
    ${createFontSizeScalingCSS()}
    ${createEnhancedFocusIndicatorsCSS()}
  `;

    document.head.appendChild(style);
}

/**
 * Setup system preference listeners
 */
export function setupAccessibilityListeners(
    onHighContrastChange?: (enabled: boolean) => void,
    onReducedMotionChange?: (enabled: boolean) => void
): () => void {
    if (typeof window === 'undefined') return () => { };

    const unsubscribers: Array<() => void> = [];

    try {
        const highContrastQuery = window.matchMedia('(prefers-contrast: more)');
        const handleHighContrastChange = (e: MediaQueryListEvent | MediaQueryList) => {
            onHighContrastChange?.(e.matches);
        };

        highContrastQuery.addEventListener('change', handleHighContrastChange);
        unsubscribers.push(() => highContrastQuery.removeEventListener('change', handleHighContrastChange));
    } catch {
        // High contrast detection not supported
    }

    try {
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handleReducedMotionChange = (e: MediaQueryListEvent | MediaQueryList) => {
            onReducedMotionChange?.(e.matches);
        };

        reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
        unsubscribers.push(() => reducedMotionQuery.removeEventListener('change', handleReducedMotionChange));
    } catch {
        // Reduced motion detection not supported
    }

    return () => {
        unsubscribers.forEach(unsub => unsub());
    };
}
