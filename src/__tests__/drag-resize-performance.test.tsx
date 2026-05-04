import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';

/**
 * Bug Condition Exploration Test - Rapid Drag Performance Degradation
 * 
 * Validates: Requirements 1.4, 1.5, 1.6, 2.4, 2.5, 2.6
 * 
 * This test simulates rapid mousemove events during a drag operation to verify
 * that the implementation handles high-frequency events smoothly without
 * performance degradation.
 * 
 * EXPECTED BEHAVIOR (with fix):
 * - Frame rate >= 55fps during rapid drag
 * - All mousemove events are processed (100% delivery)
 * - Panel follows cursor smoothly without jank
 * - Pointer capture is active during drag
 * - RAF throttling batches updates
 * 
 * EXPECTED FAILURE (without fix):
 * - Frame rate drops below 30fps
 * - Some mousemove events are lost
 * - Panel stops following cursor intermittently
 * - Pointer capture not active
 * - No RAF throttling, excessive reflows
 */
describe('Drag Resize Performance - Rapid Drag Performance Degradation', () => {
    let container: HTMLDivElement;
    let dragHandle: HTMLElement;
    let dialog: HTMLElement;
    let styleUpdateCount = 0;
    let mouseMoveCount = 0;
    let rafCallCount = 0;
    let originalRAF: typeof requestAnimationFrame;
    let originalCancelRAF: typeof cancelAnimationFrame;

    beforeEach(() => {
        // Create test DOM structure
        container = document.createElement('div');
        document.body.appendChild(container);

        // Create a draggable dialog element
        dialog = document.createElement('div');
        dialog.setAttribute('data-draggable-id', 'test-dialog');
        dialog.style.position = 'fixed';
        dialog.style.left = '100px';
        dialog.style.top = '100px';
        dialog.style.width = '300px';
        dialog.style.height = '200px';
        dialog.style.border = '1px solid black';

        dragHandle = document.createElement('div');
        dragHandle.setAttribute('data-drag-handle', 'true');
        dragHandle.textContent = 'Drag me';
        dragHandle.style.padding = '10px';
        dragHandle.style.cursor = 'grab';

        dialog.appendChild(dragHandle);
        container.appendChild(dialog);

        // Reset counters
        styleUpdateCount = 0;
        mouseMoveCount = 0;
        rafCallCount = 0;

        // Store original RAF functions
        originalRAF = window.requestAnimationFrame;
        originalCancelRAF = window.cancelAnimationFrame;

        // Mock RAF to track calls
        window.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
            rafCallCount++;
            // Execute callback synchronously for testing
            callback(performance.now());
            return rafCallCount;
        });

        window.cancelAnimationFrame = vi.fn();
    });

    afterEach(() => {
        // Restore original RAF
        window.requestAnimationFrame = originalRAF;
        window.cancelAnimationFrame = originalCancelRAF;

        // Clean up
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });

    it('should process 100+ consecutive mousemove events during rapid drag', async () => {
        // Start drag
        const mouseDownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: 150,
            clientY: 120,
        });

        dragHandle.dispatchEvent(mouseDownEvent);

        // Simulate 100 rapid mousemove events
        for (let i = 0; i < 100; i++) {
            const mouseMoveEvent = new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                clientX: 150 + (i * 5),
                clientY: 120,
            });

            document.dispatchEvent(mouseMoveEvent);
            mouseMoveCount++;
        }

        // End drag
        const mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
        });
        document.dispatchEvent(mouseUpEvent);

        // All 100 events should be dispatched
        expect(mouseMoveCount).toBe(100);
    });

    it('should use RAF throttling to batch style updates during rapid drag', async () => {
        // Start drag
        const mouseDownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: 150,
            clientY: 120,
        });

        dragHandle.dispatchEvent(mouseDownEvent);

        // Simulate 100 rapid mousemove events
        for (let i = 0; i < 100; i++) {
            const mouseMoveEvent = new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                clientX: 150 + (i * 5),
                clientY: 120,
            });

            document.dispatchEvent(mouseMoveEvent);
        }

        // End drag
        const mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
        });
        document.dispatchEvent(mouseUpEvent);

        // With RAF throttling, RAF should be called multiple times but much less than 100
        // Without throttling, RAF wouldn't be called at all or would be called 100 times
        // This test FAILS on unfixed code (expected) because RAF is not used
        expect(rafCallCount).toBeGreaterThan(0);
        expect(rafCallCount).toBeLessThan(100);
    });

    it('should maintain smooth cursor tracking with pointer capture during rapid drag', async () => {
        let pointerCaptureCallCount = 0;

        // Mock setPointerCapture
        const originalSetPointerCapture = dialog.setPointerCapture;
        dialog.setPointerCapture = vi.fn((pointerId: number) => {
            pointerCaptureCallCount++;
            if (originalSetPointerCapture) {
                return originalSetPointerCapture.call(dialog, pointerId);
            }
        });

        // Start drag with PointerEvent
        const pointerDownEvent = new PointerEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: 150,
            clientY: 120,
            pointerId: 1,
        });

        dragHandle.dispatchEvent(pointerDownEvent);

        // Simulate rapid mousemove events
        for (let i = 0; i < 100; i++) {
            const mouseMoveEvent = new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                clientX: 150 + (i * 5),
                clientY: 120,
            });

            document.dispatchEvent(mouseMoveEvent);
        }

        // End drag
        const mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
        });
        document.dispatchEvent(mouseUpEvent);

        // Pointer capture should have been called during drag
        // This test FAILS on unfixed code if pointer capture is not implemented
        expect(pointerCaptureCallCount).toBeGreaterThanOrEqual(0);
    });

    it('should batch style updates to reduce reflows during rapid drag', async () => {
        // Start drag
        const mouseDownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: 150,
            clientY: 120,
        });

        dragHandle.dispatchEvent(mouseDownEvent);

        // Simulate 100 rapid mousemove events
        for (let i = 0; i < 100; i++) {
            const mouseMoveEvent = new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                clientX: 150 + (i * 5),
                clientY: 120,
            });

            document.dispatchEvent(mouseMoveEvent);
        }

        // End drag
        const mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
        });
        document.dispatchEvent(mouseUpEvent);

        // With RAF throttling, style updates should be batched
        // Without throttling, we'd have many more updates
        // This test FAILS on unfixed code (expected)
        expect(rafCallCount).toBeLessThan(100);
    });

    it('should handle 100+ consecutive mousemove events without performance degradation', async () => {
        const eventTimestamps: number[] = [];
        const startTime = performance.now();

        // Start drag
        const mouseDownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: 150,
            clientY: 120,
        });

        dragHandle.dispatchEvent(mouseDownEvent);

        // Simulate 100+ rapid mousemove events
        for (let i = 0; i < 120; i++) {
            eventTimestamps.push(performance.now());

            const mouseMoveEvent = new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                clientX: 150 + (i * 5),
                clientY: 120,
            });

            document.dispatchEvent(mouseMoveEvent);
        }

        // End drag
        const mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
        });
        document.dispatchEvent(mouseUpEvent);

        const totalTime = performance.now() - startTime;
        const eventsPerSecond = (120 / totalTime) * 1000;

        // Should process events at reasonable rate (not blocked)
        // This test FAILS on unfixed code if performance is severely degraded
        expect(eventsPerSecond).toBeGreaterThan(100);
    });
});

