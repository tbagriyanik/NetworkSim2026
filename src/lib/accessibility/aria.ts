/**
 * ARIA Attribute Management System
 *
 * Provides utilities for managing ARIA attributes on interactive elements
 * to ensure WCAG 2.1 AA compliance and proper screen reader support.
 */

/**
 * ARIA roles for different component types
 */
export const ARIA_ROLES = {
    BUTTON: 'button',
    LINK: 'link',
    NAVIGATION: 'navigation',
    MAIN: 'main',
    REGION: 'region',
    DIALOG: 'dialog',
    ALERT: 'alert',
    ALERT_DIALOG: 'alertdialog',
    MENU: 'menu',
    MENUITEM: 'menuitem',
    MENUITEMCHECKBOX: 'menuitemcheckbox',
    MENUITEMRADIO: 'menuitemradio',
    TABLIST: 'tablist',
    TAB: 'tab',
    TABPANEL: 'tabpanel',
    LISTBOX: 'listbox',
    OPTION: 'option',
    COMBOBOX: 'combobox',
    SEARCHBOX: 'searchbox',
    SPINBUTTON: 'spinbutton',
    SLIDER: 'slider',
    PROGRESSBAR: 'progressbar',
    TOOLTIP: 'tooltip',
    TREE: 'tree',
    TREEITEM: 'treeitem',
    GRID: 'grid',
    GRIDCELL: 'gridcell',
    ROWHEADER: 'rowheader',
    COLUMNHEADER: 'columnheader',
    ROW: 'row',
    LIST: 'list',
    LISTITEM: 'listitem',
    GROUP: 'group',
    HEADING: 'heading',
    IMG: 'img',
    PRESENTATION: 'presentation',
    NONE: 'none',
} as const;

/**
 * ARIA live region politeness levels
 */
export const ARIA_LIVE_POLITE = {
    OFF: 'off',
    POLITE: 'polite',
    ASSERTIVE: 'assertive',
} as const;

/**
 * ARIA sort directions
 */
export const ARIA_SORT = {
    NONE: 'none',
    ASCENDING: 'ascending',
    DESCENDING: 'descending',
    OTHER: 'other',
} as const;

/**
 * Interface for ARIA attributes
 */
export interface ARIAAttributes {
    role?: string;
    ariaLabel?: string;
    ariaLabelledBy?: string;
    ariaDescribedBy?: string;
    ariaHidden?: boolean;
    ariaDisabled?: boolean;
    ariaPressed?: boolean;
    ariaChecked?: boolean | 'mixed';
    ariaSelected?: boolean;
    ariaExpanded?: boolean;
    ariaLevel?: number;
    ariaPosinset?: number;
    ariaSetsize?: number;
    ariaValuemin?: number;
    ariaValuemax?: number;
    ariaValuenow?: number;
    ariaValuetext?: string;
    ariaLive?: 'off' | 'polite' | 'assertive';
    ariaAtomic?: boolean;
    ariaRelevant?: string;
    ariaSort?: 'none' | 'ascending' | 'descending' | 'other';
    ariaColindex?: number;
    ariaRowindex?: number;
    ariaColspan?: number;
    ariaRowspan?: number;
    ariaControls?: string;
    ariaOwns?: string;
    ariaFlowto?: string;
    ariaHaspopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
    ariaModal?: boolean;
    ariaRequired?: boolean;
    ariaInvalid?: boolean;
    ariaReadonly?: boolean;
    ariaBusy?: boolean;
    ariaCurrentPage?: boolean;
    ariaCurrentStep?: boolean;
    ariaCurrentLocation?: boolean;
    ariaCurrentDate?: boolean;
    ariaCurrentTime?: boolean;
}

/**
 * Generates ARIA attributes for a button element
 */
export function generateButtonARIA(options: {
    label?: string;
    pressed?: boolean;
    disabled?: boolean;
    ariaDescribedBy?: string;
}): ARIAAttributes {
    return {
        role: ARIA_ROLES.BUTTON,
        ariaLabel: options.label,
        ariaPressed: options.pressed,
        ariaDisabled: options.disabled,
        ariaDescribedBy: options.ariaDescribedBy,
    };
}

