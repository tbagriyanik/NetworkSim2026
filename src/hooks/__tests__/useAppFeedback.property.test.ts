import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';

const toastMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/use-toast', () => ({
  toast: toastMock,
}));

import { useAppFeedback } from '../useAppFeedback';

describe('App feedback system - Property Tests', () => {
  it('should classify success and error feedback consistently', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length > 0),
        fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: undefined }),
        (title, description) => {
          toastMock.mockClear();
          const { notifySuccess, notifyError } = useAppFeedback();

          notifySuccess(title, description);
          expect(toastMock).toHaveBeenLastCalledWith(expect.objectContaining({
            title,
            description,
          }));

          notifyError(title, description);
          expect(toastMock).toHaveBeenLastCalledWith(expect.objectContaining({
            title,
            description,
            variant: 'destructive',
          }));
        }
      )
    );
  });

  it('should preserve recovery hints for recoverable errors', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 80 }),
        fc.string({ minLength: 1, maxLength: 80 }),
        (title, description, hint) => {
          toastMock.mockClear();
          const { notifyRecoverableError } = useAppFeedback();

          notifyRecoverableError(title, description, hint);

          expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
            title,
            variant: 'destructive',
          }));

          const call = toastMock.mock.calls[toastMock.mock.calls.length - 1]?.[0];
          expect(call.description).toContain(hint);
        }
      )
    );
  });

  it('should emit progress feedback without destructive styling', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length > 0),
        fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: undefined }),
        (title, description) => {
          toastMock.mockClear();
          const { notifyProgress } = useAppFeedback();

          notifyProgress(title, description);

          expect(toastMock).toHaveBeenLastCalledWith(expect.objectContaining({
            title,
            description,
          }));

          const call = toastMock.mock.calls[toastMock.mock.calls.length - 1]?.[0];
          expect(call.variant).toBeUndefined();
        }
      )
    );
  });
});
