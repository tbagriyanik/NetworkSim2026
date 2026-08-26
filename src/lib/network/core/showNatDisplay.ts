import type { CommandContext } from './commandTypes';
import type { SwitchState, CommandResult } from '../types';

/**
 * Show IP NAT Translations (including PAT port columns)
 */
export function cmdShowIpNatTranslations(state: SwitchState, _input: string, _ctx?: CommandContext): CommandResult {
  const translations = state.natTranslations || [];
  const staticTranslations = state.natStaticTranslations || [];

  if (staticTranslations.length === 0 && translations.length === 0) {
    return { success: true, output: '\n% No NAT translations active\n' };
  }

  let output = '\nPro Inside global          Inside local           Outside local          Outside global\n';

  staticTranslations.forEach(t => {
    const proto = (t as any).protocol ? String((t as any).protocol).toLowerCase() : '---';
    const inGlobal = (t as any).globalPort !== undefined ? `${t.globalIp}:${(t as any).globalPort}` : t.globalIp;
    const inLocal = (t as any).localPort !== undefined ? `${t.localIp}:${(t as any).localPort}` : t.localIp;
    output += `${proto.padEnd(4)}${inGlobal.padEnd(23)}${inLocal.padEnd(23)}---                    ---\n`;
  });

  translations.forEach(t => {
    const proto = (t.protocol || 'tcp').toLowerCase();
    const inGlobal = t.globalPort !== undefined ? `${t.globalIp}:${t.globalPort}` : t.globalIp;
    const inLocal = t.localPort !== undefined ? `${t.localIp}:${t.localPort}` : t.localIp;
    const outLocal = t.remoteIp ? (t.remotePort !== undefined ? `${t.remoteIp}:${t.remotePort}` : t.remoteIp) : '---';
    const outGlobal = outLocal;
    output += `${proto.padEnd(4)}${inGlobal.padEnd(23)}${inLocal.padEnd(23)}${outLocal.padEnd(23)}${outGlobal}\n`;
  });

  return { success: true, output };
}

/**
 * Show IP NAT Statistics
 */
export function cmdShowIpNatStatistics(state: SwitchState, _input: string, _ctx?: CommandContext): CommandResult {
  let output = '\nTotal active translations: ' + (state.natTranslations?.length || 0) + ' (0 static, 0 dynamic; 0 extended)\n';
  output += 'Peak translations: 0, occurred 00:00:00 ago\n';
  output += 'Outside interfaces:\n';
  Object.keys(state.ports || {}).forEach(pId => {
    if (state.ports[pId].natSide === 'outside') output += `  ${pId}\n`;
  });
  output += 'Inside interfaces:\n';
  Object.keys(state.ports || {}).forEach(pId => {
    if (state.ports[pId].natSide === 'inside') output += `  ${pId}\n`;
  });
  output += 'Hits: 0  Misses: 0\n';
  output += 'CEF Translated packets: 0, CEF Punted packets: 0\n';
  output += 'Expired translations: 0\n';
  output += 'Dynamic mappings:\n';
  (state.natDynamicRules || []).forEach(r => {
    output += `-- Inside Source\n`;
    output += `   access-list ${r.aclId} interface ${r.interface || 'pool ' + r.poolName} refcount 0\n`;
  });

  return { success: true, output };
}