/**
 * Generates ARIA attributes for a link element
 */
export function generateLinkARIA(options: {
    label?: string;
    current?: boolean;
    ariaDescribedBy?: string;
}): ARIAAttributes {
    return {
        role: ARIA_ROLES.LINK,
        ariaLabel: options.label,
        ariaCurrentPage: options.current,
        ariaDescribedBy: options.ariaDescribedBy,
    };
}

/**
 * Generates ARIA attributes for a navigation element
 */
export function generateNavigationARIA(options: {
    label?: string;
    ariaDescribedBy?: string;
}): ARIAAttributes {
    return {
        role: ARIA_ROLES.NAVIGATION,
        ariaLabel: options.label,
        ariaDescribedBy: options.ariaDescribedBy,
    };
}

/**
 * Generates ARIA attributes for a dialog element
 */
export function generateDialogARIA(options: {
    label?: string;
    labelledBy?: string;
    describedBy?: string;
    modal?: boolean;
}): ARIAAttributes {
    return {
        role: ARIA_ROLES.DIALOG,
        ariaLabel: options.label,
        ariaLabelledBy: options.labelledBy,
        ariaDescribedBy: options.describedBy,
        ariaModal: options.modal ?? true,
    };
}

/**
 * Generates ARIA attributes for an alert element
 */
export function generateAlertARIA(options: {
    label?: string;
    describedBy?: string;
    live?: 'polite' | 'assertive';
}): ARIAAttributes {
    return {
        role: ARIA_ROLES.ALERT,
        ariaLabel: options.label,
        ariaDescribedBy: options.describedBy,
        ariaLive: options.live ?? 'assertive',
        ariaAtomic: true,
    };
}

/**
 * Generates ARIA attributes for a tab element
 */
export function generateTabARIA(options: {
    selected?: boolean;
    disabled?: boolean;
    label?: string;
    panelId?: string;
}): ARIAAttributes {
    return {
        role: ARIA_ROLES.TAB,
        ariaSelected: options.selected,
        ariaDisabled: options.disabled,
        ariaLabel: options.label,
        ariaControls: options.panelId,
    };
}

/**
 * Generates ARIA attributes for a tab panel element
 */
export function generateTabPanelARIA(options: {
    label?: string;
    labelledBy?: string;
    hidden?: boolean;
}): ARIAAttributes {
    return {
        role: ARIA_ROLES.TABPANEL,
        ariaLabel: options.label,
        ariaLabelledBy: options.labelledBy,
        ariaHidden: options.hidden,
    };
}

/**
 * Generates ARIA attributes for a checkbox element
 */
export function generateCheckboxARIA(options: {
    checked?: boolean | 'mixed';
    disabled?: boolean;
    label?: string;
    describedBy?: string;
}): ARIAAttributes {
    return {
        ariaChecked: options.checked,
        ariaDisabled: options.disabled,
        ariaLabel: options.label,
        ariaDescribedBy: options.describedBy,
    };
}

/**
 * Generates ARIA attributes for a radio button element
 */
export function generateRadioARIA(options: {
    checked?: boolean;
    disabled?: boolean;
    label?: string;
    describedBy?: string;
}): ARIAAttributes {
    return {
        ariaChecked: options.checked,
        ariaDisabled: options.disabled,
        ariaLabel: options.label,
        ariaDescribedBy: options.describedBy,
    };
}

/**
 * Generates ARIA attributes for a slider element
 */
export function generateSliderARIA(options: {
    min?: number;
    max?: number;
    value?: number;
    valueText?: string;
    label?: string;
    disabled?: boolean;
    describedBy?: string;
}): ARIAAttributes {
    return {
        role: ARIA_ROLES.SLIDER,
        ariaValuemin: options.min,
        ariaValuemax: options.max,
        ariaValuenow: options.value,
        ariaValuetext: options.valueText,
        ariaLabel: options.label,
        ariaDisabled: options.disabled,
        ariaDescribedBy: options.describedBy,
    };
}

/**
 * Generates ARIA attributes for a combobox element
 */
