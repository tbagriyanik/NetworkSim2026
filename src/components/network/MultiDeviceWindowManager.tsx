'use client';

import React, { useState } from 'react';
import { DraggableWindowWrapper } from './DraggableWindowWrapper';
import { PCPanel } from './PCPanel';
import { FirewallPanel } from './FirewallPanel';
import { UnifiedDevicePanel } from './UnifiedDevicePanel';
import { CanvasDevice, CanvasConnection, DeviceType, FirewallRule } from './networkTopology.types';
import { CableInfo, SwitchState } from '@/lib/network/types';
import { TerminalOutput } from './Terminal';
import { OutputLine as PCOutputLine, PcOutputsSetter } from './pc-panel/PCPanel.types';
import { useMultiWindowStore, DeviceWindowItem } from '@/hooks/useMultiWindowStore';
import { TaskDefinition, TaskContext } from '@/lib/network/taskDefinitions';

interface MultiDeviceWindowManagerProps {
  topologyDevices: CanvasDevice[];
  topologyConnections: CanvasConnection[];
  cableInfo: CableInfo;
  deviceStates: Map<string, SwitchState>;
  deviceOutputs: Map<string, TerminalOutput[]>;
  pcOutputs: Map<string, PCOutputLine[]>;
  setPcOutputs: PcOutputsSetter;
  pcHistories: Map<string, string[]>;
  handleUpdatePCHistory: (deviceId: string, history: string[]) => void;
  handleUpdateHistory: (deviceId: string, history: string[]) => void;
  handleExecuteCommand: (deviceId: string, command: string) => Promise<unknown>;
  handleDeviceDelete: (deviceId: string) => void;
  isDark: boolean;
  language: string;
  theme?: string;
  t: Record<string, unknown>;
  toggleDevicePower: (deviceId: string) => void;
  updateDeviceConfig?: (deviceId: string, config: { firewallRules?: FirewallRule[] }) => void;
  confirmDialog?: { show: boolean; message: string; action: string; onConfirm: () => void } | null;
  setConfirmDialog?: (dialog: { show: boolean; message: string; action: string; onConfirm: () => void } | null) => void;
  isTablet?: boolean;
}

