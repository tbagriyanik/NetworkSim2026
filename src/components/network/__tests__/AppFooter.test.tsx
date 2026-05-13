import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppFooter } from '../AppFooter';
import type { Translations } from '@/contexts/LanguageContext';

const mockT = {
  unsaved: 'Unsaved',
  saved: 'Saved',
  lastSavedAt: 'Last saved: ',
  tips: 'Tips',
  tabToNext: 'Tab to next',
  saveLabel: 'Save',
  devicesCount: 'devices',
  labProgress: 'Progress',
  pan: 'Pan',
  boxSelect: 'Box select',
  menu: 'Menu',
  taskCompleted: 'Task completed!',
  taskFailed: 'Task failed!',
  clickIconsToRun: 'Click icons to run',
} as unknown as Translations;

// Mock language context
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: mockT, language: 'en' }),
}));

describe('AppFooter', () => {
  const defaultProps = {
    t: mockT,
    isDark: false,
    language: 'en' as const,
    activeTab: 'topology',
    activeDeviceType: 'switchL2' as const,
    activeDeviceId: 'switch-1',
    hasUnsavedChanges: false,
    lastSaveTime: null,
    totalScore: 0,
    maxScore: 100,
    topologyDevices: [],
    lastTaskEvent: null,
    showProjectPicker: false,
    showOnboarding: false,
  };

  it('renders save status as Saved in both desktop and mobile footers', () => {
    render(<AppFooter {...defaultProps} />);
    const savedElements = screen.getAllByText('Saved');
    expect(savedElements.length).toBe(2);
  });

  it('renders save status as Unsaved in both desktop and mobile footers', () => {
    render(<AppFooter {...defaultProps} hasUnsavedChanges={true} />);
    const unsavedElements = screen.getAllByText('Unsaved');
    expect(unsavedElements.length).toBe(2);
  });

  it('renders device count in topology mode', () => {
    render(<AppFooter {...defaultProps} topologyDevices={[{ id: 'd1' } as any]} />);
    expect(screen.getByText(/1.*devices/)).toBeTruthy();
  });

  it('renders lab progress when devices exist and score > 0', () => {
    render(
      <AppFooter
        {...defaultProps}
        activeDeviceType="switchL2"
        topologyDevices={[{ id: 'd1' } as any]}
        activeDeviceId="d1"
        totalScore={50}
      />
    );
    expect(screen.getByText('Progress')).toBeTruthy();
  });

  it('shows task event notification when present', () => {
    render(
      <AppFooter
        {...defaultProps}
        lastTaskEvent={{
          type: 'completed',
          taskName: 'Configure VLAN',
          timestamp: Date.now(),
        }}
      />
    );
    expect(screen.getByText('Task completed!')).toBeTruthy();
    expect(screen.getByText('Configure VLAN')).toBeTruthy();
  });

  it('hides footer when project picker is open', () => {
    const { container } = render(<AppFooter {...defaultProps} showProjectPicker={true} />);
    const footer = container.querySelector('footer');
    expect(footer?.className).toContain('hidden');
  });
});
