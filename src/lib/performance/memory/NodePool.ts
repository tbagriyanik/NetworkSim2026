/**
 * Object Pool for memory optimization
 * Reuses objects to reduce garbage collection pressure
 */

import type { PooledObject, ObjectPoolConfig, MemoryProfile } from '../types';

export class NodePool<T extends PooledObject> {
  private pool: T[] = [];
  private active: Set<T> = new Set();
  private config: Required<ObjectPoolConfig>;

  constructor(
    private factory: () => T,
    config: ObjectPoolConfig = {}
  ) {
    this.config = {
      initialSize: config.initialSize || 10,
      maxSize: config.maxSize || 100,
      resetOnRelease: config.resetOnRelease ?? true,
    };

    // Pre-allocate initial pool
    for (let i = 0; i < this.config.initialSize; i++) {
      const obj = this.factory();
      obj.release();
      this.pool.push(obj);
    }
  }

  /**
   * Acquire an object from the pool
   */
  acquire(): T {
    let obj: T;

    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else if (this.active.size < this.config.maxSize) {
      obj = this.factory();
    } else {
      // Pool exhausted, create temporary object
      obj = this.factory();
    }

    obj.acquire();
    this.active.add(obj);
    return obj;
  }

  /**
   * Release an object back to the pool
   */
  release(obj: T): void {
    if (!this.active.has(obj)) return;

    this.active.delete(obj);

    if (this.config.resetOnRelease) {
      obj.reset();
    }

    obj.release();

    // Only keep if under max size
    if (this.pool.length < this.config.maxSize) {
      this.pool.push(obj);
    }
  }

  /**
   * Release all active objects
   */
  releaseAll(): void {
    for (const obj of this.active) {
      this.release(obj);
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      poolSize: this.pool.length,
      activeCount: this.active.size,
      maxSize: this.config.maxSize,
    };
  }

  /**
   * Clear the pool
   */
  clear(): void {
    this.releaseAll();
    this.pool = [];
  }
}

/**
 * Memory profiling utilities
 */
export class MemoryProfiler {
  private snapshots: MemoryProfile[] = [];
  private maxSnapshots = 100;

  /**
   * Take a memory snapshot
   */
  takeSnapshot(): MemoryProfile {
    const snapshot: MemoryProfile = {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      timestamp: Date.now(),
    };

    // Use performance.memory if available (Chrome)
    if (typeof (performance as any).memory !== 'undefined') {
      const memory = (performance as any).memory;
      snapshot.heapUsed = memory.usedJSHeapSize;
      snapshot.heapTotal = memory.totalJSHeapSize;
      snapshot.external = memory.jsHeapSizeLimit;
    }

    this.snapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  /**
   * Get memory usage trend
   */
  getTrend(): {
    current: MemoryProfile;
    average: number;
    peak: number;
  } | null {
    if (this.snapshots.length === 0) return null;

    const current = this.snapshots[this.snapshots.length - 1];
    const average = this.snapshots.reduce((sum, s) => sum + s.heapUsed, 0) / this.snapshots.length;
    const peak = Math.max(...this.snapshots.map(s => s.heapUsed));

    return { current, average, peak };
  }

  /**
   * Clear snapshot history
   */
  clear(): void {
    this.snapshots = [];
  }
}

/**
 * Typed array utilities for efficient data storage
 */
export class TypedArrayUtils {
  /**
   * Create a typed array for coordinates
   */
  static createCoordinateArray(size: number): Float32Array {
    return new Float32Array(size * 2); // x, y for each point
  }

  /**
   * Create a typed array for colors
   */
  static createColorArray(size: number): Uint8Array {
    return new Uint8Array(size * 4); // r, g, b, a for each color
  }

  /**
   * Batch update coordinates
   */
  static updateCoordinates(
    array: Float32Array,
    index: number,
    x: number,
    y: number
  ): void {
    array[index * 2] = x;
    array[index * 2 + 1] = y;
  }

  /**
   * Batch update colors
   */
  static updateColor(
    array: Uint8Array,
    index: number,
    r: number,
    g: number,
    b: number,
    a: number
  ): void {
    array[index * 4] = r;
    array[index * 4 + 1] = g;
    array[index * 4 + 2] = b;
    array[index * 4 + 3] = a;
  }
}
