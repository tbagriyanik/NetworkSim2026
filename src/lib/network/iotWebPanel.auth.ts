/**
 * IoT Web Panel Authentication Security Module
 * Handles secure authentication and session management
 */

import { sanitizeHTML } from '@/lib/security/sanitizer';

export class IotPanelAuth {
  private static readonly SESSION_KEY = 'iotPanelAuthenticated';
  private static readonly PASSWORD_KEY = 'iotPanelPassword';
  private static readonly DEFAULT_USERNAME = 'admin';
  private static readonly DEFAULT_PASSWORD = 'admin';

  private static getStorage() {
    if (typeof window === 'undefined') return null;
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  }

  private static getFallbackStorage() {
    if (typeof window === 'undefined') return {};
    return (window as any).__iot_storage || {};
  }

  private static setFallbackStorage(key: string, value: string) {
    if (typeof window !== 'undefined') {
      if (!(window as any).__iot_storage) {
        (window as any).__iot_storage = {};
      }
      (window as any).__iot_storage[key] = value;
    }
  }

  private static deleteFallbackStorage(key: string) {
    if (typeof window !== 'undefined' && (window as any).__iot_storage) {
      delete (window as any).__iot_storage[key];
    }
  }

  static getItem(key: string): string | null {
    const storage = this.getStorage();
    if (storage) {
      try {
        return storage.getItem(key);
      } catch {
        return this.getFallbackStorage()[key] || null;
      }
    }
    return this.getFallbackStorage()[key] || null;
  }

  static setItem(key: string, value: string): void {
    const storage = this.getStorage();
    if (storage) {
      try {
        storage.setItem(key, value);
      } catch {
        this.setFallbackStorage(key, value);
      }
    } else {
      this.setFallbackStorage(key, value);
    }
  }

  static removeItem(key: string): void {
    const storage = this.getStorage();
    if (storage) {
      try {
        storage.removeItem(key);
      } catch {
        this.deleteFallbackStorage(key);
      }
    } else {
      this.deleteFallbackStorage(key);
    }
  }

  static getPassword(): string {
    return this.getItem(this.PASSWORD_KEY) || this.DEFAULT_PASSWORD;
  }

  static setPassword(password: string): void {
    this.setItem(this.PASSWORD_KEY, password);
  }

  static isAuthenticated(): boolean {
    return this.getItem(this.SESSION_KEY) === 'true';
  }

  static setAuthenticated(authenticated: boolean): void {
    this.setItem(this.SESSION_KEY, authenticated ? 'true' : 'false');
  }

  static clearSession(): void {
    this.removeItem(this.SESSION_KEY);
  }

  static validateCredentials(username: string, password: string): boolean {
    const safeUsername = sanitizeHTML(username);
    const storedPassword = this.getPassword();
    return safeUsername === this.DEFAULT_USERNAME && password === storedPassword;
  }

  static changePassword(newPassword: string, confirmPassword: string): { success: boolean; message: string } {
    if (!newPassword || newPassword !== confirmPassword) {
      return { success: false, message: 'Passwords do not match!' };
    }

    this.setPassword(newPassword);
    return { success: true, message: 'Password changed successfully!' };
  }
}