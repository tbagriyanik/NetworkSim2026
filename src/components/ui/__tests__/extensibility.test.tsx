import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ModernAppShell } from '../ModernAppShell';
import { ModernPanel } from '../ModernPanel';
import { LayoutProvider } from '@/contexts/LayoutContext';

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => ({ isMobile: false }),
}));

describe('Component extensibility patterns', () => {
  it('should allow ModernAppShell slot extensions without breaking legacy props', () => {
    render(
      <LayoutProvider>
        <ModernAppShell
          header={<div>Header</div>}
          headerExtras={<div>HeaderExtra</div>}
          sidebar={<div>Sidebar</div>}
          sidebarFooter={<div>SidebarFooter</div>}
          main={<div>Main</div>}
          mainBefore={<div>MainBefore</div>}
          mainAfter={<div>MainAfter</div>}
          footer={<div>Footer</div>}
        />
      </LayoutProvider>
    );

    expect(screen.getByText('Header')).toBeDefined();
    expect(screen.getByText('HeaderExtra')).toBeDefined();
    expect(screen.getByText('Sidebar')).toBeDefined();
    expect(screen.getByText('SidebarFooter')).toBeDefined();
    expect(screen.getByText('MainBefore')).toBeDefined();
    expect(screen.getByText('Main')).toBeDefined();
    expect(screen.getByText('MainAfter')).toBeDefined();
    expect(screen.getByText('Footer')).toBeDefined();
  });

  it('should allow ModernPanel to accept header and footer extensions', () => {
    render(
      <LayoutProvider>
        <ModernPanel
          id="panel-1"
          title="Panel"
          headerStart={<div>PanelStart</div>}
          headerAction={<div>PanelAction</div>}
          footer={<div>PanelFooter</div>}
        >
          <div>PanelBody</div>
        </ModernPanel>
      </LayoutProvider>
    );

    expect(screen.getByText('Panel')).toBeDefined();
    expect(screen.getByText('PanelStart')).toBeDefined();
    expect(screen.getByText('PanelAction')).toBeDefined();
    expect(screen.getByText('PanelBody')).toBeDefined();
    expect(screen.getByText('PanelFooter')).toBeDefined();
  });
});

