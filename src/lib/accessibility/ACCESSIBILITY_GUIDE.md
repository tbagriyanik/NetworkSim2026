# Accessibility Enhancement System Guide

## Overview

The Accessibility Enhancement System provides comprehensive utilities for implementing WCAG 2.1 AA compliant interfaces with proper ARIA attribute management, keyboard navigation support, and focus management utilities.

## Features

### 1. ARIA Attribute Management

The ARIA system provides utilities for generating and managing ARIA attributes on interactive elements.

#### Available ARIA Generators

- `generateButtonARIA()` - For button elements
- `generateLinkARIA()` - For link elements
- `generateNavigationARIA()` - For navigation regions
- `generateDialogARIA()` - For dialog/modal elements
- `generateAlertARIA()` - For alert messages
- `generateTabARIA()` - For tab elements
- `generateTabPanelARIA()` - For tab panel elements
- `generateCheckboxARIA()` - For checkbox inputs
- `generateRadioARIA()` - For radio button inputs
- `generateSliderARIA()` - For slider inputs
- `generateComboboxARIA()` - For combobox elements
- `generateListboxARIA()` - For listbox elements
- `generateListItemARIA()` - For list item elements
- `generateMenuARIA()` - For menu elements
- `generateMenuItemARIA()` - For menu item elements
- `generateProgressBarARIA()` - For progress bar elements
- `generateTooltipARIA()` - For tooltip elements
- `generateHeadingARIA()` - For heading elements
- `generateLiveRegionARIA()` - For live regions

#### Usage Example

```typescript
import { generateButtonARIA, ariaAttributesToHTMLAttributes } from '@/lib/accessibility';

const aria = generateButtonARIA({
  label: 'Save Configuration',
  disabled: false,
  ariaDescribedBy: 'save-help-text'
});

const htmlAttrs = ariaAttributesToHTMLAttributes(aria);

// Use in JSX
<button {...htmlAttrs}>Save</button>
```

### 2. Keyboard Navigation Support

The keyboard navigation system provides utilities for implementing keyboard shortcuts, focus management, and keyboard event handling.

#### Key Features

- **Keyboard Event Matching**: Detect specific keyboard events with modifiers
- **Focusable Element Discovery**: Find all keyboard-accessible elements
- **Focus Navigation**: Move focus between elements programmatically
- **Focus Trapping**: Trap focus within containers (for modals/dialogs)
- **Arrow Key Navigation**: Handle arrow key navigation for lists
- **Character Key Navigation**: First-letter navigation for lists
- **Keyboard Shortcuts**: Register and manage keyboard shortcuts

#### Usage Example

```typescript
import { 
  getFocusableElements, 
  focusNextElement,
  trapFocus,
  KEYBOARD_KEYS 
} from '@/lib/accessibility';

// Get all focusable elements in a container
const focusable = getFocusableElements(container);

// Move focus to next element
focusNextElement(container, currentElement);

// Handle keyboard event
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === KEYBOARD_KEYS.ESCAPE) {
    closeModal();
  }
};

// Trap focus in modal
const handleTabKey = (event: KeyboardEvent) => {
  trapFocus(modalContainer, event);
};
```

### 3. Focus Management Utilities

The focus management system provides utilities for managing focus state, focus restoration, and focus visibility.

#### Key Features

- **Focus Saving/Restoration**: Save and restore focus positions
- **Focus Element**: Focus specific elements with scroll behavior
- **Focus Checking**: Check if elements are focused
- **Focus Manager Class**: Comprehensive focus management for containers
- **Focus Visibility Manager**: Show/hide focus indicators based on input method
- **Focus Restoration Context**: Manage focus across navigation
- **Screen Reader Announcements**: Announce messages to screen readers

#### Usage Example

```typescript
import { 
  FocusManager,
  saveFocusedElement,
  restoreFocusedElement,
  focusElement 
} from '@/lib/accessibility';

// Save current focus
saveFocusedElement();

// Do something
openModal();

// Restore focus
restoreFocusedElement();

// Or use FocusManager for more control
const manager = new FocusManager(modalContainer);
manager.activate({
  trapFocus: true,
  initialFocus: firstButton,
  restoreFocus: true
});

// Later...
manager.deactivate({ restoreFocus: true });
manager.destroy();
```

## React Hooks

The system provides React hooks for easy integration with React components.

### Available Hooks

- `useFocusManagement()` - Manage focus within a container
- `useFocusVisibility()` - Manage focus visibility (keyboard vs mouse)
- `useFocusRestoration()` - Restore focus across navigation
- `useScreenReaderAnnouncement()` - Announce messages to screen readers
- `useKeyboardNavigation()` - Handle keyboard navigation in lists
- `useLiveRegion()` - Manage ARIA live regions
- `useFocusTrap()` - Trap focus in modals/dialogs
- `useScreenReaderDetection()` - Detect if screen reader is active
- `useKeyboardShortcuts()` - Register keyboard shortcuts

### Usage Example

