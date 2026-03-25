import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { findRedoIndex, findUndoIndex } from '../useHistory';

type Op = 'all' | 'topology' | 'device' | 'ui';

const opArbitrary = fc.constantFrom<Op>('all', 'topology', 'device', 'ui');

function toItems(ops: Op[]) {
  return ops.map((op, i) => ({
    state: {} as any,
    operationType: op,
    signature: `${op}-${i}`,
    estimatedBytes: 1,
  }));
}

describe('useHistory - Property Tests', () => {
  it('undo index should never move forward and should match selected operation when moved', () => {
    fc.assert(
      fc.property(
        fc.array(opArbitrary, { minLength: 2, maxLength: 80 }),
        opArbitrary,
        (ops, selectedOp) => {
          const items = toItems(ops);
          const index = Math.floor(items.length / 2);
          const next = findUndoIndex(items as any, index, selectedOp);

          expect(next).toBeLessThanOrEqual(index);
          expect(next).toBeGreaterThanOrEqual(0);

          if (next !== index) {
            const op = items[next].operationType;
            if (selectedOp === 'all') {
              expect(next).toBe(index - 1);
            } else {
              expect(op === selectedOp || op === 'all').toBe(true);
            }
          }
        }
      )
    );
  });

  it('redo index should never move backward and should match selected operation when moved', () => {
    fc.assert(
      fc.property(
        fc.array(opArbitrary, { minLength: 2, maxLength: 80 }),
        opArbitrary,
        (ops, selectedOp) => {
          const items = toItems(ops);
          const index = Math.floor(items.length / 2);
          const next = findRedoIndex(items as any, index, selectedOp);

          expect(next).toBeGreaterThanOrEqual(index);
          expect(next).toBeLessThan(items.length);

          if (next !== index) {
            const op = items[next].operationType;
            if (selectedOp === 'all') {
              expect(next).toBe(index + 1);
            } else {
              expect(op === selectedOp || op === 'all').toBe(true);
            }
          }
        }
      )
    );
  });

  it('all operation should behave like single-step undo/redo within bounds', () => {
    fc.assert(
      fc.property(
        fc.array(opArbitrary, { minLength: 2, maxLength: 80 }),
        (ops) => {
          const items = toItems(ops);
          for (let i = 1; i < items.length; i++) {
            expect(findUndoIndex(items as any, i, 'all')).toBe(i - 1);
          }
          for (let i = 0; i < items.length - 1; i++) {
            expect(findRedoIndex(items as any, i, 'all')).toBe(i + 1);
          }
        }
      )
    );
  });
});
