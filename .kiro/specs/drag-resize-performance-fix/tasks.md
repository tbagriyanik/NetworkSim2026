# Drag Resize Performance Fix - Implementation Tasks

## Overview

This task list implements the bugfix for drag and resize performance issues using the bug condition methodology. Tasks are ordered to follow the exploratory workflow: first surface the bug with exploration tests, then verify preservation of existing behavior, then implement the fix, and finally validate the solution.

---

## Phase 1: Bug Condition Exploration (BEFORE Fix)

- [x] 1. Write bug condition exploration test - Rapid drag performance degradation
  - **Property 1: Bug Condition** - Performance Degradation During Rapid Drag
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the performance bug exists
  - **Scoped PBT Approach**: Scope the property to rapid drag scenarios (100+ consecutive mousemove events)
  - Test implementation details from Bug Condition in design:
    - Simulate rapid mousemove events during drag operation (100 events in quick succession)
    - Measure frame rate during drag (should be 60fps with fix, <30fps without)
    - Verify all mousemove events are processed (should be 100 with pointer capture, may be <100 without)
    - Assert that pointer capture is active during drag
    - Assert that RAF throttling is batching updates
  - The test assertions should match the Expected Behavior Properties from design:
    - Frame rate >= 55fps during rapid drag (Property 1: Bug Condition)
    - All mousemove events are delivered (100% event delivery)
    - Panel follows cursor smoothly without jank
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause:
    - Frame rate drops below 30fps during rapid drag
    - Some mousemove events are not processed (event loss)
    - Panel stops following cursor intermittently
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.4, 1.5, 1.6, 2.4, 2.5, 2.6_

- [x] 2. Write bug condition exploration test - Rapid resize performance degradation
  - **Property 1: Bug Condition** - Performance Degradation During Rapid Resize
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **GOAL**: Surface counterexamples that demonstrate resize performance bug
  - **Scoped PBT Approach**: Scope the property to rapid resize scenarios (100+ consecutive mousemove events)
  - Test implementation details from Bug Condition in design:
    - Simulate rapid mousemove events during resize operation (100 events in quick succession)
    - Measure frame rate during resize (should be 60fps with fix, <30fps without)
    - Count reflow/repaint operations (should be minimal with RAF throttling)
    - Assert that RAF throttling is batching updates
  - The test assertions should match the Expected Behavior Properties from design:
    - Frame rate >= 55fps during rapid resize (Property 1: Bug Condition)
    - Minimal reflows/repaints (batched updates)
    - Panel dimensions update smoothly without stuttering
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found:
    - Frame rate drops below 30fps during rapid resize
    - Excessive reflows/repaints on each mousemove event
    - Visible stuttering and jank during resize
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.2, 1.6, 2.2, 2.6_

- [x] 3. Write bug condition exploration test - Event listener accumulation
  - **Property 1: Bug Condition** - Event Listener Memory Leak
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **GOAL**: Surface counterexamples that demonstrate event listener accumulation
  - **Scoped PBT Approach**: Scope the property to multiple consecutive drag operations (10+ operations)
  - Test implementation details from Bug Condition in design:
    - Perform 10 consecutive drag operations in sequence
    - Count active event listeners before and after each operation
    - Measure memory usage before and after operations
    - Assert that event listeners are properly cleaned up
  - The test assertions should match the Expected Behavior Properties from design:
    - Event listener count remains constant across operations (Property 2: Preservation)
    - Memory usage remains constant (no leaks)
    - Performance consistent across multiple operations
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found:
    - Event listeners accumulate after each operation
    - Memory usage increases with each operation
    - Performance degrades over time
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.3, 2.3_

- [x] 4. Write bug condition exploration test - Fast mouse movement event loss
  - **Property 1: Bug Condition** - Event Loss During Fast Mouse Movement
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **GOAL**: Surface counterexamples that demonstrate event loss during fast movements
  - **Scoped PBT Approach**: Scope the property to very fast mouse movements (500px/frame)
  - Test implementation details from Bug Condition in design:
    - Simulate mouse movement at 500px/frame (very fast)
    - Verify panel follows cursor continuously without gaps
    - Assert that all pointer events are captured
  - The test assertions should match the Expected Behavior Properties from design:
    - Panel follows cursor continuously (Property 1: Bug Condition)
    - No gaps or jumps in cursor tracking
    - Pointer capture is active
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found:
    - Panel stops following cursor during fast movements
    - Gaps in cursor tracking
    - Pointer events are lost
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.4, 1.5, 2.4, 2.5_

