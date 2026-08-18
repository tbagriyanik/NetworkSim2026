import { useCallback } from 'react';
import { CanvasDevice, CanvasNote, CanvasConnection, DeviceType } from '../components/network/networkTopology.types';
import { generateRandomLinkLocalIpv4, generateRandomLinkLocalIpv6 } from '@/lib/network/linkLocal';
import { getDeviceWidth, getDeviceHeight } from '../components/network/networkTopology.helpers';
import { generateSwitchPorts, generateL3SwitchPorts, generateRouterPorts, generateWLCPorts } from '../components/network/networkTopology.portGenerators';
import { generateUniqueMacAddress } from '@/lib/utils';
import { buildRunningConfig } from '@/lib/network/core/configBuilder';
import type { SwitchState } from '@/lib/network/types';

function getSummaryCliCommands(state: SwitchState): string[] {
  const config = state.runningConfig?.length > 0 ? state.runningConfig : buildRunningConfig(state);
  const ignoredLines = /^(?:!|version\s|no service pad$|service timestamps\b|! base mac-address\b)/i;
  const sensitiveLines = /^(?:enable secret|enable password|username\s+\S+\s+.*\bsecret\b|\s+(?:password|secret)\b)/i;
  const meaningfulLines = config.filter((line) => {
    const command = line.trim();
    return command.length > 0 && !ignoredLines.test(command) && !sensitiveLines.test(command);
  });

  return meaningfulLines.filter((line, index, lines) => {
    const command = line.trim();
    if (!/^interface\s/i.test(command)) return true;

    const nextCommand = lines[index + 1]?.trim() || '';
    return nextCommand.length > 0 && !/^interface\s/i.test(nextCommand);
  });
}

