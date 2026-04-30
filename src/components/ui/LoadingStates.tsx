'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { Loader2, Wifi, Server, Database, AlertCircle } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2
        className={cn(
          'animate-spin text-primary',
          sizeMap[size]
        )}
      />
      {text && (
        <span className={cn(
          'text-sm animate-pulse',
          isDark ? 'text-slate-400' : 'text-slate-600'
        )}>
          {text}
        </span>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        'animate-fade-in',
        className
      )}
    >
      <div
        className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center mb-4',
          isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
        )}
      >
        {icon || <Server className="w-8 h-8" />}
      </div>
      <h3
        className={cn(
          'font-semibold text-lg mb-2',
          isDark ? 'text-slate-200' : 'text-slate-800'
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            'text-sm max-w-xs mb-4',
            isDark ? 'text-slate-400' : 'text-slate-600'
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

interface NetworkEmptyStateProps {
  type: 'no-devices' | 'no-connections' | 'no-data' | 'error';
  className?: string;
  action?: React.ReactNode;
}

export function NetworkEmptyState({ type, className, action }: NetworkEmptyStateProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const configs = {
    'no-devices': {
      icon: <Server className="w-8 h-8" />,
      title: 'Cihaz Bulunamadı',
      titleEn: 'No Devices Found',
      description: 'Topolojiye cihaz eklemek için sürükle-bırak kullanın',
      descriptionEn: 'Use drag and drop to add devices to the topology',
    },
    'no-connections': {
      icon: <Wifi className="w-8 h-8" />,
      title: 'Bağlantı Yok',
      titleEn: 'No Connections',
      description: 'Cihazları bağlamak için kablo aracını kullanın',
      descriptionEn: 'Use the cable tool to connect devices',
    },
    'no-data': {
      icon: <Database className="w-8 h-8" />,
      title: 'Veri Yok',
      titleEn: 'No Data',
      description: 'Henüz görüntülenecek veri bulunmuyor',
      descriptionEn: 'No data to display yet',
    },
    'error': {
      icon: <AlertCircle className="w-8 h-8" />,
      title: 'Bir Hata Oluştu',
      titleEn: 'An Error Occurred',
      description: 'Bir sorun oluştu. Lütfen tekrar deneyin.',
      descriptionEn: 'Something went wrong. Please try again.',
    },
  };

  const config = configs[type];

  return (
    <EmptyState
      icon={config.icon}
      title={config.title}
      description={config.description}
      action={action}
      className={className}
    />
  );
}