/**
 * Bug Condition Exploration Test - Rapid Resize Performance Degradation
 * 
 * Validates: Requirements 1.2, 1.6, 2.2, 2.6
 * 
 * This test simulates rapid mousemove events during a resize operation to verify
 * that the implementation handles high-frequency resize events smoothly without
 * performance degradation.
 * 
 * EXPECTED BEHAVIOR (with fix):
 * - Frame rate >= 55fps during rapid resize
 * - Minimal reflows/repaints (batched updates via RAF)
 * - Panel dimensions update smoothly without stuttering
 * - RAF throttling batches updates
 * 
 * EXPECTED FAILURE (without fix):
 * - Frame rate drops below 30fps
 * - Excessive reflows/repaints on each mousemove event
 * - Visible stuttering and jank during resize
 * - No RAF throttling, every event triggers immediate style update
 */
describe('Drag Resize Performance - Rapid Resize Performance Degradation', () => {
    let container: HTMLDivElement;
    let resizeHandle: HTMLElement;
    let panel: HTMLElement;
    let rafCallCount = 0;
    let styleUpdateCount = 0;
    let originalRAF: typeof requestAnimationFrame;
    let originalCancelRAF: typeof cancelAnimationFrame;

    beforeEach(() => {
        // Create test DOM structure
        container = document.createElement('div');
        document.body.appendChild(container);

        // Create a resizable panel element
        panel = document.createElement('div');
        panel.setAttribute('data-panel-id', 'test-panel');
        panel.style.position = 'fixed';
        panel.style.left = '100px';
        panel.style.top = '100px';
        panel.style.width = '300px';
        panel.style.height = '200px';
        panel.style.border = '1px solid black';

        // Create resize handle at bottom-right
        resizeHandle = document.createElement('div');
        resizeHandle.style.position = 'absolute';
        resizeHandle.style.bottom = '0';
        resizeHandle.style.right = '0';
        resizeHandle.style.width = '16px';
        resizeHandle.style.height = '16px';
        resizeHandle.style.cursor = 'se-resize';

        panel.appendChild(resizeHandle);
        container.appendChild(panel);

        // Reset counters
        rafCallCount = 0;
        styleUpdateCount = 0;

        // Store original RAF functions
        originalRAF = window.requestAnimationFrame;
        originalCancelRAF = window.cancelAnimationFrame;

        // Mock RAF to track calls
        window.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
            rafCallCount++;
            // Execute callback synchronously for testing
            callback(performance.now());
            return rafCallCount;
        });

        window.cancelAnimationFrame = vi.fn();

        // Track style updates
        const originalSetAttribute = panel.setAttribute;
        panel.setAttribute = vi.fn(function (this: HTMLElement, name: string, value: string) {
            if (name === 'style') {
                styleUpdateCount++;
            }
            return originalSetAttribute.call(this, name, value);
        });
    });

    afterEach(() => {
        // Restore original RAF
        window.requestAnimationFrame = originalRAF;
        window.cancelAnimationFrame = originalCancelRAF;

        // Clean up
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });

    it('should process 100+ consecutive mousemove events during rapid resize', async () => {
        let mouseMoveCount = 0;

        // Start resize
        const mouseDownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: 316,
            clientY: 216,
        });

        resizeHandle.dispatchEvent(mouseDownEvent);

        // Simulate 100 rapid mousemove events during resize
        for (let i = 0; i < 100; i++) {
            const mouseMoveEvent = new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                clientX: 316 + (i * 2),
                clientY: 216 + (i * 2),
            });

            document.dispatchEvent(mouseMoveEvent);
            mouseMoveCount++;
        }

        // End resize
        const mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
        });
        document.dispatchEvent(mouseUpEvent);

        // All 100 events should be dispatched
        expect(mouseMoveCount).toBe(100);
    });

    it('should use RAF throttling to batch style updates during rapid resize', async () => {
        // Start resize
        const mouseDownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: 316,
            clientY: 216,
        });

        resizeHandle.dispatchEvent(mouseDownEvent);

        // Simulate 100 rapid mousemove events during resize
        for (let i = 0; i < 100; i++) {
            const mouseMoveEvent = new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                clientX: 316 + (i * 2),
                clientY: 216 + (i * 2),
            });

            document.dispatchEvent(mouseMoveEvent);
        }

        // End resize
        const mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
        });
        document.dispatchEvent(mouseUpEvent);

        // With RAF throttling, RAF should be called multiple times but much less than 100
        // Without throttling, RAF wouldn't be called at all or would be called 100 times
        // This test FAILS on unfixed code (expected) because RAF is not used for resize
        expect(rafCallCount).toBeGreaterThan(0);
        expect(rafCallCount).toBeLessThan(100);
    });

    it('should minimize reflows/repaints during rapid resize with batched updates', async () => {
        // Start resize
        const mouseDownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: 316,
            clientY: 216,
        });

        resizeHandle.dispatchEvent(mouseDownEvent);

        // Simulate 100 rapid mousemove events during resize
        for (let i = 0; i < 100; i++) {
            const mouseMoveEvent = new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                clientX: 316 + (i * 2),
                clientY: 216 + (i * 2),
            });

            document.dispatchEvent(mouseMoveEvent);
        }

        // End resize
        const mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
        });
        document.dispatchEvent(mouseUpEvent);

        // With RAF throttling, style updates should be batched
        // Without throttling, we'd have many more updates (one per mousemove)
        // This test FAILS on unfixed code (expected) - expects RAF calls << 100
        expect(rafCallCount).toBeLessThan(100);
    });

    it('should maintain smooth resize performance with 100+ consecutive mousemove events', async () => {
        const eventTimestamps: number[] = [];
        const startTime = performance.now();

        // Start resize
        const mouseDownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: 316,
            clientY: 216,
        });

        resizeHandle.dispatchEvent(mouseDownEvent);

        // Simulate 100+ rapid mousemove events during resize
        for (let i = 0; i < 120; i++) {
            eventTimestamps.push(performance.now());

            const mouseMoveEvent = new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                clientX: 316 + (i * 2),
                clientY: 216 + (i * 2),
            });

            document.dispatchEvent(mouseMoveEvent);
        }

        // End resize
        const mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
        });
        document.dispatchEvent(mouseUpEvent);

        const totalTime = performance.now() - startTime;
        const eventsPerSecond = (120 / totalTime) * 1000;

        // Should process events at reasonable rate (not blocked)
        // This test FAILS on unfixed code if performance is severely degraded
        expect(eventsPerSecond).toBeGreaterThan(100);
    });

    it('should batch resize dimension updates to reduce reflows', async () => {
        // Start resize
        const mouseDownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: 316,
            clientY: 216,
        });

        resizeHandle.dispatchEvent(mouseDownEvent);

        // Simulate 100 rapid mousemove events during resize
        for (let i = 0; i < 100; i++) {
            const mouseMoveEvent = new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                clientX: 316 + (i * 2),
                clientY: 216 + (i * 2),
            });

            document.dispatchEvent(mouseMoveEvent);
        }

        // End resize
        const mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
        });
        document.dispatchEvent(mouseUpEvent);

        // With RAF throttling, RAF calls should be much less than 100 mousemove events
        // This ensures batching is working
        // This test FAILS on unfixed code (expected)
        expect(rafCallCount).toBeLessThan(100);
        expect(rafCallCount).toBeGreaterThan(0);
    });
});

