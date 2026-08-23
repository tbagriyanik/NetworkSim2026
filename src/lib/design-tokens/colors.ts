/**
 * Color Design Tokens
 * Centralized color tokens for UI, topology canvas, status indicators, and packet animations.
 */

export const colors = {
  // Status Colors
  status: {
    online: '#10b981',
    offline: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    idle: '#6b7280',
    active: '#22c55e',
    inactive: '#9ca3af',
  },

  // Network Cable Colors
  cables: {
    straight: '#3b82f6',
    crossover: '#f59e0b',
    fiber: '#8b5cf6',
    serial: '#ec4899',
    console: '#64748b',
    wireless: '#06b6d4',
    default: '#94a3b8',
    selected: '#38bdf8',
    hover: '#60a5fa',
    active: '#22c55e',
    disabled: '#475569',
  },

  // Topology Canvas & Device Node Colors
  topology: {
    bg: '#0f172a',
    canvasBg: '#1e293b',
    gridLine: '#334155',
    deviceBg: '#1e293b',
    deviceBorder: '#475569',
    deviceSelectedBorder: '#38bdf8',
    deviceText: '#f8fafc',
    subText: '#94a3b8',
    halo: 'rgba(56, 189, 248, 0.25)',
    noteBg: '#1e293b',
    noteBorder: '#475569',
    noteText: '#e2e8f0',
  },

  // Packet & Simulation Animation Colors
  packet: {
    icmp: '#3b82f6',
    arp: '#f59e0b',
    tcp: '#10b981',
    udp: '#8b5cf6',
    dns: '#ec4899',
    dhcp: '#06b6d4',
    http: '#eab308',
    error: '#ef4444',
    success: '#22c55e',
  },

  // Terminal & Console Colors
  terminal: {
    bg: '#090d16',
    fg: '#f1f5f9',
    prompt: '#38bdf8',
    command: '#f8fafc',
    output: '#cbd5e1',
    error: '#f87171',
    warning: '#fbbf24',
    cursor: '#38bdf8',
    selection: '#1e3a8a',
  },

  // Brand / Theme UI Colors
  theme: {
    primary: '#0284c7',
    primaryHover: '#0369a1',
    secondary: '#475569',
    accent: '#38bdf8',
    background: '#0f172a',
    card: '#1e293b',
    cardHover: '#334155',
    border: '#334155',
    ring: '#38bdf8',
  },
} as const;

export type ColorTokenGroup = typeof colors;
