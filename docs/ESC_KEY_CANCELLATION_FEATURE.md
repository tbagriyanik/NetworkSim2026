# ESC Key Command Cancellation Feature

## Overview
Implemented ESC key functionality to cancel long-running CMD and CLI commands in both Terminal and PCPanel components.

## Changes Made

### 1. Terminal Component (`src/components/network/Terminal.tsx`)

#### Added Cancellation State
- Added `isCancellationRequestedRef` ref to track cancellation requests
- Enhanced ESC key handler to detect long-running commands when `isLoading` is true

#### ESC Key Behavior
When ESC is pressed during a long-running command:
1. Sets `isCancellationRequestedRef.current = true`
2. Sends `__CANCEL__` command token to the command handler
3. Displays a toast notification confirming cancellation
4. Clears the input field

**Languages Supported:**
- Turkish: "Komut İptal Edildi"
- English: "Command Cancelled"

### 2. useDeviceManager Hook (`src/hooks/useDeviceManager.ts`)

#### Added Cancellation Handler
```typescript
if (command === '__CANCEL__') {
  setIsLoading(false);
  // Display cancellation message
  return { success: false, error: 'Cancelled' };
}
```

The handler:
- Stops the loading state
- Displays "^C\nCommand cancelled." message in terminal
- Returns failure status to prevent further command processing

### 3. Command Executor (`src/lib/network/executor.ts`)

#### Added Token Recognition
```typescript
if (input === '__CANCEL__') {
  return { success: false, error: '% Command cancelled' };
}
```

This ensures the executor properly recognizes and handles the cancellation token.

### 4. PCPanel Component (`src/components/network/PCPanel.tsx`)

#### Added Execution State
- Added `isExecutingCommand` state to track command execution
- Set flag when CMD tab commands start executing
- Reset flag after command completion

#### ESC Key Behavior
For **Console Tab**:
- Sends `__CANCEL__` to connected device via `onExecuteDeviceCommand`

For **CMD Tab**:
- Displays cancellation message directly in local output
- Resets execution state

## Usage

### Cancelling Long-Running Commands

1. **Terminal (Switch/Router)**
   - Execute a command (e.g., `ping`, `traceroute`)
   - Press `ESC` during execution
   - Command is cancelled with confirmation message

2. **PCPanel - Console Tab**
   - Connected to remote device
   - Execute long-running command
   - Press `ESC` to cancel

3. **PCPanel - CMD Tab**
   - Execute local CMD commands
   - Press `ESC` during execution
   - Shows cancellation message

## Technical Details

### Cancellation Flow
```
User presses ESC
    ↓
Terminal/PCPanel detects isLoading/isExecutingCommand
    ↓
Sends __CANCEL__ token
    ↓
useDeviceManager handles token
    ↓
Sets isLoading = false
    ↓
Displays cancellation message
    ↓
Command execution stops
```

### Special Tokens
- `__CANCEL__` - General cancellation token
- `__PASSWORD_CANCELLED__` - Password dialog cancellation
- `__RELOAD_CONFIRM__` - Reload confirmation
- `__RELOAD_CANCEL__` - Reload cancellation

## Benefits

1. **Improved UX**: Users can stop unwanted operations without waiting
2. **Consistent Behavior**: Works across all terminal types (CLI, CMD, Console)
3. **Bilingual Support**: Messages in both Turkish and English
4. **Visual Feedback**: Toast notifications and terminal messages confirm cancellation
5. **Clean State Management**: Properly resets loading states and clears inputs

## Testing Recommendations

1. Test with ping commands to distant targets
2. Test with traceroute/tracert commands
3. Test during reload confirmation dialogs
4. Test during password prompts
5. Verify behavior in both light and dark themes
6. Test on mobile, tablet, and desktop views

## Browser Compatibility

The feature uses standard React hooks and browser APIs:
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Future Enhancements

Potential improvements:
1. Add keyboard shortcut customization
2. Implement partial result display on cancellation
3. Add cancellation history tracking
4. Support for multiple concurrent command cancellations
5. Visual indicator showing command is cancellable
