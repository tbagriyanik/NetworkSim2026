'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

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
    
    // Show red toast notification instead of full-screen error
    toast({
      title: this.props.fallbackTitle ?? 'Something went wrong',
      description: this.props.fallbackDescription ?? 'We hit an unexpected error. Please refresh your browser page.',
      variant: 'destructive',
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, info);
    }
  }

  render() {
    // Always return children - errors are shown as toast notifications
    return this.props.children;
  }
}
