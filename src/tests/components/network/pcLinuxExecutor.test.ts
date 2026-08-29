import { describe, expect, it, vi } from 'vitest';
import { executeLinuxCommand } from '@/components/network/pc-panel/pcLinuxExecutor';

describe('executeLinuxCommand date handling', () => {
    const baseParams = {
        deviceId: 'pc-1',
        internalPcHostname: 'pc1',
        pcIP: '192.168.1.10',
        pcSubnet: '255.255.255.0',
        pcMAC: '00:11:22:33:44:55',
        pcGateway: '192.168.1.1',
        pcDNS: '8.8.8.8',
        pcIPv6: 'fe80::1',
        wifiEnabled: false,
        currentPath: '/',
        setCurrentPath: vi.fn(),
        canReachTargetIp: vi.fn(() => true),
        resolveDeviceNameTargetCallback: vi.fn(() => null),
        addLocalOutput: vi.fn(),
        setLinuxOutput: vi.fn(),
    };

    it('uses the NTP time when it is available', async () => {
        const expected = new Date('2026-08-29T12:34:56Z');
        const outputs: string[] = [];

        await executeLinuxCommand('date', {
            ...baseParams,
            getNtpNow: () => expected,
            addLocalOutput: (_type, content) => outputs.push(content),
        });

        const commandOutputs = outputs.filter(value => value !== 'date');
        expect(commandOutputs).toContain(expected.toString());
    });

    it('falls back to the current system date when NTP sync is not active', async () => {
        const outputs: string[] = [];

        await expect(
            executeLinuxCommand('date', {
                ...baseParams,
                getNtpNow: () => null,
                addLocalOutput: (_type, content) => outputs.push(content),
            })
        ).resolves.toBeUndefined();

        const commandOutputs = outputs.filter(value => value !== 'date');
        expect(commandOutputs.length).toBeGreaterThan(0);
        expect(commandOutputs.at(-1)).toContain(String(new Date().getFullYear()));
    });
});
