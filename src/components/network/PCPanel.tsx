'use client';

import { useState, useRef, useEffect, useCallback, useMemo, type CSSProperties } from 'react';
import { useEnvironment } from '@/lib/store/appStore';
import { SwitchState } from '@/lib/network/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { TerminalOutput } from './Terminal';
import type { CanvasDevice, CanvasConnection } from './networkTopology.types';
import { checkConnectivity, getWirelessSignalStrength, getDeviceWifiConfig } from '@/lib/network/connectivity';
import { dispatchCapturedPackets } from '@/utils/packetCapture';
import { ensureDeviceStatesMap } from '@/lib/network/networkUtils';
import { Laptop, Terminal as TerminalIcon, Globe, Settings, Wifi, Radio } from 'lucide-react';

import { toast } from "@/hooks/use-toast";
import { useOutputSearch } from '@/hooks/useOutputSearch';
import { cn } from "@/lib/utils";
import { ModernPanel } from '@/components/ui/ModernPanel';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { sanitizeHTTPContent } from '@/lib/security/sanitizer';
import { generateRouterAdminPage, isRouterDevice } from '@/components/network/WifiControlPanel';
import { generateIotWebPanelContent } from '@/lib/network/iotWebPanel';
import { errorHandler, STORAGE_ERRORS } from '@/lib/errors/errorHandler';
import { SearchOutputDialog } from './pc-panel/SearchOutputDialog';
import { HiddenNavigationTabs } from './pc-panel/HiddenNavigationTabs';
import { FtpFileTransferDialog } from './pc-panel/FtpFileTransferDialog';
import { HttpBrowserWindow } from './pc-panel/HttpBrowserWindow';
import { HomeLauncher } from './pc-panel/HomeLauncher';
import { PowerOffOverlay } from './pc-panel/PowerOffOverlay';
import { getDefaultPcFiles, getPCConfigDefaults } from './pc-panel/pcPanelFiles';
import { usePCPanelNtp } from './pc-panel/usePCPanelNtp';
import { usePCPanelSync } from './pc-panel/usePCPanelSync';
import { usePCPanelValidation } from './pc-panel/usePCPanelValidation';
import { usePCPanelBrowserState } from './pc-panel/usePCPanelBrowserState';
import { usePCPanelTerminalSync } from './pc-panel/usePCPanelTerminalSync';
import { usePCPanelMail } from './pc-panel/usePCPanelMail';
import { usePCPanelDhcp } from './pc-panel/usePCPanelDhcp';
import { usePCPanelRouterAdmin } from './pc-panel/usePCPanelRouterAdmin';
import { usePCPanelBrowser } from './pc-panel/usePCPanelBrowser';
import { usePCPanelCommands } from './pc-panel/usePCPanelCommands';
import { usePCPanelInput } from './pc-panel/usePCPanelInput';
import { validateIP, validateIPv6, isValidIpAddress, formatMacForArp, highlightText as highlightTextHelper, getInitialPcOutput } from './pc-panel/pcPanelHelpers';
import type { DhcpPoolConfig, FtpSession, OutputLine, PCActiveTab, PCPanelProps, PcFile } from './pc-panel/PCPanel.types';
import { CommandLineTab } from './pc-panel/CommandLineTab';
import { ConsoleTerminalTab } from './pc-panel/ConsoleTerminalTab';
import { IpSettingsTab } from './pc-panel/IpSettingsTab';
import { ServicesTab } from './pc-panel/ServicesTab';
import { WirelessConfigTab } from './pc-panel/WirelessConfigTab';
import { IotDashboardTab } from './pc-panel/IotDashboardTab';
import { PCPanelHeader } from './pc-panel/PCPanelHeader';
import { PCPanelTerminalToolbar } from './pc-panel/PCPanelTerminalToolbar';
import {
  hasGatewayForTarget,
  normalizeLookupTarget,
  resolveDeviceNameTarget,
  resolveDomainWithDnsServices,
  findHttpServerByTarget,
  isDhcpPoolCompatibleForClient
} from './pc-panel/pcBrowser.utils';
import { getConsoleDevice } from './pc-panel/pcTerminal.utils';