export interface UseCanvasActionsProps {
  devices: CanvasDevice[];
  setDevices: React.Dispatch<React.SetStateAction<CanvasDevice[]>>;
  connections: CanvasConnection[];
  setConnections: React.Dispatch<React.SetStateAction<CanvasConnection[]>>;
  notes: CanvasNote[];
  setNotes: React.Dispatch<React.SetStateAction<CanvasNote[]>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deviceStates: Map<string, any> | undefined | null;
  saveToHistory: () => void;
  isExamActive: boolean;
  isExamEditorOpen: boolean;
  pan: { x: number; y: number };
  zoom: number;
  canvasDimensions: { width: number; height: number };
  deviceCounterRef: React.MutableRefObject<Record<string, number>>;
  noteCounterRef: React.MutableRefObject<number>;
  latestNotesRef: React.MutableRefObject<CanvasNote[]>;
  setSelectedDeviceIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedNoteIds: React.Dispatch<React.SetStateAction<string[]>>;
  onDeviceSelect: (type: DeviceType, id: string, switchModel?: string, name?: string, isNew?: boolean, device?: CanvasDevice) => void;
  onDeviceDelete?: (deviceId: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setConnectionStart: React.Dispatch<React.SetStateAction<any>>;
  setIsDrawingConnection: React.Dispatch<React.SetStateAction<boolean>>;
  language: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}

export function useCanvasActions({
  devices,
  setDevices,
  setConnections,
  setNotes,
  deviceStates,
  saveToHistory,
  isExamActive,
  isExamEditorOpen,
  pan,
  zoom,
  canvasDimensions,
  deviceCounterRef,
  noteCounterRef,
  latestNotesRef,
  setSelectedDeviceIds,
  setSelectedNoteIds,
  onDeviceSelect,
  onDeviceDelete,
  setConnectionStart,
  setIsDrawingConnection,
  language,
}: UseCanvasActionsProps) {

  const generateUniqueLinkLocalIp = useCallback((reservedIps: string[] = []) => {
    const usedIps = new Set([
      ...devices.map((d) => d.ip).filter(Boolean),
      ...reservedIps.filter(Boolean),
    ]);
    return generateRandomLinkLocalIpv4(usedIps);
  }, [devices]);

  const generateUniqueLinkLocalIpv6 = useCallback((reservedIps: string[] = []) => {
    const usedIps = new Set([
      ...devices.map((d) => d.ipv6).filter(Boolean) as string[],
      ...reservedIps.filter(Boolean),
    ]);
    return generateRandomLinkLocalIpv6(usedIps);
  }, [devices]);

  const generateUniqueHostname = useCallback((baseName: string, reservedNames: string[] = []) => {
    const normalize = (value: string) => value.trim().toLowerCase();
    const usedNames = new Set<string>();

    devices.forEach((d) => usedNames.add(normalize(d.name)));
    if (deviceStates) {
      deviceStates.forEach((state) => {
        if (state?.hostname) {
          usedNames.add(normalize(state.hostname));
        }
      });
    }
    reservedNames.forEach((name) => usedNames.add(normalize(name)));

    if (!usedNames.has(normalize(baseName))) return baseName;

    let suffix = 2;
    let candidate = `${baseName}-${suffix}`;
    while (usedNames.has(normalize(candidate))) {
      suffix++;
      candidate = `${baseName}-${suffix}`;
    }
    return candidate;
  }, [devices, deviceStates]);

  const addDevice = useCallback((type: 'pc' | 'iot' | 'switch' | 'router' | 'firewall' | 'wlc', layer?: 'L2' | 'L3') => {
    if (isExamActive && !isExamEditorOpen) return;
    saveToHistory();
    deviceCounterRef.current[type]++;

    let spawnX = 100 + Math.random() * 30;
    let spawnY = 80 + Math.random() * 30;

    if (canvasDimensions.width > 0 && canvasDimensions.height > 0) {
      const estimatedDeviceWidth = getDeviceWidth(type);
      const estimatedDeviceHeight = getDeviceHeight(type, type === 'pc' || type === 'iot' ? 2 : 24);

      spawnX = (canvasDimensions.width / 2 - pan.x) / zoom - estimatedDeviceWidth / 2;
      spawnY = (canvasDimensions.height / 2 - pan.y) / zoom - estimatedDeviceHeight / 2;
    }

    const switchLayer = layer || 'L2';
    const switchModel = switchLayer === 'L3' ? 'WS-C3650-24PS' : 'WS-C2960-24TT-L';
    const resolvedType = type === 'switch'
      ? (switchLayer === 'L3' ? 'switchL3' : 'switchL2')
      : type;

    const baseName =
      type === 'switch' && switchLayer === 'L3'
        ? `Switch-${deviceCounterRef.current[type]}`
        : `${type.toUpperCase()}-${deviceCounterRef.current[type]}`;

    const initialLinkLocalIp = (type === 'pc' || type === 'iot') ? generateUniqueLinkLocalIp() : '';
    const initialLinkLocalIpv6 = (type === 'pc' || type === 'iot') ? generateUniqueLinkLocalIpv6() : '';
    const allUsedMacs = devices.flatMap(d => [d.macAddress, ...(d.ports || []).map(p => p.macAddress)]).filter(Boolean) as string[];

    const newDevice: CanvasDevice = {
      id: `${type}-${deviceCounterRef.current[type]}`,
      type: resolvedType,
      name: generateUniqueHostname(baseName),
      macAddress: generateUniqueMacAddress(allUsedMacs),
      ip: type === 'wlc' ? '192.168.1.1' : initialLinkLocalIp,
      ipv6: initialLinkLocalIpv6,
      subnet: (type === 'pc' || type === 'iot') ? '255.255.0.0' : type === 'wlc' ? '255.255.255.0' : undefined,
      gateway: (type === 'pc' || type === 'iot') ? '0.0.0.0' : undefined,
      dns: (type === 'pc' || type === 'iot') ? '0.0.0.0' : undefined,
      ipConfigMode: type === 'iot' ? 'dhcp' : undefined,
      x: spawnX,
      y: spawnY,
      status: 'online',
      switchModel: type === 'switch' ? switchModel : type === 'wlc' ? 'AIR-CT2504-K9' as const : undefined,
      ports:
        type === 'pc' || type === 'iot'
          ? [
            { id: 'eth0', label: 'Eth0', status: 'disconnected' as const, macAddress: generateUniqueMacAddress([...allUsedMacs]) },
            ...(type === 'pc' ? [{ id: 'com1', label: 'COM1', status: 'disconnected' as const }] : []),
          ]
          : type === 'switch'
            ? switchLayer === 'L3' ? generateL3SwitchPorts() : generateSwitchPorts()
            : type === 'firewall'
              ? [
                { id: 'gi0/0', label: 'Gi0/0', status: 'disconnected' as const, macAddress: generateUniqueMacAddress([...allUsedMacs]) },
                { id: 'gi0/1', label: 'Gi0/1', status: 'disconnected' as const, macAddress: generateUniqueMacAddress([...allUsedMacs]) },
              ]
              : type === 'wlc'
                ? generateWLCPorts()
                : generateRouterPorts(),
      services: type === 'wlc'
        ? {
          http: { enabled: true, content: '' },
          dhcp: {
            enabled: true,
            pools: [
              {
                poolName: 'WLC-DHCP-POOL',
                defaultGateway: '192.168.1.1',
                dnsServer: '8.8.8.8',
                startIp: '192.168.1.100',
                subnetMask: '255.255.255.0',
                maxUsers: 50
              }
            ]
          }
        }
        : undefined,
      iot: type === 'iot'
        ? { sensorType: 'temperature', collaborationEnabled: false, dataStore: '' }
        : undefined,
      wifi: type === 'iot'
        ? { enabled: true, ssid: '', security: 'open', password: '', channel: '2.4GHz', mode: 'client' }
        : type === 'wlc'
          ? { enabled: true, ssid: 'WLC-WiFi', security: 'open', password: '', channel: '2.4GHz', mode: 'ap' }
          : (type === 'router' || (type === 'switch' && switchLayer === 'L3'))
            ? { enabled: false, ssid: 'Network-AP', security: 'open', password: '', channel: '2.4GHz', mode: 'ap' }
            : undefined,
    };

    setDevices((prev) => [...prev, newDevice]);
    setSelectedDeviceIds([newDevice.id]);
    onDeviceSelect(resolvedType, newDevice.id, newDevice.switchModel, newDevice.name, true, newDevice);

  }, [devices, saveToHistory, generateUniqueHostname, generateUniqueLinkLocalIp, generateUniqueLinkLocalIpv6, onDeviceSelect, canvasDimensions, pan, zoom, isExamActive, isExamEditorOpen, deviceCounterRef, setDevices, setSelectedDeviceIds]);

  const deleteDevice = useCallback((deviceId: string) => {
    if (isExamActive) return;
    saveToHistory();
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    setConnections((prev) =>
      prev.filter((c) => c.sourceDeviceId !== deviceId && c.targetDeviceId !== deviceId)
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setConnectionStart((prev: any) => {
      if (prev?.deviceId === deviceId) {
        setIsDrawingConnection(false);
        return null;
      }
      return prev;
    });
    if (onDeviceDelete) {
      onDeviceDelete(deviceId);
    }
  }, [saveToHistory, onDeviceDelete, isExamActive, setDevices, setConnections, setConnectionStart, setIsDrawingConnection]);

  const getNextNoteId = useCallback(() => {
    const existingIds = new Set(latestNotesRef.current.map((n) => n.id));
    let nextId = noteCounterRef.current + 1;
    while (existingIds.has(`note-${nextId}`)) {
      nextId++;
    }
    noteCounterRef.current = nextId;
    return `note-${nextId}`;
  }, [latestNotesRef, noteCounterRef]);

  const addNote = useCallback((text = 'Yeni Not', color = 'yellow') => {
    if (isExamActive && !isExamEditorOpen) return;
    saveToHistory();

    const noteId = getNextNoteId();
    const newNote: CanvasNote = {
      id: noteId,
      text,
      x: 150 + Math.random() * 50,
      y: 150 + Math.random() * 50,
      width: 140,
      height: 100,
      color,
      font: 'sans',
      fontSize: 12,
      opacity: 1,
    };
    setNotes((prev) => [...prev, newNote]);
    setSelectedNoteIds([noteId]);
  }, [isExamActive, isExamEditorOpen, saveToHistory, getNextNoteId, setNotes, setSelectedNoteIds]);

  const duplicateNote = useCallback((noteId: string) => {
    if (isExamActive && !isExamEditorOpen) return;
    const noteToDuplicate = latestNotesRef.current.find((n) => n.id === noteId);
    if (!noteToDuplicate) return;
    saveToHistory();
    const duplicatedNote: CanvasNote = {
      ...noteToDuplicate,
      id: getNextNoteId(),
      x: noteToDuplicate.x + 20,
      y: noteToDuplicate.y + 20,
    };
    setNotes((prev) => [...prev, duplicatedNote]);
    setSelectedNoteIds([duplicatedNote.id]);
  }, [isExamActive, isExamEditorOpen, latestNotesRef, saveToHistory, getNextNoteId, setNotes, setSelectedNoteIds]);

  const deleteNote = useCallback((noteId: string) => {
    if (isExamActive && !isExamEditorOpen) return;
    saveToHistory();
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    setSelectedNoteIds((prev) => prev.filter((id) => id !== noteId));
  }, [isExamActive, isExamEditorOpen, saveToHistory, setNotes, setSelectedNoteIds]);

  const updateNoteText = useCallback((noteId: string, text: string) => {
    if (isExamActive && !isExamEditorOpen) return;
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, text } : n)));
  }, [isExamActive, isExamEditorOpen, setNotes]);

  const updateNoteColor = useCallback((noteId: string, color: string) => {
    if (isExamActive && !isExamEditorOpen) return;
    saveToHistory();
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, color } : n)));
  }, [isExamActive, isExamEditorOpen, saveToHistory, setNotes]);

  const updateNoteStyle = useCallback((noteId: string, updates: Partial<CanvasNote>) => {
    if (isExamActive && !isExamEditorOpen) return;
    saveToHistory();
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, ...updates } : n)));
  }, [isExamActive, isExamEditorOpen, saveToHistory, setNotes]);

  const deleteConnection = useCallback((connectionId: string) => {
    if (isExamActive) return;
    saveToHistory();
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
  }, [isExamActive, saveToHistory, setConnections]);

  const toggleConnectionActive = useCallback((connectionId: string) => {
    if (isExamActive) return;
    saveToHistory();
    setConnections((prev) =>
      prev.map((c) => (c.id === connectionId ? { ...c, active: !c.active } : c))
    );
  }, [isExamActive, saveToHistory, setConnections]);

  const addSummaryNote = useCallback(() => {
    saveToHistory();
    const isTr = language === 'tr';
    let summaryText = isTr ? '📋 TOPOLOJİ ÖZETİ\n' : '📋 TOPOLOGY SUMMARY\n';
    summaryText += '========================\n';

    if (devices.length === 0) {
      summaryText += isTr ? 'Cihaz bulunamadı.' : 'No devices found.';
    } else {
      devices.forEach(d => {
        const typeLabel = d.type === 'switchL2' ? 'Switch L2' : d.type === 'switchL3' ? 'Switch L3' : d.type.toUpperCase();
        summaryText += `• ${d.name} [${typeLabel}]\n`;
        if (d.ip) {
          summaryText += `  IP: ${d.ip}\n`;
        }
        if (d.ipv6) {
          summaryText += `  IPv6: ${d.ipv6}\n`;
        }
        if (d.gateway && d.gateway !== '0.0.0.0') {
          summaryText += `  GW: ${d.gateway}\n`;
        }
        summaryText += `  MAC: ${d.macAddress}\n`;
        const deviceState = deviceStates?.get(d.id) as SwitchState | undefined;
        const cliCommands = deviceState ? getSummaryCliCommands(deviceState) : [];
        if (cliCommands.length > 0) {
          summaryText += isTr ? '  CLI AYARLARI:\n' : '  CLI CONFIGURATION:\n';
          summaryText += cliCommands.map((command) => `    ${command}`).join('\n') + '\n';
        }
        summaryText += '------------------------\n';
      });
    }

    const newNote: CanvasNote = {
      id: getNextNoteId(),
      x: 150 + Math.random() * 50,
      y: 150 + Math.random() * 50,
      width: 250,
      height: Math.max(120, 50 + devices.length * 75),
      text: summaryText.trim(),
      color: 'var(--color-success-200)',
      font: 'Courier New',
      fontSize: 10,
      opacity: 1,
    };
    setNotes((prev) => [...prev, newNote]);
    setSelectedNoteIds([newNote.id]);
  }, [saveToHistory, language, getNextNoteId, devices, setNotes, setSelectedNoteIds]);

  return {
    addDevice,
    deleteDevice,
    addNote,
    addSummaryNote,
    duplicateNote,
    deleteNote,
    updateNoteText,
    updateNoteColor,
    updateNoteStyle,
    deleteConnection,
    toggleConnectionActive,
    getNextNoteId,
    generateUniqueLinkLocalIp,
    generateUniqueLinkLocalIpv6,
    generateUniqueHostname,
  };
}
