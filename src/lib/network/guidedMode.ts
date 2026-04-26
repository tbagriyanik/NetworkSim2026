// Rehberli Ders (Guided Lesson) - Adım adım öğrenme sistemi
import { ExampleProject } from './exampleProjects';

export interface GuidedStep {
  id: string;
  order: number;
  title: { tr: string; en: string };
  description: { tr: string; en: string };
  hint: { tr: string; en: string };
  detailedInstructions?: { tr: string[]; en: string[] };
  checkType: 'deviceAccess' | 'command' | 'config' | 'connection' | 'manual';
  checkParams?: {
    deviceType?: 'switch' | 'router' | 'pc';
    commandPattern?: string;
    configKey?: string;
    configValue?: any;
    cableType?: 'straight' | 'crossover' | 'console';
    sourceDevice?: string;
    sourcePort?: string;
    targetDevice?: string;
    targetPort?: string;
    connections?: Array<{ sourceDevice: string; sourcePort: string; targetDevice: string; targetPort: string }>;
    subnetMask?: string;
  };
  completed: boolean;
  completedAt?: Date;
}

export interface GuidedProject extends ExampleProject {
  isGuided: true;
  steps: GuidedStep[];
  estimatedTimeMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  startedAt?: Date;
}

// Adım tanımları - Temel Switch Yapılandırma Laboratuvarı
export const basicSwitchGuidedSteps: GuidedStep[] = [
  {
    id: 'connect-pc-to-switch',
    order: 1,
    title: { tr: 'PC\'yi Switch\'e Bağla', en: 'Connect PC to Switch' },
    description: { 
      tr: 'PC-1 cihazını Switch-1\'e kablo ile bağlayın', 
      en: 'Connect PC-1 to Switch-1 using a cable' 
    },
    hint: { 
      tr: 'Sol taraftaki kablo simgesine tıklayın, Straight-Through kablo seçin. PC-1\'in Eth0 portuna tıklayın, sonra Switch-1\'in Fa0/1 portuna tıklayın.', 
      en: 'Click the cable icon on the left, select Straight-Through cable. Click on PC-1\'s Eth0 port, then click on Switch-1\'s Fa0/1 port.' 
    },
    detailedInstructions: {
      tr: [
        'Sol panelde kablo aracını seçin',
        'Straight-Through kablo tipini seçin',
        'PC-1\'in Eth0 portuna tıklayın',
        'Switch-1\'in Fa0/1 portuna tıklayın',
        'Bağlantının yeşil renkte olduğunu doğrulayın'
      ],
      en: [
        'Select the cable tool from the left panel',
        'Choose Straight-Through cable type',
        'Click on PC-1\'s Eth0 port',
        'Click on Switch-1\'s Fa0/1 port',
        'Verify the connection is green'
      ]
    },
    checkType: 'connection',
    checkParams: {
      cableType: 'straight',
      sourceDevice: 'pc-1',
      sourcePort: 'eth0',
      targetDevice: 'switch-1',
      targetPort: 'fa0/1'
    },
    completed: false
  },
  {
    id: 'open-switch-terminal',
    order: 2,
    title: { tr: 'Switch Terminalini Aç', en: 'Open Switch Terminal' },
    description: { 
      tr: 'Switch cihazına çift tıklayarak terminalini açın', 
      en: 'Double-click the Switch device to open its terminal' 
    },
    hint: { 
      tr: 'Topolojideki Switch-1\'in üzerine çift tıklayın. Terminal penceresi açılacaktır.', 
      en: 'Double-click on Switch-1 in the topology. The terminal window will open.' 
    },
    detailedInstructions: {
      tr: [
        'Topoloji görünümünde Switch-1 cihazını bulun',
        'Cihazın üzerine çift tıklayın',
        'Terminal penceresinin açıldığını doğrulayın'
      ],
      en: [
        'Find Switch-1 device in the topology view',
        'Double-click on the device',
        'Verify the terminal window opens'
      ]
    },
    checkType: 'deviceAccess',
    checkParams: { deviceType: 'switch' },
    completed: false
  },
  {
    id: 'enter-enable-mode',
    order: 3,
    title: { tr: 'Enable Moduna Geç', en: 'Enter Enable Mode' },
    description: { 
      tr: 'Ayrıcalıklı moda geçmek için enable komutunu kullanın', 
      en: 'Use the enable command to enter privileged mode' 
    },
    hint: { 
      tr: 'Terminalde "Switch>" yazıyorsa, "enable" yazıp Enter\'a basın. Prompt "Switch#" olmalı.', 
      en: 'If you see "Switch>", type "enable" and press Enter. The prompt should change to "Switch#".' 
    },
    detailedInstructions: {
      tr: [
        'Terminalde mevcut prompt\'u kontrol edin (Switch>)',
        'enable yazıp Enter\'a basın',
        'Prompt\'un Switch# olarak değiştiğini doğrulayın'
      ],
      en: [
        'Check the current prompt in terminal (Switch>)',
        'Type enable and press Enter',
        'Verify the prompt changes to Switch#'
      ]
    },
    checkType: 'command',
    checkParams: { commandPattern: 'enable' },
    completed: false
  },
  {
    id: 'enter-config-mode',
    order: 4,
    title: { tr: 'Yapılandırma Moduna Geç', en: 'Enter Configuration Mode' },
    description: { 
      tr: 'Global yapılandırma moduna geçmek için conf t komutunu kullanın', 
      en: 'Use conf t command to enter global configuration mode' 
    },
    hint: { 
      tr: 'Switch# modunda "conf t" veya "configure terminal" yazın. Prompt "Switch(config)#" olacak.', 
      en: 'In Switch# mode, type "conf t" or "configure terminal". Prompt will become "Switch(config)#".' 
    },
    detailedInstructions: {
      tr: [
        'Enable modunda olduğunuzu doğrulayın (Switch#)',
        'conf t yazıp Enter\'a basın',
        'Switch(config)# prompt\'unu gördüğünüzü doğrulayın'
      ],
      en: [
        'Verify you are in enable mode (Switch#)',
        'Type conf t and press Enter',
        'Confirm you see Switch(config)# prompt'
      ]
    },
    checkType: 'command',
    checkParams: { commandPattern: 'conf' },
    completed: false
  },
  {
    id: 'configure-hostname',
    order: 5,
    title: { tr: 'Hostname Değiştir', en: 'Change Hostname' },
    description: { 
      tr: 'Switch\'e yeni bir isim verin', 
      en: 'Give the Switch a new name' 
    },
    hint: { 
      tr: '(config)# modunda "hostname SW-Lab" yazın. Prompt değişecektir.', 
      en: 'In (config)# mode, type "hostname SW-Lab". The prompt will change.' 
    },
    detailedInstructions: {
      tr: [
        'Config modunda olduğunuzu doğrulayın',
        'hostname SW-Lab yazın',
        'Prompt\'un SW-Lab(config)# olarak değiştiğini gözlemleyin'
      ],
      en: [
        'Verify you are in config mode',
        'Type hostname SW-Lab',
        'Observe the prompt changes to SW-Lab(config)#'
      ]
    },
    checkType: 'command',
    checkParams: { commandPattern: 'hostname' },
    completed: false
  },
  {
    id: 'activate-port',
    order: 6,
    title: { tr: 'Port Aktifleştir', en: 'Activate a Port' },
    description: { 
      tr: 'FastEthernet 0/1 portunu aktif hale getirin', 
      en: 'Activate the FastEthernet 0/1 port' 
    },
    hint: { 
      tr: 'interface fa0/1 ile porta girin, ardından no shutdown yazın.', 
      en: 'Enter the port with interface fa0/1, then type no shutdown.' 
    },
    detailedInstructions: {
      tr: [
        'interface fastethernet0/1 yazın',
        'no shutdown komutunu girin',
        'Portun aktif olduğunu doğrulayın'
      ],
      en: [
        'Type interface fastethernet0/1',
        'Enter the no shutdown command',
        'Verify the port is activated'
      ]
    },
    checkType: 'config',
    checkParams: { configKey: 'ports.fa0/1.shutdown', configValue: false },
    completed: false
  },
  {
    id: 'save-config',
    order: 7,
    title: { tr: 'Yapılandırmayı Kaydet', en: 'Save Configuration' },
    description: { 
      tr: 'Yaptığınız değişiklikleri kaydedin', 
      en: 'Save your changes' 
    },
    hint: { 
      tr: 'Enable moduna geri dönün (end veya exit) ve write memory yazın.', 
      en: 'Return to enable mode (end or exit) and type write memory.' 
    },
    detailedInstructions: {
      tr: [
        'exit veya end ile config modundan çıkın',
        'write memory veya copy run start yazın',
        'Yapılandırmanın kaydedildiğini onaylayın'
      ],
      en: [
        'Exit config mode with exit or end',
        'Type write memory or copy run start',
        'Confirm the configuration is saved'
      ]
    },
    checkType: 'command',
    checkParams: { commandPattern: 'write|copy' },
    completed: false
  }
];

