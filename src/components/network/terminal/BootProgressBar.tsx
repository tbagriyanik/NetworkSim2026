'use client';

import { useState, useEffect, useRef } from 'react';

// Global set — keeps track of completed boot IDs across tab changes
export const completedBootIds = new Set<string>();
export const BOOT_PROGRESS_MARKER = '\x00BOOT_PROGRESS\x00';

interface BootProgressBarProps {
  id: string;
  isDark: boolean;
  onDone: (id: string) => void;
  readyText?: string;
}

export function BootProgressBar({ id, isDark, onDone, readyText = "Ready!" }: BootProgressBarProps) {
  const [filled, setFilled] = useState(0);
  const [done, setDone] = useState(false);
  const total = 10;
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    if (filled < total) {
      const timer = setTimeout(() => setFilled(f => f + 1), 180);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setDone(true);
        onDoneRef.current(id);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [filled, id]);

  return (
    <span className={`font-mono ${isDark ? 'text-success-400' : 'text-success-600'}`}>
      {done ? (
        <span className="font-bold">{'#'.repeat(total)} {readyText}</span>
      ) : (
        <span className="inline-block min-w-[12ch]">{'#'.repeat(filled)}<span className="opacity-30">{'#'.repeat(total - filled)}</span></span>
      )}
    </span>
  );
}
