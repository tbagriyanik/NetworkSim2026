/**
 * Screen Reader Support System
 *
 * Provides utilities for screen reader optimization including:
 * - Live regions for dynamic updates
 * - Accessible announcements
 * - Screen reader optimized content
 * - ARIA live region management
 */

/**
 * Live region priority levels
 */
export type LiveRegionPriority = 'polite' | 'assertive';

/**
 * Configuration for live region announcements
 */
export interface LiveRegionConfig {
    priority: LiveRegionPriority;
    atomic?: boolean;
    relevant?: string;
}

/**
 * Screen reader announcement options
 */
export interface AnnouncementOptions {
    priority?: LiveRegionPriority;
    delay?: number;
    clear?: boolean;
}

/**
 * Live region manager for screen reader announcements
 */
class LiveRegionManager {
    private regions: Map<string, HTMLElement> = new Map();
    private announcements: Map<string, string> = new Map();

    /**
     * Create or get a live region
     */
    getOrCreateRegion(id: string, config: LiveRegionConfig): HTMLElement {
        if (this.regions.has(id)) {
            return this.regions.get(id)!;
        }

        const region = document.createElement('div');
        region.id = id;
        region.setAttribute('role', 'status');
        region.setAttribute('aria-live', config.priority);
        region.setAttribute('aria-atomic', config.atomic ? 'true' : 'false');

        if (config.relevant) {
            region.setAttribute('aria-relevant', config.relevant);
        }

        // Hide visually but keep accessible to screen readers
        region.style.position = 'absolute';
        region.style.left = '-10000px';
        region.style.width = '1px';
        region.style.height = '1px';
        region.style.overflow = 'hidden';

        document.body.appendChild(region);
        this.regions.set(id, region);

        return region;
    }

    /**
     * Announce a message to screen readers
     */
    announce(message: string, id: string = 'sr-announcements', config: LiveRegionConfig = { priority: 'polite' }): void {
        const region = this.getOrCreateRegion(id, config);
        region.textContent = message;
        this.announcements.set(id, message);
    }

    /**
     * Clear a live region
     */
    clear(id: string): void {
        const region = this.regions.get(id);
        if (region) {
            region.textContent = '';
            this.announcements.delete(id);
        }
    }

    /**
     * Destroy all live regions
     */
    destroy(): void {
        this.regions.forEach(region => {
            region.remove();
        });
        this.regions.clear();
        this.announcements.clear();
    }
}

// Global instance
let liveRegionManager: LiveRegionManager | null = null;

/**
 * Get or create the global live region manager
 */
function getManager(): LiveRegionManager {
    if (!liveRegionManager) {
        liveRegionManager = new LiveRegionManager();
    }
    return liveRegionManager;
}

/**
 * Announce a message to screen readers
 */
export function announceToScreenReader(
    message: string,
    options: AnnouncementOptions = {}
): void {
    if (typeof document === 'undefined') return;

    const { priority = 'polite', delay = 0, clear = false } = options;

    const announce = () => {
        const manager = getManager();
        const regionId = `sr-${priority}`;
        manager.announce(message, regionId, { priority });

        if (clear) {
            setTimeout(() => {
                manager.clear(regionId);
            }, 3000);
        }
    };

    if (delay > 0) {
        setTimeout(announce, delay);
    } else {
        announce();
    }
}

/**
 * Create a screen reader only text element
 */
export function createScreenReaderOnlyElement(text: string): HTMLElement {
    const element = document.createElement('span');
    element.className = 'sr-only';
    element.textContent = text;
    element.style.position = 'absolute';
    element.style.width = '1px';
    element.style.height = '1px';
    element.style.padding = '0';
    element.style.margin = '-1px';
    element.style.overflow = 'hidden';
    element.style.clip = 'rect(0, 0, 0, 0)';
    element.style.whiteSpace = 'nowrap';
    element.style.borderWidth = '0';
    return element;
}

/**
 * Add screen reader only text to an element
 */
export function addScreenReaderText(element: HTMLElement, text: string): void {
    const srElement = createScreenReaderOnlyElement(text);
    element.appendChild(srElement);
}

/**
 * Generate screen reader friendly label for a component
 */
export function generateScreenReaderLabel(
    label: string,
    context?: string,
    state?: string
): string {
    const parts = [label];

    if (context) {
        parts.push(`in ${context}`);
    }

    if (state) {
        parts.push(`${state}`);
    }

    return parts.join(', ');
}

/**
 * Create accessible status message
 */
export function createStatusMessage(
    action: string,
    result: 'success' | 'error' | 'warning' | 'info',
    details?: string
): string {
    const resultText = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Information',
    }[result];

    const parts = [`${resultText}: ${action}`];

    if (details) {
        parts.push(details);
    }

    return parts.join('. ');
}

/**
 * Announce a status update
 */
export function announceStatus(
    action: string,
    result: 'success' | 'error' | 'warning' | 'info',
    details?: string
): void {
    const message = createStatusMessage(action, result, details);
    const priority = result === 'error' ? 'assertive' : 'polite';
    announceToScreenReader(message, { priority, clear: true });
}

/**
 * Create accessible loading message
 */
export function createLoadingMessage(action: string): string {
    return `Loading ${action}...`;
}

/**
 * Announce loading state
 */
export function announceLoading(action: string): void {
    const message = createLoadingMessage(action);
    announceToScreenReader(message, { priority: 'polite' });
}

/**
 * Create accessible completion message
 */
export function createCompletionMessage(action: string): string {
    return `${action} completed`;
}

/**
 * Announce completion
 */
export function announceCompletion(action: string): void {
    const message = createCompletionMessage(action);
    announceToScreenReader(message, { priority: 'polite', clear: true });
}

/**
 * Cleanup screen reader resources
 */
export function cleanupScreenReader(): void {
    if (liveRegionManager) {
        liveRegionManager.destroy();
        liveRegionManager = null;
    }
}
