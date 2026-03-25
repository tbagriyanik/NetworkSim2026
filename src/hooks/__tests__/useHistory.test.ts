import { describe, it, expect } from 'vitest';
import { findUndoIndex, findRedoIndex } from '../useHistory';

describe('useHistory selective navigation helpers', () => {
  const items = [
    { operationType: 'all' as const },
    { operationType: 'topology' as const },
    { operationType: 'ui' as const },
    { operationType: 'device' as const },
    { operationType: 'topology' as const },
  ].map((item, index) => ({
    state: {} as any,
    operationType: item.operationType,
    signature: `${item.operationType}-${index}`,
    estimatedBytes: 1,
  }));

  it('findUndoIndex should jump to previous matching operation type', () => {
    expect(findUndoIndex(items as any, 4, 'ui')).toBe(2);
    expect(findUndoIndex(items as any, 4, 'device')).toBe(3);
    expect(findUndoIndex(items as any, 4, 'topology')).toBe(1);
  });

  it('findRedoIndex should jump to next matching operation type', () => {
    expect(findRedoIndex(items as any, 1, 'ui')).toBe(2);
    expect(findRedoIndex(items as any, 1, 'device')).toBe(3);
    expect(findRedoIndex(items as any, 2, 'topology')).toBe(4);
  });

  it('all operation type should move by one step', () => {
    expect(findUndoIndex(items as any, 4, 'all')).toBe(3);
    expect(findRedoIndex(items as any, 1, 'all')).toBe(2);
  });
});

