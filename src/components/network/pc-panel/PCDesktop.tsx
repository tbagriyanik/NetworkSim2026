'use client';

import React from 'react';
import { CommandLineTab } from './CommandLineTab';
import { usePCPanel } from './PCPanelContext';

export type PCDesktopProps = object;

/** Context-connected wrapper: maps PCPanelContext to CommandLineTab props. */
export const PCDesktop: React.FC<PCDesktopProps> = () => {
  const ctx = usePCPanel();
  return (
    <CommandLineTab
      isDark={ctx.isDark}
      language={ctx.language}
      t={ctx.t}
      fontSize={ctx.fontSize}
      terminalBg={ctx.terminalBg}
      textColor={ctx.textColor}
      isMobile={ctx.isMobile}
      isPcPoweredOff={ctx.isPcPoweredOff}
      pcOutput={ctx.pcOutput}
      setPcOutput={ctx.setPcOutput}
      input={ctx.input}
      setInput={ctx.setInput}
      isCmdInputDisabled={ctx.isCmdInputDisabled}
      ftpSession={ctx.ftpSession}
      pythonSession={ctx.pythonSession}
      internalPcHostname={ctx.internalPcHostname}
      currentPath={ctx.currentPath}
      showCmdSettings={ctx.showCmdSettings}
      handleFontSizeChange={ctx.handleFontSizeChange}
      executeCommand={ctx.executeCommand}
      inputRef={ctx.inputRef}
      outputRef={ctx.outputRef}
      handleInputChange={ctx.handleInputChange}
      handleKeyDown={ctx.handleKeyDown}
      shouldShowAutocomplete={ctx.shouldShowAutocomplete}
      renderAutocompleteSuggestions={ctx.renderAutocompleteSuggestions}
      autocompleteIndex={ctx.autocompleteIndex}
      autocompleteRef={ctx.autocompleteRef}
      completeAutocompleteSelection={ctx.completeAutocompleteSelection}
      handleResizeStart={ctx.handleResizeStart}
      highlightText={ctx.highlightText}
      mobileVerticalScrollStyle={ctx.mobileVerticalScrollStyle}
      deviceId={ctx.deviceId}
      pcIP={ctx.pcIP}
      setPcIP={ctx.setPcIP}
      applyDhcpLease={(force) => ctx.applyDhcpLeaseRef.current?.(force) ?? null}
      pcSubnet={ctx.pcSubnet}
      pcMAC={ctx.pcMAC}
      pcGateway={ctx.pcGateway}
      pcDNS={ctx.pcDNS}
      pcIPv6={ctx.pcIPv6}
      wifiEnabled={ctx.wifiEnabled}
      setCurrentPath={ctx.setCurrentPath}
      canReachTargetIp={ctx.canReachTargetIp}
      resolveDeviceNameTargetCallback={ctx.resolveDeviceNameTargetCallback}
      openWebPage={ctx.openWebPage}
      setPcHostname={ctx.setPcHostname}
      setEditingFile={ctx.setEditingFile}
      buildArpTableOutput={ctx.buildArpTableOutput}
      getNtpNow={ctx.getNtpNow}
    />
  );
};
