# CLI Topology Sync Fix - Bugfix Design

## Overview

This document covers the fix design for eight interconnected bugs in the network topology simulator. The bugs span CLI state persistence (`saveConfig`/`eraseConfig` result fields ignored), running-config display (ConfigPanel uses a hardcoded generator instead of live state), topology-to-CLI synchronization (device rename not propagated, active highlight lost on tab switch), task evaluation scope (only active device evaluated instead of full topology), and a runtime crash from a misplaced `useState` import in `useOptimizedAutosave.ts`.

The fix strategy is minimal and targeted: each bug is addressed at its root cause without restructuring existing logic. All fixes must preserve the existing reload-from-startup, VTP propagation, autosave, and terminal behaviors.

---

## Glossary

- **Bug_Condition (C)**: The set of inputs or states that trigger one of the eight defects
- **Property (P)**: The correct observable behavior that must hold after the fix
- **Preservation**: All existing correct behaviors that must remain unchanged
- **handleCommandForDevice**: The function in `src/hooks/useDeviceManager.ts` that executes CLI commands and updates `deviceStates`
- **runningConfig**: The `string[]` array on `SwitchState` representing the live running configuration
- **startupConfig**: The `StartupConfig` snapshot on `SwitchState` persisted by `write memory` and restored on `reload`
- **taskContext**: The `TaskContext` object passed to `TaskCard` and `getTaskStatus`, currently built from only the active device's state
- **generateConfig()**: The local function inside `ConfigPanel.tsx` that synthesizes a config string from `SwitchState` fields — currently used instead of `state.runningConfig`
- **activeDeviceId**: The currently selected device ID in `page.tsx`, used to drive terminal focus and topology highlight

---

## Bug Details

### Bug Condition

The eight bugs share a common pattern: a data flow between two subsystems is broken — either a result field is produced but never consumed, a derived value is displayed instead of the authoritative source, or a state update in one component is not propagated to another.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { command?: string, action?: string, component?: string }
  OUTPUT: boolean

  RETURN (
    -- Bug 1: saveConfig result field ignored
    (input.command IN ['write memory', 'copy running-config startup-config']
      AND executeCommand returns saveConfig = true
      AND deviceStates[deviceId].startupConfig is NOT updated)

    OR

    -- Bug 2: eraseConfig result field ignored
    (input.command IN ['erase startup-config', 'erase nvram:']
      AND executeCommand returns eraseConfig = true
      AND deviceStates[deviceId].startupConfig is NOT cleared)

    OR

    -- Bug 3: ConfigPanel shows stale generated config
    (input.component = 'ConfigPanel'
      AND ConfigPanel renders generateConfig() output
      AND state.runningConfig contains different/newer data)

    OR

    -- Bug 4: runningConfig not updated after CLI command
    (input.command modifies device state (hostname, interface, vlan, security)
      AND newState returned by executeCommand does NOT include updated runningConfig)

    OR

    -- Bug 5: Tasks evaluated against single device only
    (input.action = 'view Tasks tab'
      AND topology has multiple devices
      AND taskContext does NOT include deviceStates map or topologyConnections)

    OR

    -- Bug 6: Device rename not propagated to hostname
    (input.action = 'rename device in topology canvas'
      AND devices[id].name is updated
      AND deviceStates[id].hostname is NOT updated)

    OR

    -- Bug 7: useState import after usage in useOptimizedAutosave
    (input.action = 'module load'
      AND useDebounce references useState
      AND useState import is placed AFTER useDebounce definition)

    OR

    -- Bug 8: Active device highlight lost on tab switch
    (input.action = 'switch to topology tab'
      AND activeDeviceId is set
      AND NetworkTopology selectedDeviceIds does NOT include activeDeviceId)
  )
