# Implementation Plan

- [x] 1. Write bug condition exploration tests
  - **Property 1: Bug Condition** - CLI State Persistence, Config Display, and Import Crash
  - **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: These tests encode the expected behavior — they will validate the fix when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate each bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope each property to the concrete failing case(s)
  - Test 1a — saveConfig not persisted: call `handleCommandForDevice` with `'write memory'`, then assert `deviceStates.get(deviceId).startupConfig` is set; observe it is `undefined` (Bug 1, isBugCondition: command IN ['write memory'] AND executeCommand returns saveConfig=true AND startupConfig NOT updated)
  - Test 1b — eraseConfig not cleared: pre-set a `startupConfig`, call `handleCommandForDevice` with `'erase startup-config'`, assert `startupConfig` is `undefined`; observe it is still set (Bug 2)
  - Test 1c — ConfigPanel stale config: render `ConfigPanel` with `state.runningConfig = ['hostname MySwitch', '!']`, assert displayed text contains `MySwitch`; observe it shows `Switch` from `generateConfig()` (Bug 3)
  - Test 1d — runningConfig not updated: execute `hostname NewName`, assert `deviceStates.get(id).runningConfig` contains `hostname NewName`; observe old value (Bug 4)
  - Test 1e — useState crash: import `useOptimizedAutosave` module, assert no error; observe `ReferenceError: useState is not defined` (Bug 7)
  - Run all tests on UNFIXED code
  - **EXPECTED OUTCOME**: All tests FAIL (this is correct — it proves the bugs exist)
  - Document counterexamples found (e.g., `startupConfig` remains `undefined` after `write memory`, `ReferenceError` on module load)
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Reload, VTP Propagation, and Non-saveConfig Command Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: `reload` on a device with `startupConfig` set correctly restores state via `applyStartupConfig` on unfixed code
  - Observe: VLAN add/remove propagates over trunk links to neighboring switches on unfixed code
  - Observe: CLI commands that do NOT return `saveConfig`/`eraseConfig` leave `startupConfig` unchanged on unfixed code
  - Observe: terminal boot sequence output and command processing are unchanged on unfixed code
  - Write property-based test: for all commands where `executeCommand` does NOT return `saveConfig: true` or `eraseConfig: true`, assert `startupConfig` is identical before and after (from Preservation Requirements 3.1 in design)
  - Write property-based test: for any VLAN command on a trunk-connected switch, assert VLAN propagates to neighbor (Preservation Requirement 3.5)
  - Write property-based test: for any `reload` command, assert resulting state matches `applyStartupConfig(baseState, startupConfig)` (Preservation Requirement 3.2)
  - Verify all tests PASS on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 3. Fix Bug 7 — move useState import to top of useOptimizedAutosave.ts
  - [x] 3.1 Merge useState into the existing React import at the top of `src/hooks/useOptimizedAutosave.ts`
    - Change `import { useEffect, useRef, useCallback } from 'react'` to `import { useState, useEffect, useRef, useCallback } from 'react'`
    - Remove the `import { useState } from 'react'` line at the bottom of the file
    - _Bug_Condition: isBugCondition({ action: 'module load' }) — useState import placed after useDebounce definition_
    - _Expected_Behavior: module loads without ReferenceError; useDebounce works correctly_
    - _Preservation: useOptimizedAutosave and useDebounce behavior unchanged (Requirements 3.3)_
    - _Requirements: 1.7, 2.7_

  - [x] 3.2 Verify bug condition exploration test 1e now passes
    - **Property 1: Expected Behavior** - useState Import Fix
    - **IMPORTANT**: Re-run the SAME test from task 1 (test 1e) — do NOT write a new test
    - Run the module-load test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms no ReferenceError on import)
    - _Requirements: 2.7_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Autosave Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions in autosave)

- [x] 4. Add buildRunningConfig utility (new file src/lib/network/core/configBuilder.ts)
  - [x] 4.1 Create `src/lib/network/core/configBuilder.ts` with `buildRunningConfig(state: SwitchState): string[]`
    - Implement the same config-generation logic as `generateConfig()` in `ConfigPanel.tsx` but operating on `SwitchState` and returning `string[]` (one entry per config line)
    - Include: version header, hostname, banner, enable secret/password, users, ip routing, VLANs, interfaces, VLAN SVIs, line con 0, line vty 0 15, end
    - Export the function for use in `useDeviceManager.ts` and `ConfigPanel.tsx`
    - _Bug_Condition: isBugCondition({ command: 'hostname ...' }) — runningConfig not updated after CLI commands_
    - _Expected_Behavior: buildRunningConfig(mergedState) returns string[] reflecting current device configuration_
    - _Preservation: does not alter any existing state; pure function (Requirements 3.1–3.8)_
    - _Requirements: 1.4, 2.4_