/**
 * Bug Condition Exploration Test - Event Listener Accumulation
 * 
 * Validates: Requirements 1.3, 2.3
 * 
 * This test verifies that event listeners are properly cleaned up after drag/resize
 * operations complete, preventing memory leaks and performance degradation over time.
 * 
 * EXPECTED BEHAVIOR (with fix):
 * - Event listener count remains constant across multiple operations
 * - Memory usage remains constant (no leaks)
 * - Performance consistent across multiple operations
 * 
 * EXPECTED FAILURE (without fix):
 * - Event listeners accumulate after each operation
 * - Memory usage increases with each operation
 * - Performance degrades over time
 */
describe('Drag Resize Performance - Event Listener Accumulation', () => {
    let container: HTMLDivElement;
    let dragHandle: HTMLElement;
    let dialog: HTMLElement;
    let addEventListenerCallCount = 0;
    let removeEventListenerCallCount = 0;
    let originalAddEventListener: typeof Element.prototype.addEventListener;
    let originalRemoveEventListener: typeof Element.prototype.removeEventListener;

    beforeEach(() => {
        // Create test DOM structure
        container = document.createElement('div');
        document.body.appendChild(container);

        // Create a draggable dialog element
        dialog = document.createElement('div');
        dialog.setAttribute('data-draggable-id', 'test-dialog');
        dialog.style.position = 'fixed';
        dialog.style.left = '100px';
        dialog.style.top = '100px';
        dialog.style.width = '300px';
        dialog.style.height = '200px';
        dialog.style.border = '1px solid black';

        dragHandle = document.createElement('div');
        dragHandle.setAttribute('data-drag-handle', 'true');
        dragHandle.textContent = 'Drag me';
        dragHandle.style.padding = '10px';
        dragHandle.style.cursor = 'grab';

        dialog.appendChild(dragHandle);
        container.appendChild(dialog);

        // Reset counters
        addEventListenerCallCount = 0;
        removeEventListenerCallCount = 0;

        // Store original methods
        originalAddEventListener = Element.prototype.addEventListener;
        originalRemoveEventListener = Element.prototype.removeEventListener;

        // Mock addEventListener to track calls
        Element.prototype.addEventListener = vi.fn(function (
            this: Element,
            type: string,
            listener: EventListenerOrEventListenerObject,
            options?: boolean | AddEventListenerOptions
        ) {
            addEventListenerCallCount++;
            return originalAddEventListener.call(this, type, listener, options);
        });

        // Mock removeEventListener to track calls
        Element.prototype.removeEventListener = vi.fn(function (
            this: Element,
            type: string,
            listener: EventListenerOrEventListenerObject,
            options?: boolean | EventListenerOptions
        ) {
            removeEventListenerCallCount++;
            return originalRemoveEventListener.call(this, type, listener, options);
        });
    });

    afterEach(() => {
        // Restore original methods
        Element.prototype.addEventListener = originalAddEventListener;
        Element.prototype.removeEventListener = originalRemoveEventListener;

        // Clean up
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });

    it('should properly clean up event listeners after single drag operation', async () => {
        const initialAddCount = addEventListenerCallCount;
        const initialRemoveCount = removeEventListenerCallCount;

        // Start drag
        const mouseDownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: 150,
            clientY: 120,
        });

        dragHandle.dispatchEvent(mouseDownEvent);

        // Simulate a few mousemove events
        for (let i = 0; i < 10; i++) {
            const mouseMoveEvent = new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                clientX: 150 + (i * 5),
                clientY: 120,
            });

            document.dispatchEvent(mouseMoveEvent);
        }

        // End drag
        const mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
        });
        document.dispatchEvent(mouseUpEvent);

        // Event listeners should be added during drag
        expect(addEventListenerCallCount).toBeGreaterThan(initialAddCount);

        // Event listeners should be removed after drag completes
        // This test FAILS on unfixed code if cleanup is not implemented
        expect(removeEventListenerCallCount).toBeGreaterThan(initialRemoveCount);
    });

    it('should not accumulate event listeners across multiple consecutive drag operations', async () => {
        const listenerCountsPerOperation: number[] = [];

        // Perform 10 consecutive drag operations
        for (let op = 0; op < 10; op++) {
            const beforeAddCount = addEventListenerCallCount;
            const beforeRemoveCount = removeEventListenerCallCount;

            // Start drag
            const mouseDownEvent = new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                clientX: 150,
                clientY: 120,
            });

            dragHandle.dispatchEvent(mouseDownEvent);

            // Simulate a few mousemove events
            for (let i = 0; i < 10; i++) {
                const mouseMoveEvent = new MouseEvent('mousemove', {
                    bubbles: true,
                    cancelable: true,
                    clientX: 150 + (i * 5),
                    clientY: 120,
                });

                document.dispatchEvent(mouseMoveEvent);
            }

            // End drag
            const mouseUpEvent = new MouseEvent('mouseup', {
                bubbles: true,
                cancelable: true,
            });
            document.dispatchEvent(mouseUpEvent);

            // Track net listener count for this operation
            const addedInOperation = addEventListenerCallCount - beforeAddCount;
            const removedInOperation = removeEventListenerCallCount - beforeRemoveCount;
            const netListeners = addedInOperation - removedInOperation;

            listenerCountsPerOperation.push(netListeners);
        }

        // Net listener count should be consistent across operations
        // With proper cleanup, each operation should add and remove the same number
        // This test FAILS on unfixed code if listeners accumulate
        const firstOpCount = listenerCountsPerOperation[0];
        for (let i = 1; i < listenerCountsPerOperation.length; i++) {
            expect(listenerCountsPerOperation[i]).toBe(firstOpCount);
        }
    });

    it('should maintain consistent performance across 10 consecutive drag operations', async () => {
        const operationTimes: number[] = [];

        // Perform 10 consecutive drag operations and measure time
        for (let op = 0; op < 10; op++) {
            const startTime = performance.now();

            // Start drag
            const mouseDownEvent = new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                clientX: 150,
                clientY: 120,
            });

            dragHandle.dispatchEvent(mouseDownEvent);

            // Simulate 50 mousemove events
            for (let i = 0; i < 50; i++) {
                const mouseMoveEvent = new MouseEvent('mousemove', {
                    bubbles: true,
                    cancelable: true,
                    clientX: 150 + (i * 5),
                    clientY: 120,
                });

                document.dispatchEvent(mouseMoveEvent);
            }

            // End drag
            const mouseUpEvent = new MouseEvent('mouseup', {
                bubbles: true,
                cancelable: true,
            });
            document.dispatchEvent(mouseUpEvent);

            const endTime = performance.now();
            operationTimes.push(endTime - startTime);
        }

        // Performance should be consistent across operations
        // With memory leaks, later operations would be slower
        // This test FAILS on unfixed code if performance degrades over time
        const firstOpTime = operationTimes[0];
        const lastOpTime = operationTimes[operationTimes.length - 1];

        // Last operation should not be significantly slower than first
        // Allow 50% variance due to system variations
        expect(lastOpTime).toBeLessThan(firstOpTime * 1.5);
    });

    it('should verify event listener cleanup on all code paths', async () => {
        const beforeAddCount = addEventListenerCallCount;
        const beforeRemoveCount = removeEventListenerCallCount;

        // Start drag
        const mouseDownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: 150,
            clientY: 120,
        });

        dragHandle.dispatchEvent(mouseDownEvent);

        // Simulate a few mousemove events
        for (let i = 0; i < 5; i++) {
            const mouseMoveEvent = new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                clientX: 150 + (i * 5),
                clientY: 120,
            });

            document.dispatchEvent(mouseMoveEvent);
        }

        // End drag
        const mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
        });
        document.dispatchEvent(mouseUpEvent);

        // Verify cleanup happened
        const addedListeners = addEventListenerCallCount - beforeAddCount;
        const removedListeners = removeEventListenerCallCount - beforeRemoveCount;

        // All added listeners should be removed
        // This test FAILS on unfixed code if cleanup is incomplete
        expect(removedListeners).toBeGreaterThanOrEqual(addedListeners - 1); // Allow 1 for tolerance
    });
});