END FUNCTION
```

### Examples

- **Bug 1**: User runs `write memory` on Switch-1. Terminal shows `[OK]`. User runs `reload`. Device boots with no startup config because `startupConfig` was never saved.
- **Bug 2**: User runs `erase startup-config`. Terminal shows `Erase of nvram: complete`. User runs `reload`. Device still boots with old config because `startupConfig` was never cleared.
- **Bug 3**: User sets `hostname MySwitch` via CLI. ConfigPanel still shows `hostname Switch` because it calls `generateConfig()` which reads `state.hostname` — but `state.hostname` may be stale if `runningConfig` is the authoritative source.
- **Bug 4**: User runs `hostname MySwitch`. `show running-config` in terminal shows updated hostname, but `runningConfig` array on state is not updated, so ConfigPanel and persistence are stale.
- **Bug 5**: Topology has Switch-1 and Switch-2 connected via trunk. Task "Configure trunk between switches" requires both devices. Tasks tab only checks Switch-1 (activeDeviceId), so the task never completes even when both are configured.
- **Bug 6**: User right-clicks Switch-1 in topology canvas and renames it to "Core-SW". Canvas label updates. CLI prompt still shows `Switch-1#` because `deviceStates.get('switch-1').hostname` was not updated.
- **Bug 7**: App loads. `useDebounce` is called. JavaScript throws `ReferenceError: useState is not defined` because the `import { useState }` statement is at the bottom of the file, after the function body.
- **Bug 8**: User double-clicks Switch-1 to open terminal. Switches to Topology tab. Switch-1 has no highlight ring because `selectedDeviceIds` was not re-synced from `activeDeviceId` prop.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `reload` command must continue to restore device state from `startupConfig` via `applyStartupConfig` (requirement 3.2)
- VTP VLAN propagation over trunk links must continue to work after any VLAN command (requirement 3.5)
- Terminal boot sequence output and CLI command processing must remain unchanged (requirement 3.4)
- Autosave to `localStorage` for topology devices, connections, and notes must continue (requirement 3.3)
- Project save/load to JSON must continue to restore all device states correctly (requirement 3.6)
- The `ConfigPanel` "Save" button must continue to execute `write memory` via `onExecuteCommand` (requirement 3.8)
- Single-device task evaluation (port, VLAN, security tasks against active device) must remain correct (requirement 3.7)

**Scope:**
All inputs that do NOT involve the eight bug conditions above should be completely unaffected. This includes:
- CLI commands that do not return `saveConfig` or `eraseConfig` (requirement 3.1)
- Mouse clicks, drag operations, and connection drawing in the topology canvas
- PC CMD terminal commands (ping, ipconfig, etc.)
- Theme switching, language switching, and other UI state

---

## Hypothesized Root Cause

1. **Missing result field consumption in handleCommandForDevice** (Bugs 1 & 2): `executeCommand` returns `saveConfig` and `eraseConfig` fields in its result, but `handleCommandForDevice` destructures only `{ requiresConfirmation, confirmationMessage, confirmationAction, success, newState, error, ...result }`. The `saveConfig` and `eraseConfig` fields end up in `...result` but are never acted upon. Fix: check `result.saveConfig` and `result.eraseConfig` after the success branch and update `deviceStates` accordingly.

2. **ConfigPanel bypasses live state** (Bug 3): `ConfigPanel.tsx` defines a local `generateConfig()` function that synthesizes config text from `SwitchState` fields. This was likely an early implementation before `runningConfig` was added to `SwitchState`. Fix: replace `generateConfig()` call with `state.runningConfig.join('\n')`.

3. **Executors don't update runningConfig** (Bug 4): The command executors in `src/lib/network/core/` return `newState` with updated fields (hostname, ports, vlans, etc.) but do not recompute `runningConfig`. The `runningConfig` array is initialized in `createInitialState` but never updated by command handlers. Fix: after merging `newState` into `deviceState` in `handleCommandForDevice`, regenerate `runningConfig` from the merged state using a shared utility function.

4. **TaskContext lacks topology-wide data** (Bug 5): `TaskContext` interface only has `{ cableInfo, showPCPanel, selectedDevice, language }`. The `taskContext` in `page.tsx` is built with the single active device's `state`. Tasks that need to check multiple devices (e.g. trunk configuration across two switches) have no way to access other device states. Fix: extend `TaskContext` to include `deviceStates: Map<string, SwitchState>` and `topologyConnections`, and pass them from `page.tsx`.