// VLAN Yapılandırma Laboratuvarı - Adımlar
export const vlanGuidedSteps: GuidedStep[] = [
  {
    id: 'vlan-enter-config',
    order: 1,
    title: { tr: 'Yapılandırma Moduna Gir', en: 'Enter Config Mode' },
    description: { 
      tr: 'Enable ve config moduna geçin', 
      en: 'Enter enable and config modes' 
    },
    hint: { 
      tr: 'enable, sonra conf t komutlarını kullanın.', 
      en: 'Use enable, then conf t commands.' 
    },
    checkType: 'command',
    checkParams: { commandPattern: 'conf' },
    completed: false
  },
  {
    id: 'vlan-create-vlan10',
    order: 2,
    title: { tr: 'VLAN 10 Oluştur', en: 'Create VLAN 10' },
    description: { 
      tr: 'VLAN 10\'u oluşturun', 
      en: 'Create VLAN 10' 
    },
    hint: { 
      tr: 'vlan 10 yazın ve Enter\'a basın.', 
      en: 'Type vlan 10 and press Enter.' 
    },
    detailedInstructions: {
      tr: [
        'vlan 10 yazıp Enter\'a basın',
        'VLAN 10 oluşturulacaktır'
      ],
      en: [
        'Type vlan 10 and press Enter',
        'VLAN 10 will be created'
      ]
    },
    checkType: 'command',
    checkParams: { commandPattern: 'vlan 10' },
    completed: false
  },
  {
    id: 'vlan-name-vlan10',
    order: 3,
    title: { tr: 'VLAN 10\'a İsim Ver', en: 'Name VLAN 10' },
    description: { 
      tr: 'VLAN 10\'a SALES ismini verin', 
      en: 'Name VLAN 10 as SALES' 
    },
    hint: { 
      tr: 'name SALES yazın ve Enter\'a basın.', 
      en: 'Type name SALES and press Enter.' 
    },
    detailedInstructions: {
      tr: [
        'name SALES yazıp Enter\'a basın',
        'exit ile VLAN modundan çıkın'
      ],
      en: [
        'Type name SALES and press Enter',
        'Exit VLAN mode with exit'
      ]
    },
    checkType: 'command',
    checkParams: { commandPattern: 'name' },
    completed: false
  },
  {
    id: 'vlan-create-vlan20',
    order: 4,
    title: { tr: 'VLAN 20 Oluştur', en: 'Create VLAN 20' },
    description: { 
      tr: 'VLAN 20\'yi oluşturun', 
      en: 'Create VLAN 20' 
    },
    hint: { 
      tr: 'vlan 20 yazın ve Enter\'a basın.', 
      en: 'Type vlan 20 and press Enter.' 
    },
    detailedInstructions: {
      tr: [
        'vlan 20 yazıp Enter\'a basın',
        'VLAN 20 oluşturulacaktır'
      ],
      en: [
        'Type vlan 20 and press Enter',
        'VLAN 20 will be created'
      ]
    },
    checkType: 'command',
    checkParams: { commandPattern: 'vlan 20' },
    completed: false
  },
  {
    id: 'vlan-name-vlan20',
    order: 5,
    title: { tr: 'VLAN 20\'ye İsim Ver', en: 'Name VLAN 20' },
    description: { 
      tr: 'VLAN 20\'ye IT ismini verin', 
      en: 'Name VLAN 20 as IT' 
    },
    hint: { 
      tr: 'name IT yazın ve Enter\'a basın.', 
      en: 'Type name IT and press Enter.' 
    },
    detailedInstructions: {
      tr: [
        'name IT yazıp Enter\'a basın',
        'exit ile VLAN modundan çıkın'
      ],
      en: [
        'Type name IT and press Enter',
        'Exit VLAN mode with exit'
      ]
    },
    checkType: 'command',
    checkParams: { commandPattern: 'name' },
    completed: false
  },
  {
    id: 'vlan-assign-port',
    order: 6,
    title: { tr: 'Port VLAN Atama', en: 'Assign Port to VLAN' },
    description: { 
      tr: 'Fa0/1 portunu VLAN 10\'a atayın', 
      en: 'Assign Fa0/1 port to VLAN 10' 
    },
    hint: { 
      tr: 'interface fa0/1, switchport mode access, switchport access vlan 10', 
      en: 'interface fa0/1, switchport mode access, switchport access vlan 10' 
    },
    detailedInstructions: {
      tr: [
        'interface fa0/1 ile porta girin',
        'switchport mode access yazın',
        'switchport access vlan 10 yazın'
      ],
      en: [
        'Enter interface fa0/1',
        'Type switchport mode access',
        'Type switchport access vlan 10'
      ]
    },
    checkType: 'config',
    checkParams: { configKey: 'ports.fa0/1.vlan', configValue: 10 },
    completed: false
  },
  {
    id: 'vlan-verify',
    order: 7,
    title: { tr: 'VLAN\'ları Doğrula', en: 'Verify VLANs' },
    description: { 
      tr: 'show vlan brief komutu ile VLAN\'ları görüntüleyin', 
      en: 'View VLANs with show vlan brief command' 
    },
    hint: { 
      tr: 'Enable moduna dönün ve show vlan brief yazın.', 
      en: 'Return to enable mode and type show vlan brief.' 
    },
    checkType: 'command',
    checkParams: { commandPattern: 'show vlan' },
    completed: false
  }
];