export function generateComboboxARIA(options: {
    expanded?: boolean;
    disabled?: boolean;
    label?: string;
    describedBy?: string;
    owns?: string;
}): ARIAAttributes {
    return {
        role: ARIA_ROLES.COMBOBOX,
        ariaExpanded: options.expanded,
        ariaDisabled: options.disabled,
        ariaLabel: options.label,
        ariaDescribedBy: options.describedBy,
        ariaOwns: options.owns,
    };
}

/**
 * Generates ARIA attributes for a listbox element
 */
export function generateListboxARIA(options: {
    label?: string;
    describedBy?: string;
    disabled?: boolean;
}): ARIAAttributes {
    return {
        role: ARIA_ROLES.LISTBOX,
        ariaLabel: options.label,
        ariaDescribedBy: options.describedBy,
        ariaDisabled: options.disabled,
    };
}

/**
 * Generates ARIA attributes for a list item element
 */
export function generateListItemARIA(options: {
    selected?: boolean;
    disabled?: boolean;
    label?: string;
    posinset?: number;
    setsize?: number;
}): ARIAAttributes {
    return {
        role: ARIA_ROLES.OPTION,
        ariaSelected: options.selected,
        ariaDisabled: options.disabled,
        ariaLabel: options.label,
        ariaPosinset: options.posinset,
        ariaSetsize: options.setsize,
    };
}

/**
 * Generates ARIA attributes for a menu element
 */
export function generateMenuARIA(options: {
    label?: string;
    describedBy?: string;
}): ARIAAttributes {
    return {
        role: ARIA_ROLES.MENU,
        ariaLabel: options.label,
        ariaDescribedBy: options.describedBy,
    };
}

/**
 * Generates ARIA attributes for a menu item element
 */
export function generateMenuItemARIA(options: {
    label?: string;
    disabled?: boolean;
    describedBy?: string;
}): ARIAAttributes {
    return {
        role: ARIA_ROLES.MENUITEM,
        ariaLabel: options.label,
        ariaDisabled: options.disabled,
        ariaDescribedBy: options.describedBy,
    };
}

/**
 * Generates ARIA attributes for a progress bar element
 */
export function generateProgressBarARIA(options: {
    min?: number;
    max?: number;
    value?: number;
    valueText?: string;
    label?: string;
}): ARIAAttributes {
    return {
        role: ARIA_ROLES.PROGRESSBAR,
        ariaValuemin: options.min ?? 0,
        ariaValuemax: options.max ?? 100,
        ariaValuenow: options.value,
        ariaValuetext: options.valueText,
        ariaLabel: options.label,
    };
}

/**
 * Generates ARIA attributes for a tooltip element
 */
export function generateTooltipARIA(options: {
    label?: string;
    role?: 'tooltip' | 'status';
}): ARIAAttributes {
    return {
        role: options.role ?? ARIA_ROLES.TOOLTIP,
        ariaLabel: options.label,
    };
}

/**
 * Generates ARIA attributes for a heading element
 */
export function generateHeadingARIA(options: {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    label?: string;
}): ARIAAttributes {
    return {
        role: ARIA_ROLES.HEADING,
        ariaLevel: options.level,
        ariaLabel: options.label,
    };
}

/**
 * Generates ARIA attributes for a live region
 */
export function generateLiveRegionARIA(options: {
    polite?: 'polite' | 'assertive';
    atomic?: boolean;
    relevant?: string;
    label?: string;
}): ARIAAttributes {
    return {
        ariaLive: options.polite ?? 'polite',
        ariaAtomic: options.atomic ?? true,
        ariaRelevant: options.relevant ?? 'additions text',
        ariaLabel: options.label,
    };
}

/**
 * Converts ARIA attributes object to HTML attributes
 */
export function ariaAttributesToHTMLAttributes(
    ariaAttrs: ARIAAttributes
): Record<string, any> {
    const htmlAttrs: Record<string, any> = {};

    Object.entries(ariaAttrs).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            // Convert camelCase to kebab-case for ARIA attributes
            const htmlKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            htmlAttrs[htmlKey] = value;
        }
    });

    return htmlAttrs;
}