5. **Topology rename doesn't call deviceStates update** (Bug 6): The rename handler in `NetworkTopology.tsx` calls `setDevices(...)` to update the canvas device name but does not call any callback to update `deviceStates`. The `onTopologyChange` callback propagates device list changes to the parent, but `page.tsx` does not listen for hostname changes from topology. Fix: add an `onDeviceRename` callback prop to `NetworkTopology` and handle it in `page.tsx` to update `deviceStates[id].hostname`.

6. **Import hoisting violation** (Bug 7): `useOptimizedAutosave.ts` defines `useDebounce` which calls `useState`, but the `import { useState } from 'react'` statement is at the bottom of the file. ES module imports are hoisted at the module level by the spec, but some bundlers/transpilers may not handle this correctly when the import is after the usage in the source text. Fix: move the `useState` import to the top of the file with the other imports.

7. **selectedDeviceIds not re-synced on tab switch** (Bug 8): `NetworkTopology` has a `useEffect` that syncs `selectedDeviceIds` from the `activeDeviceId` prop, but this effect only runs when `activeDeviceId` changes. When the user switches tabs and returns to topology, `activeDeviceId` may not have changed, so the effect does not re-run and the highlight is lost. Fix: ensure the sync effect also runs when the topology tab becomes active, or ensure `selectedDeviceIds` is always derived from `activeDeviceId` without relying on a stale effect.

---

## Correctness Properties

Property 1: Bug Condition - saveConfig/eraseConfig Persistence

_For any_ CLI command where `executeCommand` returns `saveConfig: true`, the fixed `handleCommandForDevice` SHALL update `deviceStates[deviceId].startupConfig` to a snapshot of the current running configuration. _For any_ CLI command where `executeCommand` returns `eraseConfig: true`, the fixed `handleCommandForDevice` SHALL set `deviceStates[deviceId].startupConfig` to `undefined` or an empty value.

**Validates: Requirements 2.1, 2.2**

Property 2: Bug Condition - ConfigPanel Live Config Display

_For any_ `SwitchState` where `runningConfig` is a non-empty array, the fixed `ConfigPanel` SHALL display the content of `state.runningConfig.join('\n')` rather than the output of the local `generateConfig()` function.

**Validates: Requirements 2.3**

Property 3: Bug Condition - runningConfig Updated After CLI Commands

_For any_ CLI command that modifies device state (hostname, interface, VLAN, security settings), the fixed system SHALL produce a `newState` that includes an updated `runningConfig` array reflecting the current device configuration.

**Validates: Requirements 2.4**

Property 4: Bug Condition - Topology-Wide Task Evaluation

_For any_ topology with multiple devices and connections, the fixed task evaluation SHALL use the full `deviceStates` map and `topologyConnections` so that tasks requiring cross-device state are correctly assessed.

**Validates: Requirements 2.5**

Property 5: Bug Condition - Device Rename Propagation

_For any_ device rename action in the topology canvas, the fixed system SHALL update `deviceStates[deviceId].hostname` to match the new canvas device name.

**Validates: Requirements 2.6**

Property 6: Bug Condition - useState Import Position

_For any_ module load of `useOptimizedAutosave.ts`, the fixed file SHALL have `useState` imported at the top of the file so that `useDebounce` does not throw a reference error.

**Validates: Requirements 2.7**

Property 7: Bug Condition - Active Device Highlight Sync

_For any_ navigation to the topology tab where `activeDeviceId` is set, the fixed `NetworkTopology` SHALL include `activeDeviceId` in `selectedDeviceIds` so the correct device is visually highlighted.

**Validates: Requirements 2.8**

Property 8: Preservation - Unchanged Behaviors

_For any_ input where none of the eight bug conditions hold (non-saveConfig commands, non-eraseConfig commands, non-topology-rename actions, non-tab-switch actions), the fixed system SHALL produce exactly the same behavior as the original system, preserving reload-from-startup, VTP propagation, autosave, terminal output, and project save/load.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

---

## Fix Implementation

### Changes Required

**File 1**: `src/hooks/useDeviceManager.ts`

