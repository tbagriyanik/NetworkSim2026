'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode, KeyboardEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PromptOptions {
  message: string;
  title?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  maxLength?: number;
}

export interface PromptResult {
  confirmed: boolean;
  value: string;
}

interface PromptContextValue {
  openPrompt: (options: PromptOptions) => Promise<PromptResult>;
}

const PromptContext = createContext<PromptContextValue | undefined>(undefined);

export function PromptProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<PromptOptions | null>(null);
  const [value, setValue] = useState('');
  const resolveRef = useRef<((result: PromptResult) => void) | null>(null);

  const openPrompt = useCallback((opts: PromptOptions) => {
    setValue(opts.defaultValue || '');
    setOptions(opts);
    return new Promise<PromptResult>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const close = useCallback(
    (confirmed: boolean) => {
      const resolve = resolveRef.current;
      resolveRef.current = null;
      setOptions(null);
      if (resolve) {
        resolve({ confirmed, value });
      }
    },
    [value]
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') close(true);
  };

  return (
    <PromptContext.Provider value={{ openPrompt }}>
      {children}
      <Dialog
        open={options !== null}
        onOpenChange={(open) => { if (!open) close(false); }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{options?.title || 'Input'}</DialogTitle>
            {options?.message && <DialogDescription>{options.message}</DialogDescription>}
          </DialogHeader>
          <input
            type="text"
            autoFocus
            value={value}
            maxLength={options?.maxLength}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={options?.placeholder}
            className={cn(
              'flex h-9 w-full rounded-md border border-secondary-300 bg-background px-3 py-1 text-sm text-secondary-900 outline-none transition-colors',
              'placeholder:text-secondary-400 focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500/30',
              'dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-100'
            )}
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => close(false)}>
              {options?.cancelLabel || 'Cancel'}
            </Button>
            <Button onClick={() => close(true)}>
              {options?.confirmLabel || 'OK'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PromptContext.Provider>
  );
}

export function usePrompt(): PromptContextValue {
  const ctx = useContext(PromptContext);
  if (!ctx) {
    throw new Error('usePrompt must be used within PromptProvider');
  }
  return ctx;
}