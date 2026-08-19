import { X } from 'lucide-react';
import { TooltipWrapper } from '@/components/ui/TooltipWrapper';

interface TopologyFullscreenButtonProps {
  isDark: boolean;
  label: string;
  onClick: () => void;
}

export function TopologyFullscreenButton({ isDark, label, onClick }: TopologyFullscreenButtonProps) {
  return (
    <TooltipWrapper title={label}>
      <button
        onClick={onClick}
        className={`fixed top-4 right-4 z-[10000] flex items-center justify-center w-8 h-8 rounded-full shadow-lg transition-colors ${isDark
          ? 'bg-secondary-800/90 hover:bg-error-500/30 text-secondary-300 hover:text-error-400 border border-secondary-600'
          : 'bg-white/90 hover:bg-error-500/30 text-secondary-600 hover:text-error-600 border border-secondary-300'
          }`}
        aria-label={label}
      >
        <X className="w-4 h-4" />
      </button>
    </TooltipWrapper>
  );
}
