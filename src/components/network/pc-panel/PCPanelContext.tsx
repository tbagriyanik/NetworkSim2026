'use client';

import { createContext, useContext, type RefObject, type CSSProperties } from 'react';
import type { SwitchState } from '@/lib/network/types';
import type { CanvasDevice } from '../networkTopology.types';
import type { TerminalOutput } from '../Terminal';
import type { DhcpPoolConfig, OutputLine, PCActiveTab, PcFile } from './PCPanel.types';
import type { SyslogMessage } from '@/lib/network/syslog';

/** All state and callbacks shared between PCPanel and its tab components. */
export interface PCPanelContextValue {
  // Identity
  deviceId: string;
  isDark: boolean;
  language: 'tr' | 'en';
  t: Record<string, string>;
  environment: any;

  // Layout
  isMobile: boolean;
  mobileVerticalScrollStyle: CSSProperties | undefined;
  fontSize: number;
  terminalBg: string;
  textColor: string;

  // Navigation
  activeTab: PCActiveTab;
  setActiveTab: (tab: PCActiveTab) => void;
  navigateToProgram: (tab: PCActiveTab) => void;
  goHome: () => void;

  // Device topology
  isPcPoweredOff: boolean;
  deviceFromTopology: CanvasDevice | undefined;
  topologyDevices: CanvasDevice[];
  topologyConnections: any;
  deviceStates: Map<string, SwitchState> | undefined;
  deviceOutputs: Map<string, TerminalOutput[]> | undefined;
  handleResizeStart: any;

  // PC Network config
  pcIP: string;
  setPcIP: (ip: string) => void;
  pcMAC: string;
  setPcMAC: (mac: string) => void;
  pcSubnet: string;
  setPcSubnet: (s: string) => void;
  pcGateway: string;
  setPcGateway: (g: string) => void;
  pcDNS: string;
  setPcDNS: (d: string) => void;
  pcIPv6: string;
  setPcIPv6: (v: string) => void;
  pcIPv6Prefix: string;
  setPcIPv6Prefix: (p: string) => void;
  ipConfigMode: 'static' | 'dhcp';
  setIpConfigMode: (m: 'static' | 'dhcp') => void;
  internalPcHostname: string;
  setPcHostname: (name: string) => void;
  wifiEnabled: boolean;
  setWifiEnabled: any;
  wifiSSID: string;
  setWifiSSID: (s: string) => void;
  wifiBSSID: string;
  setWifiBSSID: (b: string) => void;
  wifiSecurity: string;
  setWifiSecurity: any;
  wifiPassword: string;
  setWifiPassword: (p: string) => void;
  wifiChannel: string;
  setWifiChannel: (c: string) => void;
  wifiSignalStrength: number;
  availableSSIDs: Array<{ ssid: string; deviceId: string; deviceName: string; channel?: string }>;

  // Command execution
  input: string;
  setInput: (v: string) => void;
  executeCommand: (cmd?: string) => Promise<void>;
  isCmdInputDisabled: boolean;
  currentPath: string;
  setCurrentPath: (p: string) => void;

  // Output
  pcOutput: OutputLine[];
  setPcOutput: React.Dispatch<React.SetStateAction<OutputLine[]>>;
  addLocalOutput: (type: OutputLine['type'], content: string, prompt?: string) => void;
  addMultilineOutput: (type: OutputLine['type'], content: string, delayMs?: number) => Promise<void>;

  // Autocomplete
  shouldShowAutocomplete: any;
  renderAutocompleteSuggestions: any;
  autocompleteIndex: number;
  completeAutocompleteSelection: (word: string) => void;
  handleInputChange: any;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;

  // Refs
  inputRef: RefObject<HTMLInputElement | null>;
  outputRef: RefObject<HTMLDivElement | null>;
  autocompleteRef: RefObject<HTMLDivElement | null>;
  showCmdSettings: boolean;
  setShowCmdSettings: (v: boolean) => void;
  handleFontSizeChange: (size: number) => void;
  highlightText: (text: string) => React.ReactNode;

