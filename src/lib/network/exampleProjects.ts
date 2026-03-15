import { createInitialState, createInitialRouterState } from './initialState';
import type { SwitchState } from './types';
import type { CanvasDevice, CanvasConnection, CanvasNote } from '@/components/network/networkTopology.types';

type ProjectData = {
  version: string;
  timestamp: string;
  devices: { id: string; state: SwitchState }[];
  deviceOutputs: { id: string; outputs: any[] }[];
  pcOutputs: { id: string; outputs: any[] }[];
  pcHistories: { id: string; history: string[] }[];
  topology: {
    devices: CanvasDevice[];
    connections: CanvasConnection[];
    notes: CanvasNote[];
  };
  cableInfo: {
    connected: boolean;
    cableType: 'straight' | 'crossover' | 'console';
    sourceDevice: 'pc' | 'switch' | 'router';
    targetDevice: 'pc' | 'switch' | 'router';
  };
  activeDeviceId: string;
  activeDeviceType: 'pc' | 'switch' | 'router';
  activeTab: 'topology' | 'cmd' | 'terminal' | 'ports' | 'vlan' | 'security';
  zoom: number;
  pan: { x: number; y: number };
};

type ExampleProject = {
  id: string;
  tag: string;
  title: string;
  description: string;
  detail?: string;
  data: ProjectData;
};

const createSwitchDevice = (id: string, name: string, x: number, y: number): CanvasDevice => ({
  id,
  type: 'switch',
  name,
  x,
  y,
  ip: '',
  macAddress: id === 'switch-1' ? '0011.2233.4401' : '0011.2233.4402',
  status: 'online',
  ports: [
    { id: 'console', label: 'Console', status: 'disconnected' as const },
    ...Array.from({ length: 24 }, (_, i) => ({ id: `fa0/${i + 1}`, label: `Fa0/${i + 1}`, status: 'disconnected' as const })),
    { id: 'gi0/1', label: 'Gi0/1', status: 'disconnected' as const },
    { id: 'gi0/2', label: 'Gi0/2', status: 'disconnected' as const }
  ]
});

const createPcDevice = (id: string, name: string, x: number, y: number, ip: string, vlan: number): CanvasDevice => ({
  id,
  type: 'pc',
  name,
  x,
  y,
  ip,
  vlan,
  macAddress: '00e0.f701.a1b1',
  status: 'online',
  ports: [
    { id: 'eth0', label: 'Eth0', status: 'disconnected' as const },
    { id: 'com1', label: 'COM1', status: 'disconnected' as const }
  ]
});

const createRouterDevice = (id: string, name: string, x: number, y: number): CanvasDevice => ({
  id,
  type: 'router',
  name,
  x,
  y,
  ip: '',
  macAddress: '00aa.bbcc.dd01',
  status: 'online',
  ports: [
    { id: 'console', label: 'Console', status: 'disconnected' as const },
    { id: 'gi0/0', label: 'Gi0/0', status: 'disconnected' as const },
    { id: 'gi0/1', label: 'Gi0/1', status: 'disconnected' as const },
    { id: 'gi0/2', label: 'Gi0/2', status: 'disconnected' as const },
    { id: 'gi0/3', label: 'Gi0/3', status: 'disconnected' as const }
  ]
});

const connectPorts = (
  devices: CanvasDevice[],
  connections: CanvasConnection[],
  sourceDeviceId: string,
  sourcePort: string,
  targetDeviceId: string,
  targetPort: string,
  cableType: 'straight' | 'crossover' | 'console' = 'straight'
) => {
  connections.push({
    id: `${sourceDeviceId}-${sourcePort}-${targetDeviceId}-${targetPort}`,
    sourceDeviceId,
    sourcePort,
    targetDeviceId,
    targetPort,
    cableType,
    active: true
  });

  devices.forEach(device => {
    if (device.id !== sourceDeviceId && device.id !== targetDeviceId) return;
    device.ports = device.ports.map(port => {
      const isMatch = (device.id === sourceDeviceId && port.id === sourcePort) ||
        (device.id === targetDeviceId && port.id === targetPort);
      return isMatch ? { ...port, status: 'connected' as const } : port;
    });
  });
};

