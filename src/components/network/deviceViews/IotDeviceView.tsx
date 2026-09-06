'use client';

import { useState, useEffect } from 'react';
import { Cpu, Power, RefreshCw, Wifi, Server, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWirelessSignalStrength } from '@/lib/network/connectivity';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { CanvasDevice, CanvasConnection } from '../networkTopology.types';
import type { SwitchState } from '@/lib/network/types';

interface IotDeviceViewProps {
  device: CanvasDevice;
  topologyDevices: CanvasDevice[];
  topologyConnections: CanvasConnection[];
  deviceStates: Map<string, SwitchState>;
  isDark: boolean;
  language: string;
}

export function IotDeviceView({
  device,
  topologyDevices,
  topologyConnections,
  deviceStates,
  isDark,
  language,
}: IotDeviceViewProps) {
  const isTr = language === 'tr';
  const liveDevice = topologyDevices.find(d => d.id === device.id) || device;

  const isPowerOn = liveDevice.status !== 'offline';
  const isCollaborationEnabled = liveDevice.iot?.collaborationEnabled !== false;

  const iotKind = liveDevice.iot?.kind || 'sensor';
  const iotSensorType = liveDevice.iot?.sensorType || 'temperature';

  const [deviceName, setDeviceName] = useState(liveDevice.name || liveDevice.id);
  const [dataStore, setDataStore] = useState(liveDevice.iot?.dataStore || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setDeviceName(liveDevice.name || liveDevice.id);
    setDataStore(liveDevice.iot?.dataStore || '');
  }, [liveDevice.id, liveDevice.name, liveDevice.iot?.dataStore]);

  const wifiSignalStrength = getWirelessSignalStrength(liveDevice, topologyDevices, deviceStates);
  const isWired = topologyConnections.some(c =>
    (c.sourceDeviceId === liveDevice.id || c.targetDeviceId === liveDevice.id) && c.active !== false
  );
  const isNetworkConnected = (wifiSignalStrength > 0 || isWired) && isPowerOn;

  const handleTypeChange = (value: string) => {
    const [kind, sensor] = value.split(':');
    const newKind = kind as 'cooler' | 'lamp' | 'heater' | 'sensor';
    const newSensor = sensor as 'temperature' | 'sound' | 'motion' | 'humidity' | 'light';

    window.dispatchEvent(new CustomEvent('update-topology-device-config', {
      detail: {
        deviceId: liveDevice.id,
        config: {
          iot: {
            ...liveDevice.iot,
            kind: newKind,
            sensorType: newSensor,
          }
        }
      }
    }));
  };

  const handleTogglePower = () => {
    const nextStatus: 'online' | 'offline' = isPowerOn ? 'offline' : 'online';
    window.dispatchEvent(new CustomEvent('update-topology-device-config', {
      detail: { deviceId: liveDevice.id, config: { status: nextStatus } }
    }));
  };

  const handleToggleCollaboration = () => {
    const nextCollab = !isCollaborationEnabled;
    window.dispatchEvent(new CustomEvent('update-topology-device-config', {
      detail: {
        deviceId: liveDevice.id,
        config: {
          iot: {
            ...liveDevice.iot,
            collaborationEnabled: nextCollab
          }
        }
      }
    }));
  };

  const handleSaveConfig = () => {
    window.dispatchEvent(new CustomEvent('update-topology-device-config', {
      detail: {
        deviceId: liveDevice.id,
        config: {
          name: deviceName,
          iot: {
            ...liveDevice.iot,
            dataStore: dataStore,
          }
        }
      }
    }));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-4 p-4 text-xs">
      {/* Header Info */}
      <div className={cn("p-4 rounded-xl border flex items-center justify-between", isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200")}>
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm", isDark ? "bg-cyan-950/60 border-cyan-800 text-cyan-400" : "bg-cyan-50 border-cyan-200 text-cyan-600")}>
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-foreground flex items-center gap-2">
              <span>{liveDevice.name || liveDevice.id}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
                IoT Device
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
              IP: {liveDevice.ip || 'DHCP/Unassigned'} | MAC: {liveDevice.macAddress || 'N/A'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePower}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border shadow-sm",
              isPowerOn
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                : "bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25"
            )}
          >
            <Power className="w-3.5 h-3.5" />
            {isPowerOn ? (isTr ? 'Güç Açık' : 'Power On') : (isTr ? 'Güç Kapalı' : 'Power Off')}
          </button>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className={cn("p-4 rounded-xl border space-y-4", isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="font-bold text-muted-foreground">{isTr ? 'Cihaz Adı' : 'Device Name'}</label>
            <input
              type="text"
              value={deviceName}
              onChange={e => setDeviceName(e.target.value)}
              className={cn("w-full px-3 py-2 rounded-lg border font-mono text-xs outline-none", isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-300 text-slate-900")}
              placeholder={isTr ? "IoT Cihaz Adı..." : "IoT Device Name..."}
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-muted-foreground">{isTr ? 'Cihaz Türü / Sensör' : 'Device Type / Sensor'}</label>
            <Select value={`${iotKind}:${iotSensorType}`} onValueChange={handleTypeChange}>
              <SelectTrigger className={cn("w-full h-9 text-xs", isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-300")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="heater:temperature">{isTr ? 'Isıtıcı' : 'Heater'}</SelectItem>
                <SelectItem value="lamp:light">{isTr ? 'Lamba' : 'Lamp'}</SelectItem>
                <SelectItem value="cooler:temperature">{isTr ? 'Soğutucu' : 'Cooler'}</SelectItem>
                <SelectItem value="sensor:temperature">{isTr ? 'Isı Sensörü' : 'Temperature Sensor'}</SelectItem>
                <SelectItem value="sensor:light">{isTr ? 'Işık Sensörü' : 'Light Sensor'}</SelectItem>
                <SelectItem value="sensor:humidity">{isTr ? 'Nem Sensörü' : 'Humidity Sensor'}</SelectItem>
                <SelectItem value="sensor:motion">{isTr ? 'Hareket Sensörü' : 'Motion Sensor'}</SelectItem>
                <SelectItem value="sensor:sound">{isTr ? 'Ses Sensörü' : 'Sound Sensor'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex items-center justify-between py-2 border-y border-slate-800/40">
          <div>
            <div className="font-bold text-foreground">{isTr ? 'Cihaz Durumu' : 'Device Status'}</div>
            <div className="text-[11px] text-muted-foreground">{isTr ? 'Cihazın ağ ve sensör simülasyon yanıtını açar/kapatır' : 'Toggles sensor response & network automation'}</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isCollaborationEnabled}
            onClick={handleToggleCollaboration}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors shrink-0 px-0.5",
              isCollaborationEnabled ? 'bg-cyan-600 border-cyan-500 justify-end' : (isDark ? 'bg-slate-800 border-slate-700 justify-start' : 'bg-slate-200 border-slate-300 justify-start')
            )}
          >
            <span className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-all" />
          </button>
        </div>

        {/* Data storage */}
        <div className="space-y-1.5">
          <label className="font-bold text-muted-foreground">{isTr ? 'Veri Saklama / Notlar (JSON veya Metin)' : 'Data Storage / Notes (JSON or Text)'}</label>
          <textarea
            value={dataStore}
            onChange={e => setDataStore(e.target.value)}
            rows={4}
            className={cn("w-full px-3 py-2 rounded-lg border font-mono text-xs outline-none custom-scrollbar", isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-300 text-slate-900")}
            placeholder={isTr ? "Sensör verileri veya notlar..." : "Sensor data or notes..."}
          />
        </div>

        {/* Network Status Footer */}
        <div className={cn("p-3 rounded-lg border flex items-center justify-between text-xs font-mono", isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-100 border-slate-200")}>
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span className={isNetworkConnected ? "text-emerald-400" : "text-rose-400"}>
              {isNetworkConnected ? (isTr ? 'Ağ Bağlantısı Aktif' : 'Network Connected') : (isTr ? 'Ağ Bağlantısı Yok' : 'No Network Connection')}
            </span>
          </div>
          {liveDevice.wifi?.ssid && (
            <div className="flex items-center gap-1.5 text-sky-400">
              <Wifi className="w-3.5 h-3.5" />
              <span>Wi-Fi SSID: {liveDevice.wifi?.ssid}</span>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={handleSaveConfig}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-md"
          >
            {saveSuccess ? <CheckCircle2 className="w-4 h-4 text-white" /> : <RefreshCw className="w-4 h-4" />}
            {saveSuccess ? (isTr ? 'Kaydedildi!' : 'Saved!') : (isTr ? 'Ayarları Kaydet' : 'Save Settings')}
          </button>
        </div>
      </div>
    </div>
  );
}
