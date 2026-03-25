# Core Component Primitives

This document describes the core UI component primitives that form the foundation of the modernized UI/UX system.

## Overview

The core component primitives are reusable, accessible, and consistently styled components that implement the design token system. These components follow modern React patterns and are built with TypeScript for type safety.

## Core Components

### 1. Button Component

**File:** `button.tsx`

**Purpose:** Primary interactive element for user actions

**Features:**
- Multiple variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- Multiple sizes: `default`, `sm`, `lg`, `icon`
- Full accessibility support with focus-visible styling
- Disabled state support
- Icon support with proper spacing
- Uses CVA (Class Variance Authority) for variant management

**Design Tokens Used:**
- Colors: `primary`, `primary-foreground`, `secondary`, `destructive`, `accent`
- Spacing: `px-4`, `py-2`, `gap-2`
- Shadows: `shadow-xs`
- Animations: `transition-all duration-200`

**Example Usage:**
```tsx
<Button variant="primary" size="default">
  Save Changes
</Button>

<Button variant="destructive" size="sm">
  Delete
</Button>

<Button variant="ghost" size="icon">
  <Icon />
</Button>
```

### 2. Input Component

**File:** `input.tsx`

**Purpose:** Text input field for user data entry

**Features:**
- Support for all HTML input types
- Placeholder text with muted styling
- Focus-visible styling for accessibility
- Disabled state support
- Validation support with `aria-invalid`
- File input support with custom styling
- Selection color customization

**Design Tokens Used:**
- Colors: `background`, `foreground`, `border`, `input`, `muted-foreground`
- Spacing: `px-3`, `py-1`, `h-9`
- Shadows: `shadow-xs`
- Animations: `transition-[color,box-shadow]`

**Example Usage:**
```tsx
<Input type="text" placeholder="Enter name" />

<Input 
  type="email" 
  placeholder="Email address"
  aria-invalid={hasError}
/>

<Input type="password" placeholder="Password" />
```

### 3. Card Component

**File:** `card.tsx`

**Purpose:** Container for grouped content with consistent styling

**Features:**
- Base Card container with border and shadow
- CardHeader for title and metadata
- CardTitle with badge-style appearance
- CardDescription for supplementary text
- CardContent for main content area
- CardFooter for action buttons
- CardAction for header-level actions
- Responsive padding and spacing

**Design Tokens Used:**
- Colors: `card`, `card-foreground`, `muted`, `muted-foreground`, `border`
- Spacing: `px-6`, `py-6`, `gap-6`
- Shadows: `shadow-sm`
- Border radius: `rounded-xl`

**Example Usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Settings</CardTitle>
    <CardDescription>Manage your preferences</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

### 4. Dialog Component

**File:** `dialog.tsx`

**Purpose:** Modal dialog for focused user interactions

**Features:**
- DialogTrigger for opening the dialog
- DialogContent with backdrop blur overlay
- DialogHeader for title and description
- DialogTitle with semantic heading
- DialogDescription for supplementary text
- DialogFooter for action buttons
- Close button with accessibility support
- Smooth animations with fade and zoom effects
- Optional close button control

**Design Tokens Used:**
- Colors: `background`, `foreground`, `muted-foreground`, `ring`
- Spacing: `p-6`, `gap-4`
- Shadows: `shadow-lg`
- Border radius: `rounded-lg`
- Animations: `fade-in-0`, `zoom-in-95`

