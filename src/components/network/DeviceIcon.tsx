'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { DEVICE_ICON_COLORS } from './networkTopology.constants';
import type { DeviceType } from './networkTopology.types';

export interface DeviceIconProps {
  type: DeviceType;
  className?: string;
  size?: number | string;
  color?: string;
  switchModel?: string;
  active?: boolean;
}

export function DeviceIcon({
  type,
  className,
  size = 24,
  color,
  switchModel,
  active = false
}: DeviceIconProps) {
  const isSwitch = type === 'switchL2' || type === 'switchL3';
  const defaultColor = color || (
    type === 'pc'
      ? DEVICE_ICON_COLORS.pc
      : type === 'iot'
        ? DEVICE_ICON_COLORS.iot  // IoT için varsayılan renk
        : type === 'router'
          ? DEVICE_ICON_COLORS.router
          : (isSwitch && switchModel === 'WS-C3560-24PS' ? '#a855f7' : DEVICE_ICON_COLORS.switch)
  );

  const strokeWidth = active ? 2.5 : 1.5;
  const svgProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: defaultColor,
    strokeWidth,
    className: cn(
      'transition-all duration-300',
      active && 'filter drop-shadow-[0_0_8px_rgba(var(--color-primary),0.5)]',
      className
    )
  };

  switch (type) {
    case 'pc':
      return (
        <svg {...svgProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 0 0 2-2V5a2 2 0 0 0 -2-2H5a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2z"
          />
        </svg>
      );
    case 'iot':
      return (
        <svg {...svgProps}>
          <path d="M16.247 7.761a6 6 0 0 1 0 8.478" />
          <path d="M19.075 4.933a10 10 0 0 1 0 14.134" />
          <path d="M4.925 19.067a10 10 0 0 1 0-14.134" />
          <path d="M7.753 16.239a6 6 0 0 1 0-8.478" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case 'router':
      return (
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="9" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 5v14M5 12h14M12 5l-2 2m2-2l2 2m-2 12l-2-2m2 2l2-2M5 12l2-2m-2 2l2 2M19 12l-2-2m2 2l-2 2"
          />
        </svg>
      );
    case 'switchL2':
    case 'switchL3':
      return (
        <svg {...svgProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 12h14M5 12a2 2 0 0 1 -2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2M5 12a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0 -2-2m-2-4h.01M17 16h.01"
          />
        </svg>
      );
    default:
      return (
        <svg {...svgProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 12h14M5 12a2 2 0 0 1 -2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2M5 12a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0 -2-2m-2-4h.01M17 16h.01"
          />
        </svg>
      );
  }
}