**Function**: `handleCommandForDevice`

**Specific Changes**:
1. **Consume saveConfig result**: After the `if (newState)` block in the success branch, add:
   ```ts
   if (result.saveConfig && newState) {
     // startupConfig is set from the merged running state
     const merged = { ...deviceState, ...newState };
     setDeviceStates(prev => {
       const next = new Map(prev);
       const current = next.get(deviceId) || merged;
       next.set(deviceId, {
         ...current,
         startupConfig: buildStartupConfig(current)
       });
       return next;
     });
   }
   if (result.eraseConfig) {
     setDeviceStates(prev => {
       const next = new Map(prev);
       const current = next.get(deviceId);
       if (current) next.set(deviceId, { ...current, startupConfig: undefined });
       return next;
     });
   }
   ```
2. **Update runningConfig after state merge**: After merging `newState`, call a `buildRunningConfig(mergedState)` utility and include the result in the state update.

---

**File 2**: `src/components/network/ConfigPanel.tsx`

**Specific Changes**:
1. **Replace generateConfig() with live runningConfig**: Change `const configText = generateConfig();` to:
   ```ts
   const configText = (state.runningConfig || []).join('\n');
   ```
2. **Remove or keep `generateConfig`** as a fallback only if `runningConfig` is empty (optional safety net).

---

**File 3**: `src/lib/network/core/` (command executors) + shared utility

**Specific Changes**:
1. **Add `buildRunningConfig(state: SwitchState): string[]`** utility in `src/lib/network/initialState.ts` or a new `src/lib/network/core/configBuilder.ts`. This function generates the canonical `runningConfig` lines from the current state fields (hostname, ports, vlans, security, etc.) — essentially the same logic as `generateConfig()` in ConfigPanel but operating on `SwitchState` and returning `string[]`.
2. **Call `buildRunningConfig` in `handleCommandForDevice`**: After merging `newState`, recompute `runningConfig` and include it in the state update.

---

**File 4**: `src/lib/network/taskDefinitions.ts`

**Specific Changes**:
1. **Extend `TaskContext`**:
   ```ts
   export interface TaskContext {
     cableInfo: CableInfo;
     showPCPanel: boolean;
     selectedDevice: 'pc' | 'switch' | 'router' | null;
     language: 'tr' | 'en';
     deviceStates?: Map<string, SwitchState>;       // NEW
     topologyConnections?: CanvasConnection[];       // NEW
   }
   ```
2. **Update topology-wide task `checkFn`s** to use `context.deviceStates` and `context.topologyConnections` where needed.

---

**File 5**: `src/app/page.tsx`

**Specific Changes**:
1. **Pass `deviceStates` and `topologyConnections` to `taskContext`**:
   ```ts
   const taskContext: TaskContext = {
     language,
     cableInfo,
     showPCPanel: false,
     selectedDevice,
     deviceStates,           // NEW
     topologyConnections,    // NEW
   };
   ```
2. **Add `onDeviceRename` handler**: When `NetworkTopology` fires a rename event, update `deviceStates[id].hostname` and `runningConfig`.

---

**File 6**: `src/components/network/NetworkTopology.tsx`

**Specific Changes**:
1. **Add `onDeviceRename` prop**: `onDeviceRename?: (deviceId: string, newName: string) => void`
2. **Call `onDeviceRename`** inside the rename confirmation handler after `setDevices(...)`.
3. **Fix selectedDeviceIds sync**: Ensure the `useEffect` that syncs `selectedDeviceIds` from `activeDeviceId` also fires when the component becomes active (add `isActive` to the dependency array or use a separate effect).

---

**File 7**: `src/hooks/useOptimizedAutosave.ts`

**Specific Changes**:
1. **Move `import { useState } from 'react'`** to the top of the file, alongside the existing `import { useEffect, useRef, useCallback } from 'react'`. Merge into a single import statement:
   ```ts
   import { useState, useEffect, useRef, useCallback } from 'react';
   ```
2. **Remove** the duplicate `import { useState } from 'react'` at the bottom of the file.

---

## Testing Strategy

