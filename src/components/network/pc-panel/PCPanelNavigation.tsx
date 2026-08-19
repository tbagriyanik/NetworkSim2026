import { HiddenNavigationTabs } from './HiddenNavigationTabs';
import type { PCActiveTab } from './PCPanel.types';

interface PCPanelNavigationProps {
  activeTab: PCActiveTab;
  setActiveTab: (tab: PCActiveTab) => void;
  isMobile: boolean;
  language: string;
  httpAppContent: string | null;
  httpAppDeviceId: string | null;
  openWebPage: (target?: string, url?: string) => void;
  labels: {
    commandPromptTab: string;
    consoleTab: string;
    settingsTab: string;
    servicesTab: string;
  };
}

export function PCPanelNavigation(props: PCPanelNavigationProps) {
  return <HiddenNavigationTabs {...props} />;
}