  // Sessions
  ftpSession: import('./PCPanel.types').FtpSession | null;
  pythonSession: import('./PCPanel.types').PythonSession | null;
  editingFile: { path: string; content: string } | null;
  setEditingFile: (f: { path: string; content: string } | null) => void;

  // Console
  isConsoleConnected: boolean;
  setIsConsoleConnected: (v: boolean) => void;
  connectedDeviceId: string | null;
  setConnectedDeviceId: (id: string | null) => void;
  setConsoleConnectionTime: (t: number) => void;
  isConsoleInputDisabled: boolean;
  consoleNeedsPassword: boolean;
  consoleConfirmDialog: { show: boolean; message: string } | null;
  consoleReloadPending: boolean;
  consoleDevice: any;
  handleConnect: () => Promise<void>;
  onExecuteDeviceCommand?: (deviceId: string, command: string) => Promise<unknown>;
  setConsolePasswordAttempted: (v: boolean) => void;
  activeConsoleOutput: any;

  // Reachability
  canReachTargetIp: (targetIp: string, options?: { protocol?: 'tcp' | 'udp' | 'icmp' | 'any'; port?: string }) => boolean;
  resolveDeviceNameTargetCallback: (raw: string) => { ip: string; label?: string } | null;

  // Refs needed by tabs
  applyDhcpLeaseRef: RefObject<((force?: boolean) => { ip: string; subnetMask: string; gateway: string; dns: string; serverName: string; poolName: string } | null) | null>;
  manualDhcpClickRef: RefObject<boolean>;
  isDnsEditingRef: RefObject<boolean>;
  isDhcpEditingRef: RefObject<boolean>;

  // Active service sub-tab
  activeServiceTab: any;
  setActiveServiceTab: any;

  // Service state: DNS
  serviceDnsEnabled: boolean;
  setServiceDnsEnabled: (v: boolean) => void;
  serviceDnsRecords: Array<{ domain: string; address: string }>;
  setServiceDnsRecords: (r: Array<{ domain: string; address: string }>) => void;
  dnsFormDomain: string;
  setDnsFormDomain: (v: string) => void;
  dnsFormAddress: string;
  setDnsFormAddress: (v: string) => void;
  handleAddDnsRecord: () => void;
  getDnsRecordDisplay: (record: { domain: string; address: string }) => string;

  // Service state: HTTP
  serviceHttpEnabled: boolean;
  setServiceHttpEnabled: (v: boolean) => void;
  serviceHttpContent: string;
  setServiceHttpContent: (c: string) => void;

  // Service state: FTP
  serviceFtpEnabled: boolean;
  setServiceFtpEnabled: (v: boolean) => void;
  serviceFtpFiles: PcFile[];
  setServiceFtpFiles: (f: PcFile[]) => void;

  // Service state: DHCP
  serviceDhcpEnabled: boolean;
  setServiceDhcpEnabled: (v: boolean) => void;
  serviceDhcpPools: DhcpPoolConfig[];
  setServiceDhcpPools: (p: DhcpPoolConfig[]) => void;
  dhcpForm: any;
  setDhcpForm: any;
  editingDhcpIndex: number | null;
  setEditingDhcpIndex: (i: number | null) => void;

  // Service state: NTP
  serviceNtpEnabled: boolean;
  setServiceNtpEnabled: (v: boolean) => void;
  serviceNtpServer: string;
  setServiceNtpServer: (s: string) => void;
  serviceNtpServerError: string;
  setServiceNtpServerError: (e: string) => void;
  setServiceNtpServerPreset: any;
  serviceNtpDate: string;
  setServiceNtpDate: (d: string) => void;
  serviceNtpTime: string;
  setServiceNtpTime: (t: string) => void;
  applyNtpServerTime: any;
  ntpPanelTime: Date | null;
  ntpSyncState: any;