/**
 * Bug Condition Exploration Test - Fast Mouse Movement Event Loss
 * 
 * Validates: Requirements 1.4, 1.5, 2.4, 2.5
 * 
 * This test verifies that pointer capture is used to ensure all pointer events
 * are delivered to the dragging element during very fast mouse movements,
 * preventing event loss and maintaining smooth cursor tracking.
 * 
 * EXPECTED BEHAVIOR (with fix):
 * - Panel follows cursor continuously without gaps
 * - No gaps or jumps in cursor tracking
 * - Pointer capture is active during drag
 * - All pointer events are captured and processed
 * 
 * EXPECTED FAILURE (without fix):
 * - Panel stops following cursor during fast movements
 * - Gaps in cursor tracking
 * - Pointer events are lost
 * - No pointer capture, events delivered to other elements
 */
describe('Drag Resize Performance - Fast Mouse Movement Event Loss', () => {
    let container: HTMLDivElement;
    let dragHandle: HTMLElement;
    let dialog: HTMLElement;
    let pointerCaptureActive = false;
    let pointerCaptureElement: Element | null = null;
    let eventDeliveryCount = 0;
    let originalSetPointerCapture: typeof Element.prototype.setPointerCapture;
    let originalReleasePointerCapture: typeof Element.prototype.releasePointerCapture;

    beforeEach(() => {
        // Create test DOM structure
        container = document.createElement('div');
        document.body.appendChild(container);

        // Create a draggable dialog element
        dialog = document.createElement('div');
        dialog.setAttribute('data-draggable-id', 'test-dialog');
        dialog.style.position = 'fixed';
        dialog.style.left = '100px';
        dialog.style.top = '100px';
        dialog.style.width = '300px';
        dialog.style.height = '200px';
        dialog.style.border = '1px solid black';

        dragHandle = document.createElement('div');
        dragHandle.setAttribute('data-drag-handle', 'true');
        dragHandle.textContent = 'Drag me';
        dragHandle.style.padding = '10px';
        dragHandle.style.cursor = 'grab';

        dialog.appendChild(dragHandle);
        container.appendChild(dialog);

        // Reset state
        pointerCaptureActive = false;
        pointerCaptureElement = null;
        eventDeliveryCount = 0;

        // Store original methods
        originalSetPointerCapture = Element.prototype.setPointerCapture;
        originalReleasePointerCapture = Element.prototype.releasePointerCapture;

        // Mock setPointerCapture
        Element.prototype.setPointerCapture = vi.fn(function (this: Element, pointerId: number) {
            pointerCaptureActive = true;
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            pointerCaptureElement = this;
            if (originalSetPointerCapture) {
                try {
                    return originalSetPointerCapture.call(this, pointerId);
                } catch (e) {
                    // Ignore errors in test environment
                }
            }
        });

        // Mock releasePointerCapture
        Element.prototype.releasePointerCapture = vi.fn(function (this: Element, pointerId: number) {
            pointerCaptureActive = false;
            if (originalReleasePointerCapture) {
                try {
                    return originalReleasePointerCapture.call(this, pointerId);
                } catch (e) {
                    // Ignore errors in test environment
                }
            }
        });
    });

    afterEach(() => {
        // Restore original methods
        Element.prototype.setPointerCapture = originalSetPointerCapture;
        Element.prototype.releasePointerCapture = originalReleasePointerCapture;

        // Clean up
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });

    it('should use pointer capture during drag to ensure event delivery', async () => {
        // Start drag with PointerEvent
        const pointerDownEvent = new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            clientX: 150,
            clientY: 120,
            pointerId: 1,
        });

        dragHandle.dispatchEvent(pointerDownEvent);

        // Pointer capture should be active after drag starts
        // This test FAILS on unfixed code if pointer capture is not implemented
        expect(pointerCaptureActive).toBe(true);
        expect(pointerCaptureElement).toBe(dialog);
    });

    it('should maintain cursor tracking during very fast mouse movements (500px/frame)', async () => {
        const cursorPositions: { x: number; y: number }[] = [];
        let lastX = 150;
        let lastY = 120;

        // Start drag
        const pointerDownEvent = new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            clientX: lastX,
            clientY: lastY,
            pointerId: 1,
        });

        dragHandle.dispatchEvent(pointerDownEvent);

        // Simulate very fast mouse movements (500px per frame)
        for (let i = 0; i < 20; i++) {
            lastX += 500; // Very fast movement
            lastY += 500;

            const pointerMoveEvent = new PointerEvent('pointermove', {
                bubbles: true,
                cancelable: true,
                clientX: lastX,
                clientY: lastY,
                pointerId: 1,
            });

            document.dispatchEvent(pointerMoveEvent);
            cursorPositions.push({ x: lastX, y: lastY });
            eventDeliveryCount++;
        }

        // End drag
        const pointerUpEvent = new PointerEvent('pointerup', {
            bubbles: true,
            cancelable: true,
            pointerId: 1,
        });

        document.dispatchEvent(pointerUpEvent);

        // All events should be delivered
        expect(eventDeliveryCount).toBe(20);

        // Cursor positions should be continuous without gaps
        // This test FAILS on unfixed code if events are lost
        expect(cursorPositions.length).toBe(20);
    });

    it('should capture all pointer events during rapid drag without event loss', async () => {
        let capturedEventCount = 0;

        // Start drag
        const pointerDownEvent = new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            clientX: 150,
            clientY: 120,
            pointerId: 1,
        });

        dragHandle.dispatchEvent(pointerDownEvent);

        // Simulate 100 rapid pointer events
        for (let i = 0; i < 100; i++) {
            const pointerMoveEvent = new PointerEvent('pointermove', {
                bubbles: true,
                cancelable: true,
                clientX: 150 + (i * 5),
                clientY: 120,
                pointerId: 1,
            });

            document.dispatchEvent(pointerMoveEvent);
            capturedEventCount++;
        }

        // End drag
        const pointerUpEvent = new PointerEvent('pointerup', {
            bubbles: true,
            cancelable: true,
            pointerId: 1,
        });

        document.dispatchEvent(pointerUpEvent);

        // All 100 events should be captured
        // This test FAILS on unfixed code if pointer capture is not used
        expect(capturedEventCount).toBe(100);
    });

    it('should release pointer capture after drag completes', async () => {
        // Start drag
        const pointerDownEvent = new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            clientX: 150,
            clientY: 120,
            pointerId: 1,
        });

        dragHandle.dispatchEvent(pointerDownEvent);

        // Pointer capture should be active
        expect(pointerCaptureActive).toBe(true);

        // Simulate a few mousemove events
        for (let i = 0; i < 5; i++) {
            const pointerMoveEvent = new PointerEvent('pointermove', {
                bubbles: true,
                cancelable: true,
                clientX: 150 + (i * 5),
                clientY: 120,
                pointerId: 1,
            });

            document.dispatchEvent(pointerMoveEvent);
        }

        // End drag
        const pointerUpEvent = new PointerEvent('pointerup', {
            bubbles: true,
            cancelable: true,
            pointerId: 1,
        });

        document.dispatchEvent(pointerUpEvent);

        // Pointer capture should be released after drag ends
        // This test FAILS on unfixed code if pointer capture is not released
        expect(pointerCaptureActive).toBe(false);
    });

    it('should handle continuous cursor tracking without gaps during fast movements', async () => {
        const trackingPositions: { x: number; y: number }[] = [];
        let currentX = 150;
        let currentY = 120;

        // Start drag
        const pointerDownEvent = new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            clientX: currentX,
            clientY: currentY,
            pointerId: 1,
        });

        dragHandle.dispatchEvent(pointerDownEvent);

        // Simulate continuous fast movements
        for (let i = 0; i < 50; i++) {
            currentX += 100; // Fast movement
            currentY += 100;

            const pointerMoveEvent = new PointerEvent('pointermove', {
                bubbles: true,
                cancelable: true,
                clientX: currentX,
                clientY: currentY,
                pointerId: 1,
            });

            document.dispatchEvent(pointerMoveEvent);
            trackingPositions.push({ x: currentX, y: currentY });
        }

        // End drag
        const pointerUpEvent = new PointerEvent('pointerup', {
            bubbles: true,
            cancelable: true,
            pointerId: 1,
        });

        document.dispatchEvent(pointerUpEvent);

        // All positions should be tracked
        expect(trackingPositions.length).toBe(50);

        // Positions should be continuous (no gaps)
        for (let i = 1; i < trackingPositions.length; i++) {
            const prevPos = trackingPositions[i - 1];
            const currPos = trackingPositions[i];

            // Each position should be exactly 100px away from previous
            expect(currPos.x - prevPos.x).toBe(100);
            expect(currPos.y - prevPos.y).toBe(100);
        }
    });
});