```typescript
import { useFocusManagement, useKeyboardShortcuts } from '@/hooks/useAccessibility';

function Modal() {
  const containerRef = useFocusManagement({
    trapFocus: true,
    restoreFocus: true
  });

  useKeyboardShortcuts([
    {
      key: 'Escape',
      handler: () => closeModal()
    },
    {
      key: 's',
      ctrl: true,
      handler: () => saveChanges()
    }
  ]);

  return (
    <div ref={containerRef} role="dialog">
      {/* Modal content */}
    </div>
  );
}
```

## WCAG 2.1 AA Compliance

The accessibility system helps ensure WCAG 2.1 AA compliance through:

### Perceivable
- Proper ARIA labels and descriptions for all interactive elements
- Sufficient color contrast through design tokens
- Text alternatives for images and icons

### Operable
- Full keyboard navigation support
- Focus management and visible focus indicators
- Keyboard shortcuts for common actions
- Touch-friendly interactions

### Understandable
- Clear, descriptive labels and instructions
- Consistent navigation patterns
- Error messages and recovery options
- Live regions for dynamic content updates

### Robust
- Semantic HTML structure
- Proper ARIA attributes
- Compatibility with assistive technologies
- Proper focus management

## Best Practices

### 1. Always Provide Labels

```typescript
// Good
<button aria-label="Close dialog">×</button>

// Bad
<button>×</button>
```

### 2. Use Semantic HTML

```typescript
// Good
<button>Click me</button>
<a href="/page">Link</a>

// Bad
<div role="button" onClick={handleClick}>Click me</div>
```

### 3. Manage Focus Properly

```typescript
// Good - Focus moves to modal when opened
const manager = new FocusManager(modal);
manager.activate({ trapFocus: true });

// Bad - Focus stays on background
openModal();
```

### 4. Announce Dynamic Changes

```typescript
// Good
announceToScreenReader('Item added to list', 'polite');

// Bad - No announcement
addItemToList();
```

### 5. Support Keyboard Navigation

```typescript
// Good
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    handleAction();
  }
};

// Bad - Only mouse support
onClick={handleAction}
```

## Testing Accessibility

### Unit Tests

```typescript
import { generateButtonARIA, getFocusableElements } from '@/lib/accessibility';

describe('Accessibility', () => {
  it('should generate button ARIA attributes', () => {
    const aria = generateButtonARIA({ label: 'Save' });
    expect(aria.role).toBe('button');
    expect(aria.ariaLabel).toBe('Save');
  });

  it('should find all focusable elements', () => {
    const container = document.createElement('div');
    container.innerHTML = '<button>Button</button><input />';
    
    const focusable = getFocusableElements(container);
    expect(focusable.length).toBe(2);
  });
});
```

### Property-Based Tests

```typescript
import fc from 'fast-check';
import { generateButtonARIA } from '@/lib/accessibility';

it('should generate valid ARIA for any label', () => {
  fc.assert(
    fc.property(fc.string(), (label) => {
      const aria = generateButtonARIA({ label });
      expect(aria.role).toBe('button');
      expect(aria.ariaLabel).toBe(label);
    })
  );
});
```

## Common Patterns

### Modal Dialog

```typescript
function Modal({ isOpen, onClose }) {
  const containerRef = useFocusManagement({
    trapFocus: true,
    restoreFocus: true
  });

  useKeyboardShortcuts([
    { key: 'Escape', handler: onClose }
  ]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      {...generateDialogARIA({
        label: 'Modal Title',
        modal: true
      })}
    >
      {/* Modal content */}
    </div>
  );
}
```

### Accessible List

```typescript
function AccessibleList({ items }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemRefs = useRef<HTMLElement[]>([]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCurrentIndex((i) => (i + 1) % items.length);
      itemRefs.current[currentIndex + 1]?.focus();
    }
  };

  return (
    <ul role="listbox" onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <li
          key={index}
          ref={(el) => (itemRefs.current[index] = el!)}
          {...generateListItemARIA({
            selected: index === currentIndex,
            label: item.label
          })}
        >
          {item.label}
        </li>
      ))}
    </ul>
  );
}
```

### Keyboard Shortcuts

```typescript
function Editor() {
  useKeyboardShortcuts([
    {
      key: 's',
      ctrl: true,
      handler: () => saveDocument()
    },
    {
      key: 'z',
      ctrl: true,
      handler: () => undo()
    },
    {
      key: 'z',
      ctrl: true,
      shift: true,
      handler: () => redo()
    }
  ]);

  return <div>{/* Editor content */}</div>;
}
```

## Troubleshooting

### Focus Not Moving

- Ensure element is focusable (button, input, link, or has tabindex)
- Check if element is hidden (display: none, visibility: hidden)
- Verify element is not disabled

### ARIA Attributes Not Working

- Ensure ARIA attributes are correctly formatted (aria-label, not ariaLabel in HTML)
- Check that role is appropriate for the element
- Verify aria-labelledby/aria-describedby reference valid IDs

### Keyboard Navigation Not Working

- Ensure event listeners are attached to correct element
- Check that preventDefault() is called when needed
- Verify focus is being moved to correct element

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)