- [x] 5. Fix Bugs 1, 2, 4 — update useDeviceManager.ts to consume saveConfig/eraseConfig and rebuild runningConfig
  - [x] 5.1 Consume `result.saveConfig` in `handleCommandForDevice` in `src/hooks/useDeviceManager.ts`
    - After the `if (newState)` block in the success branch, add a check: if `result.saveConfig && newState`, call `setDeviceStates` to set `startupConfig` to `buildRunningConfig(mergedState)` (or a snapshot object) on the device
    - _Bug_Condition: isBugCondition({ command: 'write memory' }) — saveConfig result field ignored_
    - _Expected_Behavior: deviceStates[deviceId].startupConfig is updated to current running config snapshot_
    - _Preservation: only triggered when saveConfig=true; all other commands unaffected (Requirement 3.1)_
    - _Requirements: 1.1, 2.1_

  - [x] 5.2 Consume `result.eraseConfig` in `handleCommandForDevice`
    - After the saveConfig block, add: if `result.eraseConfig`, call `setDeviceStates` to set `startupConfig` to `undefined` on the device
    - _Bug_Condition: isBugCondition({ command: 'erase startup-config' }) — eraseConfig result field ignored_
    - _Expected_Behavior: deviceStates[deviceId].startupConfig is cleared_
    - _Preservation: only triggered when eraseConfig=true; reload still applies startupConfig via applyStartupConfig (Requirement 3.2)_
    - _Requirements: 1.2, 2.2_

  - [x] 5.3 Rebuild runningConfig after state merge in `handleCommandForDevice`
    - After merging `newState` into `deviceState`, call `buildRunningConfig(mergedState)` and include the result as `runningConfig` in the `setDeviceStates` update
    - _Bug_Condition: isBugCondition({ command: 'hostname ...' }) — runningConfig not updated after CLI commands_
    - _Expected_Behavior: deviceStates[deviceId].runningConfig reflects current configuration after every command_
    - _Preservation: VTP propagation, reload, and terminal output unchanged (Requirements 3.2, 3.4, 3.5)_
    - _Requirements: 1.4, 2.4_

  - [x] 5.4 Verify bug condition exploration tests 1a, 1b, 1d now pass
    - **Property 1: Expected Behavior** - saveConfig/eraseConfig Persistence and runningConfig Update
    - **IMPORTANT**: Re-run the SAME tests from task 1 (tests 1a, 1b, 1d) — do NOT write new tests
    - **EXPECTED OUTCOME**: Tests PASS (confirms Bugs 1, 2, 4 are fixed)
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 5.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Reload, VTP, Non-saveConfig Commands
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)

- [x] 6. Fix Bug 3 — update ConfigPanel.tsx to use live runningConfig
  - [x] 6.1 Replace `generateConfig()` call with `state.runningConfig` in `src/components/network/ConfigPanel.tsx`
    - Change `const configText = generateConfig();` to `const configText = (state.runningConfig || []).join('\n');`
    - Keep `generateConfig` as a fallback only if `runningConfig` is empty (optional safety net): `const configText = state.runningConfig?.length ? state.runningConfig.join('\n') : generateConfig();`
    - _Bug_Condition: isBugCondition({ component: 'ConfigPanel' }) — ConfigPanel renders generateConfig() instead of state.runningConfig_
    - _Expected_Behavior: ConfigPanel displays state.runningConfig.join('\n') when runningConfig is non-empty_
    - _Preservation: "Save" button still executes write memory via onExecuteCommand (Requirement 3.8)_
    - _Requirements: 1.3, 2.3_

  - [x] 6.2 Verify bug condition exploration test 1c now passes
    - **Property 1: Expected Behavior** - ConfigPanel Live Config Display
    - **IMPORTANT**: Re-run the SAME test from task 1 (test 1c) — do NOT write a new test
    - **EXPECTED OUTCOME**: Test PASSES (confirms Bug 3 is fixed)
    - _Requirements: 2.3_

  - [x] 6.3 Verify preservation tests still pass
    - **Property 2: Preservation** - ConfigPanel Save Button
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)

