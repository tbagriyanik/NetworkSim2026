# UI Component Migration Guide

This guide helps keep the modernized UI component library backward compatible while the app transitions to the new primitives.

## Stable Imports

Prefer importing from the UI barrel when you want the modernized, supported surface:

```ts
import { Button, AccessibleButton, ModernPanel, ModernAppShell } from '@/components/ui';
```

## Compatibility Notes

- `Button` remains the primary primitive and now supports `forwardRef`.
- `AccessibleButton` remains available for icon-only and loading states.
- `ModernPanel` keeps the existing `title`, `children`, `onClose`, and sizing props.
- `ModernAppShell` remains usable for navigation/layout compositions.

## Migration Strategy

- Move new code to `Button` and other primitives from the barrel export.
- Keep legacy imports working during rollout.
- Add deprecation warnings only when a real break in usage is identified, not preemptively.

