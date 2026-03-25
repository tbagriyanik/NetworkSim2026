'use client';

import { toast } from '@/hooks/use-toast';
import { formatErrorForUser } from '@/lib/errors/errorHandler';
import type { ApplicationError, ErrorInfo } from '@/lib/errors/errorHandler';

export type FeedbackVariant = 'default' | 'destructive';

export function useAppFeedback() {
  const notifySuccess = (title: string, description?: string) => {
    toast({
      title,
      description,
    });
  };

  const notifyError = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: 'destructive',
    });
  };

  const notifyRecoverableError = (title: string, description?: string, recoveryHint?: string) => {
    toast({
      title,
      description: recoveryHint ? `${description ?? ''}${description ? ' ' : ''}${recoveryHint}` : description,
      variant: 'destructive',
    });
  };

  const notifyProgress = (title: string, description?: string) => {
    toast({
      title,
      description,
    });
  };

  const notifyErrorInfo = (error: ErrorInfo) => {
    const feedback = {
      title: error.code,
      description: error.userMessage,
      variant: error.severity === 'critical' || error.severity === 'error' ? 'destructive' as const : undefined,
    };

    toast(feedback);
  };

  const notifyException = (error: Error | ApplicationError, fallbackMessage?: string) => {
    const info = formatErrorForUser(error, fallbackMessage);
    notifyErrorInfo(info);
  };

  return {
    notifySuccess,
    notifyError,
    notifyRecoverableError,
    notifyProgress,
    notifyErrorInfo,
    notifyException,
  };
}
