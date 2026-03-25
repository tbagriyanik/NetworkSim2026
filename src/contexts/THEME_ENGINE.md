# Theme Engine Documentation

## Overview

The Theme Engine is a comprehensive system for managing application themes with support for:
- Multiple theme variants (light, dark, high-contrast, auto)
- Smooth theme transitions with accessibility support
- System theme detection and auto-switching
- Theme preference persistence across sessions
- Reduced motion preference respect

## Architecture

### Components

#### ThemeProvider
The main provider component that wraps the application and manages theme state.

```tsx
<ThemeProvider>
  <App />
</ThemeProvider>
```

#### useTheme Hook
React hook for accessing theme context and controlling theme settings.

```tsx
const { theme, effectiveTheme, setTheme, toggleTheme, isTransitioning, systemThemePreference } = useTheme();
```

### Theme Types

- **light**: Light theme variant
- **dark**: Dark theme variant
- **high-contrast**: High contrast theme for accessibility
- **auto**: Automatically follows system preference

### Context API

```typescript
interface ThemeContextType {
  // Current theme setting (may be 'auto')
  theme: Theme;
  
  // Resolved theme (always concrete: light, dark, or high-contrast)
  effectiveTheme: 'dark' | 'light' | 'high-contrast';
  
  // Set theme to a specific variant
  setTheme: (theme: Theme) => void;
  
  // Toggle through theme variants
  toggleTheme: () => void;
  
  // Whether a theme transition is in progress
  isTransitioning: boolean;
  
  // Current system theme preference
  systemThemePreference: 'dark' | 'light' | null;
}
```

## Features

### 1. Theme Switching

Set theme to a specific variant:

```tsx
const { setTheme } = useTheme();

// Set to light theme
setTheme('light');

// Set to dark theme
setTheme('dark');

// Set to high-contrast theme
setTheme('high-contrast');

// Follow system preference
setTheme('auto');
```

### 2. Theme Toggling

Cycle through theme variants:

```tsx
const { toggleTheme } = useTheme();

// Cycles: auto → light → dark → high-contrast → auto
toggleTheme();
```

### 3. System Theme Detection

The theme engine automatically detects system theme preferences using the `prefers-color-scheme` media query:

```tsx
const { systemThemePreference } = useTheme();

// Returns 'dark' or 'light' based on system settings
console.log(systemThemePreference);
```

### 4. Auto Theme Switching

When theme is set to 'auto', the application automatically follows system preferences:

```tsx
const { theme, effectiveTheme } = useTheme();

// If theme is 'auto' and system prefers dark:
// theme = 'auto'
// effectiveTheme = 'dark'
```

### 5. Smooth Transitions

Theme changes include smooth CSS transitions (300ms by default):

```tsx
const { isTransitioning } = useTheme();

// Use this to show loading state during transition
if (isTransitioning) {
  // Show transition indicator
}
```

### 6. Reduced Motion Support

The theme engine respects user's reduced motion preferences:

```tsx
// If user has enabled 'prefers-reduced-motion: reduce':
// - Theme transitions are instant (0ms)
// - No animation effects are applied
```

### 7. Persistence

Theme preferences are automatically saved to localStorage and restored on app reload:

```tsx
// User sets theme to 'dark'
setTheme('dark');

// On page reload, theme is automatically restored to 'dark'
```

## Usage Examples

### Basic Theme Toggle Button

```tsx
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

### Theme Selector

```tsx
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value as any)}>
      <option value="auto">Auto (System)</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="high-contrast">High Contrast</option>
    </select>
  );
}
```

### Conditional Rendering Based on Theme

```tsx
import { useTheme } from '@/contexts/ThemeContext';

export function ThemedComponent() {
  const { effectiveTheme } = useTheme();

  return (
    <div className={`theme-${effectiveTheme}`}>
      {effectiveTheme === 'dark' && <DarkModeContent />}
      {effectiveTheme === 'light' && <LightModeContent />}
      {effectiveTheme === 'high-contrast' && <HighContrastContent />}
    </div>
  );
}
```

### Transition Indicator

```tsx
import { useTheme } from '@/contexts/ThemeContext';

export function TransitionIndicator() {
  const { isTransitioning } = useTheme();

  if (!isTransitioning) return null;

  return <div className="theme-transition-indicator">Applying theme...</div>;
}
```

## CSS Integration

The theme engine applies theme classes to the document root:

```html
<!-- Light theme -->
<html class="light">

