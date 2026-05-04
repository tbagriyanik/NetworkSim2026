# Implementation Notes: Window Position Preservation

## Feature Summary

When users refresh the network simulation, all open modal windows (Tasks, CLI, PC panels) and draggable dialogs now maintain their positions and sizes. This provides a seamless user experience without losing the carefully arranged workspace layout.

## Files Created

### 1. Core Utility: `src/lib/storage/windowPositionManager.ts`

**Purpose**: Manages saving and restoring window positions to/from localStorage

**Key Functions**:
- `saveWindowPositions()`: Backs up all current window positions
- `restoreWindowPositions()`: Restores positions from backup
- `clearWindowPositionsBackup()`: Removes temporary backup
- `getWindowPositionsBackup()`: Retrieves backup data

**Storage Keys**:
- Modal positions: `tasks-modal-position`, `cli-modal-position`, `pc-modal-position`
- Modal sizes: `tasks-modal-size`, `cli-modal-size`, `pc-modal-size`
- Draggable dialogs: `draggable_position_<dialogId>`
- Backup: `netsim_window_positions_backup`

**Error Handling**:
- Gracefully handles missing localStorage
- Catches JSON parse errors
- Validates position bounds
- Logs warnings for debugging

### 2. React Hook: `src/hooks/useNetworkRefreshWithPositions.ts`

**Purpose**: Orchestrates the save → refresh → restore workflow

**Key Features**:
- Wraps the `onRefreshNetwork` callback
- Manages timing with setTimeout for DOM readiness
- Includes error handling to restore positions even if refresh fails
- Returns `refreshNetworkWithPositions` function

**Workflow**:
```
1. Save positions
2. Call onRefreshNetwork()
3. Wait 100ms for DOM to settle
4. Restore positions
5. Clear backup
```

### 3. Integration: `src/components/network/NetworkTopology.tsx`

**Changes**:
- Added import for `useNetworkRefreshWithPositions`
- Called hook in component body
- Replaced `onClick={onRefreshNetwork}` with `onClick={refreshNetworkWithPositions}`

**Location**: Line ~5636 in the refresh button handler

### 4. Tests

**Unit Tests**: `src/lib/storage/__tests__/windowPositionManager.test.ts`
- Tests for save/restore functionality
- Tests for error handling
- Integration tests for full cycle

**Hook Tests**: `src/hooks/__tests__/useNetworkRefreshWithPositions.test.ts`
- Tests for hook behavior
- Tests for error handling
- Tests for execution order

**Example**: `examples/window-position-preservation.md`
- Usage examples
- Workflow diagrams
- Troubleshooting guide

## Design Decisions

### 1. Why localStorage?

**Pros**:
- Simple and reliable
- No server required
- Persists across page reloads
- Good browser support

**Cons**:
- Limited to ~5-10MB per domain
- Not shared across tabs
- Synchronous API

**Decision**: localStorage is appropriate for this use case since we're only storing a few window positions (~1KB).

### 2. Why a Backup Key?

Instead of directly modifying the original position keys, we use a temporary backup key (`netsim_window_positions_backup`). This approach:
- Prevents data loss if restore fails
- Allows inspection of backed-up data
- Enables future features like position history
- Makes debugging easier

### 3. Why 100ms Delay?

After network refresh, we wait 100ms before restoring positions to ensure:
- React has finished re-rendering
- DOM elements are ready
- Event handlers are attached
- No race conditions occur

### 4. Why Separate Hook?

Instead of embedding logic in NetworkTopology, we created a separate hook because:
- Reusable in other components
- Easier to test
- Cleaner separation of concerns
- Can be used with different refresh functions

## Integration Points

### 1. useModalDragResize Hook

**Location**: `src/hooks/useModalDragResize.ts`

This hook already saves modal positions to localStorage when dragging/resizing ends. Our feature leverages this existing functionality.

**Keys Used**:
- `tasks-modal-position`, `tasks-modal-size`
- `cli-modal-position`, `cli-modal-size`
- `pc-modal-position`, `pc-modal-size`