export function MultiDeviceWindowManager({
  topologyDevices,
  topologyConnections,
  cableInfo,
  deviceStates,
  deviceOutputs,
  pcOutputs,
  setPcOutputs,
  pcHistories,
  handleUpdatePCHistory,
  handleUpdateHistory,
  handleExecuteCommand,
  handleDeviceDelete,
  isDark,
  language,
  theme = 'cisco',
  t,
  toggleDevicePower,
  updateDeviceConfig,
  confirmDialog,
  setConfirmDialog,
  isTablet = false,
}: MultiDeviceWindowManagerProps) {
  const { openWindows, closeDeviceWindow, windowPositions, windowSizes, updateWindowPosition, updateWindowSize } = useMultiWindowStore();
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});

  if (openWindows.length === 0 || isTablet) return null;

  return (
    <>
      {openWindows.map((win: DeviceWindowItem) => {
        const deviceObj = topologyDevices.find((d) => d.id === win.id);
        const deviceName = deviceObj?.name || win.id;
        const deviceType = (deviceObj?.type || win.type) as DeviceType;
        const position = windowPositions[win.id] || { x: win.x || 120, y: win.y || 80 };
        const size = windowSizes[win.id] || { width: win.width || 720, height: win.height || 540 };

        const handlePointerDown = (e: React.PointerEvent) => {
          // Pointer capture for dragging
          const startX = e.clientX - position.x;
          const startY = e.clientY - position.y;

          const onPointerMove = (moveEvt: PointerEvent) => {
            const nextX = Math.max(0, Math.min(window.innerWidth - 100, moveEvt.clientX - startX));
            const nextY = Math.max(0, Math.min(window.innerHeight - 60, moveEvt.clientY - startY));
            updateWindowPosition(win.id, { x: nextX, y: nextY });
          };

          const onPointerUp = () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
          };

          window.addEventListener('pointermove', onPointerMove);
          window.addEventListener('pointerup', onPointerUp);
        };

        const handleResizeStart = (e: React.PointerEvent, direction: string) => {
          const startX = e.clientX;
          const startY = e.clientY;
          const startWidth = size.width;
          const startHeight = size.height;
          const startPosX = position.x;
          const startPosY = position.y;

          const onPointerMove = (moveEvt: PointerEvent) => {
            const dx = moveEvt.clientX - startX;
            const dy = moveEvt.clientY - startY;
            let newW = startWidth;
            let newH = startHeight;
            let newX = startPosX;
            let newY = startPosY;

            if (direction.includes('e')) newW = Math.max(400, startWidth + dx);
            if (direction.includes('s')) newH = Math.max(300, startHeight + dy);
            if (direction.includes('w')) {
              newW = Math.max(400, startWidth - dx);
              newX = startPosX + (startWidth - newW);
            }
            if (direction.includes('n')) {
              newH = Math.max(300, startHeight - dy);
              newY = startPosY + (startHeight - newH);
            }

            updateWindowSize(win.id, { width: newW, height: newH });
            if (newX !== startPosX || newY !== startPosY) {
              updateWindowPosition(win.id, { x: newX, y: newY });
            }
          };

          const onPointerUp = () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
          };

          window.addEventListener('pointermove', onPointerMove);
          window.addEventListener('pointerup', onPointerUp);
        };

        // Render PC Window
        if (deviceType === 'pc') {
          return (
            <DraggableWindowWrapper
              key={win.id}
              id={win.id}
              title={`PC Terminal - ${deviceName}`}
              isOpen={true}
              onClose={() => closeDeviceWindow(win.id)}
              isDark={isDark}
              modalPosition={position}
              modalSize={size}
              handlePointerDown={handlePointerDown}
              handleResizeStart={handleResizeStart}
              collapsible
            >
              <div className="flex-1 overflow-hidden relative rounded-b-2xl">
                <PCPanel
                  key={`pc-panel-${win.id}`}
                  className="h-full min-h-0 !border-none"
                  deviceId={win.id}
                  cableInfo={cableInfo}
                  initialTab={(win.initialTab as any) || 'home'}
                  isVisible={true}
                  onClose={() => closeDeviceWindow(win.id)}
                  onTogglePower={toggleDevicePower}
                  topologyDevices={topologyDevices}
                  topologyConnections={topologyConnections}
                  deviceStates={deviceStates}
                  deviceOutputs={deviceOutputs}
                  pcOutputs={pcOutputs}
                  setPcOutputs={setPcOutputs}
                  pcHistories={pcHistories}
                  onUpdatePCHistory={handleUpdatePCHistory}
                  onExecuteDeviceCommand={handleExecuteCommand}
                  onDeleteDevice={handleDeviceDelete}
                  handleResizeStart={handleResizeStart}
                />
              </div>
            </DraggableWindowWrapper>
          );
        }

        // Render Firewall Window
        if (deviceType === 'firewall') {
          return (
            <DraggableWindowWrapper
              key={win.id}
              id={win.id}
              title={`Firewall - ${deviceName}`}
              isOpen={true}
              onClose={() => closeDeviceWindow(win.id)}
              isDark={isDark}
              modalPosition={position}
              modalSize={size}
              handlePointerDown={handlePointerDown}
              handleResizeStart={handleResizeStart}
              collapsible
            >
              <div className="flex-1 overflow-y-auto rounded-b-2xl p-4 custom-scrollbar">
                <FirewallPanel
                  device={(deviceObj || { id: win.id, name: deviceName, type: 'firewall', x: 0, y: 0, ports: [] }) as unknown as CanvasDevice}
                  t={t as any}
                  theme={theme}
                  isDevicePoweredOff={deviceObj?.status === 'offline'}
                  onUpdateRules={(rules) => {
                    if (updateDeviceConfig) updateDeviceConfig(win.id, { firewallRules: rules });
                  }}
                  deviceStates={deviceStates}
                  deviceOutputs={deviceOutputs}
                  onExecuteCommand={(cmd) => handleExecuteCommand(win.id, cmd)}
                  onUpdateHistory={(hist) => handleUpdateHistory(win.id, Array.isArray(hist) ? hist : [hist])}
                  setConfirmDialog={setConfirmDialog as any}
                  confirmDialog={confirmDialog as any}
                  topologyDevices={topologyDevices}
                  activeTab={(activeTabs[win.id] || win.initialTab || 'console') as 'console' | 'settings'}
                  onTabChange={(tab) => setActiveTabs((prev) => ({ ...prev, [win.id]: tab }))}
                  onTogglePower={toggleDevicePower}
                />
              </div>
            </DraggableWindowWrapper>
          );
        }

        // Render Switch (L2/L3), Router, WLC Devices
        const deviceState = (deviceStates.get(win.id) || {
          hostname: deviceName,
          switchModel: 'WS-C2960-24TT-L',
          ports: {},
          vlanTable: {},
          security: {},
          services: {},
        }) as unknown as SwitchState;

        const output = deviceOutputs.get(win.id) || [];
        const prompt = (deviceState as unknown as { prompt?: string }).prompt || `${deviceName}>`;
        const currentActiveTab = (activeTabs[win.id] || win.initialTab || 'console') as 'console' | 'settings' | 'stp';

        return (
          <UnifiedDevicePanel
            key={win.id}
            isOpen={true}
            onOpenChange={(open) => {
              if (!open) closeDeviceWindow(win.id);
            }}
            activeTab={currentActiveTab}
            onTabChange={(tab) => setActiveTabs((prev) => ({ ...prev, [win.id]: tab }))}
            deviceId={win.id}
            deviceType={deviceType}
            deviceStates={deviceStates}
            topologyDevices={topologyDevices}
            topologyConnections={topologyConnections}
            handleCommand={(cmd) => handleExecuteCommand(win.id, cmd)}
            handleClearTerminal={() => {
              deviceOutputs.set(win.id, []);
            }}
            handleUpdateHistory={(history) => handleUpdateHistory(win.id, Array.isArray(history) ? history : [history])}
            confirmDialog={confirmDialog as any}
            setConfirmDialog={setConfirmDialog as any}
            t={t as any}
            theme={theme}
            language={language}
            helpLevel="intermediate"
            isDark={isDark}
            isExecutingCommand={false}
            output={output}
            prompt={prompt}
            state={deviceState}
            activeDeviceTasks={[] as TaskDefinition[]}
            taskContext={{} as TaskContext}
            modalPosition={position}
            modalSize={size}
            handlePointerDown={handlePointerDown}
            handleResizeStart={handleResizeStart}
          />
        );
      })}
    </>
  );
}
