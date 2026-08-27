import type { WifiAdminConfig } from './wifiAdminTypes';

export interface WifiConfigFieldTemplates {
  passwordField: string;
  hiddenCheckbox: string;
  maxClientsField: string;
}

export function renderWifiConfigFieldTemplates(
  wifi: WifiAdminConfig,
  isTurkish: boolean,
  safeWifiPassword: string,
): WifiConfigFieldTemplates {
  const isWepMode = wifi.security === 'wep';
  return {
    passwordField: `
    <div class="form-group">
      <label for="wifi-password">${isTurkish ? 'Kablosuz Ağ Parolası' : 'Wireless Network Password'}</label>
      <input type="password" id="wifi-password" name="password" value="${safeWifiPassword}" placeholder="${isWepMode ? (isTurkish ? 'WEP anahtarı girin' : 'Enter WEP key') : (isTurkish ? 'En az 8 karakter girin' : 'Enter at least 8 characters')}" minlength="${isWepMode ? 5 : 8}" aria-describedby="wifi-password-hint">
      <span class="hint" id="wifi-password-hint">${isTurkish ? 'WPA2/WPA3 güvenliği için güçlü bir parola kullanın' : 'Use a strong password for WPA2/WPA3 security'}</span>
    </div>
  `,
    hiddenCheckbox: `
    <div class="form-group checkbox-group">
      <label class="checkbox-label">
        <input type="checkbox" id="wifi-hidden" name="hidden" ${wifi.hidden ? 'checked' : ''}>
        <span>${isTurkish ? 'SSID Gizle (Gizli Ağ)' : 'Hide SSID (Hidden Network)'}</span>
      </label>
      <span class="hint">${isTurkish ? 'Gizli ağlar istemci aramasında taranmaz' : 'Hidden networks are not visible in client scans'}</span>
    </div>
  `,
    maxClientsField: `
    <div class="form-group">
      <label for="max-clients">${isTurkish ? 'Maksimum Bağlı İstemci Sayısı' : 'Maximum Connected Clients'}</label>
      <input type="number" id="max-clients" name="maxClients" value="${wifi.maxClients ?? 32}" min="1" max="128" step="1">
      <span class="hint">${isTurkish ? 'Ağa aynı anda bağlanabilecek istemci sayısı' : 'Number of clients that can connect simultaneously'}</span>
    </div>
  `,
  };
}