---

## Phase 2: Preservation Checking (BEFORE Fix)

- [x] 5. Write preservation property tests - localStorage persistence
  - **Property 2: Preservation** - localStorage Position Persistence
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: On unfixed code, after drag completes, panel position is saved to localStorage with key format `draggable_position_{dialogId}`
  - Observe: On unfixed code, after ModernPanel drag completes, position is saved (if persistence implemented)
  - Write property-based test: For all drag operations that complete successfully, panel position is saved to localStorage with correct key format
  - Verify test passes on UNFIXED code
  - Test implementation details from Preservation Requirements in design:
    - Drag panel to new position
    - Release mouse button
    - Verify localStorage contains position with correct key
    - Verify position persists across page reloads
  - The test assertions should match the Preservation Requirements from design:
    - Position saved with correct storage key format (Requirement 3.1, 3.8)
    - Position persists across page reloads
    - Correct coordinates are stored
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test PASSES (this confirms baseline behavior to preserve)
  - Mark task complete when test is written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.8_

- [x] 6. Write preservation property tests - dimension constraints
  - **Property 2: Preservation** - Dimension Constraints Respected
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: On unfixed code, when resizing panel below minWidth, panel respects minWidth constraint
  - Observe: On unfixed code, when resizing panel below minHeight, panel respects minHeight constraint
  - Write property-based test: For all resize operations, final dimensions respect minWidth and minHeight constraints
  - Verify test passes on UNFIXED code
  - Test implementation details from Preservation Requirements in design:
    - Resize panel to smaller than minWidth
    - Verify panel width equals minWidth (not smaller)
    - Resize panel to smaller than minHeight
    - Verify panel height equals minHeight (not smaller)
  - The test assertions should match the Preservation Requirements from design:
    - minWidth constraint enforced (Requirement 3.2)
    - minHeight constraint enforced (Requirement 3.2)
    - Panel cannot be resized below minimum dimensions
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test PASSES (this confirms baseline behavior to preserve)
  - Mark task complete when test is written, run, and passing on unfixed code
  - _Requirements: 3.2_

- [x] 7. Write preservation property tests - mobile behavior
  - **Property 2: Preservation** - Mobile Drag Disabled
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: On unfixed code, on mobile viewport, drag operations are disabled
  - Observe: On unfixed code, on mobile viewport, panel remains in default position
  - Write property-based test: For all drag attempts on mobile viewport, panel position does not change
  - Verify test passes on UNFIXED code
  - Test implementation details from Preservation Requirements in design:
    - Set viewport to mobile size (max-width: 1023px)
    - Attempt to drag panel
    - Verify panel position unchanged
  - The test assertions should match the Preservation Requirements from design:
    - Drag disabled on mobile (Requirement 3.3)
    - Panel remains in default position
    - No drag operation occurs
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test PASSES (this confirms baseline behavior to preserve)
  - Mark task complete when test is written, run, and passing on unfixed code
  - _Requirements: 3.3_

- [x] 8. Write preservation property tests - layout mode respect
  - **Property 2: Preservation** - Layout Mode Drag Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: On unfixed code, in overlay layout mode, drag is enabled
  - Observe: On unfixed code, in stacked layout mode, drag is disabled
  - Observe: On unfixed code, in docked layout mode, drag is disabled
  - Write property-based test: For all layout modes, drag behavior is correct (enabled in overlay, disabled in others)
  - Verify test passes on UNFIXED code
  - Test implementation details from Preservation Requirements in design:
    - Test drag in overlay layout (should work)
    - Test drag in stacked layout (should not work)
    - Test drag in docked layout (should not work)
  - The test assertions should match the Preservation Requirements from design:
    - Drag enabled in overlay mode (Requirement 3.4)
    - Drag disabled in stacked mode (Requirement 3.4)
    - Drag disabled in docked mode (Requirement 3.4)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test PASSES (this confirms baseline behavior to preserve)
  - Mark task complete when test is written, run, and passing on unfixed code
  - _Requirements: 3.4_