- [x] 7. Fix Bug 5 — extend TaskContext and pass topology-wide data from page.tsx
  - [x] 7.1 Extend `TaskContext` interface in `src/lib/network/taskDefinitions.ts`
    - Add optional fields: `deviceStates?: Map<string, SwitchState>` and `topologyConnections?: CanvasConnection[]`
    - Import `CanvasConnection` from `@/components/network/networkTopology.types`
    - _Bug_Condition: isBugCondition({ action: 'view Tasks tab' }) — taskContext lacks deviceStates and topologyConnections_
    - _Expected_Behavior: TaskContext includes full topology data for cross-device task evaluation_
    - _Preservation: existing checkFn signatures unchanged; new fields are optional (Requirement 3.7)_
    - _Requirements: 1.5, 2.5_

  - [x] 7.2 Pass `deviceStates` and `topologyConnections` to `taskContext` in `src/app/page.tsx`
    - Update the `taskContext` object to include `deviceStates` and `topologyConnections: topologyConnections`
    - _Bug_Condition: isBugCondition({ action: 'view Tasks tab' }) — taskContext built from single active device only_
    - _Expected_Behavior: task evaluation uses full deviceStates map and topologyConnections_
    - _Preservation: single-device task checks (port, VLAN, security) still use active device state (Requirement 3.7)_
    - _Requirements: 1.5, 2.5_

- [x] 8. Fix Bug 6 — propagate topology device rename to deviceStates hostname
  - [x] 8.1 Add `onDeviceRename` prop to `NetworkTopology` in `src/components/network/NetworkTopology.tsx`
    - Add `onDeviceRename?: (deviceId: string, newName: string) => void` to `NetworkTopologyProps`
    - Call `onDeviceRename(deviceId, newName)` inside the rename confirmation handler after `setDevices(...)` updates the canvas label
    - _Bug_Condition: isBugCondition({ action: 'rename device in topology canvas' }) — rename not propagated to deviceStates.hostname_
    - _Expected_Behavior: onDeviceRename fires with deviceId and new name after canvas rename_
    - _Preservation: existing rename UI and setDevices behavior unchanged_
    - _Requirements: 1.6, 2.6_

  - [x] 8.2 Handle `onDeviceRename` in `src/app/page.tsx` to update deviceStates hostname and runningConfig
    - Add handler: when `onDeviceRename(deviceId, newName)` fires, call `setDeviceStates` to update `hostname` and rebuild `runningConfig` via `buildRunningConfig` on the affected device
    - Pass the handler as `onDeviceRename` prop to `<NetworkTopology />`
    - _Bug_Condition: isBugCondition({ action: 'rename device in topology canvas' }) — hostname in deviceStates not updated_
    - _Expected_Behavior: deviceStates[deviceId].hostname equals new canvas name; runningConfig reflects updated hostname_
    - _Preservation: topology canvas label update, autosave, and project save/load unaffected (Requirements 3.3, 3.6)_
    - _Requirements: 1.6, 2.6_

- [x] 9. Fix Bug 8 — sync selectedDeviceIds with activeDeviceId on topology tab activation
  - [x] 9.1 Fix the `selectedDeviceIds` sync effect in `src/components/network/NetworkTopology.tsx`
    - The existing `useEffect` that syncs `selectedDeviceIds` from `activeDeviceId` only fires when `activeDeviceId` changes; add `isActive` to its dependency array so it also re-runs when the topology tab becomes active
    - _Bug_Condition: isBugCondition({ action: 'switch to topology tab' }) — selectedDeviceIds not re-synced when tab becomes active_
    - _Expected_Behavior: selectedDeviceIds includes activeDeviceId whenever topology tab is active_
    - _Preservation: drag, pan, zoom, and connection drawing behavior unchanged_
    - _Requirements: 1.8, 2.8_

- [x] 10. Checkpoint — Ensure all tests pass
  - Re-run all exploration tests from task 1 (tests 1a–1e): all must PASS
  - Re-run all preservation tests from task 2: all must PASS
  - Run integration smoke checks:
    - Configure switch → `write memory` → `reload` → verify config is restored (Bugs 1 & 2)
    - Run `hostname MySwitch` → open ConfigPanel → verify it shows `MySwitch` (Bugs 3 & 4)
    - Rename device in topology → open terminal → verify CLI prompt shows new hostname (Bug 6)
    - Open terminal for device → switch to topology tab → verify device is highlighted (Bug 8)
    - View Tasks tab with multi-device topology → verify cross-device tasks evaluate correctly (Bug 5)
  - Ensure all tests pass; ask the user if questions arise.
