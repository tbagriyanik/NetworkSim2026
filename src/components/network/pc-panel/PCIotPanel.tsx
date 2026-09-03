'use client';

import React from 'react';
import { IotDashboardTab } from './IotDashboardTab';
import { usePCPanel } from './PCPanelContext';
import type { PCActiveTab } from './PCPanel.types';

export type PCIotPanelProps = object;

/** Context-connected wrapper: maps PCPanelContext to IotDashboardTab props. */
export const PCIotPanel: React.FC<PCIotPanelProps> = () => {
  const ctx = usePCPanel();
  return (
    <IotDashboardTab
      isDark={ctx.isDark}
      language={ctx.language}
      isMobile={ctx.isMobile}
      mobileVerticalScrollStyle={ctx.mobileVerticalScrollStyle}
      iotDevices={ctx.iotDevices}
      selectedIotDeviceId={ctx.selectedIotDeviceId}
      setSelectedIotDeviceId={ctx.setSelectedIotDeviceId}
      selectedIotDevice={ctx.selectedIotDevice}
      iotSensorType={ctx.iotSensorType}
      setIotSensorType={ctx.setIotSensorType}
      iotKind={ctx.iotKind}
      setIotKind={ctx.setIotKind}
      iotCollaborationEnabled={ctx.iotCollaborationEnabled}
      setIotCollaborationEnabled={(val: boolean | ((prevState: boolean) => boolean)) => {
        if (typeof val === 'function') {
          ctx.setIotCollaborationEnabled(val(ctx.iotCollaborationEnabled));
        } else {
          ctx.setIotCollaborationEnabled(val);
        }
      }}
      iotDataStore={ctx.iotDataStore}
      setIotDataStore={ctx.setIotDataStore}
      topologyDevices={ctx.topologyDevices}
      deviceStates={ctx.deviceStates}
      topologyConnections={ctx.topologyConnections}
      deviceId={ctx.deviceId}
      wifiSSID={ctx.wifiSSID}
      navigateToProgram={(program: string) => ctx.navigateToProgram(program as PCActiveTab)}
      setInput={ctx.setInput}
      executeCommand={ctx.executeCommand}
      environment={ctx.environment}
    />
  );
};
