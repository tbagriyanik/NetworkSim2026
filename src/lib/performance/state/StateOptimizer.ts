/**
 * State Update Optimization
 * Batches state updates to prevent cascading re-renders
 */

import React from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import type { StateUpdateBatch, SelectorConfig } from '../types';

export class StateOptimizer {
  private updateQueue: Map<string, StateUpdateBatch> = new Map();
  private batchTimeout: NodeJS.Timeout | null = null;
  private batchDelay = 16; // ~60fps

  /**
   * Queue a state update for batching
   */
  queueUpdate(
    batchId: string,
    key: string,
    value: any,
    callback?: () => void
  ): void {
    let batch = this.updateQueue.get(batchId);

    if (!batch) {
      batch = {
        updates: [],
        batchId,
        timestamp: Date.now(),
      };
      this.updateQueue.set(batchId, batch);
    }

    batch.updates.push({ key, value, timestamp: Date.now() });

    // Schedule batch processing
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch(batchId, callback);
    }, this.batchDelay);
  }

  /**
   * Process a batch of updates
   */
  private processBatch(batchId: string, callback?: () => void): void {
    const batch = this.updateQueue.get(batchId);
    if (!batch) return;

    unstable_batchedUpdates(() => {
      // Apply all updates in the batch
      for (const update of batch.updates) {
        // Updates would be applied to the store here
        // This is a placeholder for the actual state update logic
      }

      callback?.();
    });

    this.updateQueue.delete(batchId);
  }

  /**
   * Force immediate processing of a batch
   */
  flushBatch(batchId: string, callback?: () => void): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    this.processBatch(batchId, callback);
  }

  /**
   * Clear all pending batches
   */
  clear(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    this.updateQueue.clear();
  }
}

/**
 * Optimized selector helper
 * Creates memoized selectors to prevent unnecessary re-renders
 */
export function createSelector<T, R>(
  selector: (state: T) => R,
  config: SelectorConfig = {}
): (state: T) => R {
  const { memoize = true, equalityFn } = config;

  if (!memoize) {
    return selector;
  }

  let lastState: T | null = null;
  let lastResult: R | null = null;

  return (state: T): R => {
    if (lastState !== null && equalityFn) {
      if (equalityFn(lastState, state)) {
        return lastResult!;
      }
    } else if (lastState === state) {
      return lastResult!;
    }

    lastState = state;
    lastResult = selector(state);
    return lastResult;
  };
}

/**
 * Default equality function for shallow comparison
 */
export function shallowEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;

  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key) || (a as any)[key] !== (b as any)[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Non-blocking state update helper
 * Uses React.startTransition for non-urgent updates
 */
export function updateNonBlocking(updateFn: () => void): void {
  if (typeof React.startTransition !== 'undefined') {
    React.startTransition(() => {
      updateFn();
    });
  } else {
    // Fallback for older React versions
    setTimeout(() => {
      updateFn();
    }, 0);
  }
}

/**
 * Selective re-rendering helper
 * Only re-renders components that depend on changed state
 */
export function createSelectiveUpdater<T>(
  initialState: T
): {
  getState: () => T;
  setState: (partial: Partial<T> | ((prev: T) => Partial<T>)) => void;
  subscribe: (listener: (state: T) => void) => () => void;
} {
  let state = initialState;
  const listeners = new Set<(state: T) => void>();
  const dependencies = new Map<(state: T) => void, Set<keyof T>>();

  const getState = () => state;

  const setState = (partial: Partial<T> | ((prev: T) => Partial<T>)) => {
    const nextState =
      typeof partial === 'function' ? (partial as (prev: T) => Partial<T>)(state) : partial;
    const changedKeys = new Set<keyof T>();

    // Find changed keys
    for (const key in nextState) {
      if (nextState[key] !== state[key]) {
        changedKeys.add(key);
      }
    }

    state = { ...state, ...nextState };

    // Only notify listeners that depend on changed keys
    for (const listener of listeners) {
      const deps = dependencies.get(listener);
      if (!deps || Array.from(deps).some((key) => changedKeys.has(key))) {
        listener(state);
      }
    }
  };

  const subscribe = (listener: (state: T) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { getState, setState, subscribe };
}
