'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onError?: (error: Error, info: React.ErrorInfo) => void;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
          <div className="max-w-md rounded-2xl border bg-card p-6 shadow-lg">
            <h1 className="text-xl font-semibold tracking-tight">
              {this.props.fallbackTitle ?? 'Something went wrong'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {this.props.fallbackDescription ?? 'We hit an unexpected error. You can reload the app and try again.'}
            </p>
            <div className="mt-4 flex gap-3">
              <Button onClick={() => window.location.reload()}>Reload</Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="mt-4 overflow-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
