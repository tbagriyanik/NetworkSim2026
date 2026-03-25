import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { AppErrorBoundary } from '../AppErrorBoundary';

describe('AppErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <AppErrorBoundary>
        <div>healthy</div>
      </AppErrorBoundary>
    );

    expect(screen.getByText('healthy')).toBeInTheDocument();
  });

  it('renders fallback UI when a child throws', () => {
    const Thrower = () => {
      throw new Error('boom');
    };

    render(
      <AppErrorBoundary fallbackTitle="Recovery">
        <Thrower />
      </AppErrorBoundary>
    );

    expect(screen.getByText('Recovery')).toBeInTheDocument();
    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
  });
});
