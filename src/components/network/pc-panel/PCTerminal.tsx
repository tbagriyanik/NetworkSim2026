'use client';

import React from 'react';
import { ConsoleTerminalTab } from './ConsoleTerminalTab';
import { usePCPanel } from './PCPanelContext';

export type PCTerminalProps = object;

/** Context-connected wrapper: maps PCPanelContext to ConsoleTerminalTab props. */
export const PCTerminal: React.FC<PCTerminalProps> = () => {
  const ctx = usePCPanel();
  return (
    <ConsoleTerminalTab
      isDark={ctx.isDark}
      language={ctx.language}
      t={ctx.t}
      fontSize={ctx.fontSize}
      terminalBg={ctx.terminalBg}
      textColor={ctx.textColor}
      isMobile={ctx.isMobile}
      isPcPoweredOff={ctx.isPcPoweredOff}
      isConsoleConnected={ctx.isConsoleConnected}
      connectedDeviceId={ctx.connectedDeviceId}
      topologyDevices={ctx.topologyDevices}
      isConsoleInputDisabled={ctx.isConsoleInputDisabled}
      consoleNeedsPassword={ctx.consoleNeedsPassword}
      consoleConfirmDialog={ctx.consoleConfirmDialog}
      consoleReloadPending={ctx.consoleReloadPending}
      activeConsoleOutput={ctx.activeConsoleOutput}
      setConsoleConnectionTime={ctx.setConsoleConnectionTime}
      setIsConsoleConnected={ctx.setIsConsoleConnected}
      setConnectedDeviceId={ctx.setConnectedDeviceId}
      handleConnect={ctx.handleConnect}
      showCmdSettings={ctx.showCmdSettings}
      executeCommand={ctx.executeCommand}
      input={ctx.input}
      handleInputChange={ctx.handleInputChange}
      handleKeyDown={ctx.handleKeyDown}
      onExecuteDeviceCommand={ctx.onExecuteDeviceCommand}
      setConsolePasswordAttempted={ctx.setConsolePasswordAttempted}
      setInput={ctx.setInput}
      highlightText={ctx.highlightText}
      consoleDevice={ctx.consoleDevice}
      inputRef={ctx.inputRef}
      outputRef={ctx.outputRef}
      mobileVerticalScrollStyle={ctx.mobileVerticalScrollStyle}
    />
  );
};
