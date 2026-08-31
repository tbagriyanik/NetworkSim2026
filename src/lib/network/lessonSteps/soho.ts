import type { GuidedStep } from '../guidedMode.types';

export const sohoGuidedSteps: GuidedStep[] = [
  {
    id: 'soho-connect-pc',
    order: 1,
    title: { tr: 'PC Bağlantısı', en: 'Connect PC' },
    description: { tr: 'Ofis bilgisayarını (Ofis-PC) switch\'e bağlayın.', en: 'Connect the office PC (Ofis-PC) to the switch.' },
    hint: { tr: 'Düz kablo: Ofis-PC Eth0 -> Switch-1 Fa0/1', en: 'Straight cable: Ofis-PC Eth0 -> Switch-1 Fa0/1' },
    checkType: 'connection',
    checkParams: { cableType: 'straight', sourceDevice: 'pc-1', sourcePort: 'eth0', targetDevice: 'switch-1', targetPort: 'fa0/1' },
    completed: false,
    points: 10
  },
  {
    id: 'soho-connect-router',
    order: 2,
    title: { tr: 'Router Bağlantısı', en: 'Connect Router' },
    description: { tr: 'Switch\'i Router-1\'e bağlayarak ağ erişimini sağlayın.', en: 'Connect the switch to Router-1 for network access.' },
    hint: { tr: 'Düz kablo: Switch-1 Gi0/1 -> Router-1 Gi0/0', en: 'Straight cable: Switch-1 Gi0/1 -> Router-1 Gi0/0' },
    checkType: 'connection',
    checkParams: { cableType: 'straight', sourceDevice: 'switch-1', sourcePort: 'gi0/1', targetDevice: 'router-1', targetPort: 'gi0/0' },
    completed: false,
    points: 10
  },
  {
    id: 'soho-router-terminal',
    order: 3,
    title: { tr: 'Router Terminali', en: 'Router Terminal' },
    description: { tr: 'Router-1 cihazına çift tıklayarak terminali açın.', en: 'Double-click Router-1 to open the CLI terminal.' },
    hint: { tr: 'Router-1 üzerine çift tıklayın.', en: 'Double-click Router-1.' },
    checkType: 'deviceAccess',
    checkParams: { deviceType: 'router', targetDeviceId: 'router-1' },
    completed: false,
    points: 5
  },
  {
    id: 'soho-router-enable',
    order: 4,
    title: { tr: 'Enable Modu', en: 'Enable Mode' },
    description: { tr: 'Ayrıcalıklı moda geçiş yapın.', en: 'Enter privileged EXEC mode.' },
    hint: { tr: 'enable yazın.', en: 'Type enable.' },
    checkType: 'command',
    checkParams: { commandPattern: 'enable', targetDeviceId: 'router-1' },
    completed: false,
    points: 5
  },
  {
    id: 'soho-router-conf-t',
    order: 5,
    title: { tr: 'Yapılandırma Modu', en: 'Config Mode' },
    description: { tr: 'Global yapılandırma moduna geçin.', en: 'Enter global configuration mode.' },
    hint: { tr: 'conf t yazın.', en: 'Type conf t.' },
    checkType: 'command',
    checkParams: { commandPattern: 'conf', targetDeviceId: 'router-1' },
    completed: false,
    points: 5
  },
  {
    id: 'soho-router-int',
    order: 6,
    title: { tr: 'Gi0/0 Arayüz Seçimi', en: 'Gi0/0 Interface Selection' },
    description: { tr: 'Gi0/0 arayüzüne girin.', en: 'Enter Gi0/0 interface configuration.' },
    hint: { tr: 'int gi0/0 yazın.', en: 'Type int gi0/0.' },
    checkType: 'command',
    checkParams: { commandPattern: 'interface gi0/0|int gi0/0', targetDeviceId: 'router-1' },
    completed: false,
    points: 5
  },
  {
    id: 'soho-router-ip',
    order: 7,
    title: { tr: 'Ağ Geçidi IP Adresi', en: 'Assign Gateway IP' },
    description: { tr: 'Router arayüzüne 192.168.1.1 IP adresini atayın.', en: 'Assign 192.168.1.1 to the router interface.' },
    hint: { tr: 'ip address 192.168.1.1 255.255.255.0 yazın.', en: 'Type ip address 192.168.1.1 255.255.255.0.' },
    checkType: 'config',
    checkParams: { targetDeviceId: 'router-1', configKey: 'interfaces.gi0/0.ip', configValue: '192.168.1.1' },
    completed: false,
    points: 10
  },
  {
    id: 'soho-router-no-shutdown',
    order: 8,
    title: { tr: 'Router Arayüzünü Açın', en: 'Enable Router Interface' },
    description: { tr: 'Router arayüzünü aktif edin.', en: 'Enable the router interface.' },
    hint: { tr: 'no shutdown yazın.', en: 'Type no shutdown.' },
    checkType: 'config',
    checkParams: { targetDeviceId: 'router-1', configKey: 'interfaces.gi0/0.shutdown', configValue: false },
    completed: false,
    points: 5
  },
  {
    id: 'soho-router-exit-if',
    order: 9,
    title: { tr: 'Arayüzden Çıkış', en: 'Exit Interface' },
    description: { tr: 'Arayüz yapılandırma modundan çıkın.', en: 'Exit interface configuration mode.' },
    hint: { tr: 'exit yazın.', en: 'Type exit.' },
    checkType: 'command',
    checkParams: { commandPattern: 'exit', targetDeviceId: 'router-1' },
    completed: false,
    points: 5
  },
  {
    id: 'soho-dhcp-create-pool',
    order: 10,
    title: { tr: 'DHCP Havuzu Oluşturun', en: 'Create DHCP Pool' },
    description: { tr: 'Router üzerinde OFIS isimli bir DHCP havuzu oluşturun.', en: 'Create a DHCP pool named OFIS on the router.' },
    hint: { tr: 'ip dhcp pool OFIS yazın.', en: 'Type ip dhcp pool OFIS.' },
    checkType: 'command',
    checkParams: { commandPattern: 'ip dhcp pool OFIS|ip dhcp pool ofis', targetDeviceId: 'router-1' },
    completed: false,
    points: 10
  },
  {
    id: 'soho-dhcp-network',
    order: 11,
    title: { tr: 'DHCP Ağını Belirleyin', en: 'Set DHCP Network' },
    description: { tr: 'DHCP havuzuna 192.168.1.0/24 ağını tanımlayın.', en: 'Set the 192.168.1.0/24 network for the DHCP pool.' },
    hint: { tr: 'network 192.168.1.0 255.255.255.0 yazın.', en: 'Type network 192.168.1.0 255.255.255.0.' },
    checkType: 'config',
    checkParams: { targetDeviceId: 'router-1', configKey: 'dhcpPools.OFIS.network', configValue: '192.168.1.0' },
    completed: false,
    points: 10
  },
  {
    id: 'soho-dhcp-gateway',
    order: 12,
    title: { tr: 'DHCP Ağ Geçidini Belirleyin', en: 'Set DHCP Gateway' },
    description: { tr: 'DHCP havuzunda varsayılan ağ geçidini 192.168.1.1 yapın.', en: 'Set 192.168.1.1 as the default gateway in the DHCP pool.' },
    hint: { tr: 'default-router 192.168.1.1 yazın.', en: 'Type default-router 192.168.1.1.' },
    checkType: 'config',
    checkParams: { targetDeviceId: 'router-1', configKey: 'dhcpPools.OFIS.defaultRouter', configValue: '192.168.1.1' },
    completed: false,
    points: 5
  },
  {
    id: 'soho-pc2-wifi',
    order: 13,
    title: { tr: 'Laptop (PC-2) Kablosuz Bağlantı', en: 'Laptop Wireless Connection' },
    description: { tr: 'Laptop (PC-2) üzerine çift tıklayın. Masaüstü > Kablosuz (WiFi) uygulamasını açıp SSID kısmına "Office-Wifi" yazarak ağa bağlanın.', en: 'Double-click Laptop (PC-2). Open Desktop > Wireless (WiFi) app and connect to "Office-Wifi" SSID.' },
    hint: { tr: 'PC-2 çift tıkla > Desktop > WiFi Yapılandırma > SSID: "Office-Wifi" seçip Bağlan butonuna tıklayın.', en: 'Double-click PC-2 > Desktop > WiFi Config > select SSID: "Office-Wifi" and click Connect.' },
    checkType: 'config',
    checkParams: { configKey: 'pc.pc-2.wifi.ssid', configValue: 'Office-Wifi' },
    completed: false,
    points: 15
  },
  {
    id: 'soho-ping-test',
    order: 14,
    title: { tr: 'Erişim Testi (Ping)', en: 'Connectivity Test (Ping)' },
    description: { tr: 'Laptop\'tan (PC-2) Ofis-PC\'ye (192.168.1.10) ping atarak bağlantıyı doğrulayın.', en: 'Verify connectivity by pinging from Laptop (PC-2) to Ofis-PC (192.168.1.10).' },
    hint: { tr: 'PC-2 CMD > ping 192.168.1.10 yazın.', en: 'PC-2 CMD > Type ping 192.168.1.10.' },
    checkType: 'ping',
    checkParams: { fromDevice: 'pc-2', toIp: '192.168.1.10' },
    completed: false,
    points: 15
  }
];
