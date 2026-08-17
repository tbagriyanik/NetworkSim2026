'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Radio, Laptop, Trash2, Power } from 'lucide-react';
import type { SwitchState } from '@/lib/network/types';
import type { CanvasDevice } from './networkTopology.types';
import { getDeviceWifiConfig } from '@/lib/network/wireless';

interface WlcWirelessPanelProps {
    state: SwitchState;
    isDark: boolean;
    language: string;
    isDevicePoweredOff: boolean;
    onExecuteCommand: (command: string) => Promise<void>;
    topologyDevices?: CanvasDevice[];
    activeDeviceId?: string;
    deviceStates?: Map<string, SwitchState>;
}

export function WlcWirelessPanel({
    state,
    isDark,
    language,
    isDevicePoweredOff,
    onExecuteCommand,
    topologyDevices = [],
    activeDeviceId = '',
    deviceStates,
}: WlcWirelessPanelProps) {
    const tr = (en: string, tr: string) => (language === 'tr' ? tr : en);
    const [wlanName, setWlanName] = useState('');
    const [wlanId, setWlanId] = useState('');
    const [wlanSsid, setWlanSsid] = useState('');
    const [wlanSecurity, setWlanSecurity] = useState<'open' | 'wpa2'>('open');
    const [busy, setBusy] = useState(false);

    const wlans = state.wlcWlans || {};
    const aps = state.wlcAps || {};

    const createWlan = async () => {
        if (!wlanName || !wlanId || !wlanSsid) return;
        setBusy(true);
        try {
            await onExecuteCommand(`wlan ${wlanName} ${wlanId} ${wlanSsid}`);
            if (wlanSecurity === 'wpa2') {
                await onExecuteCommand(`wlan security ${wlanId} wpa2`);
            }
            await onExecuteCommand(`wlan enable ${wlanId}`);
            setWlanName('');
            setWlanId('');
            setWlanSsid('');
        } finally {
            setBusy(false);
        }
    };

    const toggleWlan = async (id: number | string, currentStatus: string) => {
        setBusy(true);
        try {
            if (currentStatus === 'enabled') {
                await onExecuteCommand(`wlan disable ${id}`);
            } else {
                await onExecuteCommand(`wlan enable ${id}`);
            }
        } finally {
            setBusy(false);
        }
    };

    const deleteWlan = async (id: number | string) => {
        setBusy(true);
        try {
            await onExecuteCommand(`no wlan ${id}`);
        } finally {
            setBusy(false);
        }
    };

    // Find connected wireless clients (PCs, Laptops, IoT) associated with any active WLAN on this WLC
    const activeWlanSsids = new Set(
        Object.values(wlans)
            .filter((w) => w.status === 'enabled' && w.ssid)
            .map((w) => w.ssid.toLowerCase())
    );

    const connectedClients = topologyDevices.filter((dev) => {
        if (dev.id === activeDeviceId) return false;
        if (dev.status === 'offline') return false;
        const wifi = getDeviceWifiConfig(dev, deviceStates);
        if (!wifi?.enabled || !wifi?.ssid) return false;
        return activeWlanSsids.has(wifi.ssid.toLowerCase());
    });

    const cardClass = isDark ? 'bg-secondary-900/60 border-secondary-700' : 'bg-white border-secondary-200';
    const muted = isDark ? 'text-secondary-400' : 'text-secondary-500';

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Radio className="w-4 h-4" />
                {tr('Wireless Network Administration', 'Kablosuz Ağ Yönetimi')}
            </div>

            {/* Quick WLAN creation */}
            <Card className={cardClass}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{tr('Create New WLAN / SSID', 'Yeni WLAN / SSID Oluştur')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <Input
                            placeholder={tr('Profile name (e.g. Guest)', 'Profil adı (örn. Guest)')}
                            value={wlanName}
                            onChange={(e) => setWlanName(e.target.value)}
                            disabled={isDevicePoweredOff || busy}
                        />
                        <Input
                            placeholder={tr('WLAN ID (e.g. 2)', 'WLAN ID (örn. 2)')}
                            value={wlanId}
                            onChange={(e) => setWlanId(e.target.value.replace(/[^0-9]/g, ''))}
                            disabled={isDevicePoweredOff || busy}
                        />
                        <Input
                            placeholder={tr('SSID (e.g. Guest-WiFi)', 'SSID (örn. Guest-WiFi)')}
                            value={wlanSsid}
                            onChange={(e) => setWlanSsid(e.target.value)}
                            disabled={isDevicePoweredOff || busy}
                        />
                        <select
                            className={`flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors ${isDark ? 'bg-secondary-800 text-white border-secondary-700' : 'bg-white text-secondary-900 border-secondary-300'}`}
                            value={wlanSecurity}
                            onChange={(e) => setWlanSecurity(e.target.value as 'open' | 'wpa2')}
                            disabled={isDevicePoweredOff || busy}
                        >
                            <option value="open">{tr('Open (No password)', 'Açık (Şifresiz)')}</option>
                            <option value="wpa2">{tr('WPA2-PSK', 'WPA2-PSK')}</option>
                        </select>
                    </div>
                    <Button
                        size="sm"
                        onClick={createWlan}
                        disabled={isDevicePoweredOff || busy || !wlanName || !wlanId || !wlanSsid}
                    >
                        {tr('Add SSID / WLAN', 'SSID / WLAN Ekle')}
                    </Button>
                </CardContent>
            </Card>

            {/* Configured WLAN list */}
            <Card className={cardClass}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{tr('Configured WLANs / SSIDs', 'Yapılandırılmış WLAN\'lar / SSID\'ler')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {Object.keys(wlans).length === 0 ? (
                        <p className={`text-xs ${muted}`}>{tr('No WLANs configured.', 'WLAN yapılandırılmamış.')}</p>
                    ) : (
                        <div className="space-y-2">
                            {Object.entries(wlans).map(([id, wlan]) => (
                                <div key={id} className="flex items-center justify-between gap-2 rounded-md border border-secondary-200 dark:border-secondary-700 px-3 py-2">
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium truncate flex items-center gap-2">
                                            <span>{wlan.name}</span>
                                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">ID: {wlan.id}</Badge>
                                        </div>
                                        <div className={`text-xs ${muted}`}>SSID: <span className="font-semibold text-primary">{wlan.ssid}</span> · {tr('Security', 'Güvenlik')}: {(wlan.security || 'open').toUpperCase()}</div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Badge variant={wlan.status === 'enabled' ? 'outline' : 'secondary'} className={wlan.status === 'enabled' ? 'bg-success-500 text-white border-transparent' : ''}>
                                            {wlan.status === 'enabled' ? tr('Enabled', 'Etkin') : tr('Disabled', 'Devre Dışı')}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            title={wlan.status === 'enabled' ? tr('Disable', 'Devre Dışı Bırak') : tr('Enable', 'Etkinleştir')}
                                            disabled={isDevicePoweredOff || busy}
                                            onClick={() => toggleWlan(wlan.id, wlan.status)}
                                        >
                                            <Power className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-error-500 hover:text-error-600"
                                            title={tr('Delete', 'Sil')}
                                            disabled={isDevicePoweredOff || busy}
                                            onClick={() => deleteWlan(wlan.id)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Connected Wireless Clients */}
            <Card className={cardClass}>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{tr('Connected Wireless Clients', 'Bağlı Kablosuz Cihazlar')}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                            {connectedClients.length} {tr('Clients', 'Cihaz')}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {connectedClients.length === 0 ? (
                        <p className={`text-xs ${muted}`}>{tr('No wireless clients currently connected.', 'Şu anda bağlı kablosuz cihaz yok.')}</p>
                    ) : (
                        <div className="space-y-2">
                            {connectedClients.map((client) => {
                                const clientWifi = getDeviceWifiConfig(client, deviceStates);
                                return (
                                    <div key={client.id} className="flex items-center justify-between gap-2 rounded-md border border-secondary-200 dark:border-secondary-700 px-3 py-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8 h-8 rounded bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                                                <Laptop className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium truncate">{client.name}</div>
                                                <div className={`text-xs ${muted} font-mono`}>
                                                    IP: {client.ip || tr('Dynamic / DHCP', 'Dinamik / DHCP')} · MAC: {client.macAddress || 'Auto'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <Badge variant="outline" className="bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800 text-[11px]">
                                                SSID: {clientWifi?.ssid}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* AP list */}
            <Card className={cardClass}>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{tr('Joined Access Points', 'Bağlı Erişim Noktaları')}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                            {Object.keys(aps).length} AP
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {Object.keys(aps).length === 0 ? (
                        <p className={`text-xs ${muted}`}>{tr('No APs joined.', 'Bağlı AP yok.')}</p>
                    ) : (
                        <div className="space-y-2">
                            {Object.entries(aps).map(([name, ap]) => (
                                <div key={name} className="flex items-center justify-between gap-2 rounded-md border border-secondary-200 dark:border-secondary-700 px-3 py-2">
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium truncate">{ap.name}</div>
                                        <div className={`text-xs ${muted}`}>{ap.macAddress}</div>
                                    </div>
                                    <Badge variant={ap.status === 'joined' ? 'outline' : 'secondary'} className={ap.status === 'joined' ? 'bg-success-500 text-white border-transparent' : ''}>
                                        {ap.status === 'joined' ? tr('Joined', 'Bağlı') : tr('Down', 'Kapalı')}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