<!-- Dark theme -->
<html class="dark">

<!-- High contrast theme -->
<html class="high-contrast">
```

Use these classes in your CSS:

```css
/* Light theme styles */
:root {
  --bg-color: #ffffff;
  --text-color: #000000;
}

/* Dark theme styles */
.dark {
  --bg-color: #1a1a1a;
  --text-color: #ffffff;
}

/* High contrast theme styles */
.high-contrast {
  --bg-color: #000000;
  --text-color: #ffffff;
  --border-color: #ffff00;
}
```

## Design Tokens Integration

The theme engine works seamlessly with the design tokens system:

```tsx
import { getTheme } from '@/lib/design-tokens';
import { useTheme } from '@/contexts/ThemeContext';

export function ComponentWithTokens() {
  const { effectiveTheme } = useTheme();
  const theme = getTheme(effectiveTheme);

  return (
    <div style={{
      backgroundColor: theme.tokens.colors.surface.bg,
      color: theme.tokens.colors.surface.text,
    }}>
      Content
    </div>
  );
}
```

## Accessibility Considerations

### Reduced Motion

The theme engine automatically detects and respects the `prefers-reduced-motion` media query:

```tsx
// If user has enabled reduced motion:
// - Theme transitions are instant
// - No animation effects are applied
// - Alternative feedback mechanisms are used
```

### High Contrast Theme

For users with visual impairments, the high-contrast theme provides:
- Enhanced color contrast ratios (WCAG AAA compliant)
- Stronger visual boundaries
- Improved text readability

### System Theme Detection

Respects user's system-level theme preference, allowing users to:
- Set theme once at system level
- Have all applications follow their preference
- Reduce eye strain with appropriate theme

## Performance Considerations

### Transition Duration

- Default: 300ms
- Reduced motion: 0ms (instant)
- Configurable via `TRANSITION_DURATION` constant

### Storage

- Uses browser localStorage for persistence
- Minimal storage footprint (single string value)
- Graceful fallback if storage is unavailable

### System Theme Detection

- Uses efficient media query listeners
- Minimal performance impact
- Automatic cleanup on unmount

## Browser Support

The theme engine supports all modern browsers:
- Chrome/Edge 76+
- Firefox 67+
- Safari 12.1+
- Mobile browsers (iOS Safari 12.2+, Chrome Mobile)

### Fallbacks

- If `prefers-color-scheme` is not supported: defaults to light theme
- If `prefers-reduced-motion` is not supported: uses normal transitions
- If localStorage is unavailable: theme is not persisted (but still works)

## Testing

### Property-Based Tests

The theme engine includes comprehensive property-based tests validating:
- Theme variant support
- Preference persistence
- System theme detection
- Auto theme resolution
- Smooth transitions
- Component consistency
- Invalid value handling
- System theme change handling
- Effective theme provision
- Reduced motion respect

Run tests:

```bash
npm test -- src/contexts/__tests__/ThemeEngine.test.ts --run
```

### Manual Testing

1. **Theme Switching**: Click theme toggle and verify visual changes
2. **Persistence**: Set theme, reload page, verify theme is restored
3. **System Theme**: Change system theme, verify auto theme updates
4. **Transitions**: Observe smooth theme transitions
5. **Reduced Motion**: Enable reduced motion, verify instant transitions
6. **High Contrast**: Select high-contrast theme, verify enhanced contrast

## Troubleshooting

### Theme Not Persisting

**Issue**: Theme resets on page reload

**Solutions**:
- Check if localStorage is enabled
- Verify no browser extensions are blocking storage
- Check browser console for errors

### System Theme Not Detected

**Issue**: Auto theme doesn't follow system preference

**Solutions**:
- Verify browser supports `prefers-color-scheme`
- Check system theme settings
- Try manual theme selection as workaround

### Transitions Not Smooth

**Issue**: Theme changes appear instant

**Solutions**:
- Check if reduced motion is enabled
- Verify CSS transitions are not disabled
- Check browser performance settings

## Future Enhancements

Potential improvements for future versions:
- Custom theme creation and management
- Theme scheduling (e.g., auto-switch at sunset)
- Per-component theme overrides
- Theme animation customization
- Theme preview before applying
- Theme sync across browser tabs
- Theme analytics and usage tracking