### Validation Approach

Testing follows a two-phase approach: first run exploratory tests on unfixed code to confirm the root cause, then verify the fix and run preservation checks.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate each bug on unfixed code. Confirm or refute root cause hypotheses.

**Test Plan**: Write unit tests that exercise each bug condition directly against the current (unfixed) code and assert the expected correct behavior. These tests will fail on unfixed code, confirming the bug.

**Test Cases**:
1. **saveConfig not persisted**: Call `handleCommandForDevice` with `'write memory'`, then read `deviceStates.get(deviceId).startupConfig` — expect it to be set, observe it is `undefined` (will fail on unfixed code)
2. **eraseConfig not cleared**: Set a `startupConfig`, call `handleCommandForDevice` with `'erase startup-config'`, read `startupConfig` — expect `undefined`, observe it is still set (will fail on unfixed code)
3. **ConfigPanel stale config**: Render `ConfigPanel` with a state where `runningConfig = ['hostname MySwitch', '!']`, assert displayed text contains `MySwitch` — observe it shows `Switch` from `generateConfig()` (will fail on unfixed code)
4. **runningConfig not updated**: Execute `hostname NewName` command, read `deviceStates.get(id).runningConfig` — expect it to contain `hostname NewName`, observe it still has the old value (will fail on unfixed code)
5. **useState crash**: Import `useOptimizedAutosave` module — expect no error, observe `ReferenceError: useState is not defined` (will fail on unfixed code)

**Expected Counterexamples**:
- `startupConfig` remains `undefined` after `write memory`
- `startupConfig` remains set after `erase startup-config`
- ConfigPanel displays hostname from `generateConfig()` not from `runningConfig`
- `runningConfig` array unchanged after hostname/interface commands
- Module load throws `ReferenceError`

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed functions produce the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedSystem(input)
  ASSERT expectedBehavior(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed system produces the same result as the original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalSystem(input) = fixedSystem(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many random command sequences and device states automatically
- It catches edge cases in VTP propagation and reload logic that manual tests miss
- It provides strong guarantees that non-buggy paths are unaffected

**Test Plan**: Observe behavior on unfixed code for reload, VTP propagation, and non-saveConfig commands, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Reload preservation**: Verify `reload` still applies `startupConfig` via `applyStartupConfig` after the fix
2. **VTP propagation preservation**: Verify VLAN add/remove still propagates over trunk links after the fix
3. **Non-saveConfig command preservation**: For any command that does not return `saveConfig`/`eraseConfig`, verify `startupConfig` is unchanged
4. **Terminal output preservation**: Verify boot sequence and command output are unchanged
5. **Project save/load preservation**: Verify JSON export/import round-trips correctly

### Unit Tests

- Test `handleCommandForDevice` with `write memory` → `startupConfig` is set
- Test `handleCommandForDevice` with `erase startup-config` → `startupConfig` is cleared
- Test `ConfigPanel` renders `state.runningConfig` content, not `generateConfig()` output
- Test `buildRunningConfig` utility produces correct lines for a given state
- Test `useOptimizedAutosave` module loads without error
- Test topology rename callback updates `deviceStates.hostname`
- Test `NetworkTopology` `selectedDeviceIds` includes `activeDeviceId` after tab switch

### Property-Based Tests

- Generate random valid CLI commands; for commands returning `saveConfig: true`, verify `startupConfig` is always updated
- Generate random device states; verify `buildRunningConfig(state).join('\n')` matches what `ConfigPanel` displays
- Generate random topologies with multiple devices; verify task evaluation result is independent of which device is "active"
- Generate random sequences of non-saveConfig commands; verify `startupConfig` is never mutated

### Integration Tests

- Full flow: configure switch → `write memory` → `reload` → verify config is restored
- Full flow: configure switch → `erase startup-config` → `reload` → verify device boots clean
- Full flow: rename device in topology → open terminal → verify CLI prompt shows new hostname
- Full flow: configure two switches with trunk → view Tasks tab → verify trunk task is complete
- Full flow: open terminal for device → switch to topology tab → verify device is highlighted