- [x] 9. Write preservation property tests - header-only drag trigger
  - **Property 2: Preservation** - Header-Only Drag Trigger
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: On unfixed code, dragging header area triggers drag operation
  - Observe: On unfixed code, dragging content area does not trigger drag operation
  - Write property-based test: For all mouse positions, only header area triggers drag
  - Verify test passes on UNFIXED code
  - Test implementation details from Preservation Requirements in design:
    - Click and drag on header area (should drag)
    - Click and drag on content area (should not drag)
    - Click and drag on footer area (should not drag)
  - The test assertions should match the Preservation Requirements from design:
    - Header drag trigger works (Requirement 3.5)
    - Content area does not trigger drag (Requirement 3.5)
    - Only header area triggers drag
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test PASSES (this confirms baseline behavior to preserve)
  - Mark task complete when test is written, run, and passing on unfixed code
  - _Requirements: 3.5_

- [x] 10. Write preservation property tests - resize handle trigger
  - **Property 2: Preservation** - Resize Handle Trigger
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: On unfixed code, dragging bottom-right corner triggers resize
  - Observe: On unfixed code, dragging other areas does not trigger resize
  - Write property-based test: For all mouse positions, only bottom-right corner triggers resize
  - Verify test passes on UNFIXED code
  - Test implementation details from Preservation Requirements in design:
    - Click and drag on bottom-right corner (should resize)
    - Click and drag on other corners (should not resize)
    - Click and drag on edges (should not resize)
  - The test assertions should match the Preservation Requirements from design:
    - Bottom-right corner resize trigger works (Requirement 3.6)
    - Other areas do not trigger resize (Requirement 3.6)
    - Only bottom-right corner triggers resize
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test PASSES (this confirms baseline behavior to preserve)
  - Mark task complete when test is written, run, and passing on unfixed code
  - _Requirements: 3.6_

- [x] 11. Write preservation property tests - cursor feedback
  - **Property 2: Preservation** - Cursor Feedback During Drag/Resize
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: On unfixed code, during drag, cursor changes to 'grabbing'
  - Observe: On unfixed code, after drag ends, cursor returns to normal
  - Observe: On unfixed code, during resize, cursor changes to 'se-resize'
  - Observe: On unfixed code, after resize ends, cursor returns to normal
  - Write property-based test: For all drag/resize operations, cursor feedback is correct
  - Verify test passes on UNFIXED code
  - Test implementation details from Preservation Requirements in design:
    - Start drag, verify cursor is 'grabbing'
    - End drag, verify cursor returns to normal
    - Start resize, verify cursor is 'se-resize'
    - End resize, verify cursor returns to normal
  - The test assertions should match the Preservation Requirements from design:
    - Cursor changes to 'grabbing' during drag (Requirement 3.10)
    - Cursor returns to normal after drag (Requirement 3.10)
    - Cursor changes to 'se-resize' during resize
    - Cursor returns to normal after resize
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test PASSES (this confirms baseline behavior to preserve)
  - Mark task complete when test is written, run, and passing on unfixed code
  - _Requirements: 3.10_

- [x] 12. Write preservation property tests - modal handling
  - **Property 2: Preservation** - Modal Non-Drag Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: On unfixed code, modals with data-modal-content attribute are not dragged
  - Observe: On unfixed code, modal position remains unchanged after drag attempt
  - Write property-based test: For all drag attempts on modals with data-modal-content, position does not change
  - Verify test passes on UNFIXED code
  - Test implementation details from Preservation Requirements in design:
    - Attempt to drag modal with data-modal-content attribute
    - Verify modal position unchanged
    - Verify drag operation is skipped
  - The test assertions should match the Preservation Requirements from design:
    - Modals with data-modal-content not dragged (Requirement 3.9)
    - Modal position remains unchanged (Requirement 3.9)
    - Drag operation is skipped for modals
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test PASSES (this confirms baseline behavior to preserve)
  - Mark task complete when test is written, run, and passing on unfixed code
  - _Requirements: 3.9_

