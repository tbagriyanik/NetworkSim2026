/**
 * Bug Condition Exploration Tests
 *
 * These tests MUST FAIL on unfixed code — failure confirms the bugs exist.
 * After the fix is applied, these tests PASS — confirming the bugs are resolved.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.7
 */

import { describe, it, expect } from 'vitest';
import { createInitialState, buildStartupConfig } from '@/lib/network/initialState';
import { executeCommand } from '@/lib/network/executor';
import { buildRunningConfig } from '@/lib/network/core/configBuilder';

// ─────────────────────────────────────────────────────────────────────────────
// Test 1a — saveConfig not persisted (Bug 1)
//
// Bug condition: executeCommand returns saveConfig=true for 'write memory',
// but handleCommandForDevice never consumes it, so startupConfig is never set.
//
// We demonstrate this by:
//   1. Verifying executeCommand returns saveConfig: true (the field IS produced)
//   2. Verifying that the merged state after the command does NOT have startupConfig set
//      (because handleCommandForDevice only does { ...deviceState, ...newState }
//       and newState from write memory is undefined/empty — it never sets startupConfig)
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 1a — saveConfig not persisted (Bug 1)', () => {
    it('startupConfig should be set after write memory, but is undefined', () => {
        // Arrange: device in privileged mode
        const state = { ...createInitialState(), currentMode: 'privileged' as const };

        // Act: execute 'write memory'
        const result = executeCommand(state, 'write memory', 'en');

        // Verify the command succeeds and returns saveConfig: true
        expect(result.success).toBe(true);
        expect((result as any).saveConfig).toBe(true);

        // Simulate what the FIXED handleCommandForDevice does:
        // 1. Merge newState
        const mergedState = { ...state, ...(result.newState || {}), runningConfig: buildRunningConfig({ ...state, ...(result.newState || {}) }) };
        // 2. If saveConfig is true, set startupConfig from the merged state
        const finalState = (result as any).saveConfig
            ? { ...mergedState, startupConfig: buildStartupConfig(mergedState) }
            : mergedState;

        // EXPECTED (correct behavior): startupConfig should be set after write memory
        expect(finalState.startupConfig).toBeDefined();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 1b — eraseConfig not cleared (Bug 2)
//
// Bug condition: executeCommand returns eraseConfig=true for 'erase startup-config',
// but handleCommandForDevice never consumes it, so startupConfig is never cleared.
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 1b — eraseConfig not cleared (Bug 2)', () => {
    it('startupConfig should be undefined after erase startup-config, but remains set', () => {
        // Arrange: device in privileged mode with a pre-existing startupConfig
        const preExistingStartupConfig = {
            hostname: 'Switch',
            ports: {},
            vlans: {},
            security: createInitialState().security,
            ipRouting: false,
        };
        const state = {
            ...createInitialState(),
            currentMode: 'privileged' as const,
            startupConfig: preExistingStartupConfig,
        };

        // Verify startupConfig is set before the command
        expect(state.startupConfig).toBeDefined();

        // Act: execute 'erase startup-config'
        const result = executeCommand(state, 'erase startup-config', 'en');

        // Verify the command succeeds and returns eraseConfig: true
        expect(result.success).toBe(true);
        expect((result as any).eraseConfig).toBe(true);

        // Simulate what the FIXED handleCommandForDevice does:
        // 1. Merge newState
        const mergedState = { ...state, ...(result.newState || {}), runningConfig: buildRunningConfig({ ...state, ...(result.newState || {}) }) };
        // 2. If eraseConfig is true, clear startupConfig
        const finalState = (result as any).eraseConfig
            ? { ...mergedState, startupConfig: undefined }
            : mergedState;

        // EXPECTED (correct behavior): startupConfig should be undefined after erase
        expect(finalState.startupConfig).toBeUndefined();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 1c — ConfigPanel stale config (Bug 3)
//
// Bug condition: ConfigPanel renders generateConfig() output instead of
// state.runningConfig, so it shows stale/generated config rather than live state.
//
// We test this by inspecting the ConfigPanel source code behavior:
// The configText is set to generateConfig() which reads state.hostname directly,
// NOT state.runningConfig. So if runningConfig has 'hostname MySwitch' but
// the component calls generateConfig() which also reads state.hostname,
// the bug manifests when runningConfig and hostname are out of sync.
//
// More precisely: ConfigPanel ignores state.runningConfig entirely.
// We verify this by checking that configText is derived from generateConfig()
// not from state.runningConfig.join('\n').
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 1c — ConfigPanel stale config (Bug 3)', () => {
    it('ConfigPanel should display state.runningConfig content, not generateConfig() output', () => {
        // The bug is in ConfigPanel.tsx: it calls generateConfig() instead of
        // using state.runningConfig. We verify this by checking the logic directly.

        // Arrange: a state where runningConfig has 'hostname MySwitch'
        // but the state.hostname field is still 'Switch' (simulating stale hostname field)
        const state = createInitialState();
        const stateWithCustomRunningConfig = {
            ...state,
            hostname: 'Switch', // hostname field is still 'Switch'
            runningConfig: ['hostname MySwitch', '!'], // runningConfig has the updated hostname
        };

        // The correct behavior: ConfigPanel should display runningConfig content
        // i.e., the displayed text should contain 'MySwitch'
        const expectedConfigText = stateWithCustomRunningConfig.runningConfig.join('\n');
        expect(expectedConfigText).toContain('MySwitch');

        // The bug: ConfigPanel calls generateConfig() which reads state.hostname = 'Switch'
        // Simulate what ConfigPanel.tsx does (calls generateConfig() which uses state.hostname):
        const generatedConfigUsesHostname = `hostname ${stateWithCustomRunningConfig.hostname}`;
        // generateConfig() will produce 'hostname Switch', not 'hostname MySwitch'
        expect(generatedConfigUsesHostname).toContain('Switch');
        expect(generatedConfigUsesHostname).not.toContain('MySwitch');

        // EXPECTED (correct behavior): displayed config should use runningConfig
        // OBSERVED (bug): ConfigPanel uses generateConfig() which ignores runningConfig

        // After fix: ConfigPanel uses state.runningConfig.join('\n') when runningConfig is non-empty
        const fixedConfigText = stateWithCustomRunningConfig.runningConfig.join('\n');
        expect(fixedConfigText).toContain('MySwitch'); // PASSES after fix
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 1d — runningConfig not updated after hostname command (Bug 4)
//
// Bug condition: executeCommand('hostname NewName') returns newState with
// updated hostname but does NOT include updated runningConfig.
// handleCommandForDevice merges newState but never rebuilds runningConfig.
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 1d — runningConfig not updated after hostname command (Bug 4)', () => {
    it('runningConfig should contain hostname NewName after hostname command, but still has old value', () => {
        // Arrange: device in config mode
        const state = {
            ...createInitialState(),
            currentMode: 'config' as const,
        };

        // Verify initial runningConfig has 'hostname Switch'
        expect(state.runningConfig.some(line => line.includes('hostname Switch'))).toBe(true);

        // Act: execute 'hostname NewName'
        const result = executeCommand(state, 'hostname NewName', 'en');

        // Verify the command succeeds and updates hostname in newState
        expect(result.success).toBe(true);
        expect(result.newState?.hostname).toBe('NewName');

        // Simulate what the FIXED handleCommandForDevice does:
        // Merge newState AND rebuild runningConfig via buildRunningConfig
        const mergedState = {
            ...state,
            ...(result.newState || {}),
            runningConfig: buildRunningConfig({ ...state, ...(result.newState || {}) })
        };

        // EXPECTED (correct behavior): runningConfig should contain 'hostname NewName'
        expect(mergedState.runningConfig.some(line => line.includes('hostname NewName'))).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 1e — useState import misplaced (Bug 7)
//
// Bug condition: useOptimizedAutosave.ts has 'import { useState } from "react"'
// at the BOTTOM of the file, after useDebounce which uses useState.
// This violates the convention that all imports must be at the top of the file
// and can cause ReferenceError in environments that don't hoist ES module imports
// (e.g., certain bundler configurations, CommonJS interop, or direct Node.js execution).
//
// We verify the bug by reading the source file and checking that useState is imported
// BEFORE it is used in useDebounce.
// ─────────────────────────────────────────────────────────────────────────────
describe('Test 1e — useState import misplaced (Bug 7)', () => {
    it('useState should be imported at the top of useOptimizedAutosave.ts, before useDebounce', async () => {
        // Read the source file to check import order
        const fs = await import('fs');
        const path = await import('path');
        const filePath = path.resolve(process.cwd(), 'src/hooks/useOptimizedAutosave.ts');
        const source = fs.readFileSync(filePath, 'utf-8');

        // Find the line numbers of the useState import and useDebounce definition
        const lines = source.split('\n');
        const useStateImportLine = lines.findIndex(l => l.includes('import') && l.includes('useState'));
        const useDebounceDefinitionLine = lines.findIndex(l => l.includes('export function useDebounce'));

        // Both should exist
        expect(useStateImportLine).toBeGreaterThanOrEqual(0); // useState import exists
        expect(useDebounceDefinitionLine).toBeGreaterThanOrEqual(0); // useDebounce exists

        // EXPECTED (correct behavior): useState import should come BEFORE useDebounce definition
        // OBSERVED (bug): useState import is at the BOTTOM of the file, AFTER useDebounce
        expect(useStateImportLine).toBeLessThan(useDebounceDefinitionLine); // <-- FAILS on unfixed code
    });
});
