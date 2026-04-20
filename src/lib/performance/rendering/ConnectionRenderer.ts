/**
 * Connection Rendering Optimization
 * Efficient batch rendering for connection lines with incremental updates
 */

import type { ConnectionRenderBatch, ConnectionRenderConfig } from '../types';

export class ConnectionRenderer {
  private config: Required<ConnectionRenderConfig>;
  private cache: Map<string, ConnectionRenderBatch> = new Map();
  private lastUpdate: number = 0;
  private updateThrottle = 16; // ~60fps

  constructor(config: ConnectionRenderConfig = {}) {
    this.config = {
      batchSize: config.batchSize || 100,
      useCanvas: config.useCanvas ?? false,
      useSVG: config.useSVG ?? true,
      zoomLevel: config.zoomLevel || 1,
    };
  }

  /**
   * Batch connection updates for efficient rendering
   */
  batchConnections(
    connections: Array<{
      id: string;
      from: { x: number; y: number };
      to: { x: number; y: number };
      visible: boolean;
    }>
  ): ConnectionRenderBatch {
    const batch: ConnectionRenderBatch = {
      connections: [],
      timestamp: Date.now(),
    };

    // Filter and batch visible connections
    for (const conn of connections) {
      if (!conn.visible) continue;

      batch.connections.push({
        id: conn.id,
        from: conn.from,
        to: conn.to,
        visible: true,
      });

      if (batch.connections.length >= this.config.batchSize) {
        break;
      }
    }

    return batch;
  }

  /**
   * Incremental update - only redraw affected connections
   */
  incrementalUpdate(
    changedIds: Set<string>,
    allConnections: Array<{
      id: string;
      from: { x: number; y: number };
      to: { x: number; y: number };
      visible: boolean;
    }>
  ): ConnectionRenderBatch {
    const batch: ConnectionRenderBatch = {
      connections: [],
      timestamp: Date.now(),
    };

    for (const conn of allConnections) {
      if (changedIds.has(conn.id) && conn.visible) {
        batch.connections.push({
          id: conn.id,
          from: conn.from,
          to: conn.to,
          visible: true,
        });
      }
    }

    return batch;
  }

  /**
   * Cache connection batches to avoid re-computation
   */
  getCachedBatch(cacheKey: string): ConnectionRenderBatch | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    // Cache is valid for 100ms
    if (Date.now() - cached.timestamp < 100) {
      return cached;
    }

    this.cache.delete(cacheKey);
    return null;
  }

  /**
   * Store a batch in cache
   */
  setCachedBatch(cacheKey: string, batch: ConnectionRenderBatch): void {
    this.cache.set(cacheKey, batch);

    // Limit cache size
    if (this.cache.size > 50) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * Throttled update to prevent excessive renders
   */
  throttledUpdate(updateFn: () => void): void {
    const now = Date.now();
    if (now - this.lastUpdate < this.updateThrottle) {
      return;
    }
    this.lastUpdate = now;
    updateFn();
  }

  /**
   * Zoom-aware rendering - adjust rendering based on zoom level
   */
  setZoomLevel(zoom: number): void {
    this.config.zoomLevel = zoom;
  }

  /**
   * Get rendering configuration
   */
  getConfig(): Required<ConnectionRenderConfig> {
    return { ...this.config };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Spatial indexing for connection visibility
 */
export class ConnectionSpatialIndex {
  private index: Map<string, Set<string>> = new Map(); // cellKey -> connectionIds
  private cellSize = 100;

  constructor(cellSize = 100) {
    this.cellSize = cellSize;
  }

  /**
   * Get cell key for a point
   */
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  /**
   * Index a connection
   */
  indexConnection(
    id: string,
    from: { x: number; y: number },
    to: { x: number; y: number }
  ): void {
    // Get all cells along the line
    const cells = this.getCellsAlongLine(from, to);

    for (const cellKey of cells) {
      if (!this.index.has(cellKey)) {
        this.index.set(cellKey, new Set());
      }
      this.index.get(cellKey)!.add(id);
    }
  }

  /**
   * Get cells along a line using Bresenham's algorithm
   */
  private getCellsAlongLine(
    from: { x: number; y: number },
    to: { x: number; y: number }
  ): Set<string> {
    const cells = new Set<string>();

    const x0 = Math.floor(from.x / this.cellSize);
    const y0 = Math.floor(from.y / this.cellSize);
    const x1 = Math.floor(to.x / this.cellSize);
    const y1 = Math.floor(to.y / this.cellSize);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0;
    let y = y0;

    while (true) {
      cells.add(`${x},${y}`);

      if (x === x1 && y === y1) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    return cells;
  }

  /**
   * Query connections in a viewport
   */
  queryViewport(
    x: number,
    y: number,
    width: number,
    height: number
  ): Set<string> {
    const result = new Set<string>();

    const startCellX = Math.floor(x / this.cellSize);
    const startCellY = Math.floor(y / this.cellSize);
    const endCellX = Math.floor((x + width) / this.cellSize);
    const endCellY = Math.floor((y + height) / this.cellSize);

    for (let cx = startCellX; cx <= endCellX; cx++) {
      for (let cy = startCellY; cy <= endCellY; cy++) {
        const cellKey = `${cx},${cy}`;
        const connections = this.index.get(cellKey);
        if (connections) {
          for (const id of connections) {
            result.add(id);
          }
        }
      }
    }

    return result;
  }

  /**
   * Remove a connection from the index
   */
  removeConnection(id: string): void {
    for (const cell of this.index.values()) {
      cell.delete(id);
    }
  }

  /**
   * Clear the index
   */
  clear(): void {
    this.index.clear();
  }
}
