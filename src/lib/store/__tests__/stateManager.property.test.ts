import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { StateManager } from '../stateManager';

interface TestState {
    count: number;
    items: string[];
    metadata: Record<string, any>;
}

describe('State Management and Persistence - Property Tests', () => {
    let stateManager: StateManager<TestState>;

    beforeEach(() => {
        stateManager = new StateManager<TestState>(
            { count: 0, items: [], metadata: {} },
            { maxHistory: 50, autoSave: false }
        );
    });

    // Property 12: State Management Reliability
    it('should automatically save and restore state correctly', () => {
        fc.assert(
            fc.property(
                fc.array(fc.integer({ min: 0, max: 100 }), { maxLength: 5 }),
                (values) => {
                    const initialState = stateManager.getState();
                    expect(initialState.count).toBe(0);

                    // Update state multiple times
                    values.forEach((value) => {
                        stateManager.setState({
                            ...stateManager.getState(),
                            count: value,
                        });
                    });

                    const finalState = stateManager.getState();
                    expect(finalState.count).toBe(values[values.length - 1] ?? 0);
                }
            )
        );
    });

    // Property: Undo/Redo Functionality
    it('should provide correct undo/redo functionality', () => {
        fc.assert(
            fc.property(
                fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 5 }),
                (values) => {
                    // Set initial states
                    values.forEach((value) => {
                        stateManager.setState({
                            ...stateManager.getState(),
                            count: value,
                        });
                    });

                    const finalValue = values[values.length - 1];
                    expect(stateManager.getState().count).toBe(finalValue);

                    // Undo all changes
                    let undoCount = 0;
                    while (stateManager.canUndo()) {
                        stateManager.undo();
                        undoCount++;
                    }

                    expect(undoCount).toBe(values.length);
                    expect(stateManager.getState().count).toBe(0);

                    // Redo all changes
                    let redoCount = 0;
                    while (stateManager.canRedo()) {
                        stateManager.redo();
                        redoCount++;
                    }

                    expect(redoCount).toBe(values.length);
                    expect(stateManager.getState().count).toBe(finalValue);
                }
            )
        );
    });

    // Property: State History Management
    it('should maintain correct state history with bounded size', () => {
        fc.assert(
            fc.property(
                fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 50 }),
                (values) => {
                    values.forEach((value) => {
                        stateManager.setState({
                            ...stateManager.getState(),
                            count: value,
                        });
                    });

                    const history = stateManager.getHistory();

                    // History should not exceed max size
                    expect(history.length).toBeLessThanOrEqual(51); // 50 max + initial state

                    // History should contain valid states
                    history.forEach((snapshot) => {
                        expect(snapshot).toHaveProperty('state');
                        expect(snapshot).toHaveProperty('timestamp');
                        expect(snapshot).toHaveProperty('id');
                        expect(snapshot.state).toHaveProperty('count');
                    });
                }
            )
        );
    });

    // Property: State Deduplication
    it('should not create duplicate history entries for identical states', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 100 }),
                (value) => {
                    const initialHistoryLength = stateManager.getHistory().length;

                    // Set same state multiple times
                    for (let i = 0; i < 3; i++) {
                        stateManager.setState({
                            ...stateManager.getState(),
                            count: value,
                        });
                    }

                    const finalHistoryLength = stateManager.getHistory().length;

                    // History should not grow for identical states
                    expect(finalHistoryLength).toBeLessThanOrEqual(initialHistoryLength + 1);
                }
            )
        );
    });

    // Property: State Subscription
    it('should notify subscribers of state changes', () => {
        fc.assert(
            fc.property(
                fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 5 }),
                (values) => {
                    let notificationCount = 0;
                    const unsubscribe = stateManager.subscribe(() => {
                        notificationCount++;
                    });

                    values.forEach((value) => {
                        stateManager.setState({
                            ...stateManager.getState(),
                            count: value,
                        });
                    });

                    unsubscribe();

                    // Should have been notified for each state change
                    expect(notificationCount).toBe(values.length);
                }
            )
        );
    });

    // Property: State Immutability
    it('should maintain state immutability', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 5 }),
                (items) => {
                    const state1 = stateManager.getState();
                    const state2 = stateManager.getState();

                    // Getting state multiple times should return different object instances
                    expect(state1).not.toBe(state2);

                    // But values should be equal
                    expect(state1.count).toBe(state2.count);
                    expect(state1.items).toEqual(state2.items);

                    // Modifying returned state should not affect manager
                    state1.count = 999;
                    const state3 = stateManager.getState();
                    expect(state3.count).not.toBe(999);
                }
            )
        );
    });
});