  // Service state: Mail
  serviceMailEnabled: boolean;
  setServiceMailEnabled: (v: boolean) => void;
  serviceMailDomain: string;
  setServiceMailDomain: (d: string) => void;
  serviceMailUsername: string;
  setServiceMailUsername: (u: string) => void;
  serviceMailPassword: string;
  setServiceMailPassword: (p: string) => void;
  serviceMailInbox: any;
  setServiceMailInbox: any;
  serviceMailSent: any;
  setServiceMailSent: any;
  mailPop3Blocked: boolean;
  handleComposeSend: any;
  handleViewReplySend: any;
  handleDeleteInbox: (index: number) => void;
  handleDeleteSent: (index: number) => void;

  // Service state: Syslog
  serviceSyslogEnabled: boolean;
  setServiceSyslogEnabled: (v: boolean) => void;
  serviceSyslogMessages: SyslogMessage[];
  setServiceSyslogMessages: (m: SyslogMessage[]) => void;

  // Validation
  validateIpField: any;
  validateSubnetField: any;
  isValidIpAddress: (ip: string) => boolean;
  errors: Record<string, string>;
  setErrors: any;

  // Dispatch
  dispatchDeviceConfig: (config: Record<string, unknown>) => void;

  // IoT
  iotDevices: CanvasDevice[];
  selectedIotDeviceId: string;
  setSelectedIotDeviceId: (id: string) => void;
  selectedIotDevice: CanvasDevice | null;
  iotSensorType: 'temperature' | 'sound' | 'motion' | 'humidity' | 'light';
  setIotSensorType: (t: 'temperature' | 'sound' | 'motion' | 'humidity' | 'light') => void;
  iotKind: 'cooler' | 'lamp' | 'heater' | 'sensor';
  setIotKind: (k: 'cooler' | 'lamp' | 'heater' | 'sensor') => void;
  iotCollaborationEnabled: boolean;
  setIotCollaborationEnabled: (e: boolean) => void;
  iotDataStore: string;
  setIotDataStore: (d: string) => void;

  // Browser
  openWebPage: (url: string, target?: string) => void;
  httpAppContent: string | null;
  setHttpAppContent: (c: string | null) => void;
  httpAppUrl: string;
  setHttpAppUrl: (u: string) => void;
  httpAppTitle: string;
  setHttpAppTitle: (t: string) => void;
  httpAppDeviceId: string | null;
  setHttpAppDeviceId: (id: string | null) => void;
  browserWindow: { x: number; y: number; width: number; height: number };
  setBrowserWindow: React.Dispatch<React.SetStateAction<{ x: number; y: number; width: number; height: number }>>;
  filteredSuggestions: string[];
  showUrlSuggestions: boolean;
  setShowUrlSuggestions: (v: boolean) => void;
  selectedSuggestionIndex: number;
  setSelectedSuggestionIndex: (i: number) => void;
  urlInputRef: RefObject<HTMLInputElement | null>;
  dragStateRef: RefObject<{ startX: number; startY: number; originX: number; originY: number } | null>;
  resizeStateRef: RefObject<{ side: string; startX: number; startY: number; originX: number; originY: number; originW: number; originH: number } | null>;
  routerActiveTabRef: RefObject<string>;

  // ARP
  buildArpTableOutput: () => string;
  addPcArpEntry: (ip: string, mac: string, isIot?: boolean) => void;

  // FTP
  isFtpFilePickerOpen: boolean;
  setIsFtpFilePickerOpen: (v: boolean) => void;
  executeFtpPut: (fileName: string) => void | Promise<void>;
  handleFtpSessionCommand: (cmd: string) => void;
  getNtpNow: () => Date | null;

  // Launcher
  launcherApps: any[];

  // Search
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;

  // Misc
  onClose: () => void;
}

export const PCPanelContext = createContext<PCPanelContextValue | null>(null);

export function usePCPanel(): PCPanelContextValue {
  const ctx = useContext(PCPanelContext);
  if (!ctx) throw new Error('usePCPanel must be used within PCPanelProvider');
  return ctx;
}
