export interface PerformanceMetrics {
    fcp: number | null; // First Contentful Paint
    lcp: number | null; // Largest Contentful Paint
    cls: number | null; // Cumulative Layout Shift
    fid: number | null; // First Input Delay
    ttfb: number | null; // Time to First Byte
    renderTime: number;
    interactionTime: number;
    memoryUsage: number | null;
}

export interface PerformanceThresholds {
    fcp: number; // milliseconds
    lcp: number; // milliseconds
    cls: number; // unitless
    fid: number; // milliseconds
    ttfb: number; // milliseconds
    renderTime: number; // milliseconds
    interactionTime: number; // milliseconds
}

export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
    fcp: 1800, // 1.8 seconds
    lcp: 2500, // 2.5 seconds
    cls: 0.1, // 0.1 unitless
    fid: 100, // 100 milliseconds
    ttfb: 600, // 600 milliseconds
    renderTime: 16.67, // 60 FPS = 16.67ms per frame
    interactionTime: 100, // 100 milliseconds
};

class PerformanceMonitor {
    private metrics: PerformanceMetrics = {
        fcp: null,
        lcp: null,
        cls: null,
        fid: null,
        ttfb: null,
        renderTime: 0,
        interactionTime: 0,
        memoryUsage: null,
    };

    private thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS;
    private observers: Map<string, PerformanceObserver> = new Map();
    private interactionStartTime: number | null = null;
    private renderStartTime: number | null = null;

    constructor(thresholds?: Partial<PerformanceThresholds>) {
        if (thresholds) {
            this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
        }
        this.initializeObservers();
    }

    private initializeObservers() {
        if (typeof window === 'undefined') return;

        // Observe Paint Timing (FCP)
        if ('PerformanceObserver' in window) {
            try {
                const paintObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.name === 'first-contentful-paint') {
                            this.metrics.fcp = entry.startTime;
                        }
                    }
                });
                paintObserver.observe({ entryTypes: ['paint'] });
                this.observers.set('paint', paintObserver);
            } catch (e) {
                console.warn('Paint observer not supported:', e);
            }

            // Observe Largest Contentful Paint (LCP)
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    if (entries.length > 0) {
                        this.metrics.lcp = entries[entries.length - 1].startTime;
                    }
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                this.observers.set('lcp', lcpObserver);
            } catch (e) {
                console.warn('LCP observer not supported:', e);
            }

            // Observe Layout Shift (CLS)
            try {
                let clsValue = 0;
                const clsObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!(entry as any).hadRecentInput) {
                            clsValue += (entry as any).value;
                            this.metrics.cls = clsValue;
                        }
                    }
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
                this.observers.set('cls', clsObserver);
            } catch (e) {
                console.warn('CLS observer not supported:', e);
            }

            // Observe First Input Delay (FID)
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.metrics.fid = (entry as any).processingDuration;
                    }
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
                this.observers.set('fid', fidObserver);
            } catch (e) {
                console.warn('FID observer not supported:', e);
            }
        }

        // Get TTFB from navigation timing
        if ('performance' in window && 'getEntriesByType' in window.performance) {
            const navigationTiming = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            if (navigationTiming) {
                this.metrics.ttfb = navigationTiming.responseStart - navigationTiming.fetchStart;
            }
        }
    }

    startInteractionTiming() {
        this.interactionStartTime = performance.now();
    }

    endInteractionTiming() {
        if (this.interactionStartTime !== null) {
            this.metrics.interactionTime = performance.now() - this.interactionStartTime;
            this.interactionStartTime = null;
        }
    }

    startRenderTiming() {
        this.renderStartTime = performance.now();
    }

    endRenderTiming() {
        if (this.renderStartTime !== null) {
            this.metrics.renderTime = performance.now() - this.renderStartTime;
            this.renderStartTime = null;
        }
    }

    updateMemoryUsage() {
        if ('memory' in performance) {
            this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
        }
    }

    getMetrics(): PerformanceMetrics {
        this.updateMemoryUsage();
        return { ...this.metrics };
    }

    checkThresholds(): { passed: boolean; violations: string[] } {
        const violations: string[] = [];

        if (this.metrics.fcp !== null && this.metrics.fcp > this.thresholds.fcp) {
            violations.push(`FCP exceeded: ${this.metrics.fcp.toFixed(2)}ms > ${this.thresholds.fcp}ms`);
        }

        if (this.metrics.lcp !== null && this.metrics.lcp > this.thresholds.lcp) {
            violations.push(`LCP exceeded: ${this.metrics.lcp.toFixed(2)}ms > ${this.thresholds.lcp}ms`);
        }

        if (this.metrics.cls !== null && this.metrics.cls > this.thresholds.cls) {
            violations.push(`CLS exceeded: ${this.metrics.cls.toFixed(3)} > ${this.thresholds.cls}`);
        }

        if (this.metrics.fid !== null && this.metrics.fid > this.thresholds.fid) {
            violations.push(`FID exceeded: ${this.metrics.fid.toFixed(2)}ms > ${this.thresholds.fid}ms`);
        }

        if (this.metrics.ttfb !== null && this.metrics.ttfb > this.thresholds.ttfb) {
            violations.push(`TTFB exceeded: ${this.metrics.ttfb.toFixed(2)}ms > ${this.thresholds.ttfb}ms`);
        }

        if (this.metrics.renderTime > this.thresholds.renderTime) {
            violations.push(`Render time exceeded: ${this.metrics.renderTime.toFixed(2)}ms > ${this.thresholds.renderTime}ms`);
        }

        if (this.metrics.interactionTime > this.thresholds.interactionTime) {
            violations.push(`Interaction time exceeded: ${this.metrics.interactionTime.toFixed(2)}ms > ${this.thresholds.interactionTime}ms`);
        }

        return {
            passed: violations.length === 0,
            violations,
        };
    }

    destroy() {
        this.observers.forEach((observer) => observer.disconnect());
        this.observers.clear();
    }
}

export const performanceMonitor = new PerformanceMonitor();

export function usePerformanceMonitoring() {
    return {
        getMetrics: () => performanceMonitor.getMetrics(),
        checkThresholds: () => performanceMonitor.checkThresholds(),
        startInteraction: () => performanceMonitor.startInteractionTiming(),
        endInteraction: () => performanceMonitor.endInteractionTiming(),
        startRender: () => performanceMonitor.startRenderTiming(),
        endRender: () => performanceMonitor.endRenderTiming(),
    };
}
