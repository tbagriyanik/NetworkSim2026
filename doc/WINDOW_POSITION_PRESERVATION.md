# Window Position Preservation During Network Refresh

## Overview

This feature automatically preserves the positions and sizes of all open modal windows (Tasks, CLI, PC panels) and draggable dialogs when the network is refreshed. This ensures a seamless user experience without losing the carefully arranged workspace layout.

## How It Works

### Components

1. **windowPositionManager.ts** (`src/lib/storage/windowPositionManager.ts`)
   - Core utility for saving and restoring window positions
   - Manages localStorage backup of all window layouts
   - Handles both modal windows and draggable dialogs

2. **useNetworkRefreshWithPositions.ts** (`src/hooks/useNetworkRefreshWithPositions.ts`)
   - React hook that wraps the network refresh function
   - Orchestrates the save → refresh → restore workflow
   - Includes error handling to restore positions even if refresh fails

3. **NetworkTopology.tsx** (`src/components/network/NetworkTopology.tsx`)
   - Integrated the hook to use it when the refresh button is clicked
   - Replaces direct `onRefreshNetwork` calls with `refreshNetworkWithPositions`

### Storage Keys

Window positions are stored in localStorage with the following keys:

**Modal Windows:**
- `tasks-modal-position` / `tasks-modal-size`
- `cli-modal-position` / `cli-modal-size`
- `pc-modal-position` / `pc-modal-size`

**Draggable Dialogs:**
- `draggable_position_<dialogId>`

**Backup:**
- `netsim_window_positions_backup` - Temporary backup during refresh

## Usage

### For End Users

Simply click the refresh button (F5 or the refresh icon in the toolbar). Your window positions will be automatically preserved:

1. Current positions are saved
2. Network is refreshed
3. Positions are restored
4. Backup is cleared

### For Developers

To use this feature in your components:

```typescript
import { useNetworkRefreshWithPositions } from '@/hooks/useNetworkRefreshWithPositions';

function MyComponent({ onRefreshNetwork }) {
  const { refreshNetworkWithPositions } = useNetworkRefreshWithPositions(onRefreshNetwork);
  
  return (
    <button onClick={refreshNetworkWithPositions}>
      Refresh Network
    </button>
  );
}
```

### Manual Position Management

If you need to manually manage positions:

```typescript
import {
  saveWindowPositions,
  restoreWindowPositions,
  clearWindowPositionsBackup,
  getWindowPositionsBackup
} from '@/lib/storage/windowPositionManager';

// Save current positions
saveWindowPositions();

// Do something...

// Restore positions
restoreWindowPositions();

// Clear backup
clearWindowPositionsBackup();

// Get backup data
const backup = getWindowPositionsBackup();
```

## Technical Details

### Position Persistence

- **Modal Windows**: Positions and sizes are stored by `useModalDragResize` hook
- **Draggable Dialogs**: Positions are stored by `DraggableDialogManager` component
- **Backup**: All positions are backed up to a single localStorage key before refresh

### Error Handling

The hook includes robust error handling:

- If refresh fails, positions are still restored
- If restore fails, the error is logged but doesn't break the app
- Invalid position data is skipped gracefully

### Performance

- Positions are saved/restored asynchronously
- A 100ms delay is used after refresh to ensure DOM is ready
- No impact on refresh performance

## Browser Compatibility

This feature requires:
- localStorage support (all modern browsers)
- JSON serialization (all modern browsers)

## Limitations

1. **Window Bounds Validation**: Positions are validated to ensure windows stay within viewport bounds
2. **Responsive Design**: On window resize, positions are adjusted to fit the new viewport
3. **Cross-Tab**: Positions are not synchronized across browser tabs (each tab has its own backup)

## Troubleshooting

### Positions Not Restored

1. Check browser console for errors
2. Verify localStorage is enabled
3. Check if `netsim_window_positions_backup` exists in localStorage
4. Try clearing localStorage and refreshing

### Positions Out of Bounds

Positions are automatically clamped to viewport bounds. If windows appear off-screen:

1. Resize your browser window
2. Refresh the page
3. Positions should be recalculated

## Future Enhancements

- [ ] Cross-tab position synchronization
- [ ] Position history/undo
- [ ] Custom position presets
- [ ] Export/import workspace layouts
- [ ] Automatic position optimization based on screen size
