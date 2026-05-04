# Drag Resize Performance Fix - Design Document

## Overview

This design document formalizes the performance optimization strategy for drag and resize operations across the application. The bug manifests as jank, frame drops, and unresponsive behavior during rapid mouse movements when dragging or resizing panels and dialogs. The fix employs pointer capture, RequestAnimationFrame-based throttling, proper event listener cleanup, and React optimization strategies to achieve smooth 60fps performance while preserving all existing functionality.

The affected components are:
- **DraggableDialogManager**: Manages draggable dialogs with position persistence
- **ModernPanel**: Provides resizable and draggable overlay panels
- **Terminal**: Draggable terminal window component
- **ConfigPanel**: Network configuration panel (uses ModernPanel)
- **SecurityPanel**: Security configuration panel (uses ModernPanel)

## Glossary

- **Bug_Condition (C)**: The condition that triggers the performance bug - when a user performs rapid drag or resize operations, causing excessive event processing and style updates without throttling or pointer capture
- **Property (P)**: The desired behavior when drag/resize operations occur - smooth 60fps performance with fluid cursor tracking and minimal jank
- **Preservation**: Existing functionality that must remain unchanged - localStorage persistence, dimension constraints, mobile behavior, layout mode respect, cursor feedback, and modal handling
- **Pointer Capture**: Browser API (setPointerCapture) that ensures all pointer events are delivered to the capturing element, preventing event loss during fast movements
- **RequestAnimationFrame (RAF) Throttling**: Batching style updates to occur only once per frame, preventing excessive reflows and repaints
- **Event Listener Cleanup**: Proper removal of temporary event listeners after drag/resize operations complete, preventing memory leaks
- **React Optimization**: Using refs and direct DOM manipulation during drag/resize to avoid React re-renders that cause performance degradation
- **DraggableDialogManager**: Component in `src/components/DraggableDialogManager.tsx` that manages draggable dialog positioning
- **ModernPanel**: Component in `src/components/ui/ModernPanel.tsx` that provides resizable and draggable overlay panels
- **Terminal**: Component in `src/components/network/Terminal.tsx` that provides a draggable terminal interface
- **ConfigPanel**: Component in `src/components/network/ConfigPanel.tsx` that displays network configuration
- **SecurityPanel**: Component in `src/components/network/SecurityPanel.tsx` that displays security settings

## Bug Details

### Bug Condition

The bug manifests when a user performs rapid drag or resize operations on panels and dialogs. The performance degradation occurs due to:

1. **Missing Pointer Capture**: Without `setPointerCapture()`, fast mouse movements can cause events to be delivered to other elements, resulting in lost or delayed events
2. **Unthrottled Event Handlers**: Every single `mousemove` event triggers immediate style updates, causing excessive browser reflows and repaints
3. **React State Updates During Drag**: Updating React state on every mousemove event causes component re-renders, blocking the main thread
4. **Event Listener Memory Leaks**: Event listeners are not properly cleaned up after drag/resize operations, accumulating over time
5. **Redundant Style Updates**: Multiple style properties are updated individually instead of being batched
6. **No RAF Batching**: Style updates are not synchronized with the browser's repaint cycle

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type DragResizeEvent (contains clientX, clientY, timestamp)
  OUTPUT: boolean
  
  RETURN (input.isDragOperation OR input.isResizeOperation)
         AND input.mouseMovementSpeed > THRESHOLD (fast movement)
         AND NOT pointerCaptureActive
         AND NOT rafThrottlingActive
         AND NOT eventListenerCleanupScheduled
         AND styleUpdatesPerFrame > 1
