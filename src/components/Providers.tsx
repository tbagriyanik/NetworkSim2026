'use client';

import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { FeatureFlagProvider } from '@/contexts/FeatureFlagContext';
import { ModeProvider } from '@/contexts/ModeContext';
import { RoomProvider } from '@/contexts/RoomContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { GlobalDragManager } from '@/hooks/useDrag';
import { AppErrorBoundary } from '@/components/ui/AppErrorBoundary';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AppErrorBoundary>
        <LanguageProvider>
          <LayoutProvider>
            <FeatureFlagProvider>
              <ModeProvider>
                <RoomProvider>
                  <TooltipProvider delayDuration={0}>
                    <SidebarProvider>
                      <GlobalDragManager />
                      {children}
                      <Toaster />
                    </SidebarProvider>
                  </TooltipProvider>
                </RoomProvider>
              </ModeProvider>
            </FeatureFlagProvider>
          </LayoutProvider>
        </LanguageProvider>
      </AppErrorBoundary>
    </ThemeProvider>
  );
}
