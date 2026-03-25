/**
 * Accessibility Enhancement System
 *
 * Comprehensive accessibility utilities for managing ARIA attributes,
 * keyboard navigation, and focus management across the application.
 */

// ARIA Attribute Management
export {
    ARIA_ROLES,
    ARIA_LIVE_POLITE,
    ARIA_SORT,
    type ARIAAttributes,
    generateButtonARIA,
    generateLinkARIA,
    generateNavigationARIA,
    generateDialogARIA,
    generateAlertARIA,
    generateTabARIA,
    generateTabPanelARIA,
    generateCheckboxARIA,
    generateRadioARIA,
    generateSliderARIA,
    generateComboboxARIA,
    generateListboxARIA,
    generateListItemARIA,
    generateMenuARIA,
    generateMenuItemARIA,
    generateProgressBarARIA,
    generateTooltipARIA,
    generateHeadingARIA,
    generateLiveRegionARIA,
    ariaAttributesToHTMLAttributes,
} from './aria';

// Keyboard Navigation Support
export {
    KEYBOARD_KEYS,
    KEYBOARD_MODIFIERS,
    KEYBOARD_SHORTCUTS,
    type KeyboardEventOptions,
    isKeyboardEventMatch,
    handleKeyboardEvent,
    getFocusableElements,
    getFirstFocusableElement,
    getLastFocusableElement,
    focusNextElement,
    focusPreviousElement,
    trapFocus,
    handleArrowKeyNavigation,
    handleCharacterKeyNavigation,
    type KeyboardShortcutHandler,
    registerKeyboardShortcuts,
    isKeyboardAccessible,
    makeKeyboardAccessible,
    removeKeyboardAccessibility,
    pushFocusTrap,
    popFocusTrap,
    getCurrentFocusTrap,
    clearFocusTraps,
} from './keyboard';

// Focus Management Utilities
export {
    type FocusManagementOptions,
    saveFocusedElement,
    restoreFocusedElement,
    getPreviouslyFocusedElement,
    clearPreviouslyFocusedElement,
    focusElement,
    isElementFocused,
    getFocusedElement,
    isFocusWithin,
    focusFirstElement,
    focusLastElement,
    FocusManager,
    FocusVisibilityManager,
    FocusRestorationContext,
    announceToScreenReader,
    createFocusOutline,
    removeFocusOutline,
} from './focus';

// Screen Reader Support
export {
    type LiveRegionPriority,
    type LiveRegionConfig,
    type AnnouncementOptions,
    announceToScreenReader as announceToScreenReaderSR,
    createScreenReaderOnlyElement,
    addScreenReaderText,
    generateScreenReaderLabel,
    createStatusMessage,
    announceStatus,
    createLoadingMessage,
    announceLoading,
    createCompletionMessage,
    announceCompletion,
    cleanupScreenReader,
} from './screen-reader';

// Accessibility Preferences
export {
    type AccessibilityPreferences,
    detectHighContrast,
    detectReducedMotion,
    loadAccessibilityPreferences,
    saveAccessibilityPreferences,
    applyHighContrast,
    applyReducedMotion,
    applyFontSizeScaling,
    applyFocusIndicators,
    applyAccessibilityPreferences,
    getReducedMotionDuration,
    getAnimationDuration,
    createReducedMotionCSS,
    createHighContrastCSS,
    createFontSizeScalingCSS,
    createEnhancedFocusIndicatorsCSS,
    injectAccessibilityCSS,
    setupAccessibilityListeners,
} from './preferences';
