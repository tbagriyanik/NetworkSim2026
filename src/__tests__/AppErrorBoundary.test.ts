import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { AppErrorBoundary } from '@/components/ui/AppErrorBoundary';

describe('AppErrorBoundary', () => {
  it('getDerivedStateFromError sets hasError', () => {
    const err = new Error('boom');
    expect(AppErrorBoundary.getDerivedStateFromError(err)).toEqual({ hasError: true, error: err });
  });

  it('componentDidCatch calls onError callback', () => {
    const onError = vi.fn();
    const boundary = new AppErrorBoundary({ children: React.createElement('div'), onError });
    const err = new Error('boom');
    const info = { componentStack: 'stack' } as React.ErrorInfo;
    boundary.componentDidCatch(err, info);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(err, info);
  });
});

