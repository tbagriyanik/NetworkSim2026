'use client';

import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import type { VirtualListConfig, VirtualListItem } from '../types';

interface VirtualDeviceListProps<T = any> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscanCount?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualDeviceList<T = any>({
  items,
  itemHeight,
  renderItem,
  overscanCount = 5,
  className = '',
  onScroll
}: VirtualDeviceListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Track container height
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Calculate visible range
  const { visibleStart, visibleEnd, totalHeight } = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const visibleStart = Math.max(0, Math.floor(scrollTop / itemHeight) - overscanCount);
    const visibleEnd = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscanCount
    );
    return { visibleStart, visibleEnd, totalHeight };
  }, [scrollTop, containerHeight, itemHeight, items.length, overscanCount]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Get visible items
  const visibleItems = useMemo(() => {
    const itemsToRender: Array<{ item: T; index: number }> = [];
    for (let i = visibleStart; i < visibleEnd; i++) {
      itemsToRender.push({ item: items[i], index: i });
    }
    return itemsToRender;
  }, [items, visibleStart, visibleEnd]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      onScroll={handleScroll}
      style={{ height: '100%' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              height: itemHeight,
              width: '100%',
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}
