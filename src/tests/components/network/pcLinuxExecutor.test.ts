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

describe('Linux CLI feature enhancements (Items 8-13)', () => {
    const createTestParams = () => {
        const outputs: { type: string; content: string }[] = [];
        let curPath = 'C:\\';

        const params = {
            deviceId: `test-pc-${Date.now()}-${Math.random()}`,
            internalPcHostname: 'testpc',
            pcIP: '192.168.1.50',
            pcSubnet: '255.255.255.0',
            pcMAC: '00:11:22:33:44:55',
            pcGateway: '192.168.1.1',
            pcDNS: '8.8.8.8',
            pcIPv6: 'fe80::1',
            wifiEnabled: false,
            currentPath: curPath,
            setCurrentPath: (p: string) => { curPath = p; params.currentPath = p; },
            canReachTargetIp: () => true,
            resolveDeviceNameTargetCallback: () => null,
            addLocalOutput: (type: string, content: string) => outputs.push({ type, content }),
            setLinuxOutput: vi.fn(),
        };
        return { params, outputs };
    };

    it('Item 10: supports cat with multiple file arguments', async () => {
        const { params, outputs } = createTestParams();
        await executeLinuxCommand('echo "Hello" > file1.txt', params);
        await executeLinuxCommand('echo "World" > file2.txt', params);

        outputs.length = 0;
        await executeLinuxCommand('cat file1.txt file2.txt', params);

        const outStr = outputs.filter(o => o.type === 'output').map(o => o.content).join('\n');
        expect(outStr).toContain('Hello');
        expect(outStr).toContain('World');
    });

    it('Item 11: hides dotfiles in ls -l but shows them in ls -la', async () => {
        const { params, outputs } = createTestParams();
        await executeLinuxCommand('echo "secret" > .hidden', params);
        await executeLinuxCommand('echo "public" > normal.txt', params);

        outputs.length = 0;
        await executeLinuxCommand('ls -l', params);
        let outStr = outputs.filter(o => o.type === 'output').map(o => o.content).join('\n');
        expect(outStr).toContain('normal.txt');
        expect(outStr).not.toContain('.hidden');

        outputs.length = 0;
        await executeLinuxCommand('ls -la', params);
        outStr = outputs.filter(o => o.type === 'output').map(o => o.content).join('\n');
        expect(outStr).toContain('normal.txt');
        expect(outStr).toContain('.hidden');
        expect(outStr).toContain('.');
        expect(outStr).toContain('..');
    });

    it('Item 13: supports cd - to return to OLDPWD', async () => {
        const { params } = createTestParams();
        await executeLinuxCommand('mkdir subfolder', params);
        await executeLinuxCommand('cd subfolder', params);
        expect(params.currentPath).toContain('subfolder');

        await executeLinuxCommand('cd -', params);
        expect(params.currentPath).toBe('C:\\');
    });

    it('Item 9: supports grep flag combinations (-i, -v, -n, -c)', async () => {
        const { params, outputs } = createTestParams();
        await executeLinuxCommand('echo "Apple\nbanana\nCHERRY\ndate" > fruits.txt', params);

        // grep -i -v (case insensitive invert)
        outputs.length = 0;
        await executeLinuxCommand('grep -i -v "a" fruits.txt', params);
        let outStr = outputs.filter(o => o.type === 'output').map(o => o.content).join('\n');
        expect(outStr).toContain('CHERRY');
        expect(outStr).not.toContain('Apple');
        expect(outStr).not.toContain('banana');

        // grep -n (line numbers)
        outputs.length = 0;
        await executeLinuxCommand('grep -n "banana" fruits.txt', params);
        outStr = outputs.filter(o => o.type === 'output').map(o => o.content).join('\n');
        expect(outStr).toBe('2:banana');

        // grep -c (count)
        outputs.length = 0;
        await executeLinuxCommand('grep -c -i "a" fruits.txt', params);
        outStr = outputs.filter(o => o.type === 'output').map(o => o.content).join('\n');
        expect(outStr).toBe('3');
    });

    it('Item 12: supports && and || logical operator chains', async () => {
        const { params, outputs } = createTestParams();

        // && chain where first succeeds
        outputs.length = 0;
        await executeLinuxCommand('echo "first" && echo "second"', params);
        let outStr = outputs.filter(o => o.type === 'output').map(o => o.content).join('\n');
        expect(outStr).toContain('first');
        expect(outStr).toContain('second');

        // || chain where first fails
        outputs.length = 0;
        await executeLinuxCommand('cat nonexisting.txt || echo "fallback"', params);
        outStr = outputs.filter(o => o.type === 'output').map(o => o.content).join('\n');
        expect(outStr).toContain('fallback');

        // || chain where first succeeds (second should NOT run)
        outputs.length = 0;
        await executeLinuxCommand('echo "success" || echo "should_not_run"', params);
        outStr = outputs.filter(o => o.type === 'output').map(o => o.content).join('\n');
        expect(outStr).toContain('success');
        expect(outStr).not.toContain('should_not_run');
    });
});
