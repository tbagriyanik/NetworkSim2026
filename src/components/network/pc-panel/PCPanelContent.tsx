'use client';

import { cn } from '@/lib/utils';
import { usePCPanel } from './PCPanelContext';
import { HomeLauncher } from './HomeLauncher';
import { PCDesktop } from './PCDesktop';
import { PCTerminal } from './PCTerminal';
import { PCNetworkSettings } from './PCNetworkSettings';
import { PCServices } from './PCServices';
import { PCIotPanel } from './PCIotPanel';
import { PCWifi } from './PCWifi';
import { RestApiExplorerWindow } from './RestApiExplorerWindow';
import { loadFs, readFile } from './pcFileSystem';

/** Renders the active tab content. Reads all state from PCPanelContext. */
export function PCPanelContent() {
  const ctx = usePCPanel();
  const {
    activeTab, isPcPoweredOff, isDark, isMobile, language, t,
    mobileVerticalScrollStyle, launcherApps, navigateToProgram,
    deviceId, setEditingFile, environment,
  } = ctx;

  return (
    <div className={cn(
      'relative z-10 flex-1 min-h-0 flex flex-col overflow-hidden',
      'p-[5px]',
      isMobile ? 'mx-[10px]' : ''
    )}>
      {activeTab === 'home' && !isPcPoweredOff && (
        <HomeLauncher
          apps={launcherApps}
          isDark={isDark}
          isPoweredOff={isPcPoweredOff}
          mobileVerticalScrollStyle={mobileVerticalScrollStyle}
          onNavigate={navigateToProgram}
        />
      )}

      {activeTab === 'desktop' && (
        <PCDesktop
          isDark={isDark}
          language={language}
          t={t}
          fontSize={ctx.fontSize}
          terminalBg={ctx.terminalBg}
          textColor={ctx.textColor}
          isMobile={isMobile}
          isPcPoweredOff={isPcPoweredOff}
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
          mobileVerticalScrollStyle={mobileVerticalScrollStyle}
          deviceId={deviceId}
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
          setEditingFile={setEditingFile}
          buildArpTableOutput={ctx.buildArpTableOutput}
          getNtpNow={ctx.getNtpNow}
        />
      )}

      {activeTab === 'terminal' && (
        <PCTerminal
          isDark={isDark}
          language={language}
          t={t}
          fontSize={ctx.fontSize}
          terminalBg={ctx.terminalBg}
          textColor={ctx.textColor}
          isMobile={isMobile}
          isPcPoweredOff={isPcPoweredOff}
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
          mobileVerticalScrollStyle={mobileVerticalScrollStyle}
        />
      )}

      {activeTab === 'settings' && (
        <PCNetworkSettings
          isDark={isDark}
          fontSize={ctx.fontSize}
          mobileVerticalScrollStyle={mobileVerticalScrollStyle}
          pcIP={ctx.pcIP}
          setPcIP={ctx.setPcIP}
          pcMAC={ctx.pcMAC}
          setPcMAC={ctx.setPcMAC}
          ipConfigMode={ctx.ipConfigMode}
          setIpConfigMode={ctx.setIpConfigMode}
          pcSubnet={ctx.pcSubnet}
          setPcSubnet={ctx.setPcSubnet}
          pcGateway={ctx.pcGateway}
          setPcGateway={ctx.setPcGateway}
          pcDNS={ctx.pcDNS}
          setPcDNS={ctx.setPcDNS}
          pcIPv6={ctx.pcIPv6}
          setPcIPv6={ctx.setPcIPv6}
          pcIPv6Prefix={ctx.pcIPv6Prefix}
          setPcIPv6Prefix={ctx.setPcIPv6Prefix}
          internalPcHostname={ctx.internalPcHostname}
          setPcHostname={ctx.setPcHostname}
          serviceNtpServer={ctx.serviceNtpServer}
          setServiceNtpServer={ctx.setServiceNtpServer}
          serviceNtpServerError={ctx.serviceNtpServerError}
          setServiceNtpServerError={ctx.setServiceNtpServerError}
          setServiceNtpServerPreset={ctx.setServiceNtpServerPreset}
          serviceNtpEnabled={ctx.serviceNtpEnabled}
          serviceNtpDate={ctx.serviceNtpDate}
          serviceNtpTime={ctx.serviceNtpTime}
          errors={ctx.errors}
          setErrors={ctx.setErrors}
          t={t}
          language={language}
          dispatchDeviceConfig={ctx.dispatchDeviceConfig}
          validateIpField={ctx.validateIpField}
          validateSubnetField={ctx.validateSubnetField}
          isValidIpAddress={ctx.isValidIpAddress}
          applyNtpServerTime={ctx.applyNtpServerTime}
          deviceId={deviceId}
          manualDhcpClickRef={ctx.manualDhcpClickRef}
          applyDhcpLeaseRef={ctx.applyDhcpLeaseRef}
        />
      )}

      {activeTab === 'services' && (
        <PCServices
          deviceId={deviceId}
          onEditFile={(filePath) => {
            const fs = loadFs(deviceId);
            const content = readFile(fs, filePath) ?? '';
            setEditingFile({ path: filePath, content });
          }}
          isDark={isDark}
          language={language}
          t={t}
          activeServiceTab={ctx.activeServiceTab}
          setActiveServiceTab={ctx.setActiveServiceTab}
          mobileVerticalScrollStyle={mobileVerticalScrollStyle}
          dispatchDeviceConfig={ctx.dispatchDeviceConfig}
          serviceDnsEnabled={ctx.serviceDnsEnabled}
          setServiceDnsEnabled={ctx.setServiceDnsEnabled}
          serviceDnsRecords={ctx.serviceDnsRecords}
          setServiceDnsRecords={ctx.setServiceDnsRecords}
          dnsFormDomain={ctx.dnsFormDomain}
          setDnsFormDomain={ctx.setDnsFormDomain}
          dnsFormAddress={ctx.dnsFormAddress}
          setDnsFormAddress={ctx.setDnsFormAddress}
          handleAddDnsRecord={ctx.handleAddDnsRecord}
          getDnsRecordDisplay={ctx.getDnsRecordDisplay}
          isDnsEditingRef={ctx.isDnsEditingRef}
          serviceHttpEnabled={ctx.serviceHttpEnabled}
          setServiceHttpEnabled={ctx.setServiceHttpEnabled}
          serviceHttpContent={ctx.serviceHttpContent}
          setServiceHttpContent={ctx.setServiceHttpContent}
          serviceFtpEnabled={ctx.serviceFtpEnabled}
          setServiceFtpEnabled={ctx.setServiceFtpEnabled}
          serviceFtpFiles={ctx.serviceFtpFiles}
          setServiceFtpFiles={ctx.setServiceFtpFiles}
          serviceDhcpEnabled={ctx.serviceDhcpEnabled}
          setServiceDhcpEnabled={ctx.setServiceDhcpEnabled}
          serviceDhcpPools={ctx.serviceDhcpPools}
          setServiceDhcpPools={ctx.setServiceDhcpPools}
          dhcpForm={ctx.dhcpForm}
          setDhcpForm={ctx.setDhcpForm}
          editingDhcpIndex={ctx.editingDhcpIndex}
          setEditingDhcpIndex={ctx.setEditingDhcpIndex}
          isDhcpEditingRef={ctx.isDhcpEditingRef}
          serviceNtpEnabled={ctx.serviceNtpEnabled}
          setServiceNtpEnabled={ctx.setServiceNtpEnabled}
          serviceNtpServer={ctx.serviceNtpServer}
          serviceNtpDate={ctx.serviceNtpDate}
          setServiceNtpDate={ctx.setServiceNtpDate}
          serviceNtpTime={ctx.serviceNtpTime}
          setServiceNtpTime={ctx.setServiceNtpTime}
          serviceMailEnabled={ctx.serviceMailEnabled}
          setServiceMailEnabled={ctx.setServiceMailEnabled}
          serviceMailDomain={ctx.serviceMailDomain}
          setServiceMailDomain={ctx.setServiceMailDomain}
          serviceMailUsername={ctx.serviceMailUsername}
          setServiceMailUsername={ctx.setServiceMailUsername}
          serviceMailPassword={ctx.serviceMailPassword}
          setServiceMailPassword={ctx.setServiceMailPassword}
          serviceMailInbox={ctx.serviceMailInbox}
          setServiceMailInbox={ctx.setServiceMailInbox}
          serviceMailSent={ctx.serviceMailSent}
          setServiceMailSent={ctx.setServiceMailSent}
          mailPop3Blocked={ctx.mailPop3Blocked}
          handleComposeSend={ctx.handleComposeSend}
          handleViewReplySend={ctx.handleViewReplySend}
          handleDeleteInbox={ctx.handleDeleteInbox}
          handleDeleteSent={ctx.handleDeleteSent}
          serviceSyslogEnabled={ctx.serviceSyslogEnabled}
          setServiceSyslogEnabled={ctx.setServiceSyslogEnabled}
          serviceSyslogMessages={ctx.serviceSyslogMessages}
          setServiceSyslogMessages={ctx.setServiceSyslogMessages}
        />
      )}

      {activeTab === 'iot' && (
        <PCIotPanel
          isDark={isDark}
          language={language}
          isMobile={isMobile}
          mobileVerticalScrollStyle={mobileVerticalScrollStyle}
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
          deviceId={deviceId}
          wifiSSID={ctx.wifiSSID}
          navigateToProgram={(program: string) => navigateToProgram(program as import('./PCPanel.types').PCActiveTab)}
          setInput={ctx.setInput}
          executeCommand={ctx.executeCommand}
          environment={environment}
        />
      )}

      {activeTab === 'wireless' && (
        <PCWifi
          isDark={isDark}
          language={language}
          t={t}
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
          deviceId={deviceId}
          wifiSignalStrength={ctx.wifiSignalStrength}
          dispatchDeviceConfig={ctx.dispatchDeviceConfig}
          navigateToProgram={(program: string) => navigateToProgram(program as import('./PCPanel.types').PCActiveTab)}
          setInput={ctx.setInput}
          executeCommand={ctx.executeCommand}
          mobileVerticalScrollStyle={mobileVerticalScrollStyle}
        />
      )}

      {activeTab === 'rest-api' && (
        <RestApiExplorerWindow
          isDark={isDark}
          language={language}
          topologyDevices={ctx.topologyDevices}
        />
      )}
    </div>
  );
}
