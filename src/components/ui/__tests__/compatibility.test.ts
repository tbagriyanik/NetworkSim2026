import { describe, it, expect } from 'vitest';
import { Button, AccessibleButton, ModernPanel, ModernAppShell } from '..';

describe('UI component compatibility surface', () => {
  it('should export the primary modernized UI components from the barrel', () => {
    expect(Button).toBeDefined();
    expect(AccessibleButton).toBeDefined();
    expect(ModernPanel).toBeDefined();
    expect(ModernAppShell).toBeDefined();
  });
});

