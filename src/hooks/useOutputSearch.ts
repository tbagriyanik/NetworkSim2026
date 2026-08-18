'use client';

import { useCallback, useEffect, useState } from 'react';

const ACTIVE_CLASS = 'search-active';

interface UseOutputSearchOptions {
  searchQuery: string;
  containerRef: React.RefObject<HTMLElement | null>;
}

export interface UseOutputSearchResult {
  matchIndex: number;
  matchCount: number;
  hasQuery: boolean;
  goToNext: () => void;
  goToPrev: () => void;
}

export function useOutputSearch({ searchQuery, containerRef }: UseOutputSearchOptions): UseOutputSearchResult {
  const [matchIndex, setMatchIndex] = useState(-1);
  const [matchCount, setMatchCount] = useState(0);
  const [navQuery, setNavQuery] = useState(searchQuery);

  const hasQuery = searchQuery.trim().length > 0;

  const getMarks = useCallback(() => {
    const container = containerRef.current;
    if (!container) return [];
    return Array.from(container.querySelectorAll('mark')) as HTMLElement[];
  }, [containerRef]);

  const applyActive = useCallback((index: number) => {
    const container = containerRef.current;
    const marks = getMarks();
    setMatchCount(marks.length);
    marks.forEach((m) => m.classList.remove(ACTIVE_CLASS));
    if (container && index >= 0 && index < marks.length) {
      const active = marks[index];
      active.classList.add(ACTIVE_CLASS);
      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      const offsetTop = activeRect.top - containerRect.top - containerRect.height / 2 + activeRect.height / 2;
      container.scrollTop = Math.max(0, container.scrollTop + offsetTop);
    }
  }, [containerRef, getMarks]);

  // When the query changes before Enter is pressed again, navigation restarts from -1
  const effectiveIndex = navQuery === searchQuery ? matchIndex : -1;

  // Re-apply active highlight + centered scroll after render when query/index changes
  useEffect(() => {
    if (!hasQuery) {
      if (matchCount !== 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reset count when query cleared
        setMatchCount(0);
      }
      return;
    }
    applyActive(effectiveIndex);
  }, [hasQuery, effectiveIndex, applyActive, matchCount]);

  const goToNext = useCallback(() => {
    const marks = getMarks();
    if (marks.length === 0) {
      setMatchIndex(-1);
      setNavQuery(searchQuery);
      return;
    }
    const current = navQuery === searchQuery ? matchIndex : -1;
    const next = (current + 1) % marks.length;
    setMatchIndex(next);
    setNavQuery(searchQuery);
  }, [getMarks, navQuery, searchQuery, matchIndex]);

  const goToPrev = useCallback(() => {
    const marks = getMarks();
    if (marks.length === 0) {
      setMatchIndex(-1);
      setNavQuery(searchQuery);
      return;
    }
    const current = navQuery === searchQuery ? matchIndex : -1;
    const prev = current < 0 ? marks.length - 1 : (current - 1 + marks.length) % marks.length;
    setMatchIndex(prev);
    setNavQuery(searchQuery);
  }, [getMarks, navQuery, searchQuery, matchIndex]);

  return { matchIndex: effectiveIndex, matchCount, hasQuery, goToNext, goToPrev };
}