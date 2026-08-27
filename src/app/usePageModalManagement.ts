import { useEffect } from 'react';

interface PageModalManagementOptions {
  hasUnsavedChanges: boolean;
  modalHistoryPushedRef: { current: boolean };
  showMobileMenu: boolean;
  confirmDialog: unknown;
  saveDialog: unknown;
  showPCPanel: boolean;
  showFirewallPanel: boolean;
  showRouterPanel: boolean;
  showUnifiedDeviceModal: boolean;
  showAboutModal: boolean;
  showProjectPicker: boolean;
  showOnboarding: boolean;
  setShowMobileMenu: (value: boolean) => void;
  setConfirmDialog: (value: null) => void;
  setSaveDialog: (value: null) => void;
  setShowPCPanel: (value: boolean) => void;
  setShowRouterPanel: (value: boolean) => void;
  setShowUnifiedDeviceModal: (value: boolean) => void;
  setShowAboutModal: (value: boolean) => void;
  setShowProjectPicker: (value: boolean) => void;
  setShowOnboarding: (value: boolean) => void;
  setShowBasarilarim: (value: boolean) => void;
}

export function usePageModalManagement(options: PageModalManagementOptions): void {
  const {
    hasUnsavedChanges, modalHistoryPushedRef, showMobileMenu, confirmDialog, saveDialog,
    showPCPanel, showFirewallPanel, showRouterPanel, showUnifiedDeviceModal, showAboutModal,
    showProjectPicker, showOnboarding, setShowMobileMenu, setConfirmDialog, setSaveDialog,
    setShowPCPanel, setShowRouterPanel, setShowUnifiedDeviceModal, setShowAboutModal,
    setShowProjectPicker, setShowOnboarding, setShowBasarilarim,
  } = options;

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handlePopState = () => {
      setShowMobileMenu(false); setConfirmDialog(null); setSaveDialog(null);
      if (!showPCPanel) setShowPCPanel(false);
      setShowRouterPanel(false); setShowUnifiedDeviceModal(false); setShowAboutModal(false);
      setShowProjectPicker(false); setShowOnboarding(false); setShowBasarilarim(false);
      window.dispatchEvent(new CustomEvent('close-menus-broadcast', { detail: { source: 'back' } }));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showPCPanel, setShowMobileMenu, setConfirmDialog, setSaveDialog, setShowPCPanel, setShowRouterPanel, setShowUnifiedDeviceModal, setShowAboutModal, setShowProjectPicker, setShowOnboarding, setShowBasarilarim]);

  useEffect(() => {
    const anyModalOpen = showMobileMenu || !!confirmDialog || !!saveDialog || showPCPanel || showFirewallPanel || showRouterPanel || showUnifiedDeviceModal || showAboutModal || showProjectPicker || showOnboarding;
    if (anyModalOpen && !modalHistoryPushedRef.current) {
      window.history.pushState({ modal: true }, '');
      modalHistoryPushedRef.current = true;
    } else if (!anyModalOpen) {
      modalHistoryPushedRef.current = false;
    }
  }, [showMobileMenu, confirmDialog, saveDialog, showPCPanel, showFirewallPanel, showRouterPanel, showUnifiedDeviceModal, showAboutModal, showProjectPicker, showOnboarding, modalHistoryPushedRef]);
}
