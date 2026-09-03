'use client';

import React from 'react';
import { WirelessConfigTab } from './WirelessConfigTab';
import { usePCPanel } from './PCPanelContext';
import type { PCActiveTab } from './PCPanel.types';

export type PCWifiProps = object;

/** Context-connected wrapper: maps PCPanelContext to WirelessConfigTab props. */
export const PCWifi: React.FC<PCWifiProps> = () => {
  const ctx = usePCPanel();
  return (
    <WirelessConfigTab
      isDark={ctx.isDark}
      language={ctx.language}
      t={ctx.t}
      wifiEnabled={ctx.wifiEnabled}
      setWifiEnabled={ctx.setWifiEnabled}
      wifiSSID={ctx.wifiSSID}
      setWifiSSID={ctx.setWifiSSID}
      wifiBSSID={ctx.wifiBSSID}
      setWifiBSSID={ctx.setWifiBSSID}
      wifiSecurity={ctx.wifiSecurity as 'open' | 'wep' | 'wpa' | 'wpa2' | 'wpa3'}
      setWifiSecurity={ctx.setWifiSecurity}
      wifiPassword={ctx.wifiPassword}
      setWifiPassword={ctx.setWifiPassword}
      wifiChannel={ctx.wifiChannel}
      setWifiChannel={ctx.setWifiChannel}
      availableSSIDs={ctx.availableSSIDs}
      deviceStates={ctx.deviceStates}
      topologyDevices={ctx.topologyDevices}
      deviceId={ctx.deviceId}
      wifiSignalStrength={ctx.wifiSignalStrength}
      dispatchDeviceConfig={ctx.dispatchDeviceConfig}
      navigateToProgram={(program: string) => ctx.navigateToProgram(program as PCActiveTab)}
      setInput={ctx.setInput}
      executeCommand={ctx.executeCommand}
      mobileVerticalScrollStyle={ctx.mobileVerticalScrollStyle}
    />
  );
};
