'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { calculateSubnet, type SubnetInfo } from '@/lib/network/subnetting';

interface SubnettingPanelProps {
  ip?: string;
  mask?: string;
  isDark?: boolean;
  language?: string;
}

function maskToNumber(mask: string): number {
  const octets = mask.split('.').map(Number);
  return (((octets[0] * 256 + octets[1]) * 256 + octets[2]) * 256 + octets[3]) >>> 0;
}

function numberToMask(value: number): string {
  return [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join('.');
}

function prefixToMask(prefix: number): string {
  const n = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return numberToMask(n);
}

export function SubnettingPanel({ ip = '', mask = '255.255.255.0', isDark = false, language = 'en' }: SubnettingPanelProps) {
  const isTurkish = language === 'tr';
  const [ipValue, setIpValue] = useState(ip);
  const [maskValue, setMaskValue] = useState(mask);

  const normalizedMask = maskValue.trim().startsWith('/')
    ? prefixToMask(parseInt(maskValue.trim().slice(1), 10))
    : maskValue.trim();

  const info: SubnetInfo | null = ipValue.trim() && normalizedMask
    ? calculateSubnet(ipValue, normalizedMask)
    : null;

  const ipValid = /^\d{1,3}(\.\d{1,3}){3}$/.test(ipValue.trim()) &&
    ipValue.split('.').every(o => Number(o) >= 0 && Number(o) <= 255);
  const maskValid = /^\d{1,3}(\.\d{1,3}){3}$/.test(normalizedMask) ||
    (/^\/\d{1,2}$/.test(maskValue.trim()) && Number(maskValue.trim().slice(1)) >= 0 && Number(maskValue.trim().slice(1)) <= 32);

  const wildcard = info ? numberToMask((~maskToNumber(info.mask)) >>> 0) : '';
  const total = info ? Math.pow(2, 32 - info.prefixLength) : 0;

  const rows: [string, string][] = info
    ? [
        [isTurkish ? 'Ağ (Network)' : 'Network', `${info.network}/${info.prefixLength}`],
        [isTurkish ? 'Broadcast' : 'Broadcast', info.broadcast],
        [isTurkish ? 'İlk kullanılabilir host' : 'First usable host', info.firstHost],
        [isTurkish ? 'Son kullanılabilir host' : 'Last usable host', info.lastHost],
        [isTurkish ? 'Kullanılabilir host sayısı' : 'Usable host count', String(info.usableHosts)],
        [isTurkish ? 'Toplam adres' : 'Total addresses', String(total)],
        [isTurkish ? 'Wildcard mask' : 'Wildcard mask', wildcard],
        [isTurkish ? 'Subnet mask' : 'Subnet mask', info.mask],
      ]
    : [];

  return (
    <div className={`rounded-xl border p-4 ${isDark ? 'border-secondary-800 bg-secondary-950/40' : 'border-secondary-200 bg-white'}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-bold">{isTurkish ? 'Subnetting Yardımcısı' : 'Subnetting Helper'}</h3>
        {info && <span className="text-[10px] font-mono opacity-70">/{info.prefixLength}</span>}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="text-xs font-medium opacity-70">
          {isTurkish ? 'IP Adresi' : 'IP Address'}
          <Input
            value={ipValue}
            onChange={(e) => setIpValue(e.target.value)}
            placeholder="192.168.1.10"
            className="mt-1 font-mono"
            spellCheck={false}
          />
        </label>
        <label className="text-xs font-medium opacity-70">
          {isTurkish ? 'Subnet Maskesi (/ön ek)' : 'Subnet Mask (/prefix)'}
          <Input
            value={maskValue}
            onChange={(e) => setMaskValue(e.target.value)}
            placeholder="255.255.255.0  veya  /24"
            className="mt-1 font-mono"
            spellCheck={false}
          />
        </label>
      </div>

      {ipValue.trim() && !ipValid && (
        <p className="mt-2 text-xs text-error-500">{isTurkish ? 'Geçerli bir IPv4 adresi girin.' : 'Enter a valid IPv4 address.'}</p>
      )}
      {maskValue.trim() && !maskValid && (
        <p className="mt-2 text-xs text-error-500">{isTurkish ? 'Geçerli bir subnet maskesi veya /ön ek girin.' : 'Enter a valid subnet mask or /prefix.'}</p>
      )}

      {info ? (
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <span className="opacity-70">{label}</span>
              <span className="break-all">{value}</span>
            </div>
          ))}
        </div>
      ) : (
        (ipValid && maskValid) && (
          <p className="mt-2 text-xs text-error-500">{isTurkish ? 'Subnet hesaplanamadı.' : 'Could not calculate subnet.'}</p>
        )
      )}

    </div>
  );
}
