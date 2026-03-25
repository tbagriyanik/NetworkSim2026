'use client';

import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <LayoutProvider>
          <TooltipProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </TooltipProvider>
        </LayoutProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
