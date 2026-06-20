'use client';

import { useState, useEffect, useCallback } from 'react';
import type { StudentProgress } from '@/lib/roomTypes';

export function useRoomStudents(roomCode: string | null) {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    if (!roomCode) return;
    try {
      const res = await fetch(`/api/room/${roomCode}/students`);
      if (res.status === 404) {
        setStudents([]);
        return;
      }
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) setStudents(json.data);
    } catch {
      setError('connection_error');
    }
  }, [roomCode]);

  useEffect(() => {
    const initId = setTimeout(() => fetchStudents(), 0);
    const intervalId = setInterval(() => fetchStudents(), 4000);
    return () => {
      clearTimeout(initId);
      clearInterval(intervalId);
    };
  }, [fetchStudents]);

  return { students, error, refresh: fetchStudents };
}