END FUNCTION
```

### Examples

**Example 1: Rapid Drag Without Pointer Capture**
- User drags panel header quickly across screen
- Mouse moves 100+ pixels per frame
- Without pointer capture, some mousemove events are lost
- Panel stops following cursor intermittently
- Expected: Smooth continuous tracking
- Actual: Stuttering, cursor tracking breaks

**Example 2: Unthrottled Resize Operations**
- User drags resize handle rapidly
- Every mousemove event (60+ per second) triggers immediate style update
- Browser performs reflow/repaint on each event
- Frame rate drops to 20-30fps
- Expected: 60fps smooth resize
- Actual: Visible jank and stuttering

**Example 3: Event Listener Accumulation**
- User performs 10 drag operations in sequence
- Each operation adds mousemove and mouseup listeners
- Listeners are not removed after operation completes
- After 10 operations, 10 duplicate listeners are active
- Memory usage increases, performance degrades
- Expected: Consistent performance across multiple operations
- Actual: Performance degrades with each operation

**Example 4: React Re-renders During Drag**
- User drags panel while Terminal component is rendering output
- Drag operation updates React state (isDragging)
- Component re-renders, blocking main thread
- Drag becomes unresponsive
- Expected: Drag continues smoothly regardless of other rendering
- Actual: Drag freezes during Terminal output rendering

**Example 5: Mobile Device Behavior**
- User attempts to drag panel on mobile device
- Drag should be disabled on mobile
- Expected: No drag operation, panel stays in place
- Actual: Drag is disabled (correct)

**Example 6: Layout Mode Respect**
- User switches from overlay to stacked layout
- Drag should be disabled in stacked mode
- Expected: Drag disabled, panel not draggable
- Actual: Drag disabled (correct)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Mouse clicks on action buttons must continue to work exactly as before
- Panel position must be saved to localStorage after drag completes
- Panel dimensions must respect minWidth and minHeight constraints
- Drag operations must be disabled on mobile devices
- Drag operations must be disabled in stacked and docked layout modes
- Only header area should trigger drag (not entire panel content)
- Only bottom-right corner should trigger resize
- Cursor must change to 'grabbing' during drag and 'se-resize' during resize
- Dialogs managed by DraggableDialogManager must save position with correct storage key
- Modals with data-modal-content attribute must not be dragged
- Layout context changes must be respected

**Scope:**
All inputs that do NOT involve rapid drag/resize operations should be completely unaffected by this fix. This includes:
- Mouse clicks on buttons and interactive elements
- Keyboard input and shortcuts
- Touch input on mobile devices
- Other pointer events (hover, focus, etc.)
- Component rendering and state management outside of drag/resize

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Missing Pointer Capture**: The current implementation does not use `setPointerCapture()` to ensure all pointer events are delivered to the dragging element. This causes event loss during fast movements.

2. **Unthrottled Event Handlers**: Every `mousemove` event immediately updates styles without batching. With 60+ events per second, this causes excessive reflows and repaints, dropping frames.

3. **React State Updates During Drag**: The `isDragging` state in ModernPanel is updated on every drag operation, causing React re-renders that block the main thread and interrupt drag smoothness.

4. **Event Listener Cleanup Issues**: Event listeners added during drag/resize are not properly removed after the operation completes. The `{ once: true }` flag on mouseup helps, but mousemove listeners persist if cleanup fails.

5. **Redundant Style Updates**: Multiple style properties (left, top, width, height, willChange, transition) are updated individually instead of being batched into a single DOM operation.

6. **No RAF Synchronization**: Style updates are not synchronized with `requestAnimationFrame()`, causing updates to occur at arbitrary times rather than aligned with the browser's repaint cycle.

7. **Inefficient Cleanup Pattern**: The current cleanup pattern in ModernPanel uses `{ once: true }` on mouseup, but this doesn't guarantee cleanup if the operation is interrupted or if multiple operations overlap.

## Correctness Properties

Property 1: Bug Condition - Smooth Drag and Resize Performance

_For any_ drag or resize operation where the bug condition holds (rapid mouse movements, missing pointer capture, unthrottled updates), the fixed implementation SHALL achieve smooth 60fps performance with fluid cursor tracking, no visible jank, and continuous event delivery through pointer capture and RAF-based throttling.

**Validates: Requirements 2.1, 2.2, 2.4, 2.5, 2.6**

Property 2: Preservation - Existing Functionality Unchanged

_For any_ input that is NOT a rapid drag/resize operation (mouse clicks, keyboard input, layout changes, mobile behavior), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality including localStorage persistence, dimension constraints, layout mode respect, and cursor feedback.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct, the following changes are required:

**File 1**: `src/components/DraggableDialogManager.tsx`

**Function**: `DraggableDialogManager`

**Specific Changes**:

1. **Implement Pointer Capture**:
   - Add `setPointerCapture()` call in `handleMouseDown` to capture all pointer events
   - Add `releasePointerCapture()` call in `handleMouseUp` to release capture
   - This ensures all mousemove events are delivered to the dialog during drag, preventing event loss

2. **Implement RAF-Based Throttling**:
   - Wrap style updates in `requestAnimationFrame()` callback
   - Cancel previous RAF before scheduling new one to prevent queuing
   - This batches updates to occur once per frame, reducing reflows/repaints

3. **Improve Event Listener Cleanup**:
   - Store animation frame ID in dragState ref
   - Cancel animation frame in handleMouseUp before cleanup
   - Use proper cleanup pattern with explicit removeEventListener calls
   - This prevents memory leaks and ensures cleanup on all code paths

4. **Optimize Style Updates**:
   - Batch all style updates into a single RAF callback
   - Use `willChange` property to hint browser about upcoming changes
   - Remove `willChange` after drag completes to avoid memory overhead
   - This reduces reflows and repaints

5. **Add Passive Event Listeners**:
   - Use `{ passive: true }` on mousemove listener to allow browser optimizations
   - This improves scroll performance and allows browser to optimize event handling

**File 2**: `src/components/ui/ModernPanel.tsx`

**Function**: `ModernPanel`

**Specific Changes**:

1. **Implement Pointer Capture for Drag**:
   - Add `setPointerCapture()` call in `handleDragStart` when drag begins
   - Add `releasePointerCapture()` call in `handleMouseUp` when drag ends
   - This ensures smooth tracking during fast mouse movements

2. **Implement RAF-Based Throttling for Drag**:
   - Wrap drag style updates in `requestAnimationFrame()` callback
   - Cancel previous RAF before scheduling new one
   - This prevents excessive style updates and reflows

3. **Implement RAF-Based Throttling for Resize**:
   - Wrap resize style updates in `requestAnimationFrame()` callback
   - Cancel previous RAF before scheduling new one
   - This prevents excessive style updates during resize

4. **Avoid React State Updates During Drag**:
   - Remove `setIsDragging(true)` from drag handler
   - Use ref-based state tracking instead of React state
   - Only update React state after drag completes (for visual feedback if needed)
   - This prevents React re-renders from blocking drag performance

5. **Improve Event Listener Cleanup**:
   - Store animation frame ID in dragStateRef
   - Cancel animation frame in handleMouseUp before cleanup
   - Use explicit removeEventListener calls with proper cleanup
   - This ensures cleanup on all code paths and prevents memory leaks

6. **Optimize Style Updates**:
   - Batch all style updates into single RAF callback
   - Use `willChange` property during drag/resize
   - Remove `willChange` after operation completes
   - This reduces browser reflows and repaints

7. **Add Passive Event Listeners**:
   - Use `{ passive: true }` on mousemove listeners
   - This allows browser optimizations and improves performance

**File 3**: `src/components/network/Terminal.tsx`

**Note**: Terminal component uses ModernPanel for its container, so it will inherit the performance improvements from ModernPanel. No direct changes needed unless Terminal has its own drag/resize logic.

**File 4**: `src/components/network/ConfigPanel.tsx`

**Note**: ConfigPanel uses ModernPanel for its container, so it will inherit the performance improvements from ModernPanel. No direct changes needed.

**File 5**: `src/components/network/SecurityPanel.tsx`

**Note**: SecurityPanel uses ModernPanel for its container, so it will inherit the performance improvements from ModernPanel. No direct changes needed.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the performance bug on unfixed code, then verify the fix works correctly and preserves existing functionality.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the performance bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate rapid drag and resize operations and measure frame rate, event delivery, and memory usage. Run these tests on the UNFIXED code to observe performance degradation and understand the root cause.

**Test Cases**:

1. **Rapid Drag Performance Test**: Simulate 100 consecutive mousemove events during drag operation
   - Measure frame rate (should be 60fps with fix, <30fps without)
   - Verify all events are processed (should be 100 with pointer capture, may be <100 without)
   - Expected: Frame drops and event loss on unfixed code

2. **Rapid Resize Performance Test**: Simulate 100 consecutive mousemove events during resize operation
   - Measure frame rate and reflow count
   - Expected: Excessive reflows and frame drops on unfixed code

3. **Event Listener Accumulation Test**: Perform 10 drag operations in sequence
   - Count active event listeners before and after
   - Expected: Listeners accumulate on unfixed code, stay constant with fix

4. **Memory Usage Test**: Perform 50 drag operations and measure memory
   - Expected: Memory increases significantly on unfixed code, stays constant with fix

5. **Fast Mouse Movement Test**: Simulate mouse movement at 500px/frame (very fast)
   - Verify panel follows cursor continuously
   - Expected: Panel stops tracking on unfixed code, smooth tracking with fix

6. **Pointer Capture Test**: Verify pointer events are captured during drag
   - Expected: Events lost on unfixed code, all captured with fix

**Expected Counterexamples**:
- Frame rate drops below 30fps during rapid drag/resize
- Some mousemove events are not processed (event loss)
- Event listeners accumulate after multiple operations
- Memory usage increases over time
- Panel stops following cursor during fast movements

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL dragResizeEvent WHERE isBugCondition(dragResizeEvent) DO
  result := performDragResize_fixed(dragResizeEvent)
  ASSERT frameRate(result) >= 55fps  // Allow 5fps margin
  ASSERT eventDelivery(result) == 100%  // All events delivered
  ASSERT memoryUsage(result) == CONSTANT  // No memory leaks
  ASSERT cursorTracking(result) == SMOOTH  // No jank
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalFunction(input) = fixedFunction(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for non-drag operations, then write property-based tests capturing that behavior.

**Test Cases**:

1. **localStorage Persistence Preservation**: Verify panel position is saved to localStorage after drag
   - Test on unfixed code to establish baseline behavior
   - Write test to verify this continues after fix
   - Expected: Position saved with correct key format

2. **Dimension Constraints Preservation**: Verify minWidth and minHeight are respected
   - Test on unfixed code to establish baseline
   - Write test to verify constraints still enforced after fix
   - Expected: Panel cannot be resized below minimum dimensions

3. **Mobile Behavior Preservation**: Verify drag is disabled on mobile devices
   - Test on unfixed code to establish baseline
   - Write test to verify drag still disabled after fix
   - Expected: No drag operation on mobile

4. **Layout Mode Respect Preservation**: Verify drag disabled in stacked/docked modes
   - Test on unfixed code to establish baseline
   - Write test to verify drag still disabled after fix
   - Expected: Drag only works in overlay mode

5. **Header-Only Drag Preservation**: Verify only header triggers drag
   - Test on unfixed code to establish baseline
   - Write test to verify only header triggers after fix
   - Expected: Dragging content area does not drag panel

6. **Resize Handle Preservation**: Verify only bottom-right corner triggers resize
   - Test on unfixed code to establish baseline
   - Write test to verify only corner triggers after fix
   - Expected: Dragging other areas does not resize

7. **Cursor Feedback Preservation**: Verify cursor changes during drag/resize
   - Test on unfixed code to establish baseline
   - Write test to verify cursor feedback continues after fix
   - Expected: Cursor changes to 'grabbing' and 'se-resize'

8. **Modal Handling Preservation**: Verify modals with data-modal-content are not dragged
   - Test on unfixed code to establish baseline
   - Write test to verify modals still not dragged after fix
   - Expected: Modals remain in place

### Unit Tests

- Test pointer capture is activated and released correctly
- Test RAF throttling batches multiple events into single update
- Test event listeners are properly cleaned up after drag/resize
- Test style updates are batched and optimized
- Test passive event listeners are used correctly
- Test memory usage remains constant across multiple operations
- Test frame rate stays above 55fps during rapid drag/resize

### Property-Based Tests

- Generate random drag sequences and verify smooth performance across all
- Generate random resize sequences and verify smooth performance across all
- Generate random layout mode changes and verify drag behavior is correct
- Generate random mobile/desktop viewport changes and verify behavior is correct
- Generate random rapid drag/resize combinations and verify no memory leaks
- Generate random panel configurations and verify constraints are respected

### Integration Tests

- Test full drag operation from mousedown to mouseup with position persistence
- Test full resize operation from mousedown to mouseup with dimension constraints
- Test rapid consecutive drag operations without performance degradation
- Test rapid consecutive resize operations without performance degradation
- Test drag operation interrupted by layout mode change
- Test drag operation interrupted by mobile viewport change
- Test multiple panels being dragged/resized simultaneously
- Test drag/resize with Terminal component rendering output
- Test drag/resize with ConfigPanel and SecurityPanel updates