---

## Phase 3: Implementation

- [x] 13. Implement pointer capture and RAF throttling in DraggableDialogManager

  - [x] 13.1 Implement pointer capture for drag operations
    - Add `setPointerCapture()` call in `handleMouseDown` when drag begins
    - Add `releasePointerCapture()` call in `handleMouseUp` when drag ends
    - Wrap pointer capture in try-catch to handle non-PointerEvent cases
    - This ensures all mousemove events are delivered to the dialog during drag
    - _Bug_Condition: isBugCondition(input) where input.isDragOperation AND input.mouseMovementSpeed > THRESHOLD AND NOT pointerCaptureActive_
    - _Expected_Behavior: expectedBehavior(result) - All pointer events delivered, smooth cursor tracking_
    - _Preservation: Pointer capture does not affect non-drag operations_
    - _Requirements: 1.5, 2.5_

  - [x] 13.2 Implement RAF-based throttling for drag style updates
    - Wrap style updates in `requestAnimationFrame()` callback
    - Cancel previous RAF before scheduling new one to prevent queuing
    - Store animation frame ID in dragState ref
    - This batches updates to occur once per frame, reducing reflows/repaints
    - _Bug_Condition: isBugCondition(input) where input.isDragOperation AND styleUpdatesPerFrame > 1_
    - _Expected_Behavior: expectedBehavior(result) - Batched style updates, 60fps performance_
    - _Preservation: RAF throttling does not affect non-drag operations_
    - _Requirements: 1.6, 2.6_

  - [x] 13.3 Optimize style updates with willChange property
    - Add `willChange: 'left, top'` during drag to hint browser about upcoming changes
    - Remove `willChange` after drag completes to avoid memory overhead
    - Batch all style updates into single RAF callback
    - This reduces browser reflows and repaints
    - _Bug_Condition: isBugCondition(input) where input.isDragOperation AND styleUpdatesPerFrame > 1_
    - _Expected_Behavior: expectedBehavior(result) - Optimized style updates, minimal reflows_
    - _Preservation: willChange property does not affect non-drag operations_
    - _Requirements: 2.6_

  - [x] 13.4 Improve event listener cleanup
    - Store animation frame ID in dragState ref
    - Cancel animation frame in handleMouseUp before cleanup
    - Use explicit removeEventListener calls with proper cleanup
    - Ensure cleanup on all code paths (including error cases)
    - This prevents memory leaks and ensures cleanup on all code paths
    - _Bug_Condition: isBugCondition(input) where input.isDragOperation AND NOT eventListenerCleanupScheduled_
    - _Expected_Behavior: expectedBehavior(result) - Proper cleanup, no memory leaks_
    - _Preservation: Event listener cleanup does not affect non-drag operations_
    - _Requirements: 1.3, 2.3_

  - [x] 13.5 Add passive event listeners
    - Use `{ passive: true }` on mousemove listener to allow browser optimizations
    - This improves scroll performance and allows browser to optimize event handling
    - _Bug_Condition: isBugCondition(input) where input.isDragOperation AND NOT passiveEventListeners_
    - _Expected_Behavior: expectedBehavior(result) - Optimized event handling, better performance_
    - _Preservation: Passive event listeners do not affect non-drag operations_
    - _Requirements: 2.6_