**Example Usage:**
```tsx
<Dialog>
  <DialogTrigger>Open Dialog</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        Are you sure you want to proceed?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 5. Label Component

**File:** `label.tsx`

**Purpose:** Text label for form inputs

**Features:**
- Semantic HTML label element
- Proper spacing and alignment
- Disabled state support
- Peer-based disabled styling
- Accessible form associations

**Design Tokens Used:**
- Typography: `text-sm`, `font-medium`
- Spacing: `gap-2`
- Colors: `foreground`

**Example Usage:**
```tsx
<Label htmlFor="email">Email Address</Label>
<Input id="email" type="email" />
```

## Design Token Integration

All core components use CSS custom properties (design tokens) for styling. The tokens are defined in `src/lib/design-tokens/` and include:

- **Colors:** Primary, secondary, accent, semantic (success, warning, error, info), and surface colors
- **Typography:** Font families, sizes, line heights, and weights
- **Spacing:** Consistent spacing scale for margins and padding
- **Shadows:** Elevation levels for depth
- **Animations:** Transition durations and easing functions
- **Border Radius:** Consistent corner rounding

## Variant and Size Systems

### Button Variants

| Variant | Purpose | Use Case |
|---------|---------|----------|
| `default` | Primary action | Main call-to-action buttons |
| `destructive` | Dangerous action | Delete, remove, cancel operations |
| `outline` | Secondary action | Alternative actions |
| `secondary` | Tertiary action | Less important actions |
| `ghost` | Minimal action | Icon buttons, subtle actions |
| `link` | Text link | Navigation within content |

### Button Sizes

| Size | Height | Use Case |
|------|--------|----------|
| `default` | 36px (h-9) | Standard buttons |
| `sm` | 32px (h-8) | Compact buttons |
| `lg` | 40px (h-10) | Large, prominent buttons |
| `icon` | 36px (size-9) | Icon-only buttons |

## Accessibility Features

All core components include comprehensive accessibility support:

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Proper focus management with visible focus indicators
- Tab order follows logical flow

### Screen Reader Support
- Semantic HTML elements
- Proper ARIA attributes
- Descriptive labels and descriptions
- Live regions for dynamic content

### Visual Accessibility
- High contrast colors meeting WCAG AA standards
- Focus-visible styling for keyboard users
- Disabled state indicators
- Proper color contrast ratios

### Motion Accessibility
- Respects `prefers-reduced-motion` preference
- Smooth transitions without jarring effects
- Alternative feedback mechanisms for motion-sensitive users

## Testing

All core components have comprehensive test coverage including:

- **Unit Tests:** Rendering, props, variants, sizes, states
- **Accessibility Tests:** ARIA attributes, keyboard navigation, screen reader support
- **Property Tests:** Consistency across variants and sizes
- **Integration Tests:** Component composition and interaction

Run tests with:
```bash
npm test -- src/components/ui/__tests__/CoreComponentPrimitives.test.tsx --run
```

## Styling Approach

Components use a combination of:

1. **Tailwind CSS:** Utility-first styling with design tokens
2. **CVA (Class Variance Authority):** Type-safe variant management
3. **CSS Custom Properties:** Design token variables
4. **Radix UI Primitives:** Accessible component foundations

## Best Practices

### When Using Components

1. **Always provide accessible labels** for form inputs
2. **Use semantic variants** for the appropriate action type
3. **Respect user preferences** for motion and contrast
4. **Test with keyboard navigation** and screen readers
5. **Provide clear feedback** for user actions

### When Extending Components

1. **Maintain consistency** with existing variants and sizes
2. **Use design tokens** instead of hardcoded values
3. **Add comprehensive tests** for new features
4. **Document new variants** and their use cases
5. **Ensure accessibility** for all new features

## Future Enhancements

Potential improvements for core components:

- [ ] Loading states with spinners
- [ ] Tooltip support for buttons
- [ ] Form validation integration
- [ ] Keyboard shortcut support
- [ ] Customizable animations
- [ ] Theme customization hooks
- [ ] Component composition patterns
- [ ] Advanced form components (Select, Checkbox, Radio)

## Related Documentation

- [Design Tokens System](../lib/design-tokens/README.md)
- [Accessibility Guidelines](../../docs/ACCESSIBILITY.md)
- [Component Testing Guide](../../docs/TESTING.md)
- [Design System Overview](../../docs/DESIGN_SYSTEM.md)
