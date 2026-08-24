import { render, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { createRef } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useMultiWindowStore } from '@/hooks/useMultiWindowStore';

afterEach(cleanup);
beforeEach(() => {
  useMultiWindowStore.setState({ openWindows: [], isSwitcherOpen: false, switcherSelectedIndex: 0 });
});

const baseProps = {
  showMobileMenu: false,
  confirmDialog: null as null | { show: boolean; onConfirm: () => void },
  saveDialog: null as null | { show: boolean; onConfirm: (save: boolean) => void },
  showPCPanel: false,
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
  topologyDevices: [] as any[],
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
};

function TerminalHarness({ showPCPanel }: { showPCPanel: boolean }) {
  const ref = createRef<HTMLInputElement>();
  useKeyboardShortcuts({ ...baseProps, showPCPanel });
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

function ModalHarness({ showAboutModal }: { showAboutModal: boolean }) {
  useKeyboardShortcuts({ ...baseProps, showAboutModal });
  return (
    <div role="dialog">
      <button type="button">first</button>
      <button type="button">second</button>
      <input aria-label="third" />
    </div>
  );
}

describe('global shortcut handler', () => {
  it('Tab reaches a focused terminal input when a panel/window is open', () => {
    const { container } = render(<TerminalHarness showPCPanel />);
    const input = container.querySelector('[data-terminal-input]') as HTMLInputElement;
    act(() => {
      input.focus();
      fireEvent.keyDown(input, { key: 'Tab' });
    });
    expect((input as any)._gotTab).toBe(true);
  });

  it('Tab cycles focus within an open modal (first -> second)', () => {
    const { getByText } = render(<ModalHarness showAboutModal />);
    const first = getByText('first') as HTMLButtonElement;
    const second = getByText('second') as HTMLButtonElement;
    act(() => {
      first.focus();
      fireEvent.keyDown(first, { key: 'Tab' });
    });
    expect(document.activeElement).toBe(second);
  });

  it('Shift+Tab wraps focus within an open modal (first -> last)', () => {
    const { getByText, getByLabelText } = render(<ModalHarness showAboutModal />);
    const first = getByText('first') as HTMLButtonElement;
    const third = getByLabelText('third') as HTMLInputElement;
    act(() => {
      first.focus();
      fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    });
    expect(document.activeElement).toBe(third);
  });

  it('Shift+Tab in a focused CLI/CMD terminal input opens the window switcher', () => {
    useMultiWindowStore.setState({ openWindows: [{ id: 'w1' }, { id: 'w2' }] as any, isSwitcherOpen: false });
    const { container } = render(<TerminalHarness showPCPanel />);
    const input = container.querySelector('[data-terminal-input]') as HTMLInputElement;
    act(() => {
      input.focus();
      fireEvent.keyDown(input, { key: 'Tab', shiftKey: true });
    });
    expect(useMultiWindowStore.getState().isSwitcherOpen).toBe(true);
  });
});
