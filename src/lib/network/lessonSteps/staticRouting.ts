import type { GuidedStep } from '../guidedMode.types';

export const staticRoutingGuidedSteps: GuidedStep[] = [
  // ─── R1 CONFIGURATION ───
  {
    id: 'static-open-terminal',
    order: 1,
    title: { tr: 'R1 Terminali', en: 'R1 Terminal' },
    description: { tr: 'R1 router terminalini açın.', en: 'Open R1 router terminal.' },
    hint: { tr: 'R1 üzerine çift tıklayın.', en: 'Double-click on R1.' },
    checkType: 'deviceAccess',
    checkParams: { deviceType: 'router', targetDeviceId: 'router-1' },
    completed: false,
    points: 5
  },
  {
    id: 'static-enable',
    order: 2,
    title: { tr: 'Enable Modu', en: 'Enable Mode' },
    description: { tr: 'Ayrıcalıklı moda geçin.', en: 'Enter privileged EXEC mode.' },
    hint: { tr: '"enable" yazın.', en: 'Type "enable".' },
    checkType: 'command',
    checkParams: { commandPattern: 'enable', deviceType: 'router', targetDeviceId: 'router-1' },
    completed: false,
    points: 5
  },
  {
    id: 'static-conf-t',
    order: 3,
    title: { tr: 'Yapılandırma Modu', en: 'Config Mode' },
    description: { tr: 'Global yapılandırma moduna geçin.', en: 'Enter global configuration mode.' },
    hint: { tr: '"conf t" yazın.', en: 'Type "conf t".' },
    checkType: 'command',
    checkParams: { commandPattern: 'conf', deviceType: 'router', targetDeviceId: 'router-1' },
    completed: false,
    points: 5
  },
  {
    id: 'static-r1-int-gi00',
    order: 4,
    title: { tr: 'R1 Gi0/0 Arayüz Seçimi', en: 'R1 Gi0/0 Interface Selection' },
    description: { tr: 'R1 üzerinde R2 yönündeki gi0/0 arayüzüne girin.', en: 'Enter gi0/0 interface on R1.' },
    hint: { tr: 'R1: int gi0/0 yazın.', en: 'R1: Type int gi0/0.' },
    checkType: 'command',
    checkParams: { commandPattern: 'interface gi0/0|int gi0/0', deviceType: 'router', targetDeviceId: 'router-1' },
    completed: false,
    points: 5
  },
  {
    id: 'static-r1-ip-gi00',
    order: 5,
    title: { tr: 'R1 Gi0/0 IP Adresi Ata', en: 'R1 Gi0/0 Assign IP' },
    description: { tr: 'gi0/0 arayüzüne 10.0.0.1 IP adresini atayın.', en: 'Assign 10.0.0.1 IP to gi0/0 interface.' },
    hint: { tr: 'R1: ip address 10.0.0.1 255.255.255.0 yazın.', en: 'R1: Type ip address 10.0.0.1 255.255.255.0.' },
    checkType: 'config',
    checkParams: { targetDeviceId: 'router-1', configKey: 'interfaces.gi0/0.ip', configValue: '10.0.0.1' },
    completed: false,
    points: 10
  },
  {
    id: 'static-r1-no-shut-gi00',
    order: 6,
    title: { tr: 'R1 Gi0/0 Arayüzünü Aç', en: 'R1 Gi0/0 Interface No Shutdown' },
    description: { tr: 'gi0/0 arayüzünü "no shutdown" komutu ile aktif hale getirin.', en: 'Activate gi0/0 interface with "no shutdown".' },
    hint: { tr: 'R1: no shutdown yazın.', en: 'R1: Type no shutdown.' },
    checkType: 'command',
    checkParams: { commandPattern: 'no shutdown|no shut', deviceType: 'router', targetDeviceId: 'router-1' },
    completed: false,
    points: 5
  },
  {
    id: 'static-r1-exit-gi00',
    order: 7,
    title: { tr: 'R1 Gi0/0 Arayüzden Çıkış', en: 'R1 Gi0/0 Interface Exit' },
    description: { tr: 'Arayüz modundan çıkmak için "exit" yazın.', en: 'Type "exit" to leave interface mode.' },
    hint: { tr: 'R1: exit yazın.', en: 'R1: Type exit.' },
    checkType: 'command',
    checkParams: { commandPattern: 'exit', deviceType: 'router', targetDeviceId: 'router-1' },
    completed: false,
    points: 5
  },
  {
    id: 'static-r1-int-gi01',
    order: 8,
    title: { tr: 'R1 Gi0/1 Arayüz Seçimi (Gateway)', en: 'R1 Gi0/1 Interface Selection' },
    description: { tr: 'PC1 ağ geçidi olan gi0/1 arayüzüne girin.', en: 'Enter gi0/1 interface (PC1 Gateway).' },
    hint: { tr: 'R1: int gi0/1 yazın.', en: 'R1: Type int gi0/1.' },
    checkType: 'command',
    checkParams: { commandPattern: 'interface gi0/1|int gi0/1', deviceType: 'router', targetDeviceId: 'router-1' },
    completed: false,
    points: 5
  },
  {
    id: 'static-r1-ip-gi01',
    order: 9,
    title: { tr: 'R1 Gi0/1 Gateway IP Adresi Ata', en: 'R1 Gi0/1 Assign Gateway IP' },
    description: { tr: 'PC1 için ağ geçidi IP adresi olarak 192.168.1.1 atayın.', en: 'Assign 192.168.1.1 IP as default gateway for PC1.' },
    hint: { tr: 'R1: ip address 192.168.1.1 255.255.255.0 yazın.', en: 'R1: Type ip address 192.168.1.1 255.255.255.0.' },
    checkType: 'config',
    checkParams: { targetDeviceId: 'router-1', configKey: 'interfaces.gi0/1.ip', configValue: '192.168.1.1' },
    completed: false,
    points: 10
  },
  {
    id: 'static-r1-no-shut-gi01',
    order: 10,
    title: { tr: 'R1 Gi0/1 Arayüzünü Aç', en: 'R1 Gi0/1 Interface No Shutdown' },
    description: { tr: 'gi0/1 arayüzünü "no shutdown" komutu ile aktif hale getirin.', en: 'Activate gi0/1 interface with "no shutdown".' },
    hint: { tr: 'R1: no shutdown yazın.', en: 'R1: Type no shutdown.' },
    checkType: 'command',
    checkParams: { commandPattern: 'no shutdown|no shut', deviceType: 'router', targetDeviceId: 'router-1' },
    completed: false,
    points: 5
  },
  {
    id: 'static-r1-exit-gi01',
    order: 11,
    title: { tr: 'R1 Gi0/1 Arayüzden Çıkış', en: 'R1 Gi0/1 Interface Exit' },
    description: { tr: 'Arayüz modundan çıkmak için "exit" yazın.', en: 'Type "exit" to leave interface mode.' },
    hint: { tr: 'R1: exit yazın.', en: 'R1: Type exit.' },
    checkType: 'command',
    checkParams: { commandPattern: 'exit', deviceType: 'router', targetDeviceId: 'router-1' },
    completed: false,
    points: 5
  },
  {
    id: 'static-r1-route-add',
    order: 12,
    title: { tr: 'R1 Statik Rota Ekle', en: 'R1 Add Static Route' },
    description: { tr: '192.168.2.0 ağına giden statik rotayı ekleyin.', en: 'Add static route to 192.168.2.0 network.' },
    hint: { tr: 'R1: ip route 192.168.2.0 255.255.255.0 10.0.0.2 yazın.', en: 'R1: Type ip route 192.168.2.0 255.255.255.0 10.0.0.2.' },
    checkType: 'config',
    checkParams: { targetDeviceId: 'router-1', configKey: 'staticRoutes', configValue: { destination: '192.168.2.0' } },
    completed: false,
    points: 15
  },

  // ─── R2 CONFIGURATION ───
  {
    id: 'static-r2-open',
    order: 13,
    title: { tr: 'R2 Terminali', en: 'R2 Terminal' },
    description: { tr: 'R2 router terminalini açın.', en: 'Open R2 router terminal.' },
    hint: { tr: 'R2 üzerine çift tıklayın.', en: 'Double-click on R2.' },
    checkType: 'deviceAccess',
    checkParams: { deviceType: 'router', targetDeviceId: 'router-2' },
    completed: false,
    points: 5
  },
  {
    id: 'static-r2-enable',
    order: 14,
    title: { tr: 'R2 Yapılandırma Modu', en: 'R2 Config Mode' },
    description: { tr: 'R2 üzerinde konfigürasyon moduna geçin.', en: 'Enter configuration mode on R2.' },
    hint: { tr: 'R2 terminalinde "enable" ve "conf t" yazın.', en: 'Type "enable" and "conf t" on R2.' },
    checkType: 'command',
    checkParams: { commandPattern: 'enable|conf', deviceType: 'router', targetDeviceId: 'router-2' },
    completed: false,
    points: 5
  },
  {
    id: 'static-r2-int-gi00',
    order: 15,
    title: { tr: 'R2 Gi0/0 Arayüz Seçimi', en: 'R2 Gi0/0 Interface Selection' },
    description: { tr: 'R2 üzerinde gi0/0 arayüzüne girin.', en: 'Enter gi0/0 interface on R2.' },
    hint: { tr: 'R2: int gi0/0 yazın.', en: 'R2: Type int gi0/0.' },
    checkType: 'command',
    checkParams: { commandPattern: 'interface gi0/0|int gi0/0', deviceType: 'router', targetDeviceId: 'router-2' },
    completed: false,
    points: 5
  },
  {
    id: 'static-r2-ip-gi00',
    order: 16,
    title: { tr: 'R2 Gi0/0 IP Adresi Ata', en: 'R2 Gi0/0 Assign IP' },
    description: { tr: 'gi0/0 arayüzüne 10.0.0.2 IP adresini atayın.', en: 'Assign 10.0.0.2 IP to gi0/0 interface.' },
    hint: { tr: 'R2: ip address 10.0.0.2 255.255.255.0 yazın.', en: 'R2: Type ip address 10.0.0.2 255.255.255.0.' },
    checkType: 'config',
    checkParams: { targetDeviceId: 'router-2', configKey: 'interfaces.gi0/0.ip', configValue: '10.0.0.2' },
    completed: false,
    points: 10
  },
  {
    id: 'static-r2-no-shut-gi00',
    order: 17,
    title: { tr: 'R2 Gi0/0 Arayüzünü Aç', en: 'R2 Gi0/0 Interface No Shutdown' },
    description: { tr: 'gi0/0 arayüzünü "no shutdown" komutu ile aktif hale getirin.', en: 'Activate gi0/0 interface with "no shutdown".' },
    hint: { tr: 'R2: no shutdown yazın.', en: 'R2: Type no shutdown.' },
    checkType: 'command',
    checkParams: { commandPattern: 'no shutdown|no shut', deviceType: 'router', targetDeviceId: 'router-2' },
    completed: false,
    points: 5
  },
  {
    id: 'static-r2-exit-gi00',
    order: 18,
    title: { tr: 'R2 Gi0/0 Arayüzden Çıkış', en: 'R2 Gi0/0 Interface Exit' },
    description: { tr: 'Arayüz modundan çıkmak için "exit" yazın.', en: 'Type "exit" to leave interface mode.' },
    hint: { tr: 'R2: exit yazın.', en: 'R2: Type exit.' },
    checkType: 'command',
    checkParams: { commandPattern: 'exit', deviceType: 'router', targetDeviceId: 'router-2' },
    completed: false,
    points: 5
  },
  {
    id: 'static-r2-int-gi01',
    order: 19,
    title: { tr: 'R2 Gi0/1 Arayüz Seçimi (Gateway)', en: 'R2 Gi0/1 Interface Selection' },
    description: { tr: 'PC2 ağ geçidi olan gi0/1 arayüzüne girin.', en: 'Enter gi0/1 interface (PC2 Gateway).' },
    hint: { tr: 'R2: int gi0/1 yazın.', en: 'R2: Type int gi0/1.' },
    checkType: 'command',
    checkParams: { commandPattern: 'interface gi0/1|int gi0/1', deviceType: 'router', targetDeviceId: 'router-2' },
    completed: false,
    points: 5
  },
  {
    id: 'static-r2-ip-gi01',
    order: 20,
    title: { tr: 'R2 Gi0/1 Gateway IP Adresi Ata', en: 'R2 Gi0/1 Assign Gateway IP' },
    description: { tr: 'PC2 için ağ geçidi IP adresi olarak 192.168.2.1 atayın.', en: 'Assign 192.168.2.1 IP as default gateway for PC2.' },
    hint: { tr: 'R2: ip address 192.168.2.1 255.255.255.0 yazın.', en: 'R2: Type ip address 192.168.2.1 255.255.255.0.' },
    checkType: 'config',
    checkParams: { targetDeviceId: 'router-2', configKey: 'interfaces.gi0/1.ip', configValue: '192.168.2.1' },
    completed: false,
    points: 10
  },
  {
    id: 'static-r2-no-shut-gi01',
    order: 21,
    title: { tr: 'R2 Gi0/1 Arayüzünü Aç', en: 'R2 Gi0/1 Interface No Shutdown' },
    description: { tr: 'gi0/1 arayüzünü "no shutdown" komutu ile aktif hale getirin.', en: 'Activate gi0/1 interface with "no shutdown".' },
    hint: { tr: 'R2: no shutdown yazın.', en: 'R2: Type no shutdown.' },
    checkType: 'command',
    checkParams: { commandPattern: 'no shutdown|no shut', deviceType: 'router', targetDeviceId: 'router-2' },
    completed: false,
    points: 5
  },
  {
    id: 'static-r2-exit-gi01',
    order: 22,
    title: { tr: 'R2 Gi0/1 Arayüzden Çıkış', en: 'R2 Gi0/1 Interface Exit' },
    description: { tr: 'Arayüz modundan çıkmak için "exit" yazın.', en: 'Type "exit" to leave interface mode.' },
    hint: { tr: 'R2: exit yazın.', en: 'R2: Type exit.' },
    checkType: 'command',
    checkParams: { commandPattern: 'exit', deviceType: 'router', targetDeviceId: 'router-2' },
    completed: false,
    points: 5
  },
  {
    id: 'static-r2-route-add',
    order: 23,
    title: { tr: 'R2 Statik Rota Ekle', en: 'R2 Add Static Route' },
    description: { tr: '192.168.1.0 ağına giden statik rotayı ekleyin.', en: 'Add static route to 192.168.1.0 network.' },
    hint: { tr: 'R2: ip route 192.168.1.0 255.255.255.0 10.0.0.1 yazın.', en: 'R2: Type ip route 192.168.1.0 255.255.255.0 10.0.0.1.' },
    checkType: 'config',
    checkParams: { targetDeviceId: 'router-2', configKey: 'staticRoutes', configValue: { destination: '192.168.1.0' } },
    completed: false,
    points: 15
  },

  // ─── TESTING ───
  {
    id: 'static-ping-test',
    order: 24,
    title: { tr: 'Ping Testi', en: 'Ping Test' },
    description: { tr: 'PC1 terminalinden PC2 IP adresine (192.168.2.10) ping atarak rotayı test edin.', en: 'Test the route by pinging PC2 (192.168.2.10) from PC1.' },
    hint: { tr: 'PC1 CMD > ping 192.168.2.10 yazın.', en: 'PC1 CMD > Type ping 192.168.2.10.' },
    animationId: 'ping-anim',
    checkType: 'ping',
    checkParams: { fromDevice: 'pc-1', toIp: '192.168.2.10', deviceType: 'pc' },
    completed: false,
    points: 20
  }
];