- [x] 14. Implement pointer capture and RAF throttling in ModernPanel

  - [x] 14.1 Implement pointer capture for drag operations
    - Add `setPointerCapture()` call in `handleDragStart` when drag begins
    - Add `releasePointerCapture()` call in `handleMouseUp` when drag ends
    - Wrap pointer capture in try-catch to handle non-PointerEvent cases
    - This ensures smooth tracking during fast mouse movements
    - _Bug_Condition: isBugCondition(input) where input.isDragOperation AND input.mouseMovementSpeed > THRESHOLD AND NOT pointerCaptureActive_
    - _Expected_Behavior: expectedBehavior(result) - All pointer events delivered, smooth cursor tracking_
    - _Preservation: Pointer capture does not affect non-drag operations_
    - _Requirements: 1.5, 2.5_

  - [x] 14.2 Implement RAF-based throttling for drag style updates
    - Wrap drag style updates in `requestAnimationFrame()` callback
    - Cancel previous RAF before scheduling new one to prevent queuing
    - Store animation frame ID in dragStateRef
    - This prevents excessive style updates and reflows
    - _Bug_Condition: isBugCondition(input) where input.isDragOperation AND styleUpdatesPerFrame > 1_
    - _Expected_Behavior: expectedBehavior(result) - Batched style updates, 60fps performance_
    - _Preservation: RAF throttling does not affect non-drag operations_
    - _Requirements: 1.6, 2.6_

  - [x] 14.3 Implement RAF-based throttling for resize style updates
    - Wrap resize style updates in `requestAnimationFrame()` callback
    - Cancel previous RAF before scheduling new one to prevent queuing
    - Store animation frame ID in resize handler
    - This prevents excessive style updates during resize
    - _Bug_Condition: isBugCondition(input) where input.isResizeOperation AND styleUpdatesPerFrame > 1_
    - _Expected_Behavior: expectedBehavior(result) - Batched style updates, 60fps performance_
    - _Preservation: RAF throttling does not affect non-resize operations_
    - _Requirements: 1.2, 1.6, 2.2, 2.6_

  - [x] 14.4 Avoid React state updates during drag
    - Remove `setIsDragging(true)` from drag handler
    - Use ref-based state tracking instead of React state
    - Only update React state after drag completes (if visual feedback needed)
    - This prevents React re-renders from blocking drag performance
    - _Bug_Condition: isBugCondition(input) where input.isDragOperation AND reactStateUpdatesPerFrame > 0_
    - _Expected_Behavior: expectedBehavior(result) - No React re-renders during drag, smooth performance_
    - _Preservation: React state updates do not affect non-drag operations_
    - _Requirements: 2.1_

  - [x] 14.5 Optimize style updates with willChange property
    - Add `willChange: 'left, top'` during drag to hint browser about upcoming changes
    - Add `willChange: 'width, height'` during resize to hint browser about upcoming changes
    - Remove `willChange` after operation completes to avoid memory overhead
    - Batch all style updates into single RAF callback
    - This reduces browser reflows and repaints
    - _Bug_Condition: isBugCondition(input) where input.isDragOperation OR input.isResizeOperation AND styleUpdatesPerFrame > 1_
    - _Expected_Behavior: expectedBehavior(result) - Optimized style updates, minimal reflows_
    - _Preservation: willChange property does not affect non-drag/resize operations_
    - _Requirements: 2.6_

  - [x] 14.6 Improve event listener cleanup
    - Store animation frame ID in dragStateRef and resize handler
    - Cancel animation frame in handleMouseUp before cleanup
    - Use explicit removeEventListener calls with proper cleanup
    - Ensure cleanup on all code paths (including error cases)
    - This ensures cleanup on all code paths and prevents memory leaks
    - _Bug_Condition: isBugCondition(input) where input.isDragOperation AND NOT eventListenerCleanupScheduled_
    - _Expected_Behavior: expectedBehavior(result) - Proper cleanup, no memory leaks_
    - _Preservation: Event listener cleanup does not affect non-drag operations_
    - _Requirements: 1.3, 2.3_

  - [x] 14.7 Add passive event listeners
    - Use `{ passive: true }` on mousemove listeners
    - This allows browser optimizations and improves performance
    - _Bug_Condition: isBugCondition(input) where input.isDragOperation AND NOT passiveEventListeners_
    - _Expected_Behavior: expectedBehavior(result) - Optimized event handling, better performance_
    - _Preservation: Passive event listeners do not affect non-drag operations_
    - _Requirements: 2.6_

---

## Phase 4: Verification

- [x] 15. Verify bug condition exploration test now passes
  - **Property 1: Expected Behavior** - Rapid Drag Performance Fixed
  - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
  - The test from task 1 encodes the expected behavior
  - When this test passes, it confirms the expected behavior is satisfied
  - Run bug condition exploration test from step 1 (rapid drag performance)
  - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
  - Verify frame rate >= 55fps during rapid drag
  - Verify all mousemove events are processed (100% delivery)
  - Verify panel follows cursor smoothly without jank
  - _Requirements: 2.1, 2.4, 2.5, 2.6_

