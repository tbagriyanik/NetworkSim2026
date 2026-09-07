'use client';

import React from 'react';
import { ServicesTab } from './ServicesTab';
import { usePCPanel } from './PCPanelContext';
import { loadFs, readFile } from './pcFileSystem';

import { decodeHTMLEntities } from '@/lib/security/sanitizer';

export type PCServicesProps = object;

/** Context-connected wrapper: maps PCPanelContext to ServicesTab props. */
export const PCServices: React.FC<PCServicesProps> = () => {
  const ctx = usePCPanel();
  const deviceId = ctx.deviceId;
  return (
    <ServicesTab
      deviceId={deviceId}
      onEditFile={(filePath) => {
        const fs = loadFs(deviceId);
        let content = readFile(fs, filePath);
        if ((content === null || content === undefined || content.trim() === '') && filePath.replace(/\\/g, '/').toLowerCase().includes('www/index.html')) {
          content = ctx.serviceHttpContent || ctx.t.helloWorld;
        }
        const decodedContent = decodeHTMLEntities(content ?? '');
        ctx.setEditingFile({ path: filePath, content: decodedContent });
      }}
      isDark={ctx.isDark}
      language={ctx.language}
      t={ctx.t}
      activeServiceTab={ctx.activeServiceTab}
      setActiveServiceTab={ctx.setActiveServiceTab}
      mobileVerticalScrollStyle={ctx.mobileVerticalScrollStyle}
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
  );
};