const baseProjectData = (devices: CanvasDevice[], connections: CanvasConnection[], notes: CanvasNote[], deviceStates: { id: string; state: SwitchState }[]): ProjectData => ({
  version: '1.0',
  timestamp: new Date().toISOString(),
  devices: deviceStates,
  deviceOutputs: [],
  pcOutputs: [],
  pcHistories: [],
  topology: {
    devices,
    connections,
    notes
  },
  cableInfo: {
    connected: true,
    cableType: 'straight',
    sourceDevice: 'pc',
    targetDevice: 'switch'
  },
  activeDeviceId: deviceStates[0]?.id || 'switch-1',
  activeDeviceType: 'switch',
  activeTab: 'topology',
  zoom: 1.0,
  pan: { x: 0, y: 0 }
});

export const exampleProjects = (language: 'tr' | 'en'): ExampleProject[] => {
  const isTr = language === 'tr';

  // Example 1: Basic switch + passwords
  const basicDevices = [
    createPcDevice('pc-1', 'PC-1', 40, 180, '192.168.10.10', 10),
    createPcDevice('pc-2', 'PC-2 (Console)', 40, 320, '', 1),
    createSwitchDevice('switch-1', 'SW1', 240, 220)
  ];
  const basicConnections: CanvasConnection[] = [];
  connectPorts(basicDevices, basicConnections, 'pc-1', 'eth0', 'switch-1', 'fa0/1');
  connectPorts(basicDevices, basicConnections, 'pc-2', 'com1', 'switch-1', 'console', 'console');
  const basicNotes: CanvasNote[] = [
    {
      id: 'basic-note-1',
      text: isTr
        ? 'Amaç: Konsol, VTY ve enable parolalarını ayarlayıp doğrulamak.\n1) SW1’de: enable, conf t\n2) enable secret class\n3) enable password paswd\n4) line con 0 -> password console, login\n5) line vty 0 4 -> password vty123, login\n6) write memory\nPC-2 (Console) ile COM1 üzerinden konsol bağlantısı kullan.'
        : 'Goal: Configure and verify console, VTY, and enable passwords.\n1) SW1: enable, conf t\n2) enable secret class\n3) enable password paswd\n4) line con 0 -> password console, login\n5) line vty 0 4 -> password vty123, login\n6) write memory\nUse PC-2 (Console) via COM1 to connect to console.',
      x: 600,
      y: 40,
      width: 420,
      height: 180,
      color: '#22d3ee',
      font: 'verdana',
      fontSize: 16,
      opacity: 0.75
    }
  ];
  const basicState = createInitialState();
  basicState.hostname = 'SW1';
  basicState.security = {
    ...basicState.security,
    enableSecret: 'class',
    enablePassword: 'paswd',
    servicePasswordEncryption: true,
    consoleLine: { ...basicState.security.consoleLine, password: 'console', login: true },
    vtyLines: { ...basicState.security.vtyLines, password: 'vty123', login: true }
  };
  basicState.vlans[10] = { id: 10, name: 'VLAN10', status: 'active', ports: [] };
  basicState.ports['fa0/1'] = { ...basicState.ports['fa0/1'], vlan: 10, mode: 'access', status: 'connected' };

  // Example 2: Single switch VLANs
  const vlanDevices = [
    createPcDevice('pc-1', 'PC-1', 40, 120, '192.168.10.10', 10),
    createPcDevice('pc-2', 'PC-2', 40, 260, '192.168.20.10', 20),
    createSwitchDevice('switch-1', 'SW1', 260, 190)
  ];
  const vlanConnections: CanvasConnection[] = [];
  connectPorts(vlanDevices, vlanConnections, 'pc-1', 'eth0', 'switch-1', 'fa0/1');
  connectPorts(vlanDevices, vlanConnections, 'pc-2', 'eth0', 'switch-1', 'fa0/2');
  const vlanNotes: CanvasNote[] = [
    {
      id: 'vlan-note-1',
      text: isTr
        ? 'Amaç: VLAN 10/20 erişim portları.\n1) conf t\n2) vlan 10, name VLAN10\n3) vlan 20, name VLAN20\n4) int fa0/1 -> switchport access vlan 10\n5) int fa0/2 -> switchport access vlan 20\n6) show vlan brief ile kontrol et.'
        : 'Goal: Access VLANs 10/20.\n1) conf t\n2) vlan 10, name VLAN10\n3) vlan 20, name VLAN20\n4) int fa0/1 -> switchport access vlan 10\n5) int fa0/2 -> switchport access vlan 20\n6) verify with show vlan brief.',
      x: 600,
      y: 40,
      width: 420,
      height: 180,
      color: '#a855f7',
      font: 'verdana',
      fontSize: 16,
      opacity: 0.75
    }
  ];
  const vlanState = createInitialState();
  vlanState.hostname = 'SW1';
  vlanState.vlans[10] = { id: 10, name: 'VLAN10', status: 'active', ports: [] };
  vlanState.vlans[20] = { id: 20, name: 'VLAN20', status: 'active', ports: [] };
  vlanState.ports['fa0/1'] = { ...vlanState.ports['fa0/1'], vlan: 10, mode: 'access', status: 'connected' };
  vlanState.ports['fa0/2'] = { ...vlanState.ports['fa0/2'], vlan: 20, mode: 'access', status: 'connected' };

  // Example 3: Two switches trunk + VTP
  const vtpDevices = [
    createPcDevice('pc-1', 'PC-1', 40, 220, '192.168.10.10', 10),
    createSwitchDevice('switch-1', 'SW1', 240, 140),
    createSwitchDevice('switch-2', 'SW2', 440, 260)
  ];
  const vtpConnections: CanvasConnection[] = [];
  connectPorts(vtpDevices, vtpConnections, 'pc-1', 'eth0', 'switch-2', 'fa0/1');
  connectPorts(vtpDevices, vtpConnections, 'switch-1', 'gi0/1', 'switch-2', 'gi0/1', 'crossover');
  const vtpNotes: CanvasNote[] = [
    {
      id: 'vtp-note-1',
      text: isTr
        ? 'Amaç: Trunk + VTP.\nSW1 (server): vtp mode server, vtp domain LAB\nSW2 (client): vtp mode client, vtp domain LAB\nGi0/1 trunk olmalı.\nSW1’de VLAN 10/20 aç -> SW2’ye otomatik gelmeli.\nshow interface trunk ve show vlan brief ile doğrula.'
        : 'Goal: Trunk + VTP.\nSW1 (server): vtp mode server, vtp domain LAB\nSW2 (client): vtp mode client, vtp domain LAB\nGi0/1 must be trunk.\nCreate VLAN 10/20 on SW1 -> should appear on SW2.\nVerify with show interface trunk and show vlan brief.',
      x: 600,
      y: 40,
      width: 420,
      height: 190,
      color: '#f59e0b',
      font: 'verdana',
      fontSize: 16,
      opacity: 0.75
    }
  ];
  const vtpSw1 = createInitialState();
  vtpSw1.hostname = 'SW1';
  vtpSw1.vtpMode = 'server';
  vtpSw1.vtpDomain = 'LAB';
  vtpSw1.vlans[10] = { id: 10, name: 'VLAN10', status: 'active', ports: [] };
  vtpSw1.vlans[20] = { id: 20, name: 'VLAN20', status: 'active', ports: [] };
  vtpSw1.ports['gi0/1'] = { ...vtpSw1.ports['gi0/1'], mode: 'trunk', allowedVlans: 'all', status: 'connected' };
  const vtpSw2 = createInitialState();
  vtpSw2.hostname = 'SW2';
  vtpSw2.vtpMode = 'client';
  vtpSw2.vtpDomain = 'LAB';
  vtpSw2.vlans[10] = { id: 10, name: 'VLAN10', status: 'active', ports: [] };
  vtpSw2.vlans[20] = { id: 20, name: 'VLAN20', status: 'active', ports: [] };
  vtpSw2.ports['gi0/1'] = { ...vtpSw2.ports['gi0/1'], mode: 'trunk', allowedVlans: 'all', status: 'connected' };
  vtpSw2.ports['fa0/1'] = { ...vtpSw2.ports['fa0/1'], vlan: 10, mode: 'access', status: 'connected' };

  // Example 4: ROAS (conceptual)
  const roasDevices = [
    createPcDevice('pc-1', 'PC-1', 40, 120, '192.168.10.10', 10),
    createPcDevice('pc-2', 'PC-2', 40, 260, '192.168.20.10', 20),
    createSwitchDevice('switch-1', 'SW1', 260, 190),
    createRouterDevice('router-1', 'R1', 520, 190)
  ];
  const roasConnections: CanvasConnection[] = [];
  connectPorts(roasDevices, roasConnections, 'pc-1', 'eth0', 'switch-1', 'fa0/1');
  connectPorts(roasDevices, roasConnections, 'pc-2', 'eth0', 'switch-1', 'fa0/2');
  connectPorts(roasDevices, roasConnections, 'switch-1', 'gi0/1', 'router-1', 'gi0/0', 'crossover');
  const roasSw = createInitialState();
  roasSw.hostname = 'SW1';
  roasSw.vlans[10] = { id: 10, name: 'VLAN10', status: 'active', ports: [] };
  roasSw.vlans[20] = { id: 20, name: 'VLAN20', status: 'active', ports: [] };
  roasSw.ports['fa0/1'] = { ...roasSw.ports['fa0/1'], vlan: 10, mode: 'access', status: 'connected' };
  roasSw.ports['fa0/2'] = { ...roasSw.ports['fa0/2'], vlan: 20, mode: 'access', status: 'connected' };
  roasSw.ports['gi0/1'] = { ...roasSw.ports['gi0/1'], mode: 'trunk', allowedVlans: 'all', status: 'connected' };
  const roasRouter = createInitialRouterState();
  roasRouter.hostname = 'R1';
  roasRouter.ports['gi0/0'] = { ...roasRouter.ports['gi0/0'], status: 'connected' };
  roasRouter.ports['gi0/0.10'] = {
    ...roasRouter.ports['gi0/0'],
    id: 'gi0/0.10',
    vlan: 10,
    ipAddress: '192.168.10.1',
    subnetMask: '255.255.255.0'
  };
  roasRouter.ports['gi0/0.20'] = {
    ...roasRouter.ports['gi0/0'],
    id: 'gi0/0.20',
    vlan: 20,
    ipAddress: '192.168.20.1',
    subnetMask: '255.255.255.0'
  };

  const roasNotes: CanvasNote[] = [
    {
      id: 'roas-note',
      text: isTr
        ? 'ROAS adımları:\nSW1: int gi0/1 -> switchport mode trunk\nR1: int gi0/0.10 -> encapsulation dot1q 10, ip address 192.168.10.1/24\nR1: int gi0/0.20 -> encapsulation dot1q 20, ip address 192.168.20.1/24\nPC-1 VLAN10, PC-2 VLAN20.\nAynı VLAN ping başarılı; farklı VLAN ping başarısız (L2).'
        : 'ROAS steps:\nSW1: int gi0/1 -> switchport mode trunk\nR1: int gi0/0.10 -> encapsulation dot1q 10, ip address 192.168.10.1/24\nR1: int gi0/0.20 -> encapsulation dot1q 20, ip address 192.168.20.1/24\nPC-1 VLAN10, PC-2 VLAN20.\nSame-VLAN ping succeeds; different-VLAN ping fails (L2).',
      x: 600,
      y: 40,
      width: 420,
      height: 190,
      color: '#38bdf8',
      font: 'verdana',
      fontSize: 16,
      opacity: 0.75
    }
  ];

  // Example 5: Port-security
  const psDevices = [
    createPcDevice('pc-1', 'PC-1', 40, 180, '192.168.1.10', 1),
    createSwitchDevice('switch-1', 'SW1', 240, 180)
  ];
  const psConnections: CanvasConnection[] = [];
  connectPorts(psDevices, psConnections, 'pc-1', 'eth0', 'switch-1', 'fa0/3');
  const psNotes: CanvasNote[] = [
    {
      id: 'ps-note-1',
      text: isTr
        ? 'Amaç: Port-security temel örnek.\nFa0/3 üzerinde enabled + sticky + max 1.\nshow port-security ile kontrol et.\nFarklı MAC görürse ihlal oluşur (shutdown).'
        : 'Goal: Basic port-security.\nFa0/3 enabled + sticky + max 1.\nVerify with show port-security.\nDifferent MAC triggers violation (shutdown).',
      x: 600,
      y: 40,
      width: 420,
      height: 170,
      color: '#f87171',
      font: 'verdana',
      fontSize: 16,
      opacity: 0.75
    }
  ];
  const psState = createInitialState();
  psState.hostname = 'SW1';
  psState.ports['fa0/3'] = {
    ...psState.ports['fa0/3'],
    status: 'connected',
    portSecurity: { enabled: true, maxMac: 1, violation: 'shutdown', stickyMac: true }
  };

  return [
    {
      id: 'basic-secure',
      tag: isTr ? 'TEMEL' : 'BASIC',
      title: isTr ? 'Basit Ağ + Parolalar' : 'Basic Network + Passwords',
      description: isTr ? 'Console, VTY ve enable parolaları ayarlı, tek PC + tek switch.' : 'Console, VTY, and enable passwords with 1 PC + 1 switch.',
      detail: isTr
        ? 'enable secret: class, enable password: paswd, console: console, vty: vty123'
        : 'enable secret: class, enable password: paswd, console: console, vty: vty123',
      data: baseProjectData(basicDevices, basicConnections, basicNotes, [{ id: 'switch-1', state: basicState }])
    },
    {
      id: 'single-vlan',
      tag: isTr ? 'VLAN' : 'VLAN',
      title: isTr ? '1 Switch VLAN' : 'Single Switch VLANs',
      description: isTr ? 'VLAN 10/20 ve iki PC erişim portu.' : 'VLAN 10/20 with two access PCs.',
      data: baseProjectData(vlanDevices, vlanConnections, vlanNotes, [{ id: 'switch-1', state: vlanState }])
    },
    {
      id: 'trunk-vtp',
      tag: isTr ? 'TRUNK/VTP' : 'TRUNK/VTP',
      title: isTr ? '2 Switch Trunk + VTP' : 'Two Switch Trunk + VTP',
      description: isTr ? 'Gi0/1 trunk, VTP domain LAB, VLAN 10/20 hazır.' : 'Gi0/1 trunk, VTP domain LAB, VLAN 10/20 ready.',
      data: baseProjectData(vtpDevices, vtpConnections, vtpNotes, [
        { id: 'switch-1', state: vtpSw1 },
        { id: 'switch-2', state: vtpSw2 }
      ])
    },
    {
      id: 'roas',
      tag: isTr ? 'ROAS' : 'ROAS',
      title: isTr ? 'ROAS (Konsept)' : 'ROAS (Concept)',
      description: isTr ? 'Switch trunk + router (subinterface notlarıyla).' : 'Switch trunk + router with ROAS notes.',
      data: baseProjectData(roasDevices, roasConnections, roasNotes, [
        { id: 'switch-1', state: roasSw },
        { id: 'router-1', state: roasRouter }
      ])
    },
    {
      id: 'port-security',
      tag: isTr ? 'GÜVENLİK' : 'SECURITY',
      title: isTr ? 'Port-Security' : 'Port-Security',
      description: isTr ? 'Fa0/3 üzerinde port-security hazır.' : 'Port-security enabled on Fa0/3.',
      data: baseProjectData(psDevices, psConnections, psNotes, [{ id: 'switch-1', state: psState }])
    }
  ];
};