- [x] 16. Verify bug condition exploration test now passes
  - **Property 1: Expected Behavior** - Rapid Resize Performance Fixed
  - **IMPORTANT**: Re-run the SAME test from task 2 - do NOT write a new test
  - Run bug condition exploration test from step 2 (rapid resize performance)
  - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
  - Verify frame rate >= 55fps during rapid resize
  - Verify minimal reflows/repaints (batched updates)
  - Verify panel dimensions update smoothly without stuttering
  - _Requirements: 2.2, 2.6_

- [x] 17. Verify bug condition exploration test now passes
  - **Property 1: Expected Behavior** - Event Listener Cleanup Fixed
  - **IMPORTANT**: Re-run the SAME test from task 3 - do NOT write a new test
  - Run bug condition exploration test from step 3 (event listener accumulation)
  - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
  - Verify event listener count remains constant across operations
  - Verify memory usage remains constant (no leaks)
  - Verify performance consistent across multiple operations
  - _Requirements: 2.3_

- [x] 18. Verify bug condition exploration test now passes
  - **Property 1: Expected Behavior** - Fast Mouse Movement Event Capture Fixed
  - **IMPORTANT**: Re-run the SAME test from task 4 - do NOT write a new test
  - Run bug condition exploration test from step 4 (fast mouse movement event loss)
  - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
  - Verify panel follows cursor continuously without gaps
  - Verify all pointer events are captured
  - Verify smooth cursor tracking at high speeds
  - _Requirements: 2.4, 2.5_

- [x] 19. Verify preservation tests still pass
  - **Property 2: Preservation** - All Preservation Tests Pass
  - **IMPORTANT**: Re-run the SAME tests from tasks 5-12 - do NOT write new tests
  - Run all preservation property tests from Phase 2
  - **EXPECTED OUTCOME**: All tests PASS (confirms no regressions)
  - Verify localStorage persistence still works (task 5)
  - Verify dimension constraints still enforced (task 6)
  - Verify mobile behavior still disabled (task 7)
  - Verify layout mode respect still works (task 8)
  - Verify header-only drag trigger still works (task 9)
  - Verify resize handle trigger still works (task 10)
  - Verify cursor feedback still works (task 11)
  - Verify modal handling still works (task 12)
  - Confirm all tests still pass after fix (no regressions)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 3.9, 3.10_

- [x] 20. Checkpoint - Ensure all tests pass
  - Verify all exploration tests pass (tasks 15-18)
  - Verify all preservation tests pass (task 19)
  - Verify no regressions in existing functionality
  - Verify performance improvements are measurable
  - Ensure all tests pass, ask the user if questions arise
  - Document any issues or edge cases discovered during testing
  - Mark complete when all tests pass and no regressions found

---

## Testing Notes

### Exploration Tests (Tasks 1-4)
These tests are designed to surface counterexamples that demonstrate the performance bug on unfixed code. They should FAIL on unfixed code and PASS after the fix is implemented.

### Preservation Tests (Tasks 5-12)
These tests are designed to verify that existing functionality is preserved. They should PASS on both unfixed and fixed code, ensuring no regressions.

### Verification Tests (Tasks 15-20)
These tests re-run the exploration and preservation tests after the fix is implemented to verify the fix works correctly and doesn't break existing functionality.

### Test Framework Recommendations
- Use a performance testing library (e.g., `performance.now()`, `requestAnimationFrame` timing)
- Use a property-based testing library (e.g., `fast-check` for JavaScript/TypeScript)
- Use DOM testing utilities (e.g., `@testing-library/react`, `@testing-library/user-event`)
- Measure frame rate using `requestAnimationFrame` callbacks
- Measure memory usage using browser DevTools or `performance.memory` API
- Measure reflow/repaint count using browser DevTools or performance observer

### Test Execution Order
1. Write and run exploration tests on UNFIXED code (expect failures)
2. Write and run preservation tests on UNFIXED code (expect passes)
3. Implement the fix
4. Re-run exploration tests on FIXED code (expect passes)
5. Re-run preservation tests on FIXED code (expect passes)
6. Run integration tests to verify no regressions
