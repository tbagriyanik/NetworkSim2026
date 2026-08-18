import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { RefObject } from 'react';
import { useOutputSearch } from '@/hooks/useOutputSearch';

function makeContainer(html: string): RefObject<HTMLDivElement | null> {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  return { current: container };
}

function cleanup(containerRef: RefObject<HTMLDivElement | null>) {
  containerRef.current?.remove();
}

describe('useOutputSearch', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('counts all matches in the output container', () => {
    const containerRef = makeContainer('<mark>ip</mark> x <mark>ip</mark> config <mark>ip</mark>');
    const { result } = renderHook(() => useOutputSearch({ searchQuery: 'ip', containerRef }));

    expect(result.current.matchCount).toBe(3);
    expect(result.current.hasQuery).toBe(true);
    expect(result.current.matchIndex).toBe(-1);

    cleanup(containerRef);
  });

  it('moves to the next match on goToNext and wraps around', () => {
    const containerRef = makeContainer('<mark>ip</mark> x <mark>ip</mark> y <mark>ip</mark>');
    const { result } = renderHook(() => useOutputSearch({ searchQuery: 'ip', containerRef }));

    act(() => result.current.goToNext());
    expect(result.current.matchIndex).toBe(0);
    expect(containerRef.current?.querySelectorAll('mark.search-active').length).toBe(1);

    act(() => result.current.goToNext());
    expect(result.current.matchIndex).toBe(1);
    expect(containerRef.current?.querySelectorAll('mark.search-active')[0]).toBe(containerRef.current?.querySelectorAll('mark')[1]);

    act(() => result.current.goToNext());
    expect(result.current.matchIndex).toBe(2);

    // wraps around back to the first match
    act(() => result.current.goToNext());
    expect(result.current.matchIndex).toBe(0);

    cleanup(containerRef);
  });

  it('moves to the previous match on goToPrev', () => {
    const containerRef = makeContainer('<mark>ip</mark> x <mark>ip</mark>');
    const { result } = renderHook(() => useOutputSearch({ searchQuery: 'ip', containerRef }));

    act(() => result.current.goToNext());
    act(() => result.current.goToNext());
    expect(result.current.matchIndex).toBe(1);

    act(() => result.current.goToPrev());
    expect(result.current.matchIndex).toBe(0);

    // wraps around back to the last match
    act(() => result.current.goToPrev());
    expect(result.current.matchIndex).toBe(1);

    cleanup(containerRef);
  });

  it('resets navigation when the query changes until Enter is pressed again', () => {
    const containerRef = makeContainer('<mark>ip</mark> x <mark>ip</mark>');
    const { result, rerender } = renderHook(
      ({ query }: { query: string }) => useOutputSearch({ searchQuery: query, containerRef }),
      { initialProps: { query: 'ip' } }
    );

    act(() => result.current.goToNext());
    expect(result.current.matchIndex).toBe(0);

    // typing changes the query: navigation restarts at -1
    rerender({ query: 'ipconfig' });
    expect(result.current.matchIndex).toBe(-1);

    // Enter again starts from the first match
    act(() => result.current.goToNext());
    expect(result.current.matchIndex).toBe(0);

    cleanup(containerRef);
  });

  it('handles no matches', () => {
    const containerRef = makeContainer('no matches here');
    const { result } = renderHook(() => useOutputSearch({ searchQuery: 'ip', containerRef }));

    expect(result.current.matchCount).toBe(0);
    act(() => result.current.goToNext());
    expect(result.current.matchIndex).toBe(-1);

    cleanup(containerRef);
  });

  it('clears count when the query is emptied', () => {
    const containerRef = makeContainer('<mark>ip</mark>');
    const { result, rerender } = renderHook(
      ({ query }: { query: string }) => useOutputSearch({ searchQuery: query, containerRef }),
      { initialProps: { query: 'ip' } }
    );

    expect(result.current.matchCount).toBe(1);

    rerender({ query: '' });
    expect(result.current.matchCount).toBe(0);
    expect(result.current.hasQuery).toBe(false);

    cleanup(containerRef);
  });
});