// Temel LAN Kurulumu ve Switch Yapılandırma Laboratuvarı - Adımlar
export const basicLanGuidedSteps: GuidedStep[] = [
  {
    id: 'lan-connect-devices',
    order: 1,
    title: { tr: 'Fiziksel Bağlantıyı Kurma', en: 'Establish Physical Connection' },
    description: { 
      tr: 'İki bilgisayarı switch\'e bağlayın', 
      en: 'Connect two PCs to the switch' 
    },
    hint: { 
      tr: 'PC0\'ı Fa0/1 ve PC1\'i Fa0/2 portlarına düz (straight-through) kablo ile bağlayın.', 
      en: 'Connect PC0 to Fa0/1 and PC1 to Fa0/2 using straight-through cables.' 
    },
    detailedInstructions: {
      tr: [
        'Kablo çekme aracını seçin',
        'PC0 üzerine tıklayıp Switch Fa0/1 portuna sürükleyin',
        'Düz (Copper Straight-Through) kablo tipini seçin',
        'PC1 için aynı işlemi Fa0/2 portuna yapın'
      ],
      en: [
        'Select the cable tool',
        'Click on PC0 and drag to Switch Fa0/1 port',
        'Choose Copper Straight-Through cable type',
        'Do the same for PC1 to Fa0/2 port'
      ]
    },
    checkType: 'connection',
    checkParams: {
      cableType: 'straight',
      connections: [
        { sourceDevice: 'pc-1', sourcePort: 'eth0', targetDevice: 'switch-1', targetPort: 'fa0/1' },
        { sourceDevice: 'pc-2', sourcePort: 'eth0', targetDevice: 'switch-1', targetPort: 'fa0/2' }
      ]
    },
    completed: false
  },
  {
    id: 'lan-pc0-ip',
    order: 2,
    title: { tr: 'PC0 IP Yapılandırması', en: 'PC0 IP Configuration' },
    description: { 
      tr: 'PC0\'a IP adresi atayın', 
      en: 'Assign IP address to PC0' 
    },
    hint: { 
      tr: 'PC0\'a çift tıklayıp IP Configuration sekmesine gidin. IP: 192.168.1.10, Mask: 255.255.255.0', 
      en: 'Double-click PC0 and go to IP Configuration tab. IP: 192.168.1.10, Mask: 255.255.255.0' 
    },
    detailedInstructions: {
      tr: [
        'PC0 üzerine çift tıklayın',
        'Desktop sekmesine gidin',
        'IP Configuration\'ı açın',
        'Static seçeneğini seçin',
        'IP Address: 192.168.1.10',
        'Subnet Mask: 255.255.255.0'
      ],
      en: [
        'Double-click on PC0',
        'Go to Desktop tab',
        'Open IP Configuration',
        'Select Static option',
        'IP Address: 192.168.1.10',
        'Subnet Mask: 255.255.255.0'
      ]
    },
    checkType: 'config',
    checkParams: { 
      configKey: 'pc.pc-1.ip', 
      configValue: '192.168.1.10',
      subnetMask: '255.255.255.0'
    },
    completed: false
  },
  {
    id: 'lan-pc1-ip',
    order: 3,
    title: { tr: 'PC1 IP Yapılandırması', en: 'PC1 IP Configuration' },
    description: { 
      tr: 'PC1\'e IP adresi atayın', 
      en: 'Assign IP address to PC1' 
    },
    hint: { 
      tr: 'PC1\'e IP: 192.168.1.20, Mask: 255.255.255.0 atayın.', 
      en: 'Assign IP: 192.168.1.20, Mask: 255.255.255.0 to PC1.' 
    },
    detailedInstructions: {
      tr: [
        'PC1 üzerine çift tıklayın',
        'IP Configuration\'ı açın',
        'Static seçeneğini seçin',
        'IP Address: 192.168.1.20',
        'Subnet Mask: 255.255.255.0'
      ],
      en: [
        'Double-click on PC1',
        'Open IP Configuration',
        'Select Static option',
        'IP Address: 192.168.1.20',
        'Subnet Mask: 255.255.255.0'
      ]
    },
    checkType: 'config',
    checkParams: { 
      configKey: 'pc.pc-2.ip', 
      configValue: '192.168.1.20',
      subnetMask: '255.255.255.0'
    },
    completed: false
  },
  {
    id: 'lan-switch-hostname',
    order: 4,
    title: { tr: 'Switch Hostname Değiştirme', en: 'Change Switch Hostname' },
    description: { 
      tr: 'Switch\'e Lab_Switch ismini verin', 
      en: 'Name the switch as Lab_Switch' 
    },
    hint: { 
      tr: 'enable, configure terminal, sonra hostname Lab_Switch yazın.', 
      en: 'Type enable, configure terminal, then hostname Lab_Switch.' 
    },
    detailedInstructions: {
      tr: [
        'Switch terminalini açın',
        'enable yazın',
        'configure terminal yazın',
        'hostname Lab_Switch yazın'
      ],
      en: [
        'Open switch terminal',
        'Type enable',
        'Type configure terminal',
        'Type hostname Lab_Switch'
      ]
    },
    checkType: 'command',
    checkParams: { commandPattern: 'hostname' },
    completed: false
  },
  {
    id: 'lan-switch-enable-secret',
    order: 5,
    title: { tr: 'Enable Secret Şifre', en: 'Enable Secret Password' },
    description: { 
      tr: 'Ayrıcalıklı mod şifresi belirleyin', 
      en: 'Set privileged mode password' 
    },
    hint: { 
      tr: 'enable secret 1234 komutunu kullanın.', 
      en: 'Use enable secret 1234 command.' 
    },
    detailedInstructions: {
      tr: [
        'Config modunda olun',
        'enable secret 1234 yazın',
        'Şifrelenmiş parola oluşturulacaktır'
      ],
      en: [
        'Be in config mode',
        'Type enable secret 1234',
        'Encrypted password will be created'
      ]
    },
    checkType: 'command',
    checkParams: { commandPattern: 'enable secret' },
    completed: false
  },
  {
    id: 'lan-switch-console-pass',
    order: 6,
    title: { tr: 'Konsol Şifresi', en: 'Console Password' },
    description: { 
      tr: 'Konsol portu şifresi koyun', 
      en: 'Set console port password' 
    },
    hint: { 
      tr: 'line console 0, password 4321, login komutlarını kullanın.', 
      en: 'Use line console 0, password 4321, login commands.' 
    },
    detailedInstructions: {
      tr: [
        'Config modundayken: line console 0 yazın',
        'password 4321 yazın',
        'login yazın',
        'exit ile çıkın'
      ],
      en: [
        'In config mode: type line console 0',
        'Type password 4321',
        'Type login',
        'Exit with exit command'
      ]
    },
    checkType: 'command',
    checkParams: { commandPattern: 'line console|password 4321' },
    completed: false
  },
  {
    id: 'lan-switch-banner',
    order: 7,
    title: { tr: 'Karşılama Mesajı (MOTD)', en: 'Welcome Message (MOTD)' },
    description: { 
      tr: 'Banner mesajı ekleyin', 
      en: 'Add banner message' 
    },
    hint: { 
      tr: 'banner motd #YETKISIZ GIRIS YASAKTIR# yazın.', 
      en: 'Type banner motd #Unauthorized Access Prohibited#.' 
    },
    detailedInstructions: {
      tr: [
        'Config modunda: banner motd #YETKISIZ GIRIS YASAKTIR#',
        'veya kendi mesajınızı yazın',
        'Sonlandırıcı karakter (#) ile kapatın'
      ],
      en: [
        'In config mode: banner motd #Unauthorized Access Prohibited#',
        'Or use your own message',
        'Close with terminator character (#)'
      ]
    },
    checkType: 'command',
    checkParams: { commandPattern: 'banner motd' },
    completed: false
  },
  {
    id: 'lan-ping-test',
    order: 8,
    title: { tr: 'Ping Testi', en: 'Ping Test' },
    description: { 
      tr: 'PC0\'dan PC1\'e ping atın', 
      en: 'Ping from PC0 to PC1' 
    },
    hint: { 
      tr: 'PC0\'da Command Prompt açın ve ping 192.168.1.20 yazın.', 
      en: 'Open Command Prompt on PC0 and type ping 192.168.1.20.' 
    },
    detailedInstructions: {
      tr: [
        'PC0 üzerine çift tıklayın',
        'Desktop > Command Prompt açın',
        'ping 192.168.1.20 yazın',
        'Reply from mesajlarını görün'
      ],
      en: [
        'Double-click on PC0',
        'Open Desktop > Command Prompt',
        'Type ping 192.168.1.20',
        'See Reply from messages'
      ]
    },
    checkType: 'command',
    checkParams: { commandPattern: 'ping 192.168.1.20' },
    completed: false
  },
  {
    id: 'lan-save-config',
    order: 9,
    title: { tr: 'Yapılandırmayı Kaydet', en: 'Save Configuration' },
    description: { 
      tr: 'Ayarları kalıcı hafızaya kaydedin', 
      en: 'Save settings to persistent memory' 
    },
    hint: { 
      tr: 'exit ile enable moduna dönün, copy running-config startup-config yazın.', 
      en: 'Return to enable mode with exit, type copy running-config startup-config.' 
    },
    detailedInstructions: {
      tr: [
        'Config modundan exit ile çıkın',
        'Privileged modda (Switch#) olduğunuzdan emin olun',
        'copy running-config startup-config yazın',
        'Enter onaylayın'
      ],
      en: [
        'Exit config mode with exit',
        'Make sure you are in privileged mode (Switch#)',
        'Type copy running-config startup-config',
        'Press Enter to confirm'
      ]
    },
    checkType: 'command',
    checkParams: { commandPattern: 'copy running-config|wr' },
    completed: false
  },
  {
    id: 'lan-verify-config',
    order: 10,
    title: { tr: 'Yapılandırmayı Doğrula', en: 'Verify Configuration' },
    description: { 
      tr: 'show running-config ile ayarları görüntüleyin', 
      en: 'View settings with show running-config' 
    },
    hint: { 
      tr: 'show running-config yazarak hostname, şifre ve banner ayarlarını kontrol edin.', 
      en: 'Type show running-config to check hostname, password and banner settings.' 
    },
    detailedInstructions: {
      tr: [
        'Switch terminalinde olun',
        'show running-config yazın',
        'Hostname: Lab_Switch kontrol edin',
        'Banner ve şifre ayarlarını doğrulayın'
      ],
      en: [
        'Be in switch terminal',
        'Type show running-config',
        'Check Hostname: Lab_Switch',
        'Verify banner and password settings'
      ]
    },
    checkType: 'command',
    checkParams: { commandPattern: 'show run' },
    completed: false
  }
];

