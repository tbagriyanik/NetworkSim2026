import type { CommandContext } from './commandTypes';
import type { SwitchState, CommandResult } from '../types';
import { clearArpCache } from '../arp';
import { clearNdpCache } from '../ndp';
import { clearMacTable, clearDynamicMacEntries, clearStaticMacEntries } from '../macLearning';

/**
 * Clear ARP Cache
 */
export function cmdClearArpCache(_state: SwitchState, _input: string, ctx: CommandContext): CommandResult {
    const deviceId = ctx.sourceDeviceId;
    const deviceStates = ctx.deviceStates;

    if (deviceId && deviceStates) {
        clearArpCache(deviceId, deviceStates);
    }

    return { success: true, output: '' };
}

/**
 * Clear IPv6 Neighbors Cache
 */
export function cmdClearIpv6Neighbors(_state: SwitchState, _input: string, ctx: CommandContext): CommandResult {
    const deviceId = ctx.sourceDeviceId;
    const deviceStates = ctx.deviceStates;

    if (deviceId && deviceStates) {
        clearNdpCache(deviceId, deviceStates);
    }

    return { success: true, output: '' };
}

/**
 * Clear MAC Address-Table
 */
export function cmdClearMacAddressTable(_state: SwitchState, input: string, ctx: CommandContext): CommandResult {
    const deviceId = ctx.sourceDeviceId;
    const deviceStates = ctx.deviceStates;
    const args = input.trim().split(/\s+/).slice(2); // Skip "clear mac address-table"

    if (deviceId && deviceStates) {
        if (args.length === 0 || args[0] === '') {
            // Clear all entries
            clearMacTable(deviceId, deviceStates);
        } else if (args[0] === 'dynamic') {
            // Clear only dynamic entries
            clearDynamicMacEntries(deviceId, deviceStates);
        } else if (args[0] === 'static') {
            // Clear only static entries
            clearStaticMacEntries(deviceId, deviceStates);
        }
    }

    return { success: true, output: '' };
}

/**
 * Clear Counters
 */
export function cmdClearCounters(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
    // Parse input to see if specific interface is mentioned
    const match = input.match(/clear\s+counters\s+(?:interface\s+)?(\S+)?/i);
    const interfaceName = match?.[1];

    const newState = structuredClone(state);

    if (interfaceName) {
        // Clear counters for specific interface
        const port = newState.ports?.[interfaceName.toLowerCase()];
        if (!port) {
            return { success: false, error: `% Interface ${interfaceName} not found` };
        }
        // Reset statistics for this port
        port.statistics = {
            inputPackets: 0,
            outputPackets: 0,
            inputBytes: 0,
            outputBytes: 0,
            inputErrors: 0,
            outputErrors: 0,
            crcErrors: 0,
            collisions: 0,
            runts: 0,
            giants: 0,
            throttles: 0,
            resets: 1,
            drops: 0,
            overruns: 0,
            underruns: 0,
            lastCleared: Date.now()
        };
        return {
            success: true,
            output: `Clear "show interface" counters on interface ${interfaceName}\n`,
            newState
        };
    } else {
        // Clear counters for all interfaces
        Object.keys(newState.ports || {}).forEach(portName => {
            const port = newState.ports[portName];
            if (port) {
                port.statistics = {
                    inputPackets: 0,
                    outputPackets: 0,
                    inputBytes: 0,
                    outputBytes: 0,
                    inputErrors: 0,
                    outputErrors: 0,
                    crcErrors: 0,
                    collisions: 0,
                    runts: 0,
                    giants: 0,
                    throttles: 0,
                    resets: 1,
                    drops: 0,
                    overruns: 0,
                    underruns: 0,
                    lastCleared: Date.now()
                };
            }
        });
        return {
            success: true,
            output: 'Clear "show interface" counters on all interfaces\n',
            newState
        };
    }
}

/**
 * Clear Line
 */
export function cmdClearLine(_state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
    return { success: true, output: '[confirm]\n' };
}

/**
 * Clear Interface
 */
export function cmdClearInterface(_state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
    return { success: true, output: '[confirm]\n' };
}