import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function Harness({ showPCPanel }: { showPCPanel: boolean }) {
  const ref = createRef<HTMLInputElement>();
  useKeyboardShortcuts({
    showMobileMenu: false,
    confirmDialog: null,
    saveDialog: null,
    showPCPanel,
    showRouterPanel: false,
    showFirewallPanel: false,
    showUnifiedDeviceModal: false,
    showAboutModal: false,
    showProjectPicker: false,
    showOnboarding: false,
    isTimelineMinimized: false,
    selectedDevice: null,
    activeDeviceId: '',
    activeTab: 'topology',
    topologyDevices: [],
    activeTabRef: { current: 'topology' } as any,
    fileInputRef: { current: null } as any,
    handleSaveProject: () => {},
    handleNewProject: () => {},
    handleUndo: () => {},
    handleRedo: () => {},
    handleDeviceDoubleClick: () => {},
    handleRefreshNetwork: () => {},
    closeEscLikeWindows: () => {},
    getOrCreateDeviceState: (() => ({})) as any,
    getOrCreateDeviceOutputs: (() => []) as any,
    setShowAboutModal: () => {},
    setTopologyKey: () => {},
    setIsTimelineMinimized: () => {},
    setClearSelectionTrigger: () => {},
    setSelectedDevice: () => {},
    setActiveDeviceId: () => {},
    setActiveDeviceType: () => {},
    setActiveTab: () => {},
    setUnifiedDeviceActiveTab: () => {},
    setShowUnifiedDeviceModal: () => {},
  });

  return (
    <input
      ref={ref}
      data-terminal-input
      onKeyDown={(e) => {
        if (e.key === 'Tab') (e.currentTarget as any)._gotTab = true;
      }}
    />
  );
}

describe('global shortcut handler must not block Tab in terminal inputs', () => {
  it('Tab reaches a focused terminal input when a panel/window is open', () => {
    const { container } = render(<Harness showPCPanel />);
    const input = container.querySelector('[data-terminal-input]') as HTMLInputElement;
    act(() => {
      input.focus();
      fireEvent.keyDown(input, { key: 'Tab' });
    });
    expect((input as any)._gotTab).toBe(true);
  });
});