// Rehberli projeleri oluştur
export const getGuidedProjects = (language: 'tr' | 'en'): GuidedProject[] => {
  const isTr = language === 'tr';
  
  return [
    {
      id: 'guided-basic-switch',
      tag: isTr ? 'Temel' : 'Basic',
      title: isTr ? 'Temel Switch Yapılandırma' : 'Basic Switch Configuration',
      description: isTr 
        ? 'Adım adım switch hostname değiştirme, port aktifleştirme ve kaydetme' 
        : 'Step-by-step switch hostname change, port activation, and saving',
      detail: isTr
        ? 'Bu rehberli laboratuvarda: enable moduna geçiş, config moduna geçiş, hostname değiştirme, port aktifleştirme ve yapılandırmayı kaydetme öğrenilir.'
        : 'In this guided lab: entering enable/config modes, changing hostname, activating ports, and saving configuration.',
      data: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        devices: [],
        deviceOutputs: [],
        pcOutputs: [],
        pcHistories: [],
        topology: {
          devices: [
            {
              id: 'switch-1',
              type: 'switchL2',
              name: 'Switch-1',
              x: 300,
              y: 200,
              ip: '',
              macAddress: '00:1A:2B:3C:4D:50',
              status: 'online',
              switchModel: 'WS-C2960-24TT-L',
              ports: [
                ...Array.from({ length: 24 }, (_, i) => ({ 
                  id: `fa0/${i + 1}`, 
                  label: `Fa0/${i + 1}`, 
                  status: 'disconnected' as const 
                })),
                { id: 'console', label: 'Console', status: 'disconnected' as const },
                { id: 'gi0/1', label: 'Gi0/1', status: 'disconnected' as const },
                { id: 'gi0/2', label: 'Gi0/2', status: 'disconnected' as const }
              ]
            },
            {
              id: 'pc-1',
              type: 'pc',
              name: 'PC-1',
              x: 100,
              y: 200,
              ip: '192.168.1.10',
              subnet: '255.255.255.0',
              gateway: '192.168.1.1',
              macAddress: '00:50:79:66:68:01',
              status: 'online',
              ports: [
                { id: 'eth0', label: 'Eth0', status: 'disconnected' as const },
                { id: 'com1', label: 'COM1', status: 'disconnected' as const }
              ]
            }
          ],
          connections: [],
          notes: [
            {
              id: 'guided-intro',
              text: isTr
                ? '📚 REHBERLİ DERS AKTİF\n\nSağdaki panelden adımları takip edin.\nHer adım tamamlandığında bir sonrakine geçilir.'
                : '📚 GUIDED LESSON ACTIVE\n\nFollow the steps in the right panel.\nNext step unlocks when each is completed.',
              x: 450,
              y: 100,
              width: 350,
              height: 120,
              color: '#3b82f6',
              font: 'verdana',
              fontSize: 12,
              opacity: 0.75
            }
          ]
        },
        cableInfo: {
          connected: true,
          cableType: 'straight',
          sourceDevice: 'pc',
          targetDevice: 'switchL2'
        },
        activeDeviceId: 'switch-1',
        activeDeviceType: 'switchL2',
        activeTab: 'topology',
        zoom: 1,
        pan: { x: 0, y: 0 }
      },
      level: 'basic',
      isGuided: true,
      steps: basicSwitchGuidedSteps,
      estimatedTimeMinutes: 10,
      difficulty: 'beginner'
    },
    {
      id: 'guided-basic-lan',
      tag: isTr ? 'LAN' : 'LAN',
      title: isTr ? 'Temel LAN Kurulumu' : 'Basic LAN Setup',
      description: isTr 
        ? 'İki bilgisayarlı ağ kurma ve switch güvenlik yapılandırması' 
        : 'Two-computer network setup and switch security configuration',
      detail: isTr
        ? 'PC bağlantısı, IP atama, hostname, şifre, banner, ping testi ve yapılandırma kaydetme işlemleri.'
        : 'PC connections, IP assignment, hostname, passwords, banner, ping test, and saving configuration.',
      data: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        devices: [],
        deviceOutputs: [],
        pcOutputs: [],
        pcHistories: [],
        topology: {
          devices: [
            {
              id: 'switch-1',
              type: 'switchL2',
              name: 'Switch',
              x: 400,
              y: 200,
              ip: '',
              macAddress: '00:1A:2B:3C:4D:70',
              status: 'online',
              switchModel: 'WS-C2960-24TT-L',
              ports: [
                ...Array.from({ length: 24 }, (_, i) => ({ 
                  id: `fa0/${i + 1}`, 
                  label: `Fa0/${i + 1}`, 
                  status: 'disconnected' as const 
                })),
                { id: 'console', label: 'Console', status: 'disconnected' as const },
                { id: 'gi0/1', label: 'Gi0/1', status: 'disconnected' as const },
                { id: 'gi0/2', label: 'Gi0/2', status: 'disconnected' as const }
              ]
            },
            {
              id: 'pc-1',
              type: 'pc',
              name: 'PC0',
              x: 150,
              y: 100,
              ip: '',
              subnet: '',
              gateway: '',
              macAddress: '00:50:79:66:68:10',
              status: 'online',
              ports: [
                { id: 'eth0', label: 'Eth0', status: 'disconnected' as const },
                { id: 'com1', label: 'COM1', status: 'disconnected' as const }
              ]
            },
            {
              id: 'pc-2',
              type: 'pc',
              name: 'PC1',
              x: 150,
              y: 300,
              ip: '',
              subnet: '',
              gateway: '',
              macAddress: '00:50:79:66:68:20',
              status: 'online',
              ports: [
                { id: 'eth0', label: 'Eth0', status: 'disconnected' as const },
                { id: 'com1', label: 'COM1', status: 'disconnected' as const }
              ]
            }
          ],
          connections: [],
          notes: [
            {
              id: 'lan-guided-intro',
              text: isTr
                ? '📚 TEMEL LAN KURULUMU\n\nAdım 1: PC0 ve PC1\'i Switch\'e bağlayın\nAdım 2: IP adreslerini atayın (192.168.1.10/20)\nAdım 3: Switch hostname: Lab_Switch\nAdım 4: Güvenlik: enable secret, console şifresi\nAdım 5: Banner MOTD ekle\nAdım 6: Ping testi ve kaydetme'
                : '📚 BASIC LAN SETUP\n\nStep 1: Connect PC0 and PC1 to Switch\nStep 2: Assign IPs (192.168.1.10/20)\nStep 3: Switch hostname: Lab_Switch\nStep 4: Security: enable secret, console password\nStep 5: Add Banner MOTD\nStep 6: Ping test and save',
              x: 500,
              y: 50,
              width: 450,
              height: 200,
              color: '#8b5cf6',
              font: 'verdana',
              fontSize: 12,
              opacity: 0.75
            }
          ]
        },
        cableInfo: {
          connected: true,
          cableType: 'straight',
          sourceDevice: 'pc',
          targetDevice: 'switchL2'
        },
        activeDeviceId: 'switch-1',
        activeDeviceType: 'switchL2',
        activeTab: 'topology',
        zoom: 1,
        pan: { x: 0, y: 0 }
      },
      level: 'basic',
      isGuided: true,
      steps: basicLanGuidedSteps,
      estimatedTimeMinutes: 20,
      difficulty: 'beginner'
    },
    {
      id: 'guided-vlan-lab',
      tag: isTr ? 'VLAN' : 'VLAN',
      title: isTr ? 'VLAN Yapılandırma' : 'VLAN Configuration',
      description: isTr 
        ? 'VLAN oluşturma, isimlendirme ve port atama işlemleri' 
        : 'Creating VLANs, naming them, and assigning ports',
      detail: isTr
        ? 'Bu laboratuvarda VLAN 10 (SALES) ve VLAN 20 (IT) oluşturulur, portlar VLANlara atanır ve doğrulama yapılır.'
        : 'In this lab, VLAN 10 (SALES) and VLAN 20 (IT) are created, ports assigned to VLANs, and verification performed.',
      data: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        devices: [],
        deviceOutputs: [],
        pcOutputs: [],
        pcHistories: [],
        topology: {
          devices: [
            {
              id: 'switch-1',
              type: 'switchL2',
              name: 'Switch-1',
              x: 300,
              y: 200,
              ip: '',
              macAddress: '00:1A:2B:3C:4D:60',
              status: 'online',
              switchModel: 'WS-C2960-24TT-L',
              ports: [
                ...Array.from({ length: 24 }, (_, i) => ({ 
                  id: `fa0/${i + 1}`, 
                  label: `Fa0/${i + 1}`, 
                  status: 'disconnected' as const 
                })),
                { id: 'console', label: 'Console', status: 'disconnected' as const },
                { id: 'gi0/1', label: 'Gi0/1', status: 'disconnected' as const },
                { id: 'gi0/2', label: 'Gi0/2', status: 'disconnected' as const }
              ]
            }
          ],
          connections: [],
          notes: [
            {
              id: 'vlan-guided-intro',
              text: isTr
                ? '📚 VLAN REHBERLİ DERSİ\n\nAdım 1: VLAN 10 (SALES) oluşturun\nAdım 2: VLAN 20 (IT) oluşturun\nAdım 3: Portları VLAN\'lara atayın\nAdım 4: show vlan brief ile doğrulayın'
                : '📚 VLAN GUIDED LESSON\n\nStep 1: Create VLAN 10 (SALES)\nStep 2: Create VLAN 20 (IT)\nStep 3: Assign ports to VLANs\nStep 4: Verify with show vlan brief',
              x: 450,
              y: 100,
              width: 400,
              height: 150,
              color: '#10b981',
              font: 'verdana',
              fontSize: 12,
              opacity: 0.75
            }
          ]
        },
        cableInfo: {
          connected: true,
          cableType: 'straight',
          sourceDevice: 'pc',
          targetDevice: 'switchL2'
        },
        activeDeviceId: 'switch-1',
        activeDeviceType: 'switchL2',
        activeTab: 'topology',
        zoom: 1,
        pan: { x: 0, y: 0 }
      },
      level: 'intermediate',
      isGuided: true,
      steps: vlanGuidedSteps,
      estimatedTimeMinutes: 15,
      difficulty: 'intermediate'
    }
  ];
};

