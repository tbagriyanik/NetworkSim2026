
import { describe, it, expect } from 'vitest';
import { generateIotWebPanelContent, generateIotDevicePageContent } from './iotWebPanel';
import { generateWifiControlPanelHTML } from '../../components/network/WifiControlPanel';

describe('iotWebPanel Security', () => {
  const xssPayload = '</script><script>alert("xss")</script>';

  it('generateIotWebPanelContent should escape device IDs used in onclick handlers', () => {
    const devices = [
      { id: '"><script>alert(1)</script>', name: 'Malicious Device', type: 'iot' } as any
    ];
    const html = generateIotWebPanelContent(devices, 'en');

    // Check that the payload is not raw in the onclick attribute
    expect(html).not.toContain('deviceId: ""><script>alert(1)</script>"');
    // It should be escaped or stringified safely
  });

  it('generateIotDevicePageContent should escape rules to prevent script termination', () => {
    const rules = [
      { id: '1', condition: xssPayload, action: 'ON' }
    ];
    const html = generateIotDevicePageContent('dev1', 'Device 1', 'en', true, false, 'sensor', rules);

    // If vulnerable, it will contain the raw payload which terminates the script
    expect(html).not.toContain(xssPayload);
    // It should contain the escaped version like \u003c/script\u003e
    expect(html).toContain('\\u003c/script\\u003e');
  });

  it('generateWifiControlPanelHTML should escape credentials to prevent script termination', () => {
    const config = {
      wifi: { enabled: true, ssid: 'Test', security: 'wpa2' as const, password: xssPayload, channel: '2.4GHz' as const, mode: 'ap' as const },
      deviceName: 'Router',
      deviceIp: '192.168.1.1',
      username: 'admin',
      password: xssPayload
    };
    const html = generateWifiControlPanelHTML(config);

    expect(html).not.toContain(xssPayload);
    expect(html).toContain('\\u003c/script\\u003e');
  });
});
