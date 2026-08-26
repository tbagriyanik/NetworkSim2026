import type { GuidedStep } from '../guidedMode.types';

export const sohoGuidedSteps: GuidedStep[] = [
  {
    id: 'soho-connect-pc',
    order: 1,
    title: { tr: 'PC Bağlantısı', en: 'Connect PC' },
    description: { tr: 'Ofis bilgisayarını switch\'e bağlayın.', en: 'Connect the office PC to the switch.' },
    hint: { tr: 'Düz kablo: PC-1 Eth0 -> Switch-1 Fa0/1', en: 'Straight cable: PC-1 Eth0 -> Switch-1 Fa0/1' },
    checkType: 'connection',
    checkParams: { cableType: 'straight', sourceDevice: 'pc-1', sourcePort: 'eth0', targetDevice: 'switch-1', targetPort: 'fa0/1' },
    completed: false,
    points: 10
  },
  {
    id: 'soho-connect-router',
    order: 2,
    title: { tr: 'Router Bağlantısı', en: 'Connect Router' },
    description: { tr: 'Switch\'i router\'a bağlayarak internet çıkışını hazırlayın.', en: 'Connect the switch to the router to prepare internet access.' },
    hint: { tr: 'Düz kablo: Switch-1 Gi0/1 -> Router-1 Gi0/0', en: 'Straight cable: Switch-1 Gi0/1 -> Router-1 Gi0/0' },
    checkType: 'connection',
    checkParams: { cableType: 'straight', sourceDevice: 'switch-1', sourcePort: 'gi0/1', targetDevice: 'router-1', targetPort: 'gi0/0' },
    completed: false,
    points: 10
  },
  {
    id: 'soho-router-ip',
    order: 3,
    title: { tr: 'Ağ Geçidi IP', en: 'Gateway IP' },
    description: { tr: 'Router arayüzüne 192.168.1.1 IP adresini atayın.', en: 'Assign 192.168.1.1 to the router interface.' },
    hint: { tr: 'int gi0/0 -> ip address 192.168.1.1 255.255.255.0', en: 'int gi0/0 -> ip address 192.168.1.1 255.255.255.0' },
    checkType: 'config',
    checkParams: { targetDeviceId: 'router-1', configKey: 'interfaces.gi0/0.ip', configValue: '192.168.1.1' },
    completed: false,
    points: 10
  },
  {
    id: 'soho-router-no-shutdown',
    order: 4,
    title: { tr: 'Router Arayüzünü Açın', en: 'Enable Router Interface' },
    description: { tr: 'Router arayüzünü aktif edin.', en: 'Enable the router interface.' },
    hint: { tr: 'Gi0/0 arayüzünde no shutdown yazın.', en: 'Enter no shutdown on the Gi0/0 interface.' },
    checkType: 'config',
    checkParams: { targetDeviceId: 'router-1', configKey: 'interfaces.gi0/0.shutdown', configValue: false },
    completed: false,
    points: 5
  },
  {
    id: 'soho-dhcp-network', order: 5,
    title: { tr: 'DHCP Ağını Belirleyin', en: 'Set DHCP Network' },
    description: { tr: 'DHCP havuzuna 192.168.1.0/24 ağını tanımlayın.', en: 'Set the 192.168.1.0/24 network for the DHCP pool.' },
    hint: { tr: 'network 192.168.1.0 255.255.255.0', en: 'network 192.168.1.0 255.255.255.0' },
    checkType: 'config', checkParams: { targetDeviceId: 'router-1', configKey: 'dhcpPools.OFIS.network', configValue: '192.168.1.0' }, completed: false, points: 10
  },
  {
    id: 'soho-dhcp-gateway', order: 6,
    title: { tr: 'DHCP Ağ Geçidini Belirleyin', en: 'Set DHCP Gateway' },
    description: { tr: 'DHCP havuzunda varsayılan ağ geçidini 192.168.1.1 yapın.', en: 'Set 192.168.1.1 as the default gateway in the DHCP pool.' },
    hint: { tr: 'default-router 192.168.1.1', en: 'default-router 192.168.1.1' },
    checkType: 'config', checkParams: { targetDeviceId: 'router-1', configKey: 'dhcpPools.OFIS.defaultGateway', configValue: '192.168.1.1' }, completed: false, points: 5
  },
  {
    id: 'soho-wifi-ssid',
    order: 7,
    title: { tr: 'Misafir WiFi', en: 'Guest WiFi' },
    description: { tr: 'Router üzerinde Office-Wifi adlı kablosuz ağı oluşturun.', en: 'Create a wireless network named Office-Wifi on the router.' },
    hint: { tr: 'Wifi sekmesinden SSID alanına Office-Wifi yazın.', en: 'Enter Office-Wifi in the SSID field on the Wifi tab.' },
    checkType: 'config',
    checkParams: { targetDeviceId: 'router-1', configKey: 'ports.wlan0.wifi.ssid', configValue: 'Office-Wifi' },
    completed: false,
    points: 15
  },
  {
    id: 'soho-wifi-auth', order: 8,
    title: { tr: 'WiFi Güvenliğini Ayarlayın', en: 'Set WiFi Security' },
    description: { tr: 'Kablosuz ağ kimlik doğrulamasını Open olarak ayarlayın.', en: 'Set wireless authentication to Open.' },
    hint: { tr: 'Wifi sekmesinde Auth: Open seçin.', en: 'Select Auth: Open on the Wifi tab.' },
    checkType: 'config', checkParams: { targetDeviceId: 'router-1', configKey: 'ports.wlan0.wifi.security', configValue: 'open' }, completed: false, points: 5
  },
  {
    id: 'soho-pc2-wifi',
    order: 9,
    title: { tr: 'Laptop Bağlantısı', en: 'Laptop Connection' },
    description: { tr: 'Laptop (PC-2) cihazını kablosuz ağa bağlayın.', en: 'Connect the Laptop (PC-2) device to the wireless network.' },
    hint: { tr: 'PC-2 > Desktop > Wifi > SSID: Office-Wifi seçin.', en: 'PC-2 > Desktop > Wifi > select SSID: Office-Wifi.' },
    checkType: 'config',
    checkParams: { configKey: 'pc.pc-2.wifi.ssid', configValue: 'Office-Wifi' },
    completed: false,
    points: 15
  },
  {
    id: 'soho-ping-test',
    order: 10,
    title: { tr: 'Erişim Testi', en: 'Connectivity Test' },
    description: { tr: 'Laptop\'tan sabit bilgisayara ping atarak bağlantıyı doğrulayın.', en: 'Verify connectivity by pinging from the Laptop to the desktop PC.' },
    hint: { tr: 'PC-2 CMD > ping 192.168.1.10 (PC-1\'in IP\'si)', en: 'PC-2 CMD > ping 192.168.1.10 (PC-1 IP)' },
    checkType: 'ping',
    checkParams: { fromDevice: 'pc-2', toIp: '192.168.1.10' },
    completed: false,
    points: 15
  }
];