// Rehberli ders hook için yardımcı fonksiyonlar
export const checkStepCompletion = (
  step: GuidedStep,
  context: {
    lastCommand?: string;
    deviceAccessed?: 'switch' | 'router' | 'pc' | null;
    deviceState?: any;
    topologyConnections?: any[];
    topologyDevices?: any[];
  }
): boolean => {
  switch (step.checkType) {
    case 'deviceAccess':
      return context.deviceAccessed === step.checkParams?.deviceType;
    
    case 'command':
      if (!step.checkParams?.commandPattern || !context.lastCommand) return false;
      const patterns = step.checkParams.commandPattern.split('|');
      const lastCmd = context.lastCommand!.toLowerCase().trim();
      return patterns.some(pattern => {
        const pat = pattern.toLowerCase().trim();
        // Check if command starts with pattern (prefix match)
        // or if pattern is contained within command
        return lastCmd.startsWith(pat) || lastCmd.includes(pat);
      });
    
    case 'connection':
      // Check if devices are connected with correct cable type and ports
      if (!context.topologyConnections || !context.topologyDevices) return false;

      // If multiple connections required (LAN setup)
      if (step.checkParams?.connections) {
        const requiredConnections = step.checkParams.connections;
        const allConnectionsMatch = requiredConnections.every(required => {
          return context.topologyConnections!.some((conn: any) => {
            if (!conn.active) return false;
            // Check cable type
            if (step.checkParams?.cableType) {
              const cableTypeMatch = conn.cableType === step.checkParams.cableType ||
                                    (step.checkParams.cableType === 'straight' && conn.cableType === 'copper-straight-through');
              if (!cableTypeMatch) return false;
            }
            // Check source device and port
            const sourceMatch = conn.sourceDeviceId === required.sourceDevice &&
                               conn.sourcePort === required.sourcePort;
            // Check target device and port
            const targetMatch = conn.targetDeviceId === required.targetDevice &&
                               conn.targetPort === required.targetPort;
            return sourceMatch && targetMatch;
          });
        });
        return allConnectionsMatch;
      }

      // Single connection check (Basic Switch lesson)
      if (step.checkParams?.sourceDevice && step.checkParams?.targetDevice) {
        const params = step.checkParams;
        return context.topologyConnections.some((conn: any) => {
          if (!conn.active) return false;
          // Check cable type
          if (params.cableType) {
            const cableTypeMatch = conn.cableType === params.cableType ||
                                  (params.cableType === 'straight' && conn.cableType === 'copper-straight-through');
            if (!cableTypeMatch) return false;
          }
          // Check source device and port
          const sourceMatch = conn.sourceDeviceId === params.sourceDevice &&
                             conn.sourcePort === params.sourcePort;
          // Check target device and port
          const targetMatch = conn.targetDeviceId === params.targetDevice &&
                             conn.targetPort === params.targetPort;
          return sourceMatch && targetMatch;
        });
      }

      // Fallback: check for any active connection
      return context.topologyConnections.some(
        (conn: any) => conn.active === true
      );
    
    case 'config':
      // Config kontrolü - deviceState üzerinden
      if (!context.deviceState || !step.checkParams?.configKey) return false;
      
      // Check port shutdown status (for 'no shutdown' commands)
      if (step.checkParams.configKey === 'ports.fa0/1.shutdown') {
        const port = context.deviceState.ports?.['fa0/1'] || context.deviceState.ports?.['Fa0/1'];
        if (port) {
          // shutdown: false means port is active (no shutdown applied)
          return port.shutdown === step.checkParams.configValue;
        }
      }
      
      // Check VLAN creation (for VLAN 10 and 20)
      if (step.checkParams.configKey === 'vlans.10') {
        const vlan10 = context.deviceState.vlans?.['10'] || context.deviceState.vlans?.[10];
        return !!vlan10;
      }
      if (step.checkParams.configKey === 'vlans.20') {
        const vlan20 = context.deviceState.vlans?.['20'] || context.deviceState.vlans?.[20];
        return !!vlan20;
      }
      
      // Check port VLAN assignment
      if (step.checkParams.configKey === 'ports.fa0/1.vlan') {
        const port = context.deviceState.ports?.['fa0/1'] || context.deviceState.ports?.['Fa0/1'];
        if (port) {
          return port.vlan === step.checkParams.configValue || port.accessVlan === step.checkParams.configValue;
        }
      }
      
      // Check PC IP configuration (for LAN setup)
      if (step.checkParams.configKey === 'pc.pc-1.ip') {
        // PC IP is stored in topology devices, not deviceState
        const pcDevice = context.topologyDevices?.find((d: any) => d.id === 'pc-1');
        const ipMatch = pcDevice?.ip === step.checkParams.configValue;
        // Also check subnet mask if specified
        if (step.checkParams.subnetMask) {
          const maskMatch = pcDevice?.subnet === step.checkParams.subnetMask;
          return ipMatch && maskMatch;
        }
        return ipMatch;
      }
      if (step.checkParams.configKey === 'pc.pc-2.ip') {
        // PC IP is stored in topology devices, not deviceState
        const pcDevice = context.topologyDevices?.find((d: any) => d.id === 'pc-2');
        const ipMatch = pcDevice?.ip === step.checkParams.configValue;
        // Also check subnet mask if specified
        if (step.checkParams.subnetMask) {
          const maskMatch = pcDevice?.subnet === step.checkParams.subnetMask;
          return ipMatch && maskMatch;
        }
        return ipMatch;
      }
      return false;
    
    case 'manual':
      // Manual steps always allow completion
      return true;
    
    default:
      return false;
  }
};

export const getNextIncompleteStep = (steps: GuidedStep[]): GuidedStep | null => {
  return steps.find(s => !s.completed) || null;
};

export const getCompletedStepsCount = (steps: GuidedStep[]): number => {
  return steps.filter(s => s.completed).length;
};

export const getProgressPercentage = (steps: GuidedStep[]): number => {
  if (steps.length === 0) return 0;
  return Math.round((getCompletedStepsCount(steps) / steps.length) * 100);
};
