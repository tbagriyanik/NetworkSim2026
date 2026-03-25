'use client';

import React from 'react';
import { Monitor, Server, Router, Database, Smartphone, Laptop, Globe, Shield, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEVICE_ICON_COLORS } from './networkTopology.constants';
import type { DeviceType } from './networkTopology.types';

export interface DeviceIconProps {
  type: DeviceType;
  className?: string;
  size?: number | string;
  color?: string;
  active?: boolean;
}

export function DeviceIcon({ 
  type, 
  className, 
  size = 24, 
  color,
  active = false 
}: DeviceIconProps) {
  const defaultColor = color || (
    type === 'pc' ? DEVICE_ICON_COLORS.pc : 
    type === 'router' ? DEVICE_ICON_COLORS.router : 
    DEVICE_ICON_COLORS.switch
  );

  const iconProps = {
    size,
    color: defaultColor,
    className: cn(
      'transition-all duration-300',
      active && 'filter drop-shadow-[0_0_8px_rgba(var(--color-primary),0.5)]',
      className
    ),
    strokeWidth: active ? 2.5 : 1.5,
  };

  switch (type) {
    case 'pc':
      return <Monitor {...iconProps} />;
    case 'router':
      return <Router {...iconProps} />;
    case 'switch':
      return <Server {...iconProps} />;
    default:
      return <Cpu {...iconProps} />;
  }
}