export function PCPanel({
  deviceId,
  isVisible,
  initialTab,
  className,
  onClose,
  onTogglePower,
  topologyDevices = [],
  topologyConnections = [],
  deviceStates,
  deviceOutputs,
  pcOutputs,
  setPcOutputs,
  pcHistories,
  onUpdatePCHistory,
  onExecuteDeviceCommand,
  onNavigate,
  onDeleteDevice,
  handleResizeStart
}: PCPanelProps) {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const environment = useEnvironment();

  // Responsive hooks
  const isMobile = useIsMobile();

  // Ref for click-outside detection
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const terminalBg = isDark ? 'bg-black' : 'bg-secondary-50';
  const textColor = isDark ? 'text-secondary-300' : 'text-secondary-700';

  const [activeTab, setActiveTab] = useState<PCActiveTab>(initialTab || 'home');
  const activeTabRef = useRef<PCActiveTab>(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    if (isVisible && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pc-tab-changed', {
        detail: { deviceId, activeTab }
      }));
    }
  }, [activeTab, deviceId, isVisible]);

  const [activeServiceTab, setActiveServiceTab] = useState<'dns' | 'http' | 'dhcp' | 'ftp' | 'mail' | 'ntp'>('dns');
  const tabletHistoryRef = useRef<PCActiveTab[]>(['home']);
  const tabletHistoryIndexRef = useRef(0);
  const isInternalTabletNavRef = useRef(false);
  const mobileVerticalScrollStyle: CSSProperties | undefined = isMobile
    ? {
      overflowY: 'auto' as const,
      WebkitOverflowScrolling: 'touch' as const,
      overscrollBehaviorY: 'contain' as const,
      touchAction: 'pan-y' as const,
    }
    : undefined;

  const goHome = useCallback(() => {
    setActiveTab('home');
    tabletHistoryRef.current = ['home'];
    tabletHistoryIndexRef.current = 0;
    onNavigate?.('home');
  }, [onNavigate]);

  const navigateToProgram = useCallback((program: PCActiveTab) => {
    if (program === 'home') {
      // Going home - pop from history
      if (tabletHistoryIndexRef.current > 0) {
        tabletHistoryIndexRef.current--;
        isInternalTabletNavRef.current = true;
        setActiveTab(tabletHistoryRef.current[tabletHistoryIndexRef.current]);
        onNavigate?.('home');
      } else {
        setActiveTab('home');
        onNavigate?.('home');
      }
    } else {
      // Going to a program - push to history
      tabletHistoryRef.current = tabletHistoryRef.current.slice(0, tabletHistoryIndexRef.current + 1);
      tabletHistoryRef.current.push(program);
      tabletHistoryIndexRef.current = tabletHistoryRef.current.length - 1;
      setActiveTab(program);
      onNavigate?.(program);
    }
  }, [onNavigate]);

  useEffect(() => {
    const handleTabletPopState = (e: CustomEvent) => {
      const { program } = e.detail || {};
      if (program === 'home' && tabletHistoryIndexRef.current > 0) {
        tabletHistoryIndexRef.current--;
        isInternalTabletNavRef.current = true;
        setActiveTab(tabletHistoryRef.current[tabletHistoryIndexRef.current]);
      }
    };
    window.addEventListener('tablet-back', handleTabletPopState as EventListener);
    return () => window.removeEventListener('tablet-back', handleTabletPopState as EventListener);
  }, []);


  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('terminal-font-size') || '13', 10);
    } catch (_err) {
      errorHandler.logError(STORAGE_ERRORS.LOCAL_STORAGE_UNAVAILABLE({ key: 'terminal-font-size', operation: 'read' }));
      return 13;
    }
  });
  const [showCmdSettings, setShowCmdSettings] = useState(false);

  const handleFontSizeChange = (val: number) => {
    setFontSize(val);
    try {
      localStorage.setItem('terminal-font-size', String(val));
    } catch (_err) {
      errorHandler.logError(STORAGE_ERRORS.LOCAL_STORAGE_UNAVAILABLE({ key: 'terminal-font-size', operation: 'write', value: val }));
    }
  };
  const [input, setInput] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteIndex, setAutocompleteIndex] = useState(-1);
  const [autocompleteNavigated, setAutocompleteNavigated] = useState(false);

  // Tab cycle state
  const [tabCycleIndex, setTabCycleIndex] = useState(-1);
  const [lastTabInput, setLastTabInput] = useState('');

  // Console connection state
  const [isConsoleConnected, setIsConsoleConnected] = useState(false);
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);
  const [consoleConnectionTime, setConsoleConnectionTime] = useState<number>(0);

  // FTP session state (interactive ftp> mode on PC desktop)
  const [ftpSession, setFtpSession] = useState<FtpSession | null>(null);
  const [isFtpFilePickerOpen, setIsFtpFilePickerOpen] = useState(false);

  // Local files downloaded via FTP get
  const [pcLocalFiles, setPcLocalFiles] = useState<PcFile[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`pc_files_${deviceId}`);
        if (stored) return JSON.parse(stored);
      } catch (_e) { }
    }
    // First time this PC is used — seed with per-PC default files
    const defaults = getDefaultPcFiles(deviceId);
    try { localStorage.setItem(`pc_files_${deviceId}`, JSON.stringify(defaults)); } catch (_e) { }
    return defaults;
  });

  // Keep desktop CMD and console histories separate.
  const [desktopHistory, setDesktopHistory] = useState<string[]>(() => {
    return pcHistories?.get(deviceId) || [];
  });
  const [desktopHistoryIndex, setDesktopHistoryIndex] = useState(-1);
  const [consoleHistory, setConsoleHistory] = useState<string[]>([]);
  const [consoleHistoryIndex, setConsoleHistoryIndex] = useState(-1);

  // Undo/Redo state
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Load history when component mounts or deviceId changes
  useEffect(() => {
    const globalHistory = pcHistories?.get(deviceId) || [];
    setTimeout(() => setDesktopHistory(globalHistory), 0);
    setTimeout(() => setDesktopHistoryIndex(-1), 0);
  }, [deviceId, pcHistories]);

  // Sync with global history if it changes externally
  useEffect(() => {
    const globalHistory = pcHistories?.get(deviceId) || [];
    setTimeout(() => setDesktopHistory(prevHistory => {
      if (JSON.stringify(globalHistory) !== JSON.stringify(prevHistory)) {
        return globalHistory;
      }
      return prevHistory;
    }), 0);
    setTimeout(() => setDesktopHistoryIndex(-1), 0);
  }, [pcHistories, deviceId]);

  // Reset per-tab command cursor when tab changes.
  useEffect(() => {
    if (activeTab === 'desktop') setTimeout(() => setDesktopHistoryIndex(-1), 0);
    if (activeTab === 'terminal') setTimeout(() => setConsoleHistoryIndex(-1), 0);
  }, [activeTab]);

  const executeCommandRef = useRef<((cmd?: string) => Promise<void>) | null>(null);

  useEffect(() => {
    const handleAutoType = (e: Event) => {
      const { deviceId: eventDeviceId, command } = (e as CustomEvent).detail;
      if (eventDeviceId !== deviceId) return;

      // Switch to CMD/desktop tab
      setActiveTab('desktop');

      let i = 0;
      setInput('');
      const typeInterval = setInterval(() => {
        if (i < command.length) {
          const char = command.charAt(i);
          setInput(prev => prev + char);
          i++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => {
            if (executeCommandRef.current) {
              executeCommandRef.current(command);
            }
          }, 300);
        }
      }, 70);
    };

    window.addEventListener('pc-auto-type', handleAutoType);
    return () => window.removeEventListener('pc-auto-type', handleAutoType);
  }, [deviceId, isVisible]);

  // Get device from topology
  const deviceFromTopology = topologyDevices.find(d => d.id === deviceId);
  const defaultConfig = getPCConfigDefaults(deviceId);
  const isPcPoweredOff = deviceFromTopology?.status === 'offline';
  const wifiSignalStrength = useMemo(
    () => getWirelessSignalStrength(deviceFromTopology, topologyDevices, deviceStates),
    [deviceFromTopology, topologyDevices, deviceStates]
  );

  // Local settings state
  const [pcIP, setPcIP] = useState(deviceFromTopology?.ip || defaultConfig.ip);
  const [internalPcHostname, setInternalPcHostname] = useState(deviceFromTopology?.name || deviceId);

  const setPcHostname = useCallback((hostname: string) => {
    let processedHostname = hostname.trim();
    if (processedHostname.length > 20) {
      processedHostname = processedHostname.substring(0, 20);
    }
    setInternalPcHostname(processedHostname);
  }, []);

  // Hostname initialization only on mount
  useEffect(() => {
    setTimeout(() => setInternalPcHostname(deviceFromTopology?.name || deviceId), 0);
  }, []);

  const [pcMAC, setPcMAC] = useState(deviceFromTopology?.macAddress || defaultConfig.mac);
  const [ipConfigMode, setIpConfigMode] = useState<'static' | 'dhcp'>(deviceFromTopology?.ipConfigMode || 'static');
  const [pcGateway, setPcGateway] = useState(deviceFromTopology?.gateway || '192.168.1.1');
  const [pcDNS, setPcDNS] = useState(deviceFromTopology?.dns || '8.8.8.8');
  const [pcSubnet, setPcSubnet] = useState(deviceFromTopology?.subnet || '255.255.255.0');
  const [pcIPv6, setPcIPv6] = useState(deviceFromTopology?.ipv6 || '2001:db8:acad:1::10');
  const [pcIPv6Prefix, setPcIPv6Prefix] = useState(deviceFromTopology?.ipv6Prefix || '64');
  const [serviceDnsEnabled, setServiceDnsEnabled] = useState(deviceFromTopology?.services?.dns?.enabled ?? false);
  const [serviceDnsRecords, setServiceDnsRecords] = useState<Array<{ domain: string; address: string }>>(
    deviceFromTopology?.services?.dns?.records || []
  );
  const [dnsFormDomain, setDnsFormDomain] = useState('');
  const [dnsFormAddress, setDnsFormAddress] = useState('');

  const handleAddDnsRecord = useCallback(() => {
    isDnsEditingRef.current = true;
    const domain = dnsFormDomain.trim().toLowerCase();
    const address = dnsFormAddress.trim();
    if (!domain || !address) return;
    const newRecords = serviceDnsRecords.filter((r) => r.domain.toLowerCase() !== domain);
    newRecords.push({ domain, address });
    setServiceDnsRecords(newRecords);

    // Get current values from state variables that are defined below
    // Note: Since these are in a closure, we need to be careful with ordering or use refs
    // For now, let's fix the ordering of declarations in this file.

    window.dispatchEvent(new CustomEvent('update-topology-device-config', {
      detail: {
        deviceId,
        config: {
          services: {
            dns: { enabled: serviceDnsEnabled, records: newRecords }
          }
        }
      }
    }));

    setDnsFormDomain('');
    setDnsFormAddress('');
    setTimeout(() => { isDnsEditingRef.current = false; }, 1000);
  }, [dnsFormDomain, dnsFormAddress, serviceDnsRecords, deviceId, serviceDnsEnabled]);

  const [serviceHttpEnabled, setServiceHttpEnabled] = useState(deviceFromTopology?.services?.http?.enabled ?? false);
  const [serviceHttpContent, setServiceHttpContent] = useState(deviceFromTopology?.services?.http?.content || t.helloWorld);
  const [serviceFtpEnabled, setServiceFtpEnabled] = useState(deviceFromTopology?.services?.ftp?.enabled ?? false);

  const [serviceFtpFiles, setServiceFtpFiles] = useState(deviceFromTopology?.services?.ftp?.files || [
    { name: 'readme.txt', size: 1280, modifiedAt: new Date().toISOString() },
  ]);
  const [serviceMailEnabled, setServiceMailEnabled] = useState(deviceFromTopology?.services?.mail?.enabled ?? false);
  const [serviceMailDomain, setServiceMailDomain] = useState(deviceFromTopology?.services?.mail?.domain || 'local.lan');
  const [serviceMailUsername, setServiceMailUsername] = useState(deviceFromTopology?.services?.mail?.username || 'user');
  const [serviceMailPassword, setServiceMailPassword] = useState(deviceFromTopology?.services?.mail?.password || 'mail123');
  const [serviceMailInbox, setServiceMailInbox] = useState<Array<{ from: string; subject: string; body: string; timestamp?: string }>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`mail_inbox_${deviceId}`);
        if (stored) return JSON.parse(stored);
      } catch (_e) { }
    }
    return deviceFromTopology?.services?.mail?.inbox || [];
  });
  const [serviceMailSent, setServiceMailSent] = useState<Array<{ to: string; subject: string; body: string; timestamp?: string }>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`mail_sent_${deviceId}`);
        if (stored) return JSON.parse(stored);
      } catch (_e) { }
    }
    return deviceFromTopology?.services?.mail?.sent || [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`mail_inbox_${deviceId}`, JSON.stringify(serviceMailInbox));
    }
  }, [serviceMailInbox, deviceId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`mail_sent_${deviceId}`, JSON.stringify(serviceMailSent));
    }
  }, [serviceMailSent, deviceId]);
  const mailPop3Blocked = useMemo(() => {
    if (activeServiceTab !== 'mail' || !pcIP) return false;
    const result = checkConnectivity(deviceId, pcIP, topologyDevices, topologyConnections as unknown as CanvasConnection[], deviceStates || new Map(), language as 'tr' | 'en', { protocol: 'tcp', port: '110' });
    return !result.success;
  }, [activeServiceTab, pcIP, deviceId, topologyDevices, topologyConnections, deviceStates, language]);

  const [serviceNtpEnabled, setServiceNtpEnabled] = useState(deviceFromTopology?.services?.ntp?.enabled ?? false);
  const [serviceNtpServer, setServiceNtpServer] = useState(deviceFromTopology?.services?.ntp?.server || '');
  const [serviceNtpServerError, setServiceNtpServerError] = useState('');
  const [, setServiceNtpServerPreset] = useState<'pool.ntp.org' | 'time.google.com' | 'time.cloudflare.com' | 'local-clock' | 'custom'>(
    (deviceFromTopology?.services?.ntp?.server === 'pool.ntp.org'
      ? 'pool.ntp.org'
      : deviceFromTopology?.services?.ntp?.server === 'time.google.com'
        ? 'time.google.com'
        : deviceFromTopology?.services?.ntp?.server === 'time.cloudflare.com'
          ? 'time.cloudflare.com'
          : deviceFromTopology?.services?.ntp?.server === 'local-clock'
            ? 'local-clock'
            : 'custom')
  );
  const [serviceNtpDate, setServiceNtpDate] = useState(deviceFromTopology?.services?.ntp?.date || new Date().toISOString().slice(0, 10));
  const [serviceNtpTime, setServiceNtpTime] = useState(deviceFromTopology?.services?.ntp?.time || new Date().toTimeString().slice(0, 8));
  const [serviceDhcpEnabled, setServiceDhcpEnabled] = useState(deviceFromTopology?.services?.dhcp?.enabled ?? false);
  const [serviceDhcpPools, setServiceDhcpPools] = useState<DhcpPoolConfig[]>(deviceFromTopology?.services?.dhcp?.pools || []);
  const isDhcpEditingRef = useRef(false); // Track if user is actively editing DHCP pools
  const isDnsEditingRef = useRef(false); // Track if user is actively editing DNS records
  const checkDhcpAvailabilityRef = useRef<() => { available: boolean; reason: string }>(() => ({ available: true, reason: '' }));
  const manualDhcpClickRef = useRef(false); // Track if DHCP button was manually clicked to prevent infinite loop
  const pcIpRef = useRef(''); // Track pcIP to detect changes
  const pcSubnetRef = useRef(pcSubnet);
  const pcGatewayRef = useRef(pcGateway);
  const pcDNSRef = useRef(pcDNS);
  const applyDhcpLeaseRef = useRef<((force?: boolean) => { ip: string; subnetMask: string; gateway: string; dns: string; serverName: string; poolName: string } | null) | null>(null);

  // Keep refs in sync with state
  useEffect(() => { pcIpRef.current = pcIP; }, [pcIP]);
  useEffect(() => { pcSubnetRef.current = pcSubnet; }, [pcSubnet]);
  useEffect(() => { pcGatewayRef.current = pcGateway; }, [pcGateway]);
  useEffect(() => { pcDNSRef.current = pcDNS; }, [pcDNS]);
  const [dhcpForm, setDhcpForm] = useState<DhcpPoolConfig>({
    poolName: '',
    defaultGateway: '',
    dnsServer: '',
    startIp: '',
    subnetMask: '255.255.255.0',
    maxUsers: 50,
  });
  const [editingDhcpIndex, setEditingDhcpIndex] = useState<number | null>(null);
  const [wifiEnabled, setWifiEnabled] = useState(deviceFromTopology?.wifi?.enabled ?? false);
  const [wifiSSID, setWifiSSID] = useState(deviceFromTopology?.wifi?.ssid ?? '');
  const [wifiSecurity, setWifiSecurity] = useState(deviceFromTopology?.wifi?.security ?? 'open');
  const [wifiPassword, setWifiPassword] = useState(deviceFromTopology?.wifi?.password ?? '');
  const [wifiChannel, setWifiChannel] = useState(deviceFromTopology?.wifi?.channel ?? '2.4GHz');
  const [wifiBSSID, setWifiBSSID] = useState(deviceFromTopology?.wifi?.bssid ?? '');
  const iotDevices = useMemo(
    () => {
      const allIotDevices = topologyDevices.filter((d) => d.type === 'iot');
      // Filter IoT devices that are reachable from the PC
      return allIotDevices.filter(device => {
        // Check if device has an IP and is in the same subnet or reachable via gateway
        if (device.ip && pcIP && pcSubnet && pcGateway) {
          try {
            const a = pcIP.split('.').map(Number);
            const b = device.ip.split('.').map(Number);
            const m = pcSubnet.split('.').map(Number);
            if (a.length === 4 && b.length === 4 && m.length === 4) {
              let sameSubnet = true;
              for (let i = 0; i < 4; i++) {
                if ((a[i] & m[i]) !== (b[i] & m[i])) {
                  sameSubnet = false;
                  break;
                }
              }
              if (sameSubnet) return true;
            }
          } catch (_err) {
            // Invalid IP format, skip silently - this is expected for malformed IPs
            if (process.env.NODE_ENV === 'development') {
              errorHandler.logError(new Error('IP validation failed'), { deviceId: device.id, ip: device.ip, pcIP, pcSubnet });
            }
          }

          // Check if device is reachable via gateway
          if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(pcGateway.trim())) return true;
        }

        // Check if device is connected via WiFi to the same AP as PC
        if (device.wifi?.enabled && device.wifi?.ssid && wifiEnabled && wifiSSID) {
          if (device.wifi.ssid === wifiSSID) return true;
        }

        // Check if device is connected via cable to the PC or in the same network
        if (topologyConnections.some(c =>
          (c.sourceDeviceId === deviceId && c.targetDeviceId === device.id) ||
          (c.targetDeviceId === deviceId && c.sourceDeviceId === device.id)
        )) {
          return true;
        }

        // Check if device is connected to the same router/AP as PC
        const connectedToSameRouter = topologyConnections.some(c => {
          const otherDeviceId = c.sourceDeviceId === deviceId ? c.targetDeviceId : c.targetDeviceId === deviceId ? c.sourceDeviceId : null;
          if (!otherDeviceId) return false;

          const otherDevice = topologyDevices.find(d => d.id === otherDeviceId);
          if (!otherDevice || (otherDevice.type !== 'router' && otherDevice.type !== 'switchL2' && otherDevice.type !== 'switchL3')) return false;

          // Check if the router/switch is in the PC's network
          if (otherDevice.ip && pcIP && pcSubnet) {
            try {
              const a = pcIP.split('.').map(Number);
              const r = otherDevice.ip.split('.').map(Number);
              const m = pcSubnet.split('.').map(Number);
              if (a.length === 4 && r.length === 4 && m.length === 4) {
                let routerInSameSubnet = true;
                for (let i = 0; i < 4; i++) {
                  if ((a[i] & m[i]) !== (r[i] & m[i])) {
                    routerInSameSubnet = false;
                    break;
                  }
                }
                if (!routerInSameSubnet) return false;
              }
            } catch (_err) {
              // Invalid IP format, skip silently - expected for malformed IPs
              if (process.env.NODE_ENV === 'development') {
                errorHandler.logError(new Error('Router IP validation failed'), { deviceId: otherDevice.id, ip: otherDevice.ip, pcIP, pcSubnet });
              }
            }
          } else if (!otherDevice.ip) {
            // Router has no IP, cannot verify network - skip
            return false;
          }

          return topologyConnections.some(c2 =>
            (c2.sourceDeviceId === otherDeviceId && c2.targetDeviceId === device.id) ||
            (c2.targetDeviceId === otherDeviceId && c2.sourceDeviceId === device.id)
          );
        });

        if (connectedToSameRouter) return true;

        return false;
      });
    },
    [topologyDevices, pcIP, pcSubnet, pcGateway, wifiEnabled, wifiSSID, deviceId, topologyConnections]
  );

  const {
    ntpPanelTime,
    applyNtpServerTime,
    formatFullDateTime,
  } = usePCPanelNtp({
    language,
    deviceId,
    topologyDevices,
    topologyConnections,
    deviceStates,
    serviceNtpEnabled,
    serviceNtpServer,
    serviceNtpDate,
    setServiceNtpDate,
    serviceNtpTime,
    setServiceNtpTime,
    setServiceNtpServerPreset,
    isValidIpAddress,
  });
  const [selectedIotDeviceId, setSelectedIotDeviceId] = useState<string>('');
  const selectedIotDevice = useMemo(
    () => iotDevices.find((d) => d.id === selectedIotDeviceId) || null,
    [iotDevices, selectedIotDeviceId]
  );

  const [iotSensorType, setIotSensorType] = useState<'temperature' | 'sound' | 'motion' | 'humidity' | 'light'>('temperature');
  const [iotKind, setIotKind] = useState<'cooler' | 'lamp' | 'heater' | 'sensor'>('sensor');
  const [iotCollaborationEnabled, setIotCollaborationEnabled] = useState(false);
  const [iotDataStore, setIotDataStore] = useState('');

  // Scan for available APs in the network topology dynamically - returns one entry per AP (allows duplicates)
  const availableSSIDs = useMemo(() => {
    const results: { ssid: string; deviceId: string; deviceName: string; channel?: string }[] = [];
    const addedSSIDs = new Set<string>();

    // First check deviceStates (router/switch/wlc runtime state) - only AP mode
    if (deviceStates) {
      ensureDeviceStatesMap(deviceStates).forEach((state, stateId) => {
        if (stateId === deviceId) return; // skip self
        const stateDevice = topologyDevices.find(d => d.id === stateId);
        // Only router/switch/wlc can be AP, not PC
        if (!stateDevice || (stateDevice.type !== 'router' && stateDevice.type !== 'switchL2' && stateDevice.type !== 'switchL3' && stateDevice.type !== 'wlc')) return;

        // WLC broadcasts SSIDs through wlcWlans state
        if (stateDevice.type === 'wlc' && state.wlcWlans) {
          Object.values(state.wlcWlans).forEach((wlan) => {
            if (wlan.status === 'enabled' && wlan.ssid) {
              const ssidKey = wlan.ssid;
              if (!addedSSIDs.has(ssidKey)) {
                addedSSIDs.add(ssidKey);
                results.push({
                  ssid: wlan.ssid,
                  deviceId: stateId,
                  deviceName: stateDevice?.name || stateId,
                  channel: '2.4GHz',
                });
              }
            }
          });
          return;
        }

        const wlanPort = state.ports['wlan0'];
        const wifiMode = (wlanPort?.wifi?.mode || '').toLowerCase();
        // Only show devices in AP mode
        if (wlanPort && !wlanPort.shutdown && wifiMode === 'ap' && wlanPort.wifi?.ssid) {
          const ssidKey = wlanPort.wifi.ssid;
          if (!addedSSIDs.has(ssidKey)) {
            addedSSIDs.add(ssidKey);
            results.push({
              ssid: wlanPort.wifi.ssid,
              deviceId: stateId,
              deviceName: stateDevice?.name || stateId,
              channel: wlanPort.wifi.channel,
            });
          }
        }
      });
    }
    // Also check topologyDevices for web-admin saved WiFi settings (router/switch only)
    if (results.length === 0) {
      topologyDevices.forEach((device) => {
        if (device.id === deviceId) return;
        // Only router/switch can be AP, not PC
        if (device.type !== 'router' && device.type !== 'switchL2' && device.type !== 'switchL3' && device.type !== 'wlc') return;

        // WLC broadcasts SSIDs through wlcWlans state
        if (device.type === 'wlc') {
          const wlcState = deviceStates ? ensureDeviceStatesMap(deviceStates).get(device.id) : undefined;
          const wlans = wlcState?.wlcWlans || {};
          Object.values(wlans).forEach((wlan) => {
            if (wlan.status === 'enabled' && wlan.ssid) {
              const ssidKey = wlan.ssid;
              if (!addedSSIDs.has(ssidKey)) {
                addedSSIDs.add(ssidKey);
                results.push({
                  ssid: wlan.ssid,
                  deviceId: device.id,
                  deviceName: device.name,
                  channel: '2.4GHz',
                });
              }
            }
          });
          if (device.wifi?.enabled && device.wifi.ssid) {
            const ssidKey = device.wifi.ssid;
            if (!addedSSIDs.has(ssidKey)) {
              addedSSIDs.add(ssidKey);
              results.push({
                ssid: device.wifi.ssid,
                deviceId: device.id,
                deviceName: device.name,
                channel: device.wifi.channel || '2.4GHz',
              });
            }
          }
          return;
        }

        const wifi = device.wifi;
        // Check if WiFi is enabled and in AP mode
        if (wifi?.enabled && wifi.mode === 'ap' && wifi.ssid) {
          const ssidKey = wifi.ssid;
          if (!addedSSIDs.has(ssidKey)) {
            addedSSIDs.add(ssidKey);
            results.push({
              ssid: wifi.ssid,
              deviceId: device.id,
              deviceName: device.name,
              channel: wifi.channel,
            });
          }
        }
      });
    }
    return results;
  }, [deviceStates, deviceId, topologyDevices]);
  const [errors, setErrors] = useState<Record<string, string>>({});


  // Track previous device data to detect external topology updates.
  const prevDeviceIdRef = useRef<string | null>(null);
  const prevDeviceSnapshotRef = useRef<string>('');

  // Reset tracking refs when panel becomes visible to ensure fresh sync
  useEffect(() => {
    if (isVisible) {
      prevDeviceIdRef.current = null;
      prevDeviceSnapshotRef.current = '';
    }
  }, [isVisible]);

  // Refresh local form state when switching devices or when topology data changes externally.
  useEffect(() => {
    const deviceChanged = prevDeviceIdRef.current !== deviceId;
    const nextSnapshot = JSON.stringify({
      name: deviceFromTopology?.name || deviceId,
      macAddress: deviceFromTopology?.macAddress || defaultConfig.mac,
      ipConfigMode: deviceFromTopology?.ipConfigMode || 'static',
      services: deviceFromTopology?.services || null,
      wifi: deviceFromTopology?.wifi || null,
      ip: deviceFromTopology?.ip || defaultConfig.ip,
      subnet: deviceFromTopology?.subnet || '255.255.255.0',
      gateway: deviceFromTopology?.gateway || '192.168.1.1',
      dns: deviceFromTopology?.dns || '8.8.8.8',
      ipv6: deviceFromTopology?.ipv6 || '2001:db8:acad:1::10',
      ipv6Prefix: deviceFromTopology?.ipv6Prefix || '64',
    });
    const deviceSnapshotChanged = prevDeviceSnapshotRef.current !== nextSnapshot;

    if (deviceChanged || prevDeviceIdRef.current === null || deviceSnapshotChanged) {
      prevDeviceIdRef.current = deviceId;
      prevDeviceSnapshotRef.current = nextSnapshot;

      setInternalPcHostname(deviceFromTopology?.name || deviceId);
      setPcMAC(deviceFromTopology?.macAddress || defaultConfig.mac);
      setPcIP(deviceFromTopology?.ip || defaultConfig.ip);
      setPcSubnet(deviceFromTopology?.subnet || '255.255.255.0');
      setPcGateway(deviceFromTopology?.gateway || '192.168.1.1');
      setPcDNS(deviceFromTopology?.dns || '8.8.8.8');
      setPcIPv6(deviceFromTopology?.ipv6 || '2001:db8:acad:1::10');
      setPcIPv6Prefix(deviceFromTopology?.ipv6Prefix || '64');
      setIpConfigMode(deviceFromTopology?.ipConfigMode || 'static');
      setServiceDnsEnabled(deviceFromTopology?.services?.dns?.enabled ?? false);
      setServiceDnsRecords(deviceFromTopology?.services?.dns?.records || []);
      setServiceHttpEnabled(deviceFromTopology?.services?.http?.enabled ?? false);
      setServiceHttpContent(deviceFromTopology?.services?.http?.content || t.helloWorld);
      setServiceFtpEnabled(deviceFromTopology?.services?.ftp?.enabled ?? false);
      setServiceFtpFiles(deviceFromTopology?.services?.ftp?.files || [
        { name: 'readme.txt', size: 1280, modifiedAt: new Date().toISOString() },
      ]);
      setServiceMailEnabled(deviceFromTopology?.services?.mail?.enabled ?? false);
      setServiceMailDomain(deviceFromTopology?.services?.mail?.domain || 'local.lan');
      setServiceMailUsername(deviceFromTopology?.services?.mail?.username || 'user');
      setServiceMailPassword(deviceFromTopology?.services?.mail?.password || 'mail123');

      let inboxFromStorage = null;
      let sentFromStorage = null;
      if (typeof window !== 'undefined') {
        try {
          const storedInbox = localStorage.getItem(`mail_inbox_${deviceId}`);
          if (storedInbox) inboxFromStorage = JSON.parse(storedInbox);
          const storedSent = localStorage.getItem(`mail_sent_${deviceId}`);
          if (storedSent) sentFromStorage = JSON.parse(storedSent);
        } catch (_e) { }
      }
      setServiceMailInbox(inboxFromStorage || deviceFromTopology?.services?.mail?.inbox || []);
      setServiceMailSent(sentFromStorage || deviceFromTopology?.services?.mail?.sent || []);
      setServiceNtpEnabled(deviceFromTopology?.services?.ntp?.enabled ?? false);
      setServiceNtpServer(deviceFromTopology?.services?.ntp?.server || '');
      setServiceNtpServerPreset(
        deviceFromTopology?.services?.ntp?.server === 'pool.ntp.org'
          ? 'pool.ntp.org'
          : deviceFromTopology?.services?.ntp?.server === 'time.google.com'
            ? 'time.google.com'
            : deviceFromTopology?.services?.ntp?.server === 'time.cloudflare.com'
              ? 'time.cloudflare.com'
              : deviceFromTopology?.services?.ntp?.server === 'local-clock'
                ? 'local-clock'
                : 'custom'
      );
      setServiceNtpDate(deviceFromTopology?.services?.ntp?.date || new Date().toISOString().slice(0, 10));
      setServiceNtpTime(deviceFromTopology?.services?.ntp?.time || new Date().toTimeString().slice(0, 8));
      setServiceDhcpEnabled(deviceFromTopology?.services?.dhcp?.enabled ?? false);
      setServiceDhcpPools(deviceFromTopology?.services?.dhcp?.pools || []);

      setDnsFormDomain('');
      setDnsFormAddress('');
      setDhcpForm({
        poolName: '',
        defaultGateway: '',
        dnsServer: '',
        startIp: '',
        subnetMask: '255.255.255.0',
        maxUsers: 50,
      });
      setEditingDhcpIndex(null);
      setWifiEnabled(deviceFromTopology?.wifi?.enabled ?? false);
      setWifiSSID(deviceFromTopology?.wifi?.ssid ?? '');
      setWifiSecurity(deviceFromTopology?.wifi?.security ?? 'open');
      setWifiPassword(deviceFromTopology?.wifi?.password ?? '');
      setWifiChannel(deviceFromTopology?.wifi?.channel ?? '2.4GHz');
      setWifiBSSID(deviceFromTopology?.wifi?.bssid ?? '');
    }
  }, [defaultConfig.ip, defaultConfig.mac, deviceFromTopology, deviceId]);

  useEffect(() => {
    if (!iotDevices.length) {
      setTimeout(() => setSelectedIotDeviceId(''), 0);
      return;
    }
    if (!selectedIotDeviceId || !iotDevices.some((d) => d.id === selectedIotDeviceId)) {
      setTimeout(() => setSelectedIotDeviceId(iotDevices[0].id), 0);
    }
  }, [iotDevices, selectedIotDeviceId]);

  useEffect(() => {
    if (!selectedIotDeviceId) return;
    const device = iotDevices.find((d) => d.id === selectedIotDeviceId);
    if (!device) return;
    // Defer state updates outside the effect to avoid cascading renders
    const timer = setTimeout(() => {
      setIotSensorType(device.iot?.sensorType || 'temperature');
      setIotKind(device.iot?.kind || 'sensor');
      setIotCollaborationEnabled(!!device.iot?.collaborationEnabled);
      setIotDataStore(device.iot?.dataStore || '');
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedIotDeviceId]);

  // When tablet powers on or opens, navigate to initial or home screen
  const initialNavDoneRef = useRef(false);
  useEffect(() => {
    if (isVisible) {
      if (!isPcPoweredOff) {
        const targetTab = initialTab || 'home';
        setTimeout(() => setActiveTab(targetTab), 0);
        tabletHistoryRef.current = [targetTab];
        tabletHistoryIndexRef.current = 0;
        onNavigate?.(targetTab);
        initialNavDoneRef.current = true;
      }
    } else {
      initialNavDoneRef.current = false;
    }
  }, [isVisible, isPcPoweredOff, initialTab, onNavigate]);

  // Validate and sync global state
  

    const { dispatchDeviceConfig, syncToGlobal } = usePCPanelSync({
    deviceId,
    deviceFromTopology,
    topologyDevices,
    internalPcHostname,
    ipConfigMode,
    pcIP,
    pcMAC,
    pcSubnet,
    pcGateway,
    pcDNS,
    pcIPv6,
    pcIPv6Prefix,
    serviceDnsEnabled,
    serviceDnsRecords,
    serviceHttpEnabled,
    serviceHttpContent,
    serviceFtpEnabled,
    serviceFtpFiles,
    serviceMailEnabled,
    serviceMailDomain,
    serviceMailUsername,
    serviceMailPassword,
    serviceMailInbox,
    serviceMailSent,
    serviceNtpEnabled,
    serviceNtpServer,
    serviceNtpDate,
    serviceNtpTime,
    serviceDhcpEnabled,
    serviceDhcpPools,
    wifiEnabled,
    wifiSSID,
    wifiBSSID,
    wifiSecurity,
    wifiPassword,
    wifiChannel,
    setErrors,
    pcIpRef,
    t
  });

    const { validateIpField, validateSubnetField } = usePCPanelValidation({
    deviceId,
    topologyDevices,
    pcSubnet,
    setPcSubnet,
    setErrors,
    dispatchDeviceConfig,
    t
  });

  const saveIotConfig = useCallback((showToast: boolean = true) => {
    if (!selectedIotDeviceId) return;
    // Determine data flow direction based on kind
    const dataFlowDirection: 'input' | 'output' | 'input/output' =
      iotKind === 'sensor' ? 'input' :
        (iotKind === 'cooler' || iotKind === 'lamp' || iotKind === 'heater') ? 'output' : 'input';
    window.dispatchEvent(new CustomEvent('update-topology-device-config', {
      detail: {
        deviceId: selectedIotDeviceId,
        config: {
          iot: {
            ...selectedIotDevice?.iot,
            sensorType: iotSensorType,
            kind: iotKind,
            dataFlowDirection,
            collaborationEnabled: iotCollaborationEnabled,
            dataStore: iotDataStore,
          }
        }
      }
    }));
    if (showToast) {
      toast({
        title: t.iotSaved,
        description: t.iotSavedDescription,
      });
    }
  }, [selectedIotDeviceId, selectedIotDevice, iotSensorType, iotKind, iotCollaborationEnabled, iotDataStore, language]);

  // Keep saveIotConfig in a ref to avoid circular dependency
  const saveIotConfigRef = useRef(saveIotConfig);
  useEffect(() => {
    saveIotConfigRef.current = saveIotConfig;
  }, [saveIotConfig]);

  // Auto-save IoT config on change (debounced) - uses ref to avoid circular dependency
  useEffect(() => {
    if (!selectedIotDeviceId) return;
    const handler = setTimeout(() => {
      saveIotConfigRef.current(false);
    }, 500);
    return () => clearTimeout(handler);
  }, [selectedIotDeviceId, iotSensorType, iotKind, iotCollaborationEnabled, iotDataStore]);

  // Keep syncToGlobal in a ref to avoid circular dependency with topology updates
  const syncToGlobalRef = useRef(syncToGlobal);
  useEffect(() => {
    syncToGlobalRef.current = syncToGlobal;
  }, [syncToGlobal]);

  

  

  const [pcOutput, setPcOutput] = useState<OutputLine[]>(() => {
    if (pcOutputs?.has(deviceId)) {
      return pcOutputs.get(deviceId) as OutputLine[];
    }
    return getInitialPcOutput(deviceFromTopology);
  });
  const [httpAppContent, setHttpAppContent] = useState<string | null>(null);
  const [httpAppUrl, setHttpAppUrl] = useState<string>('');
  const [httpAppTitle, setHttpAppTitle] = useState<string>('HTTP Page');
  const [httpAppDeviceId, setHttpAppDeviceId] = useState<string | null>(null);
  const routerActiveTabRef = useRef<string>('wireless');

  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [showUrlSuggestions, setShowUrlSuggestions] = useState<boolean>(false);

  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if web browser is open
      if (httpAppContent) return;

      const target = event.target as HTMLElement;
      // Don't close if clicking a portal (like Select dropdown, tooltips, etc.) or detached element
      if (
        !target ||
        !document.body.contains(target) ||
        target?.closest('[data-radix-portal]') ||
        target?.closest('[role="listbox"]') ||
        target?.closest('.radix-select-content') ||
        target?.closest('.radix-popper-content') ||
        target?.closest('[data-radix-select-viewport]') ||
        target?.closest('[data-radix-select-content]') ||
        target?.closest('[data-radix-select-trigger]') ||
        target?.closest('[role="combobox"]') ||
        target?.closest('[data-state="open"]') ||
        target?.closest('[role="dialog"]')
      ) {
        return;
      }

      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Add listener with a small delay to avoid immediate trigger
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose, httpAppContent]);

    const { filteredSuggestions, browserWindow, setBrowserWindow } = usePCPanelBrowserState({
    topologyDevices,
    httpAppUrl,
    setHttpAppUrl,
    httpAppContent,
    setHttpAppContent,
    setHttpAppDeviceId,
    inputRef
  });

  // Regenerate IoT panel content when dependencies change
  useEffect(() => {
    if (!httpAppDeviceId && (httpAppUrl === 'iot-panel' || httpAppUrl === 'http://iot-panel')) {
      const iotPanelContent = generateIotWebPanelContent(iotDevices, language, undefined, undefined, topologyConnections as unknown as { sourceDeviceId: string; targetDeviceId: string }[]);
      setTimeout(() => setHttpAppContent(iotPanelContent), 0);
    }
  }, [iotDevices, topologyConnections, language, httpAppUrl, httpAppDeviceId]);
  const dragStateRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const resizeStateRef = useRef<{
    side: 'left' | 'right' | 'bottom' | 'top' | 'se' | 'sw' | 'ne' | 'nw';
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    originW: number;
    originH: number;
  } | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  

  // Global Navigation handler (Escape key & Mobile Back Button)
  useEffect(() => {
    if (!isVisible) return;

    const handleNavigation = () => {
      // If search is open, let it handle itself
      if (searchOpen) return;

      // If HTTP content is open, close it first
      if (httpAppContent) {
        setHttpAppContent(null);
        setHttpAppDeviceId(null);
        return true; // Handled
      }

      // If a program is open, go back to home
      if (activeTab !== 'home') {
        goHome();
        return true; // Handled
      } else {
        // If already on home, close the panel
        onClose();
        return true; // Handled
      }
    };

    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (handleNavigation()) {
          e.preventDefault();
        }
      }
    };

    const handlePopState = (_e: PopStateEvent) => {
      if (handleNavigation()) {
        // Re-push state to prevent browser from actually going back to previous page
        // only if we want to stay in the panel
        if (isVisible) {
          window.history.pushState({ pcPanel: true }, '', window.location.href);
        }
      }
    };

    // Push initial state for back button tracking on mobile
    if (isMobile) {
      window.history.pushState({ pcPanel: true }, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
    }

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      if (isMobile) {
        window.removeEventListener('popstate', handlePopState);
      }
    };
  }, [isVisible, activeTab, goHome, onClose, httpAppContent, searchOpen, isMobile]);

  // Sync pcOutput when deviceId changes or pcOutputs prop updates
  useEffect(() => {
    if (pcOutputs?.has(deviceId)) {
      setTimeout(() => setPcOutput(pcOutputs.get(deviceId) ?? []), 0);
    } else {
      setTimeout(() => setPcOutput([{
        id: '1',
        type: 'output',
        content: 'OS [Version 10.0.26200.8037]\n(c) OS Corporation. All rights reserved.\n'
      }]), 0);
    }
  }, [deviceId, pcOutputs]);

  // Persist CMD output to the shared pcOutputs map so it survives window close
  useEffect(() => {
    if (!setPcOutputs) return;
    setPcOutputs(prev => {
      if (prev.get(deviceId) === pcOutput) return prev;
      return new Map(prev).set(deviceId, pcOutput);
    });
  }, [pcOutput, deviceId, setPcOutputs]);

  // Disconnect console when PC powers off
  useEffect(() => {
    if (isPcPoweredOff && isConsoleConnected) {
      setTimeout(() => setIsConsoleConnected(false), 0);
      setTimeout(() => setConsoleConnectionTime(0), 0);
      // Don't clear connectedDeviceId so we can reconnect when power comes back on
    }
  }, [isPcPoweredOff, isConsoleConnected]);

  // Reconnect console when PC powers on if it was connected before
  useEffect(() => {
    if (!isPcPoweredOff && connectedDeviceId && !isConsoleConnected) {
      // Auto-reconnect to the same device
      const device = topologyDevices.find(d => d.id === connectedDeviceId);
      if (device && device.status !== 'offline') {
        setTimeout(() => setConsoleConnectionTime(Date.now()), 0);
        setTimeout(() => setIsConsoleConnected(true), 0);
      }
    }
  }, [isPcPoweredOff, connectedDeviceId, isConsoleConnected, topologyDevices]);

  const outputRef = useRef<HTMLDivElement>(null);

  const {
    matchIndex: searchMatchIndex,
    matchCount: searchMatchCount,
    goToNext: goToNextMatch,
    goToPrev: goToPrevMatch,
  } = useOutputSearch({ searchQuery, containerRef: outputRef });

  const autocompleteRef = useRef<HTMLDivElement>(null);
  const prevIpConfigModeRef = useRef(ipConfigMode);

  const highlightText = useCallback((text: string) => {
    return highlightTextHelper({ text, searchQuery, isDark });
  }, [searchQuery, isDark]);

  const getConsoleDeviceCallback = useCallback(() => {
    return getConsoleDevice({
      deviceId,
      topologyDevices,
      topologyConnections: topologyConnections as unknown as CanvasConnection[]
    });
  }, [deviceId, topologyConnections, topologyDevices]);

  const consoleDevice = getConsoleDeviceCallback();


    const { activeConsoleOutput, handleCopyAll, getCommandMode, getAutocompleteSuggestionsCallback, renderAutocompleteSuggestions, shouldShowAutocomplete } = usePCPanelTerminalSync({
    isConsoleConnected,
    connectedDeviceId,
    deviceOutputs: deviceOutputs || new Map(),
    consoleConnectionTime,
    activeTab,
    pcOutput,
    t,
    topologyDevices,
    deviceStates: deviceStates || new Map(),
    input,
    showAutocomplete
  });

  // Auto-focus input when visible, tab changes, command completes, or search closes
  useEffect(() => {
    if (!isVisible || searchOpen || (activeTab !== 'desktop' && activeTab !== 'terminal')) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [isVisible, searchOpen, activeTab, pcOutput, activeConsoleOutput]);

  // Always keep CMD/Console views pinned to the latest output
  useEffect(() => {
    if (!outputRef.current) return;
    const el = outputRef.current;
    requestAnimationFrame(() => {
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
  }, [pcOutput, activeConsoleOutput, activeTab]);

  

  const connectedConsoleDevice = useMemo(() => {
    if (!connectedDeviceId) return null;
    return topologyDevices.find(d => d.id === connectedDeviceId) || null;
  }, [connectedDeviceId, topologyDevices]);

  const isConsoleTargetPoweredOff = isConsoleConnected && !!connectedConsoleDevice && connectedConsoleDevice.status === 'offline';
  const isCmdInputDisabled = isPcPoweredOff;
  const consoleAwaitingPassword = !!(connectedDeviceId && deviceStates?.get(connectedDeviceId)?.awaitingPassword);
  const isConsoleInputDisabled = isPcPoweredOff || !isConsoleConnected || isConsoleTargetPoweredOff;

  // Detect password/confirm states from device state
  const consoleNeedsPassword = useMemo(() => {
    if (!isConsoleConnected || !connectedDeviceId) return false;
    const state = deviceStates?.get(connectedDeviceId);
    // Only show password prompt if explicitly awaiting password
    return state?.awaitingPassword === true;
  }, [isConsoleConnected, connectedDeviceId, deviceStates]);

  const consoleReloadPending = false;

  const consoleConfirmDialog = useMemo(() => {
    if (!isConsoleConnected || !connectedDeviceId) return null;
    // Don't show confirm dialog if password is still being entered
    if (consoleNeedsPassword) return null;
    const output = deviceOutputs?.get(connectedDeviceId) || [];
    const confirmLine = output.find((line: TerminalOutput) => line.type === 'output' && /\[confirm\]/i.test(line.content));
    if (confirmLine) {
      return { show: true, message: confirmLine.content };
    }
    return null;
  }, [isConsoleConnected, connectedDeviceId, deviceOutputs, consoleNeedsPassword]);

  // Keep password prompts focused so SSH/Telnet input is immediately usable.
  useEffect(() => {
    if (activeTab !== 'terminal' || !isConsoleConnected) return;
    if (!consoleNeedsPassword && !consoleConfirmDialog?.show && !consoleReloadPending) return;
    const timer = setTimeout(() => {
      if (consoleNeedsPassword) setInput('');
      inputRef.current?.focus();
      inputRef.current?.select?.();
    }, 50);
    return () => clearTimeout(timer);
  }, [activeTab, isConsoleConnected, consoleNeedsPassword, consoleConfirmDialog?.show, consoleReloadPending]);

  

  

  

  
  const httpAppSrcDoc = useMemo(() => {
    if (!httpAppContent) return '';
    const trimmed = httpAppContent.trim();
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
      return httpAppContent;
    }
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; padding: 0; }
      body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; }
    </style>
  </head>
  <body>${httpAppContent}</body>
</html>`;
  }, [httpAppContent]);

  const [consolePasswordAttempted, setConsolePasswordAttempted] = useState(false);

  const consoleAuthenticated = useMemo(() => {
    if (!connectedDeviceId) return true;
    return deviceStates?.get(connectedDeviceId)?.consoleAuthenticated !== false;
  }, [connectedDeviceId, deviceStates]);

  useEffect(() => {
    if (!connectedDeviceId) return;
    if (consolePasswordAttempted && consoleAwaitingPassword) {
      toast({
        title: t.consolePasswordErrorTitle,
        description: t.consolePasswordErrorDescription,
        variant: 'destructive',
      });
      setTimeout(() => setConsolePasswordAttempted(false), 0);
      setTimeout(() => setIsConsoleConnected(false), 0);
      setTimeout(() => setConnectedDeviceId(null), 0);
    } else if (consolePasswordAttempted && !consoleAwaitingPassword && consoleAuthenticated) {
      setTimeout(() => setIsConsoleConnected(true), 0);
      setTimeout(() => setConsolePasswordAttempted(false), 0);
    } else if (consolePasswordAttempted && !consoleAwaitingPassword && !consoleAuthenticated) {
      setTimeout(() => setConsolePasswordAttempted(false), 0);
      setTimeout(() => setIsConsoleConnected(false), 0);
      setTimeout(() => setConnectedDeviceId(null), 0);
    }
  }, [consoleAuthenticated, consoleAwaitingPassword, consolePasswordAttempted, connectedDeviceId, t]);

  const connectionErrorText = useMemo(() => {
    if (!isPcPoweredOff && !isConsoleTargetPoweredOff) return '';
    return t.pcConnectionError;
  }, [isPcPoweredOff, isConsoleTargetPoweredOff, t]);

  const addLocalOutput = useCallback((type: OutputLine['type'], content: string, prompt?: string) => {
    // HTML çıktısını pop-up (modal) içinde aç
    if (type === 'html') {
      const safe = sanitizeHTTPContent(content || '') || ' ';
      const withLineBreaks = safe.replace(/\r?\n/g, '<br />');
      setHttpAppContent(withLineBreaks.trim() ? withLineBreaks : '<em>No HTTP content</em>');
      setHttpAppTitle(t.httpManagementPage);

      // Terminalde bilgilendir
      setPcOutput(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        type: 'success',
        content: t.httpPageOpened
      }]);
      setTimeout(() => {
        if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }, 0);
      return;
    }

    const newLine: OutputLine = { id: Math.random().toString(36).substr(2, 9), type, content, prompt };
    setPcOutput(prev => [...prev, newLine]);
    setTimeout(() => {
      if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }, 0);
  }, [language]);

  // Get connected IoT devices for a router/AP
  const getConnectedIotDevices = useCallback((routerId: string) => {
    const routerDevice = topologyDevices.find(d => d.id === routerId);
    if (!routerDevice) return [];

    const routerSsid = routerDevice.wifi?.ssid || '';
    const routerSecurity = routerDevice.wifi?.security || 'open';

    return topologyDevices
      .filter(d => {
        if (d.type !== 'iot') return false;

        let isWifiConnected = false;
        if (routerSsid) {
          isWifiConnected = d.wifi?.bssid === routerId ||
            (d.wifi?.ssid === routerSsid && d.wifi?.security === routerSecurity);
        }

        const isWiredConnected = topologyConnections.some(c =>
          (c.sourceDeviceId === routerId && c.targetDeviceId === d.id) ||
          (c.targetDeviceId === routerId && c.sourceDeviceId === d.id)
        );

        return isWifiConnected || isWiredConnected;
      })
      .map(d => {
        const isWiredConnected = topologyConnections.some(c =>
          (c.sourceDeviceId === routerId && c.targetDeviceId === d.id) ||
          (c.targetDeviceId === routerId && c.sourceDeviceId === d.id)
        );

        let deviceIp = d.ip;
        if (isWiredConnected && !deviceIp) {
          const routerIp = routerDevice?.ip || '192.168.1.1';
          const baseIpParts = routerIp.split('.');
          const usedIps = new Set<string>();
          topologyDevices.forEach(td => {
            if (td.ip && td.ip.startsWith(baseIpParts[0] + '.' + baseIpParts[1] + '.' + baseIpParts[2])) {
              usedIps.add(td.ip);
            }
          });
          for (let i = 100; i <= 254; i++) {
            const testIp = `${baseIpParts[0]}.${baseIpParts[1]}.${baseIpParts[2]}.${i}`;
            if (!usedIps.has(testIp)) {
              deviceIp = testIp;
              break;
            }
          }
          if (!deviceIp) deviceIp = `${baseIpParts[0]}.${baseIpParts[1]}.${baseIpParts[2]}.150`;

          // Assign IP asynchronously to avoid state mutation during render
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('update-topology-device-config', {
              detail: {
                deviceId: d.id,
                config: {
                  ip: deviceIp,
                  ipConfigMode: 'dhcp',
                  gateway: routerIp,
                  subnet: routerDevice?.subnet || '255.255.255.0',
                  dns: routerIp,
                },
              },
            }));
          }, 0);
        }

        return {
          id: d.id,
          name: d.name,
          sensorType: d.iot?.sensorType || 'temperature',
          connected: !!(isWiredConnected || (d.status === 'online' && d.wifi?.enabled)),
          ip: deviceIp,
          isWired: isWiredConnected,
        };
      });
  }, [topologyDevices, topologyConnections]);

  // Get available IoT devices that can be connected (not connected to this AP)
  const getAvailableIotDevices = useCallback((routerId: string) => {
    const routerDevice = topologyDevices.find(d => d.id === routerId);
    if (!routerDevice) return [];

    const routerSsid = routerDevice.wifi?.ssid || '';

    return topologyDevices
      .filter(d => {
        if (d.type !== 'iot') return false;

        const isWiredConnected = topologyConnections.some(c =>
          (c.sourceDeviceId === routerId && c.targetDeviceId === d.id) ||
          (c.targetDeviceId === routerId && c.sourceDeviceId === d.id)
        );

        if (isWiredConnected) return false;

        if (!routerSsid) return true;
        const isConnectedToThisAp = d.wifi?.bssid === routerId || d.wifi?.ssid === routerSsid;
        return !isConnectedToThisAp;
      })
      .map(d => ({
        id: d.id,
        name: d.name,
        sensorType: d.iot?.sensorType || 'temperature',
        currentSsid: d.wifi?.ssid || undefined,
      }));
  }, [topologyDevices, topologyConnections]);

  const canReachTargetIp = useCallback((targetIp: string, options: { protocol?: 'tcp' | 'udp' | 'icmp' | 'any'; port?: string } = { protocol: 'icmp' }) => {
    const result = checkConnectivity(deviceId, targetIp, topologyDevices, topologyConnections as unknown as CanvasConnection[], deviceStates || new Map(), language as 'tr' | 'en', options);

    // Global packet capture integration
    dispatchCapturedPackets(result.capturedPackets);

    return result.success;
  }, [deviceId, topologyDevices, topologyConnections, deviceStates, language]);

  const isValidIpv4 = useCallback((value: string) => validateIP(value), []);
  const isValidIpv6 = useCallback((value: string) => validateIPv6(value), []);

  const isDhcpPoolCompatibleForClientCallback = useCallback((
    poolGateway: string,
    poolStartIp: string,
    poolSubnetMask: string,
    serverDevice: CanvasDevice | undefined,
    serverState?: SwitchState
  ) => {
    return isDhcpPoolCompatibleForClient({
      poolGateway,
      poolStartIp,
      poolSubnetMask,
      serverDevice,
      serverState,
      clientDevice: deviceFromTopology,
      deviceStates,
      topologyConnections: topologyConnections as unknown as CanvasConnection[],
      isValidIpv4,
      getDeviceWifiConfig,
    });
  }, [deviceFromTopology, deviceStates, topologyConnections, isValidIpv4]);

  const isLoopbackTarget = useCallback((target: string) => target.trim() === '127.0.0.1', []);

  const hasGatewayForTargetCallback = useCallback((targetIp: string) => {
    return hasGatewayForTarget({
      pcIP,
      targetIp,
      pcSubnet,
      pcGateway,
      isValidIpv4
    });
  }, [pcGateway, pcIP, pcSubnet, isValidIpv4]);

  const normalizeLookupTargetCallback = useCallback((raw: string) => {
    return normalizeLookupTarget(raw);
  }, []);

  const resolveDeviceNameTargetCallback = useCallback((raw: string) => {
    return resolveDeviceNameTarget({
      raw,
      internalPcHostname,
      deviceId,
      topologyDevices,
      deviceStates,
      isValidIpv4
    });
  }, [deviceId, deviceStates, internalPcHostname, isValidIpv4, topologyDevices]);

  const resolveDomainWithDnsServicesCallback = useCallback((domain: string) => {
    return resolveDomainWithDnsServices({
      domain,
      pcDNS,
      topologyDevices,
      deviceStates,
      canReachTargetIp,
      isValidIpv4,
      isValidIpv6
    });
  }, [canReachTargetIp, isValidIpv4, isValidIpv6, pcDNS, topologyDevices, deviceStates]);

  const getDnsRecordDisplay = useCallback((record: { domain: string; address: string }) => {
    const chain: string[] = [record.domain, record.address.trim()];
    const startAddress = record.address.trim().toLowerCase();
    const isIp = !startAddress || isValidIpv4(startAddress) || isValidIpv6(startAddress);
    const recordType = isIp
      ? (isValidIpv6(startAddress)
        ? (language === 'tr' ? 'AAAA Kaydı (IPv6 Address)' : 'AAAA Record (IPv6 Address)')
        : (language === 'tr' ? 'A Kaydı (Address Record)' : 'A Record (Address Record)'))
      : (language === 'tr' ? 'CNAME Kaydı (Canonical Name Record)' : 'CNAME Record (Canonical Name Record)');
    if (isIp) {
      return `${recordType}: ${chain.join(' -> ')}`;
    }

    const visited = new Set<string>([record.domain.toLowerCase(), startAddress]);
    let currentDomain = startAddress;

    for (let depth = 0; depth < 10; depth += 1) {
      const nextRecord = serviceDnsRecords.find((r) => r.domain.toLowerCase() === currentDomain);
      if (!nextRecord) break;

      const nextAddress = nextRecord.address.trim();
      if (!nextAddress) break;
      chain.push(nextAddress);

      const normalizedNext = nextAddress.toLowerCase();
      if (isValidIpv4(normalizedNext) || isValidIpv6(normalizedNext)) break;
      if (visited.has(normalizedNext)) break;

      visited.add(normalizedNext);
      currentDomain = normalizedNext;
    }

    return `${recordType}: ${chain.join(' -> ')}`;
  }, [isValidIpv4, isValidIpv6, language, serviceDnsRecords]);

  const findHttpServerByTargetCallback = useCallback((target: string) => {
    return findHttpServerByTarget({
      target,
      deviceId,
      topologyDevices,
      deviceStates,
      canReachTargetIp,
      resolveDomainWithDnsServices: resolveDomainWithDnsServicesCallback,
    });
  }, [canReachTargetIp, resolveDomainWithDnsServicesCallback, topologyDevices, deviceStates, deviceId]);

  // NOTE: usePCPanelBrowser is called below, after addPcArpEntry is defined,
  // so that addPcArpEntry can be passed as a prop for ARP updates on curl/wget.
  // (See the usePCPanelBrowser call site further below.)


  // NOTE: usePCPanelRouterAdmin is also moved below (depends on openWebPage).
  // Placeholder to preserve code structure — see call sites below.

  useEffect(() => {
    if (!httpAppContent || !isMobile || typeof window === 'undefined') return;
    setTimeout(() => setBrowserWindow((prev) => ({
      ...prev,
      x: 8,
      y: Math.max(80, prev.y),
      width: Math.max(280, window.innerWidth - 16),
    })), 0);
  }, [httpAppContent, isMobile]);

  useEffect(() => {
    if (!httpAppDeviceId) return;
    const targetDevice = topologyDevices.find((d) => d.id === httpAppDeviceId);
    if (!targetDevice || !isRouterDevice(targetDevice)) return;

    const runtimeState = deviceStates?.get(httpAppDeviceId);
    const connectedIot = getConnectedIotDevices(httpAppDeviceId);
    const availableIot = getAvailableIotDevices(httpAppDeviceId);
    const refreshed = generateRouterAdminPage(targetDevice, language, runtimeState, connectedIot, availableIot, undefined, undefined, routerActiveTabRef.current);
    setHttpAppContent(refreshed);
  }, [httpAppDeviceId, topologyDevices, deviceStates, getConnectedIotDevices, getAvailableIotDevices]);

  // Dragging and resizing is handled entirely by HttpBrowserWindow.tsx via direct DOM updates

  // Add multi-line output with delay between each line for realistic typing effect
  const addMultilineOutput = useCallback(async (type: OutputLine['type'], content: string, delayMs: number = 50) => {
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isLast = i === lines.length - 1;

      const newLine: OutputLine = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        content: line,
        prompt: i === 0 ? undefined : '' // Empty prompt for continuation lines
      };

      setPcOutput(prev => [...prev, newLine]);

      // Scroll after each line
      setTimeout(() => {
        if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }, 0);

      // Wait before next line (except for last)
      if (!isLast && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }, []);

  const hasPhysicalPathToDevice = useCallback((targetDeviceId: string) => {
    if (!targetDeviceId || targetDeviceId === deviceId) return false;
    const sourceDevice = topologyDevices.find((d) => d.id === deviceId);
    const targetDevice = topologyDevices.find((d) => d.id === targetDeviceId);
    if (!sourceDevice || !targetDevice) return false;
    if (sourceDevice.status === 'offline' || targetDevice.status === 'offline') return false;

    // DHCP discover can also traverse an implicit Wi-Fi link.
    const sourceWifi = getDeviceWifiConfig(sourceDevice, deviceStates);
    const targetWifi = getDeviceWifiConfig(targetDevice, deviceStates);
    const safeStates = ensureDeviceStatesMap(deviceStates);
    const targetState = safeStates.get(targetDeviceId);

    const isTargetApMatching = (() => {
      if (!sourceWifi?.ssid) return false;
      const targetSsid = sourceWifi.ssid.toLowerCase();

      // Check standard AP wifi
      if (targetWifi?.enabled && targetWifi.mode === 'ap' && targetWifi.ssid && targetWifi.ssid.toLowerCase() === targetSsid) {
        return true;
      }

      // Check WLC centralized WLANs
      if (targetDevice.type === 'wlc' && targetState?.wlcWlans) {
        const wlan = Object.values(targetState.wlcWlans).find(
          w => w.status === 'enabled' && w.ssid?.toLowerCase() === targetSsid
        );
        if (wlan) return true;
      }

      return false;
    })();

    if (
      sourceDevice.type === 'pc' &&
      sourceWifi?.enabled &&
      (sourceWifi.mode === 'client' || sourceWifi.mode === 'sta') &&
      isTargetApMatching &&
      getWirelessSignalStrength(sourceDevice, topologyDevices, deviceStates) > 0
    ) {
      return true;
    }

    const queue: string[] = [deviceId];
    const visited = new Set<string>([deviceId]);

    while (queue.length > 0) {
      const current = queue.shift() as string;
      if (current === targetDeviceId) return true;

      const neighbors = topologyConnections
        .filter((c) => c.active !== false && (c.sourceDeviceId === current || c.targetDeviceId === current))
        .map((c) => (c.sourceDeviceId === current ? c.targetDeviceId : c.sourceDeviceId));

      for (const next of neighbors) {
        if (visited.has(next)) continue;
        const nextDevice = topologyDevices.find((d) => d.id === next);
        if (!nextDevice || nextDevice.status === 'offline') continue;
        visited.add(next);
        queue.push(next);
      }
    }

    return false;
  }, [deviceId, topologyConnections, topologyDevices, deviceStates]);







  // PC ARP Table state - synced via localStorage and custom event so topology right-click ping also updates it
  const [pcArpTable, setPcArpTable] = useState<Array<{ ip: string; mac: string; type: string }>>(() => {
    try {
      const saved = localStorage.getItem(`pc_arp_${deviceId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addPcArpEntry = useCallback((targetIp: string, targetMac: string, isIot = false) => {
    setPcArpTable((prev) => {
      const formattedMac = formatMacForArp(targetMac);
      const exists = prev.find((e) => e.ip === targetIp);
      let updated: Array<{ ip: string; mac: string; type: string }>;
      if (exists) {
        if (exists.mac === formattedMac) return prev;
        updated = prev.map((e) => (e.ip === targetIp ? { ...e, mac: formattedMac } : e));
      } else {
        updated = [...prev, { ip: targetIp, mac: formattedMac, type: isIot ? 'dynamic (IoT)' : 'dynamic' }];
      }
      try {
        localStorage.setItem(`pc_arp_${deviceId}`, JSON.stringify(updated));
      } catch { /* ignore */ }
      return updated;
    });
  }, [deviceId, formatMacForArp]);

  const clearPcArpTable = useCallback(() => {
    setPcArpTable([]);
    try {
      localStorage.removeItem(`pc_arp_${deviceId}`);
    } catch { /* ignore */ }
  }, [deviceId]);

  // Listen for ARP update events from right-click ping or other global ping actions
  useEffect(() => {
    const handleArpUpdate = (e: CustomEvent<{ sourceId: string; targetIp: string; targetMac: string; isIot?: boolean }>) => {
      if (e.detail?.sourceId === deviceId && e.detail?.targetIp && e.detail?.targetMac) {
        addPcArpEntry(e.detail.targetIp, e.detail.targetMac, e.detail.isIot);
      }
    };
    window.addEventListener('pc-arp-entry-added', handleArpUpdate as EventListener);
    return () => window.removeEventListener('pc-arp-entry-added', handleArpUpdate as EventListener);
  }, [deviceId, addPcArpEntry]);

  const buildArpTableOutput = useCallback(() => {
    if (pcArpTable.length === 0) {
      return `Interface: ${pcIP} --- 0x3\n  Internet Address      Physical Address      Type\n  No ARP Entries Found.`;
    }

    const rows = pcArpTable
      .map((h) => `  ${h.ip.padEnd(20)} ${h.mac.padEnd(21)} ${h.type}`)
      .join('\n');

    return `Interface: ${pcIP} --- 0x3\n  Internet Address      Physical Address      Type\n${rows}`;
  }, [pcArpTable, pcIP]);

  // usePCPanelBrowser and usePCPanelRouterAdmin are called here (after addPcArpEntry)
  // so that addPcArpEntry can be passed for ARP updates on curl/wget HTTP connections.
  const { openWebPage } = usePCPanelBrowser({
    language,
    deviceId,
    pcDNS,
    pcIPv6,
    topologyDevices,
    topologyConnections,
    deviceStates,
    iotDevices,
    httpAppDeviceId,
    setHttpAppUrl,
    setHttpAppContent,
    setHttpAppTitle,
    setHttpAppDeviceId,
    addLocalOutput,
    normalizeLookupTargetCallback,
    resolveDeviceNameTargetCallback,
    hasGatewayForTargetCallback,
    isLoopbackTarget,
    isValidIpv4,
    isValidIpv6,
    findHttpServerByTargetCallback,
    getConnectedIotDevices,
    getAvailableIotDevices,
    addPcArpEntry,
    t,
  });

  usePCPanelRouterAdmin({
    language,
    httpAppDeviceId,
    setHttpAppDeviceId,
    setHttpAppContent,
    routerActiveTabRef,
    topologyDevices,
    topologyConnections: topologyConnections as CanvasConnection[],
    deviceStates,
    getConnectedIotDevices,
    getAvailableIotDevices,
    openWebPage,
    addLocalOutput,
    onDeleteDevice,
  });

  const {
    getDhcpLease: _getDhcpLease,
    checkDhcpAvailability: _checkDhcpAvailability,
    applyDhcpLease: _applyDhcpLease,
  } = usePCPanelDhcp({
    language,
    deviceId,
    topologyDevices,
    topologyConnections,
    deviceStates,
    ipConfigMode,
    pcIP,
    pcIpRef,
    pcSubnetRef,
    pcGatewayRef,
    pcDNSRef,
    setPcIP,
    setPcSubnet,
    setPcGateway,
    setPcDNS,
    validateIP,
    hasPhysicalPathToDevice,
    canReachTargetIp,
    isDhcpPoolCompatibleForClientCallback,
    checkDhcpAvailabilityRef,
    applyDhcpLeaseRef,
    manualDhcpClickRef,
    prevIpConfigModeRef,
    addLocalOutput,
    toast,
    t,
  });

  const handleConnect = async () => {
    if (!consoleDevice) return;

    // Clear previous console output before connecting
    setPcOutput([]);

    setConnectedDeviceId(consoleDevice.id);
    setConsoleConnectionTime(Date.now());
    if (onExecuteDeviceCommand) {
      await onExecuteDeviceCommand(consoleDevice.id, '__CONSOLE_CONNECT__');
      const deviceState = deviceStates?.get(consoleDevice.id);
      if (!deviceState?.awaitingPassword) {
        setIsConsoleConnected(true);
      }
    } else {
      setIsConsoleConnected(true);
    }
  };

  // executeFtpPut and handleFtpSessionCommand moved to usePCPanelCommands hook



  const {
    executeCommand,
    executeFtpPut,
    handleFtpSessionCommand,
  } = usePCPanelCommands({
    activeTabRef,
    applyDhcpLeaseRef,
    input,
    desktopHistory,
    setDesktopHistory,
    setDesktopHistoryIndex,
    consoleHistory,
    setConsoleHistory,
    setConsoleHistoryIndex,
    setInput,
    setShowAutocomplete,
    setAutocompleteIndex,
    setAutocompleteNavigated,
    ftpSession,
    setFtpSession,
    pcLocalFiles,
    setPcLocalFiles,
    setIsFtpFilePickerOpen,
    pcIP,
    setPcIP,
    pcSubnet,
    pcMAC,
    pcGateway,
    pcDNS,
    pcIPv6,
    internalPcHostname,
    ipConfigMode,
    deviceId,
    language,
    t,
    topologyDevices,
    topologyConnections,
    deviceStates,
    deviceFromTopology,
    isCmdInputDisabled,
    isConsoleInputDisabled,
    connectionErrorText,
    isConsoleConnected,
    connectedDeviceId,
    setConnectedDeviceId,
    setConsoleConnectionTime,
    setIsConsoleConnected,
    wifiEnabled,
    consoleNeedsPassword,
    consoleConfirmDialog,
    consoleReloadPending,
    serviceHttpEnabled,
    serviceDnsEnabled,
    serviceDhcpEnabled,
    onUpdatePCHistory,
    onExecuteDeviceCommand,
    onNavigate,
    onClose,
    setActiveTab,
    setPcOutput,
    addLocalOutput,
    addMultilineOutput,
    resolveDeviceNameTargetCallback,
    resolveDomainWithDnsServicesCallback,
    hasGatewayForTargetCallback,
    isLoopbackTarget,
    isValidIpv4,
    isValidIpv6,
    canReachTargetIp,
    normalizeLookupTargetCallback,
    buildArpTableOutput,
    addPcArpEntry,
    clearPcArpTable,
    openWebPage,
    setPcHostname,
  });

  const {
    completeAutocompleteSelection,
    handleInputChange,
    handleKeyDown,
  } = usePCPanelInput({
    input,
    setInput,
    activeTab,
    tabCycleIndex,
    setTabCycleIndex,
    lastTabInput,
    setLastTabInput,
    undoStack,
    setUndoStack,
    redoStack,
    setRedoStack,
    showAutocomplete,
    setShowAutocomplete,
    autocompleteIndex,
    setAutocompleteIndex,
    autocompleteNavigated,
    setAutocompleteNavigated,
    setSearchOpen,
    autocompleteRef,
    getCommandMode,
    executeCommand,
    getAutocompleteSuggestionsCallback,
    isConsoleConnected,
    consoleNeedsPassword,
    consoleConfirmDialog,
    consoleReloadPending,
    connectedDeviceId,
    onExecuteDeviceCommand,
    setConsolePasswordAttempted,
    setIsConsoleConnected,
    setConnectedDeviceId,
    desktopHistory,
    desktopHistoryIndex,
    setDesktopHistoryIndex,
    consoleHistory,
    consoleHistoryIndex,
    setConsoleHistoryIndex,
    setPcOutput,
    setConsoleConnectionTime,
    renderAutocompleteSuggestions,
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };
  const launcherApps = useMemo(() => [
    {
      tab: 'desktop' as const,
      label: 'CMD',
      subtitle: language === 'tr' ? 'Komut İstemi' : 'Command Prompt',
      icon: TerminalIcon,
      accent: isDark ? 'from-primary-500 to-accent-400' : 'from-primary-600 to-accent-500',
      buttonClass: isDark ? 'text-primary-300 border-primary-400/20 bg-primary-500/10' : 'text-primary-700 border-primary-200 bg-primary-50/90',
    },
    {
      tab: 'terminal' as const,
      label: language === 'tr' ? 'Konsol' : 'Console',
      subtitle: language === 'tr' ? 'Cihaza seri bağlan' : 'Serial device access',
      icon: Laptop,
      accent: isDark ? 'from-success-500 to-accent-400' : 'from-success-600 to-accent-500',
      buttonClass: isDark ? 'text-success-300 border-success-400/20 bg-success-500/10' : 'text-success-700 border-success-200 bg-success-50/90',
    },
    {
      tab: 'wireless' as const,
      label: language === 'tr' ? 'Kablosuz' : 'Wireless',
      subtitle: language === 'tr' ? 'Wi-Fi bilgisi' : 'Wi-Fi overview',
      icon: Wifi,
      accent: isDark ? 'from-accent-500 to-accent-400' : 'from-accent-600 to-accent-500',
      buttonClass: isDark ? 'text-accent-300 border-accent-400/20 bg-accent-500/10' : 'text-accent-700 border-accent-200 bg-accent-50/90',
    },
    {
      tab: 'settings' as const,
      label: language === 'tr' ? 'Ayarlar' : 'Settings',
      subtitle: language === 'tr' ? 'PC yapılandırması' : 'PC configuration',
      icon: Settings,
      accent: isDark ? 'from-purple-500 to-pink-400' : 'from-purple-600 to-pink-500',
      buttonClass: isDark ? 'text-purple-300 border-purple-400/20 bg-purple-500/10' : 'text-purple-700 border-purple-200 bg-purple-50/90',
    },
    {
      tab: 'services' as const,
      label: language === 'tr' ? 'Servisler' : 'Services',
      subtitle: language === 'tr' ? 'HTTP, DNS, DHCP' : 'HTTP, DNS, DHCP',
      icon: Globe,
      accent: isDark ? 'from-warning-500 to-warning-400' : 'from-warning-600 to-warning-500',
      buttonClass: isDark ? 'text-warning-300 border-warning-400/20 bg-warning-500/10' : 'text-warning-700 border-warning-200 bg-warning-50/90',
    },
    {
      tab: 'iot' as const,
      label: 'IoT',
      subtitle: language === 'tr' ? 'Sensör ağı' : 'Sensor network',
      icon: Radio,
      accent: isDark ? 'from-accent-500 to-primary-400' : 'from-accent-600 to-primary-500',
      buttonClass: isDark ? 'text-accent-300 border-accent-400/20 bg-accent-500/10' : 'text-accent-700 border-accent-200 bg-accent-50/90',
    },
  ], [language, isDark]);


  const {
    handleComposeSend,
    handleViewReplySend,
    handleDeleteInbox,
    handleDeleteSent,
  } = usePCPanelMail({
    language,
    deviceId,
    deviceFromTopology,
    topologyDevices,
    topologyConnections,
    deviceStates,
    pcIP,
    serviceMailDomain,
    serviceMailUsername,
    serviceMailEnabled,
    serviceMailPassword,
    serviceMailInbox,
    setServiceMailInbox,
    serviceMailSent,
    setServiceMailSent,
    serviceDnsEnabled,
    serviceDnsRecords,
    serviceHttpEnabled,
    serviceHttpContent,
    serviceFtpEnabled,
    serviceDhcpEnabled,
    serviceDhcpPools,
    dispatchDeviceConfig,
    addLocalOutput,
    addPcArpEntry,
  });
  useEffect(() => {
    executeCommandRef.current = executeCommand;
  }, [executeCommand]);

  if (!isVisible) return null;

  return (
    <>
      <div
        ref={panelRef}
        className={cn(
          "relative w-full h-full min-h-0 flex flex-col overflow-hidden",
          className
        )}
      >
        <PCPanelHeader
          isDark={isDark}
          internalPcHostname={internalPcHostname}
          pcIP={pcIP}
          activeTab={activeTab}
          language={language}
          isPcPoweredOff={isPcPoweredOff}
          wifiSignalStrength={wifiSignalStrength}
          showCmdSettings={showCmdSettings}
          isMobile={isMobile}
          ntpPanelTime={ntpPanelTime}
          t={t}
          deviceId={deviceId}
          onGoHome={goHome}
          onNavigateToProgram={navigateToProgram}
          onToggleShowCmdSettings={() => setShowCmdSettings(prev => !prev)}
          onTogglePower={onTogglePower}
          onClose={onClose}
          openWebPage={openWebPage}
          formatTime={formatTime}
          formatFullDateTime={formatFullDateTime}
        />

        <div className="flex-1 min-h-0 px-2 pb-2 md:px-2 md:pb-2">
          <div className="mx-auto flex h-full min-h-0 w-full max-w-[1500px] items-center justify-center overflow-hidden">
            <div
              className={cn(
                "relative flex h-full min-h-0 w-full flex-col overflow-hidden shadow-[0_15px_50px_rgba(15,23,42,0.1)]",
                isMobile
                  ? (isDark
                    ? "max-w-[430px] rounded-[2.5rem] border-[10px] border-secondary-950 bg-transparent"
                    : "max-w-[430px] rounded-[2.5rem] border-[10px] border-secondary-200 bg-transparent")
                  : (isDark
                    ? "rounded-[2rem] border border-white/10 bg-transparent"
                    : "rounded-[2rem] border border-white/70 bg-transparent")
              )}
            >
              <div className={cn(
                "relative flex-1 min-h-0 flex flex-col overflow-hidden",
                isDark
                  ? 'bg-[linear-gradient(180deg,#020617_0%,#0f172a_45%,#111827_100%)]'
                  : 'bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_55%,#dbeafe_100%)]'
              )}>
                <div className="pointer-events-none absolute inset-0">
                </div>
                <ModernPanel
                  id={deviceId}
                  title={internalPcHostname}
                  onClose={onClose}
                  collapsible={!isMobile}
                  hideTitle={(activeTab === 'desktop' || activeTab === 'terminal') ? false : true}
                  hideHeader={(activeTab === 'desktop' || activeTab === 'terminal') ? false : true}
                  headerAction={<PCPanelTerminalToolbar
                    activeTab={activeTab}
                    isDark={isDark}
                    t={t}
                    isMobile={isMobile}
                    language={language}
                    showCmdSettings={showCmdSettings}
                    onSearchOpen={() => setSearchOpen(true)}
                    onCopyAll={handleCopyAll}
                    onToggleCmdSettings={() => setShowCmdSettings(!showCmdSettings)}
                  />}
                  showHeaderOnMobile
                  noPadding
                  style={{ height: '100%' }}
                  className="w-full min-w-0 h-full flex flex-col relative bg-transparent border-none shadow-none"
                >
                  {/* Power Off Overlay - Mobile/Desktop ekranını tamamen karartır */}
                  {isPcPoweredOff && <PowerOffOverlay />}
                  <div className="bg-transparent flex-1 min-h-0 flex flex-col">

                    <SearchOutputDialog
                      open={searchOpen}
                      onOpenChange={setSearchOpen}
                      isDark={isDark}
                      labels={{
                        searchOutputTitle: t.searchOutputTitle,
                        searchOutputDescription: t.searchOutputDescription,
                        searchPlaceholder: t.searchPlaceholder,
                        close: t.close,
                        noResultsFound: t.noResultsFound,
                      }}
                      searchQuery={searchQuery}
                      onSearchQueryChange={setSearchQuery}
                      onNext={goToNextMatch}
                      onPrev={goToPrevMatch}
                      matchIndex={searchMatchIndex}
                      matchCount={searchMatchCount}
                    />

                    {/* Navigation Tabs - Hide on mobile, use main app tabs */}
                    <HiddenNavigationTabs
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      isMobile={isMobile}
                      language={language}
                      httpAppContent={httpAppContent}
                      httpAppDeviceId={httpAppDeviceId}
                      openWebPage={openWebPage}
                      labels={{
                        commandPromptTab: t.commandPromptTab,
                        consoleTab: t.consoleTab,
                        settingsTab: t.settingsTab,
                        servicesTab: t.servicesTab,
                      }}
                    />

                    {/* Content Area */}
                    <div className={cn(
                      "relative z-10 flex-1 min-h-0 flex flex-col overflow-hidden",
                      "p-[5px]",
                      isMobile ? "mx-[10px]" : "" // Add horizontal margin for mobile
                    )}>
                      {activeTab === 'home' && !isPcPoweredOff && (
                        <HomeLauncher
                          apps={launcherApps}
                          isDark={isDark}
                          isPoweredOff={isPcPoweredOff}
                          mobileVerticalScrollStyle={mobileVerticalScrollStyle}
                          onNavigate={navigateToProgram}
                        />
                      )}

                      {activeTab === 'desktop' && (
                        <CommandLineTab
                          isDark={isDark}
                          language={language}
                          t={t}
                          fontSize={fontSize}
                          terminalBg={terminalBg}
                          textColor={textColor}
                          isMobile={isMobile}
                          isPcPoweredOff={isPcPoweredOff}
                          pcOutput={pcOutput}
                          setPcOutput={setPcOutput}
                          input={input}
                          setInput={setInput}
                          isCmdInputDisabled={isCmdInputDisabled}
                          ftpSession={ftpSession}
                          internalPcHostname={internalPcHostname}
                          showCmdSettings={showCmdSettings}
                          handleFontSizeChange={handleFontSizeChange}
                          executeCommand={executeCommand}
                          inputRef={inputRef}
                          outputRef={outputRef}
                          handleInputChange={handleInputChange}
                          handleKeyDown={handleKeyDown}
                          shouldShowAutocomplete={shouldShowAutocomplete}
                          renderAutocompleteSuggestions={renderAutocompleteSuggestions}
                          autocompleteIndex={autocompleteIndex}
                          autocompleteRef={autocompleteRef}
                          completeAutocompleteSelection={completeAutocompleteSelection}
                          handleResizeStart={handleResizeStart}
                          highlightText={highlightText}
                          mobileVerticalScrollStyle={mobileVerticalScrollStyle}
                        />
                      )}

                      {activeTab === 'terminal' && (
                        <ConsoleTerminalTab
                          isDark={isDark}
                          language={language}
                          t={t}
                          fontSize={fontSize}
                          terminalBg={terminalBg}
                          textColor={textColor}
                          isMobile={isMobile}
                          isPcPoweredOff={isPcPoweredOff}
                          isConsoleConnected={isConsoleConnected}
                          connectedDeviceId={connectedDeviceId}
                          topologyDevices={topologyDevices}
                          isConsoleInputDisabled={isConsoleInputDisabled}
                          consoleNeedsPassword={consoleNeedsPassword}
                          consoleConfirmDialog={consoleConfirmDialog}
                          consoleReloadPending={consoleReloadPending}
                          activeConsoleOutput={activeConsoleOutput}
                          setConsoleConnectionTime={setConsoleConnectionTime}
                          setIsConsoleConnected={setIsConsoleConnected}
                          setConnectedDeviceId={setConnectedDeviceId}
                          handleConnect={handleConnect}
                          showCmdSettings={showCmdSettings}
                          executeCommand={executeCommand}
                          input={input}
                          handleInputChange={handleInputChange}
                          handleKeyDown={handleKeyDown}
                          onExecuteDeviceCommand={onExecuteDeviceCommand}
                          setConsolePasswordAttempted={setConsolePasswordAttempted}
                          setInput={setInput}
                          highlightText={highlightText}
                          consoleDevice={consoleDevice}
                          outputRef={outputRef}
                          mobileVerticalScrollStyle={mobileVerticalScrollStyle}
                        />
                      )}

                      {activeTab === 'settings' && (
                        <IpSettingsTab
                          isDark={isDark}
                          fontSize={fontSize}
                          mobileVerticalScrollStyle={mobileVerticalScrollStyle}
                          pcIP={pcIP}
                          setPcIP={setPcIP}
                          pcMAC={pcMAC}
                          setPcMAC={setPcMAC}
                          ipConfigMode={ipConfigMode}
                          setIpConfigMode={setIpConfigMode}
                          pcSubnet={pcSubnet}
                          setPcSubnet={setPcSubnet}
                          pcGateway={pcGateway}
                          setPcGateway={setPcGateway}
                          pcDNS={pcDNS}
                          setPcDNS={setPcDNS}
                          pcIPv6={pcIPv6}
                          setPcIPv6={setPcIPv6}
                          pcIPv6Prefix={pcIPv6Prefix}
                          setPcIPv6Prefix={setPcIPv6Prefix}
                          internalPcHostname={internalPcHostname}
                          setPcHostname={setPcHostname}
                          serviceNtpServer={serviceNtpServer}
                          setServiceNtpServer={setServiceNtpServer}
                          serviceNtpServerError={serviceNtpServerError}
                          setServiceNtpServerError={setServiceNtpServerError}
                          setServiceNtpServerPreset={setServiceNtpServerPreset}
                          serviceNtpEnabled={serviceNtpEnabled}
                          serviceNtpDate={serviceNtpDate}
                          serviceNtpTime={serviceNtpTime}
                          errors={errors}
                          setErrors={setErrors}
                          t={t}
                          language={language}
                          dispatchDeviceConfig={dispatchDeviceConfig}
                          validateIpField={validateIpField}
                          validateSubnetField={validateSubnetField}
                          isValidIpAddress={isValidIpAddress}
                          applyNtpServerTime={applyNtpServerTime}
                          deviceId={deviceId}
                          manualDhcpClickRef={manualDhcpClickRef}
                          applyDhcpLeaseRef={applyDhcpLeaseRef}
                        />
                      )}

                      {activeTab === 'services' && (
                        <ServicesTab
                          isDark={isDark}
                          language={language}
                          t={t}
                          activeServiceTab={activeServiceTab}
                          setActiveServiceTab={setActiveServiceTab}
                          mobileVerticalScrollStyle={mobileVerticalScrollStyle}
                          dispatchDeviceConfig={dispatchDeviceConfig}
                          serviceDnsEnabled={serviceDnsEnabled}
                          setServiceDnsEnabled={setServiceDnsEnabled}
                          serviceDnsRecords={serviceDnsRecords}
                          setServiceDnsRecords={setServiceDnsRecords}
                          dnsFormDomain={dnsFormDomain}
                          setDnsFormDomain={setDnsFormDomain}
                          dnsFormAddress={dnsFormAddress}
                          setDnsFormAddress={setDnsFormAddress}
                          handleAddDnsRecord={handleAddDnsRecord}
                          getDnsRecordDisplay={getDnsRecordDisplay}
                          isDnsEditingRef={isDnsEditingRef}
                          serviceHttpEnabled={serviceHttpEnabled}
                          setServiceHttpEnabled={setServiceHttpEnabled}
                          serviceHttpContent={serviceHttpContent}
                          setServiceHttpContent={setServiceHttpContent}
                          serviceFtpEnabled={serviceFtpEnabled}
                          setServiceFtpEnabled={setServiceFtpEnabled}
                          serviceFtpFiles={serviceFtpFiles}
                          setServiceFtpFiles={setServiceFtpFiles}
                          serviceDhcpEnabled={serviceDhcpEnabled}
                          setServiceDhcpEnabled={setServiceDhcpEnabled}
                          serviceDhcpPools={serviceDhcpPools}
                          setServiceDhcpPools={setServiceDhcpPools}
                          dhcpForm={dhcpForm}
                          setDhcpForm={setDhcpForm}
                          editingDhcpIndex={editingDhcpIndex}
                          setEditingDhcpIndex={setEditingDhcpIndex}
                          isDhcpEditingRef={isDhcpEditingRef}
                          serviceNtpEnabled={serviceNtpEnabled}
                          setServiceNtpEnabled={setServiceNtpEnabled}
                          serviceNtpServer={serviceNtpServer}
                          serviceNtpDate={serviceNtpDate}
                          setServiceNtpDate={setServiceNtpDate}
                          serviceNtpTime={serviceNtpTime}
                          setServiceNtpTime={setServiceNtpTime}
                          serviceMailEnabled={serviceMailEnabled}
                          setServiceMailEnabled={setServiceMailEnabled}
                          serviceMailDomain={serviceMailDomain}
                          setServiceMailDomain={setServiceMailDomain}
                          serviceMailUsername={serviceMailUsername}
                          setServiceMailUsername={setServiceMailUsername}
                          serviceMailPassword={serviceMailPassword}
                          setServiceMailPassword={setServiceMailPassword}
                          serviceMailInbox={serviceMailInbox}
                          setServiceMailInbox={setServiceMailInbox}
                          serviceMailSent={serviceMailSent}
                          setServiceMailSent={setServiceMailSent}
                          mailPop3Blocked={mailPop3Blocked}
                          handleComposeSend={handleComposeSend}
                          handleViewReplySend={handleViewReplySend}
                          handleDeleteInbox={handleDeleteInbox}
                          handleDeleteSent={handleDeleteSent}
                        />
                      )}

                      {activeTab === 'iot' && (
                        <IotDashboardTab
                          isDark={isDark}
                          language={language}
                          isMobile={isMobile}
                          mobileVerticalScrollStyle={mobileVerticalScrollStyle}
                          iotDevices={iotDevices}
                          selectedIotDeviceId={selectedIotDeviceId}
                          setSelectedIotDeviceId={setSelectedIotDeviceId}
                          selectedIotDevice={selectedIotDevice}
                          iotSensorType={iotSensorType}
                          setIotSensorType={setIotSensorType}
                          iotKind={iotKind}
                          setIotKind={setIotKind}
                          iotCollaborationEnabled={iotCollaborationEnabled}
                          setIotCollaborationEnabled={setIotCollaborationEnabled}
                          iotDataStore={iotDataStore}
                          setIotDataStore={setIotDataStore}
                          topologyDevices={topologyDevices}
                          deviceStates={deviceStates}
                          topologyConnections={topologyConnections}
                          deviceId={deviceId}
                          wifiSSID={wifiSSID}
                          navigateToProgram={(program) => navigateToProgram(program as PCActiveTab)}
                          setInput={setInput}
                          executeCommand={executeCommand}
                          environment={environment}
                        />
                      )}

                      {activeTab === 'wireless' && (
                        <WirelessConfigTab
                          isDark={isDark}
                          language={language}
                          t={t}
                          wifiEnabled={wifiEnabled}
                          setWifiEnabled={setWifiEnabled}
                          wifiSSID={wifiSSID}
                          setWifiSSID={setWifiSSID}
                          wifiBSSID={wifiBSSID}
                          setWifiBSSID={setWifiBSSID}
                          wifiSecurity={wifiSecurity}
                          setWifiSecurity={setWifiSecurity}
                          wifiPassword={wifiPassword}
                          setWifiPassword={setWifiPassword}
                          wifiChannel={wifiChannel}
                          setWifiChannel={setWifiChannel}
                          availableSSIDs={availableSSIDs}
                          deviceStates={deviceStates}
                          topologyDevices={topologyDevices}
                          deviceId={deviceId}
                          wifiSignalStrength={wifiSignalStrength}
                          dispatchDeviceConfig={dispatchDeviceConfig}
                          navigateToProgram={(program) => navigateToProgram(program as PCActiveTab)}
                          setInput={setInput}
                          executeCommand={executeCommand}
                          mobileVerticalScrollStyle={mobileVerticalScrollStyle}
                        />
                      )}
                    </div>
                  </div>
                </ModernPanel>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FtpFileTransferDialog
        open={isFtpFilePickerOpen}
        onOpenChange={setIsFtpFilePickerOpen}
        session={ftpSession}
        localFiles={pcLocalFiles}
        language={language}
        isDark={isDark}
        onGetFile={(fileName) => handleFtpSessionCommand(`get ${fileName}`)}
        onPutFile={executeFtpPut}
      />

      <HttpBrowserWindow
        isOpen={!!httpAppContent}
        isMobile={isMobile}
        isDark={isDark}
        language={language}
        browserWindow={browserWindow}
        onBrowserWindowChange={setBrowserWindow}
        title={httpAppTitle}
        url={httpAppUrl || ''}
        srcDoc={httpAppSrcDoc}
        suggestions={filteredSuggestions}
        showSuggestions={showUrlSuggestions}
        selectedSuggestionIndex={selectedSuggestionIndex}
        urlInputRef={urlInputRef}
        dragStateRef={dragStateRef}
        resizeStateRef={resizeStateRef}
        onClose={() => {
          setHttpAppUrl('');
          setHttpAppContent(null);
          setHttpAppDeviceId(null);
          inputRef.current?.focus();
        }}
        onUrlChange={setHttpAppUrl}
        onSetShowSuggestions={setShowUrlSuggestions}
        onSetSelectedSuggestionIndex={setSelectedSuggestionIndex}
        onOpenWebPage={openWebPage}
      />
    </>
  );
}






