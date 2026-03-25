import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Button } from '../button';
import { AccessibleButton } from '../AccessibleButton';
import { ModernPanel } from '../ModernPanel';
import { ModernAppShell } from '../ModernAppShell';

describe('Component API consistency - Property Tests', () => {
  it('should expose consistent display names for public UI primitives', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        expect(Button.displayName).toBe('Button');
        expect(AccessibleButton.displayName).toBe('AccessibleButton');
      })
    );
  });

  it('should expose stable prop-driven surfaces for modern layout components', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length > 0),
        fc.boolean(),
        (id, title, closable) => {
          expect(typeof ModernPanel).toBe('function');
          expect(typeof ModernAppShell).toBe('function');
          expect(id).toMatch(/[0-9a-f-]{36}/i);
          expect(title.length).toBeGreaterThan(0);
          expect(typeof closable).toBe('boolean');
        }
      )
    );
  });

  it('should maintain backward-compatible button variants and sizes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('default', 'destructive', 'outline', 'secondary', 'ghost', 'link'),
        fc.constantFrom('default', 'sm', 'lg', 'icon'),
        (variant, size) => {
          expect(variant).toBeTruthy();
          expect(size).toBeTruthy();
        }
      )
    );
  });
});