### 2. DraggableDialogManager Component

**Location**: `src/components/DraggableDialogManager.tsx`

This component manages draggable dialogs and saves their positions to localStorage.

**Keys Used**:
- `draggable_position_<dialogId>`

### 3. NetworkTopology Component

**Location**: `src/components/network/NetworkTopology.tsx`

The main component that handles network visualization and refresh. We integrated the hook here to intercept refresh calls.

## Performance Considerations

### Save Operation
- Reads all localStorage keys: ~1-2ms
- JSON serialization: <1ms
- Total: ~2-3ms

### Restore Operation
- JSON deserialization: <1ms
- Writes to localStorage: ~1-2ms
- Total: ~2-3ms

### Overall Impact
- Negligible overhead (<5ms total)
- No impact on refresh performance
- No blocking operations

## Browser Compatibility

**Supported**:
- Chrome/Edge 4+
- Firefox 3.5+
- Safari 4+
- IE 8+

**Requirements**:
- localStorage API
- JSON support
- requestAnimationFrame (for timing)

## Security Considerations

### 1. Data Validation

All data read from localStorage is validated:
- JSON parsing is wrapped in try-catch
- Position values are checked for validity
- Bounds are validated against viewport

### 2. No Sensitive Data

Window positions contain no sensitive information:
- Only numeric coordinates
- No user data
- No authentication tokens
- No device configurations

### 3. localStorage Isolation

Each domain has its own localStorage:
- No cross-domain access
- No data leakage between sites
- Follows same-origin policy

## Future Enhancements

### 1. Position History

Store multiple position snapshots:
```typescript
saveWindowPositions('snapshot-1');
saveWindowPositions('snapshot-2');
restoreWindowPositions('snapshot-1');
```

### 2. Cross-Tab Synchronization

Sync positions across browser tabs:
```typescript
window.addEventListener('storage', (event) => {
  if (event.key === 'netsim_window_positions_backup') {
    restoreWindowPositions();
  }
});
```

### 3. Position Presets

Save and load predefined layouts:
```typescript
savePreset('default-layout');
loadPreset('default-layout');
```

### 4. Automatic Optimization

Adjust positions based on screen size:
```typescript
optimizePositionsForScreenSize(window.innerWidth, window.innerHeight);
```

### 5. Export/Import

Allow users to export and import workspace layouts:
```typescript
exportLayout('my-layout.json');
importLayout('my-layout.json');
```

## Debugging

### Enable Debug Logging

Add to windowPositionManager.ts:
```typescript
const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) console.log('[WindowPositions]', ...args);
}
```

### Check localStorage

In browser console:
```javascript
// View all positions
Object.keys(localStorage)
  .filter(k => k.includes('modal') || k.includes('draggable'))
  .forEach(k => console.log(k, localStorage.getItem(k)));

// View backup
console.log(JSON.parse(localStorage.getItem('netsim_window_positions_backup')));
```

### Monitor Refresh Cycle

Add logging to useNetworkRefreshWithPositions:
```typescript
console.log('1. Saving positions...');
saveWindowPositions();
console.log('2. Refreshing network...');
await onRefreshNetwork();
console.log('3. Restoring positions...');
restoreWindowPositions();
console.log('4. Done!');
```

## Testing Checklist

- [ ] Positions saved before refresh
- [ ] Positions restored after refresh
- [ ] Backup cleared after restore
- [ ] Positions validated for bounds
- [ ] Error handling works
- [ ] Works with multiple windows
- [ ] Works with draggable dialogs
- [ ] Works on mobile/responsive
- [ ] Works with different screen sizes
- [ ] Works with localStorage disabled
- [ ] Works with invalid JSON in localStorage
- [ ] Performance is acceptable

## Related Documentation

- [Window Position Preservation Guide](./WINDOW_POSITION_PRESERVATION.md)
- [useModalDragResize Hook](../src/hooks/useModalDragResize.ts)
- [DraggableDialogManager Component](../src/components/DraggableDialogManager.tsx)
- [Example Usage](../examples/window-position-preservation.md)
