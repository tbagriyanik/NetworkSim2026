## 2025-05-15 - [Consolidated Tooltip & Button Pattern]
**Learning:** In this design system, `TooltipWrapper` automatically injects `aria-label` into its children if a `title` is provided. Combining it with the themed `Button` component (instead of raw `<button>`) ensures both visual consistency (focus rings, active states) and accessibility with minimal boilerplate.
**Action:** Always prefer `TooltipWrapper` over manual `TooltipProvider/Tooltip/TooltipTrigger` blocks for icon-only buttons, and use the project's `Button` component to inherit standard UX behaviors.
