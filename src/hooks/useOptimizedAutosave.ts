'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface AutosaveOptions {
    data: unknown;
    key: string;
    debounceMs?: number;
    enabled?: boolean;
}

export function useOptimizedAutosave({ data, key, debounceMs = 800, enabled = true }: AutosaveOptions) {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSavedRef = useRef<string>('');

    const save = useCallback(() => {
        if (!enabled) return;

        const serialized = JSON.stringify(data);
        if (serialized === lastSavedRef.current) return;

        try {
            localStorage.setItem(key, serialized);
            lastSavedRef.current = serialized;
        } catch (e) {
            console.error('Autosave failed:', e);
        }
    }, [data, key, enabled]);

    useEffect(() => {
        if (!enabled) return;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(save, debounceMs);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [data, debounceMs, enabled, save]);

    // Force save (for manual save)
    const forceSave = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        save();
    }, [save]);

    return { forceSave };
}

export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}