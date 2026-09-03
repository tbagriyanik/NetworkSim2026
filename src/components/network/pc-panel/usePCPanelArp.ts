import { useCallback, useEffect, useState } from 'react';
import { secureStorage } from '@/lib/storage/secureStorage';
import { formatMacForArp } from './pcPanelHelpers';

export interface PcArpEntry {
  ip: string;
  mac: string;
  type: string;
}

interface UsePCPanelArpOptions {
  deviceId: string;
  pcIP: string;
}

/**
 * PC ARP table state, extracted from PCPanel orchestrator.
 * Synced via localStorage and custom event so topology right-click ping also updates it.
 */
export function usePCPanelArp({ deviceId, pcIP }: UsePCPanelArpOptions) {
  const [pcArpTable, setPcArpTable] = useState<PcArpEntry[]>(() => {
    try {
      const saved = secureStorage.getItem(`pc_arp_${deviceId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addPcArpEntry = useCallback((targetIp: string, targetMac: string, isIot = false) => {
    setPcArpTable((prev) => {
      const formattedMac = formatMacForArp(targetMac);
      const exists = prev.find((e) => e.ip === targetIp);
      let updated: PcArpEntry[];
      if (exists) {
        if (exists.mac === formattedMac) return prev;
        updated = prev.map((e) => (e.ip === targetIp ? { ...e, mac: formattedMac } : e));
      } else {
        updated = [...prev, { ip: targetIp, mac: formattedMac, type: isIot ? 'dynamic (IoT)' : 'dynamic' }];
      }
      try {
        secureStorage.setItem(`pc_arp_${deviceId}`, JSON.stringify(updated));
      } catch { /* ignore */ }
      return updated;
    });
  }, [deviceId]);

  const clearPcArpTable = useCallback(() => {
    setPcArpTable([]);
    try {
      secureStorage.removeItem(`pc_arp_${deviceId}`);
    } catch { /* ignore */ }
  }, [deviceId]);

  const removePcArpEntry = useCallback((targetIp: string) => {
    setPcArpTable((prev) => {
      const updated = prev.filter((entry) => entry.ip !== targetIp);
      try {
        secureStorage.setItem(`pc_arp_${deviceId}`, JSON.stringify(updated));
      } catch { /* ignore */ }
      return updated;
    });
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

  return { addPcArpEntry, removePcArpEntry, clearPcArpTable, buildArpTableOutput };
}
