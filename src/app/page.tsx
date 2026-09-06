'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

import { SwitchState, CableInfo } from '@/lib/network/types';
import { useDeviceManager } from '@/hooks/useDeviceManager';
import { useNetworkLogic } from '@/hooks/useNetworkLogic';
import { usePageNetworkLogic } from '@/hooks/usePageNetworkLogic';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useDrag } from '@/hooks/useDrag';
import { useMultiTabWarning } from '@/hooks/useMultiTabWarning';
import { useLoadProjectData } from '@/hooks/useLoadProjectData';
import { useIsMobile, useIsTablet } from '@/hooks/use-breakpoint';
import { useMobileBack } from '@/hooks/useMobileBack';
import { usePanels } from '@/hooks/usePanels';
import { useRefreshReport } from '@/hooks/useRefreshReport';
import { useDeviceSelection } from '@/hooks/useDeviceSelection';
import { useAppStore, useTopologyDevices, useTopologyConnections, useTopologyNotes, useZoom, usePan, useActiveTab, useEnvironment } from '@/lib/store/appStore';
import { ExamTask } from '@/lib/network/examMode';
import { cn } from '@/lib/utils';
import { CanvasDevice, CanvasConnection, DeviceType } from '@/components/network/networkTopology.types';
import { getPrompt } from '@/lib/network/executor';
import { errorHandler, STORAGE_ERRORS } from '@/lib/errors/errorHandler';
import { safeParse } from '@/lib/network/serialization';
import { createInitialState } from '@/lib/network/initialState';
import type { TerminalOutput } from '@/components/network/Terminal';
import type { PcOutputsSetter } from '@/components/network/pc-panel/PCPanel.types';

const NetworkTopology = dynamic(
  () => import('@/components/network/NetworkTopology').then((m) => m.NetworkTopology),
  { ssr: false }
);



import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';


import {
  topologyTasks,
  portTasks,
  vlanTasks,
  securityTasks,
  wirelessTasks,
  routingTasks,
  dhcpTasks,
  calculateTaskScore,
  TaskContext,
  getTaskStatus
} from '@/lib/network/taskDefinitions';
import type { ExampleProject, ExampleProjectLevel } from '@/lib/network/exampleProjects';
import { getGuidedProjects } from '@/lib/network/guidedMode';
import { getExamProjects } from '@/lib/network/examMode';
import { buildRunningConfig } from '@/lib/network/core/configBuilder';
import { performanceMonitor } from '@/lib/performance/monitoring';
import { useGuidedMode } from '@/hooks/useGuidedMode';
import { useExamMode } from '@/hooks/useExamMode';
import { MultiDeviceWindowManager } from '@/components/network/MultiDeviceWindowManager';
import { WindowSwitcherModal } from '@/components/network/WindowSwitcherModal';
import { useMultiWindowStore } from '@/hooks/useMultiWindowStore';
import { useWindowStore } from '@/hooks/useWindowStore';

import { PCInfoPopover, RouterInfoPopover } from '@/components/network/DeviceInfoPopovers';
import { BasarilarimPanel } from '@/components/ui/BasarilarimPanel';
import { addSessionDuration, addGuidedLessonRecord, addExamRecord, addProjectRecord } from '@/utils/achievementRecords';
import { AppHeader } from '@/components/network/AppHeader';
import { AppFooter } from '@/components/network/AppFooter';
import { TopologyToolbar } from '@/components/network/TopologyToolbar';
import { bringElementToFront } from '@/lib/utils/zIndex';
import { AppSkeleton } from '@/components/ui/AppSkeleton';
import { AppErrorBoundary } from '@/components/ui/AppErrorBoundary';
import { useRoom } from '@/contexts/RoomContext';
import { useRoomSync } from '@/hooks/useRoomSync';
import { useToast } from '@/hooks/use-toast';


import { useNetworkSimulation } from '@/hooks/useNetworkSimulation';
import { useTroubleshootingMode } from '@/hooks/useTroubleshootingMode';
import { useProjectApplication } from '@/hooks/useProjectApplication';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRefreshNetwork } from '@/hooks/useRefreshNetwork';
import { useLoadProject } from '@/hooks/useLoadProject';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useProjectExport } from '@/hooks/useProjectExport';
import { useProjectReset } from '@/hooks/useProjectReset';
import { useAutoDhcpRenewal } from '@/hooks/useAutoDhcpRenewal';
import { useProjectAutosave } from '@/hooks/useProjectAutosave';
import { useCommandExecution } from '@/hooks/useCommandExecution';
import { usePageGlobalEvents } from '@/hooks/usePageGlobalEvents';
import { useTaskSync } from '@/hooks/useTaskSync';
import { useDeviceDelete } from '@/hooks/useDeviceDelete';
import { useNetworkEventListeners } from '@/hooks/useNetworkEventListeners';
import { usePWA } from '@/hooks/usePWA';
import { computeLiveSummary } from '@/lib/network/liveSummary';



const { RouterPanel, UnifiedDevicePanel, PCWindow, FirewallWindow, GuidedModePanel, ExamModePanel, EnvironmentSettingsPanel, ExamEditorPanel, TroubleshootingPanel, TimelinePanel, TabletSplitView, RefreshReportPanel } = {
  RouterPanel: dynamic(() => import('@/components/network/panels').then((m) => m.RouterPanel)),
  UnifiedDevicePanel: dynamic(() => import('@/components/network/panels').then((m) => m.UnifiedDevicePanel)),
  PCWindow: dynamic(() => import('@/components/network/panels').then((m) => m.PCWindow), { ssr: false }),
  FirewallWindow: dynamic(() => import('@/components/network/panels').then((m) => m.FirewallWindow), { ssr: false }),
  GuidedModePanel: dynamic(() => import('@/components/network/panels').then((m) => m.GuidedModePanel)),
  ExamModePanel: dynamic(() => import('@/components/network/panels').then((m) => m.ExamModePanel)),
  EnvironmentSettingsPanel: dynamic(() => import('@/components/network/panels').then((m) => m.EnvironmentSettingsPanel)),
  ExamEditorPanel: dynamic(() => import('@/components/network/panels').then((m) => m.ExamEditorPanel)),
  TroubleshootingPanel: dynamic(() => import('@/components/network/panels').then((m) => m.TroubleshootingPanel)),
  TimelinePanel: dynamic(() => import('@/components/network/panels').then((m) => m.TimelinePanel)),
  TabletSplitView: dynamic(() => import('@/components/network/panels').then((m) => m.TabletSplitView), { ssr: false }),
  RefreshReportPanel: dynamic(() => import('@/components/network/panels').then((m) => m.RefreshReportPanel), { ssr: false }),
};

const LazyAboutModal = dynamic(() => import('@/components/network/LazyAboutModal').then((m) => m.LazyAboutModal));
const ProjectPickerDialog = dynamic(() => import('@/components/network/ProjectPickerDialog').then((m) => m.ProjectPickerDialog));
const OnboardingDialog = dynamic(() => import('@/components/network/OnboardingDialog').then((m) => m.OnboardingDialog));
const PageModals = dynamic(() => import('@/components/network/panels/PageModals').then((m) => m.PageModals), { ssr: false });
const TopologyGeneratorDialog = dynamic(() => import('@/components/network/topology/TopologyGeneratorDialog').then(m => m.TopologyGeneratorDialog), { ssr: false });

import { TabType, ALL_TABS, exampleLevelOrder } from './page.types';
import { useHistory, ProjectState } from '@/hooks/useHistory';
import { serializeState } from './page.utils';
import { usePageProjectStorage } from './usePageProjectStorage';
import { usePageModalManagement } from './usePageModalManagement';
import { handlePageShortcut } from './pageKeyboardShortcuts';
import { usePageTopologyCallbacks } from './usePageTopologyCallbacks';

export default function Home({ initialProjectId }: { initialProjectId?: string }) {
  const { t, language, setLanguage } = useLanguage();
  const { theme, effectiveTheme, setTheme } = useTheme();
  const isTR = language === 'tr';


  // Multi-tab warning system
  const { showWarning, tabCount, acknowledgeWarning, clearCurrentTabData } = useMultiTabWarning();
  const { toast } = useToast();
  const { studentRoomCode, studentDisplayName, setShowRoomJoinDialog, setShowTeacherPanel } = useRoom();

  // Refs moved to top to avoid TDZ errors
  const isApplyingHistoryRef = useRef(false);
  const pendingHistoryActionRef = useRef<'undo' | 'redo' | 'jumpTo' | null>(null);
  const lastAppliedHistoryStateRef = useRef<ProjectState | null>(null);
  const lastPushedStateRef = useRef<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modalHistoryPushedRef = useRef(false);
  const refreshReportRef = useRef<HTMLDivElement>(null);

  // State moved to top to avoid TDZ errors
  const {
    showPCPanel, setShowPCPanel,
    showFirewallPanel, setShowFirewallPanel,
    activeFirewallId, setActiveFirewallId,
    firewallActiveTab, setFirewallActiveTab,
    pcPanelInitialTab, setPcPanelInitialTab,
    showPCDeviceId, setShowPCDeviceId,
    showRouterPanel, setShowRouterPanel,
    showRouterDeviceId, setShowRouterDeviceId,
    showUnifiedDeviceModal, setShowUnifiedDeviceModal,
    unifiedDeviceActiveTab, setUnifiedDeviceActiveTab,
    showAboutModal, setShowAboutModal,
    showMobileMenu, setShowMobileMenu,
    isEnvironmentPanelOpen, setIsEnvironmentPanelOpen,
    showProjectPicker, setShowProjectPicker,
    projectPickerTab, setProjectPickerTab,
    showOnboarding, setShowOnboarding,
    onboardingStep, setOnboardingStep,
    closeAllPanels,
  } = usePanels();
  const { refreshNetworkReport, setRefreshNetworkReport } = useRefreshReport();
  const {
    activeDeviceId, setActiveDeviceId,
    activeDeviceType, setActiveDeviceType,
    selectedDevice, setSelectedDevice,
    clearSelectionTrigger, setClearSelectionTrigger,
    deviceSearchQuery, setDeviceSearchQuery,
    focusDeviceId, setFocusDeviceId,
  } = useDeviceSelection();

  const { projectName, setProjectName, loadedExampleId, setLoadedExampleId } = usePageProjectStorage();
  const [topologyKey, setTopologyKey] = useState(0);
  // Track last executed command and its output for guided mode
  const [lastCommand, setLastCommand] = useState<string>('');
  const [lastOutput, setLastOutput] = useState<string>('');
  const [isAppLoading, setIsLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [showBasarilarim, setShowBasarilarim] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  usePWA();

  // Track session start time for achievement records
  const [sessionStart] = useState(() => Date.now());

  // Which overlay panel is on top — last clicked wins
  const [focusedOverlay, setFocusedOverlay] = useState<'refresh' | 'packet' | 'pc-info' | 'router-info' | 'switch-info'>('packet');

  // Mobile/Tablet detection and back button handler
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  useMobileBack();

  useEffect(() => {
    const handleMobileBack = () => {
      setRefreshNetworkReport(prev => prev ? { ...prev, show: false } : null);
    };
    window.addEventListener('mobile-back-pressed', handleMobileBack);
    return () => window.removeEventListener('mobile-back-pressed', handleMobileBack);
  }, []);

  // Guided Mode hook
  const {
    activeProject: activeGuidedProject,
    currentStepIndex: guidedStepIndex,
    isGuidedModeActive,
    isPanelMinimized,
    lastCompletedStep,
    startGuidedProject,
    completeStep,
    uncompleteStep,
    closeGuidedMode,
    togglePanelMinimize,
    expandPanel,
    checkStepCompletionWithContext,
    isCurrentStepReady,
    getAvailableProjects,
    isAllCompleted,
    currentPoints,
    totalPoints
  } = useGuidedMode();

  // Exam Mode hook
  const {
    activeExam,
    isExamActive,
    isExamFinished,
    isPanelMinimized: isExamPanelMinimized,
    startExam: startExamProject,
    finishExam,
    closeExam,
    togglePanelMinimize: toggleExamPanelMinimize,

    isEditorOpen,
    toggleEditor,
    addTask,
    updateTask,
    deleteTask,
    updateExamMeta,
    moveTask,
    smartBalanceWeights,
    exportExamFile,
    checkTasks: checkExamTasks,
    currentScore: examScore,
    getAvailableExams
  } = useExamMode();
  const [cableInfo, setCableInfo] = useState<CableInfo>({
    connected: true,
    cableType: 'straight',
    sourceDevice: 'pc',
    targetDevice: 'switchL2',
  });
  const [, setLastTaskEvent] = useState<{ type: 'completed' | 'failed'; taskName: string; timestamp: number } | null>(null);
  const [isPingPanelOpen, setIsPingPanelOpen] = useState(false);
  const [isExamLoadedFromFile, setIsExamLoadedFromFile] = useState(false);
  const [isTimelineMinimized, setIsTimelineMinimized] = useState(false);
  const toggleTimelineMinimize = useCallback(() => setIsTimelineMinimized(prev => !prev), []);

  const setActiveTab = useAppStore((state) => state.setActiveTab);

  const resetWorkspaceUiState = useCallback(() => {
    // Do not carry floating device windows from the previous project into
    // guided lessons or exams.
    useMultiWindowStore.getState().closeAllDeviceWindows();
    setActiveDeviceId('');
    setActiveDeviceType('switchL2');
    setSelectedDevice(null);
    setClearSelectionTrigger(prev => prev + 1);
    setShowPCPanel(false);
    setShowFirewallPanel(false);
    setActiveFirewallId(null);
    setFirewallActiveTab('console');
    setPcPanelInitialTab('home');
    setShowPCDeviceId('pc-1');
    setShowRouterPanel(false);
    setShowRouterDeviceId('router-1');
    setShowUnifiedDeviceModal(false);
    setUnifiedDeviceActiveTab('console');
    setShowAboutModal(false);
    setShowMobileMenu(false);
    setShowProjectPicker(false);
    setProjectPickerTab('all');
    setShowOnboarding(false);
    setOnboardingStep(0);
    setIsEnvironmentPanelOpen(false);
    setActiveTab('topology');
    setIsTimelineMinimized(true);
    setRefreshNetworkReport(null);
    setProjectSearchQuery('');
    setLoadedExampleId('');

    // Additional resets to prevent old project remnants
    setLastCommand('');
    setLastOutput('');
    setIsPingPanelOpen(false);
    setCableInfo({ connected: false, cableType: 'straight', sourceDevice: 'pc', targetDevice: 'switchL2' });
    setFocusedOverlay('packet');
    setLastTaskEvent(null);
  }, [
    setActiveDeviceId,
    setActiveDeviceType,
    setSelectedDevice,
    setClearSelectionTrigger,
    setShowPCPanel,
    setShowFirewallPanel,
    setActiveFirewallId,
    setFirewallActiveTab,
    setPcPanelInitialTab,
    setShowPCDeviceId,
    setShowRouterPanel,
    setShowRouterDeviceId,
    setShowUnifiedDeviceModal,
    setUnifiedDeviceActiveTab,
    setShowAboutModal,
    setShowMobileMenu,
    setShowProjectPicker,
    setProjectPickerTab,
    setShowOnboarding,
    setOnboardingStep,
    setIsEnvironmentPanelOpen,
    setActiveTab,
    setRefreshNetworkReport,
    setProjectSearchQuery,
    setLoadedExampleId,
    setLastCommand,
    setLastOutput,
    setIsPingPanelOpen,
    setCableInfo,
    setFocusedOverlay,
    setLastTaskEvent
  ]);



  // Record session duration on unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
      if (elapsed >= 10) {
        addSessionDuration(elapsed);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Record guided lesson completion when all steps done
  const prevGuidedRef = useRef(activeGuidedProject);
  const prevAllDoneRef = useRef(false);
  useEffect(() => {
    if (activeGuidedProject && isAllCompleted && !prevAllDoneRef.current) {
      const lessonName = typeof activeGuidedProject.title === 'string' ? activeGuidedProject.title : (activeGuidedProject.title as { tr?: string; en?: string })?.tr || (activeGuidedProject.title as { tr?: string; en?: string })?.en || 'Guided Lesson';
      addGuidedLessonRecord(lessonName, currentPoints, totalPoints);
    }
    prevAllDoneRef.current = !!isAllCompleted;
  }, [isAllCompleted, activeGuidedProject, currentPoints, totalPoints]);

  // Record guided lesson completion on close
  useEffect(() => {
    const prev = prevGuidedRef.current;
    if (prev && !activeGuidedProject && prev.steps.every(s => s.completed)) {
      const lessonName = typeof prev.title === 'string' ? prev.title : (prev.title as { tr?: string; en?: string })?.tr || (prev.title as { tr?: string; en?: string })?.en || 'Guided Lesson';
      const earned = prev.steps.filter(s => s.completed).reduce((sum, s) => sum + (s.points || 0), 0);
      const total = prev.steps.reduce((sum, s) => sum + (s.points || 0), 0);
      addGuidedLessonRecord(lessonName, earned, total);
    }
    prevGuidedRef.current = activeGuidedProject;
  }, [activeGuidedProject]);

  // Record exam completion
  useEffect(() => {
    if (isExamFinished && activeExam) {
      const maxScore = activeExam.tasks.reduce((sum, t) => sum + t.weight, 0);
      const examName = typeof activeExam.title === 'string' ? activeExam.title : (activeExam.title as { tr?: string; en?: string })?.tr || (activeExam.title as { tr?: string; en?: string })?.en || 'Exam';
      addExamRecord(examName, examScore, maxScore || 100);
    }
  }, [isExamFinished, activeExam, examScore]);




  const [saveDialog, setSaveDialog] = useState<{
    show: boolean;
    message: string;
    onConfirm: (save: boolean) => void;
  } | null>(null);

  const exampleLevelLabels = useMemo(
    () => ({
      basic: t.levelBasic,
      intermediate: t.levelIntermediate,
      advanced: t.levelAdvanced
    }),
    [t]
  );

  const exampleLevelHints = useMemo(
    () => ({
      basic: t.basicHint,
      intermediate: t.intermediateHint,
      advanced: (t as Record<string, string>).advancedHint ?? t.intermediateHint
    }),
    [t]
  );

  const [groupedExampleProjects, setGroupedExampleProjects] = useState<Record<ExampleProjectLevel, ExampleProject[]>>(
    () => ({ basic: [], intermediate: [], advanced: [] })
  );
  useEffect(() => {
    import('@/lib/network/exampleProjects').then(({ exampleProjects }) => {
      const grouping: Record<ExampleProjectLevel, ExampleProject[]> = { basic: [], intermediate: [], advanced: [] };
      exampleProjects(language).forEach((project) => grouping[project.level].push(project));
      setGroupedExampleProjects(grouping);
    });
  }, [language]);

  const {
    deviceStates,
    setDeviceStates,
    deviceOutputs,
    setDeviceOutputs,
    pcOutputs,
    setPcOutputs,
    pcHistories,
    setPcHistories,
    isLoading: isExecutingCommand,
    confirmDialog,
    setConfirmDialog,
    getOrCreateDeviceState,
    getOrCreateDeviceOutputs,
    getOrCreatePCOutputs,
    handleCommandForDevice,
  } = useDeviceManager();

  // Zustand store state - using granular selectors to prevent cascading re-renders
  const topologyDevices = useTopologyDevices();
  const topologyConnections = useTopologyConnections();
  const topologyNotes = useTopologyNotes();
  const zoom = useZoom();
  const pan = usePan();
  const activeTab = useActiveTab();
  const environment = useEnvironment();

  const helpLevel = useAppStore(state => state.helpLevel);
  const setHelpLevel = useAppStore((state) => state.setHelpLevel);

  const setDevices = useAppStore((state) => state.setDevices);
  const setConnections = useAppStore((state) => state.setConnections);
  const setNotes = useAppStore((state) => state.setNotes);
  const setZoom = useAppStore((state) => state.setZoom);
  const setPan = useAppStore((state) => state.setPan);
  const graphicsQuality = useAppStore((state) => state.graphicsQuality);
  const setGraphicsQuality = useAppStore((state) => state.setGraphicsQuality);

  // Navigation hook (provides history management, device selection, focus)
  const nav = useAppNavigation({
    setActiveTab: (tab: TabType) => setActiveTab(tab),
    setActiveDeviceId,
    setActiveDeviceType,
    setSelectedDevice,
    setZoom,
    setPan,
    topologyDevices,
    getOrCreatePCOutputs,
    getOrCreateDeviceState,
    getOrCreateDeviceOutputs,
  });
  const {
    setActiveTabWithHistory, setDeviceTabWithHistory, handlePCPanelNavigate,
    focusDeviceInTopology,
    activeTabRef,
    pendingFocusDeviceRef, topologyContainerRef,
  } = nav;

  // Network logic functions
  const networkLogic = useNetworkLogic(deviceStates, topologyConnections, environment);
  const { toggleDevicePower, updateDeviceConfig } = usePageNetworkLogic({
    setDeviceStates,
    topologyDevices,
    setTopologyDevices: setDevices,
    setTopologyConnections: setConnections,
    setDeviceOutputs,
    setPcOutputs,
    setPcHistories,
    setFocusDeviceId,
    setActiveFirewallId,
    setShowFirewallPanel,
    toast,
    t,
    activeTab,
    topologyContainerRef,
    setZoom: setZoom,
    focusDeviceInTopology,
    pendingFocusDeviceRef,
    graphicsQuality,
  });

  useEffect(() => {
    const handleOpenPcPanelEvent = (e: Event) => {
      const customEv = e as CustomEvent<{ deviceId?: string; program?: string; targetUrl?: string }>;
      const targetPcId = customEv.detail?.deviceId || topologyDevices.find(d => d.type === 'pc')?.id || 'pc-1';
      if (targetPcId) {
        setShowPCDeviceId(targetPcId);
        getOrCreatePCOutputs(targetPcId, topologyDevices);
        setPcPanelInitialTab('desktop');
        useMultiWindowStore.getState().openDeviceWindow(targetPcId, 'pc', 'desktop');
        useMultiWindowStore.getState().restoreWindow(targetPcId);
        useWindowStore.getState().setActiveWindow(targetPcId);
      }
    };

    window.addEventListener('trigger-open-pc-panel', handleOpenPcPanelEvent);
    return () => window.removeEventListener('trigger-open-pc-panel', handleOpenPcPanelEvent);
  }, [topologyDevices, getOrCreatePCOutputs, setShowPCDeviceId, setPcPanelInitialTab]);

  const {
    isTroubleshootingMinimized,
    setIsTroubleshootingMinimized,
    showTroubleshootingPanel,
    setShowTroubleshootingPanel,
    activeTroubleshootingProject
  } = useTroubleshootingMode({
    activeExam,
    loadedExampleId,
    exampleLevelOrder,
    groupedExampleProjects,
    deviceStates,
    language,
    toast
  });

  const { handleDeviceSelectFromCanvas, handleDeviceSelectFromMenu } = usePageTopologyCallbacks({
    selectFromCanvas: nav.handleDeviceSelectFromCanvas,
    selectFromMenu: nav.handleDeviceSelectFromMenu,
    restoreSelectedWindow: (deviceId) => {
      const windowStore = useMultiWindowStore.getState();
      if (windowStore.isWindowOpen(deviceId)) {
        windowStore.restoreWindow(deviceId);
        useWindowStore.getState().setActiveWindow(deviceId);
      }
    },
    closeUnified: setShowUnifiedDeviceModal,
    closeRouter: setShowRouterPanel,
    closeFirewall: setShowFirewallPanel,
    closePC: setShowPCPanel,
    checkStepCompletion: checkStepCompletionWithContext,
    deviceStates,
    topologyConnections,
    topologyDevices,
  });
  // Wrapper to match PCPanel's single-arg onNavigate signature
  const handlePCPanelNavigateWrapper = useCallback((program: string) => {
    handlePCPanelNavigate(program, activeDeviceId);
  }, [handlePCPanelNavigate, activeDeviceId]);

  const closeEscLikeWindows = useCallback(() => {
    setShowMobileMenu(false);
    setConfirmDialog(null);
    setSaveDialog(null);
    setShowPCPanel(false);
    setShowRouterPanel(false);
    setShowUnifiedDeviceModal(false);
    setShowAboutModal(false);
    setShowProjectPicker(false);
    setShowOnboarding(false);
    setShowBasarilarim(false);
    setShowTeacherPanel(false);
    setShowRoomJoinDialog(false);
    setIsGeneratorOpen(false);
    if (!isExamActive) {
      setRefreshNetworkReport(prev => prev ? { ...prev, show: false } : null);
    }
    window.dispatchEvent(new CustomEvent('close-menus-broadcast', { detail: { source: 'escape' } }));
  }, [isExamActive, setRefreshNetworkReport, setShowTeacherPanel, setShowRoomJoinDialog]);

  // During exam mode the help level must be at its minimum ('exam').
  // The previous level is captured once when the exam starts and restored
  // when it ends (so a freshly opened project returns to its old help level).
  const prevHelpLevelRef = useRef<'beginner' | 'intermediate' | 'exam' | null>(null);
  const prevIsExamActiveRef = useRef(false);
  useEffect(() => {
    if (isExamActive && !prevIsExamActiveRef.current) {
      prevHelpLevelRef.current = helpLevel;
      if (helpLevel !== 'exam') setHelpLevel('exam');
    } else if (!isExamActive && prevIsExamActiveRef.current) {
      if (prevHelpLevelRef.current && prevHelpLevelRef.current !== 'exam') {
        setHelpLevel(prevHelpLevelRef.current);
      }
      prevHelpLevelRef.current = null;
    }
    prevIsExamActiveRef.current = isExamActive;
  }, [isExamActive, helpLevel, setHelpLevel]);

  useEffect(() => {
    const handleMobileBack = () => {
      closeEscLikeWindows();
      closeAllPanels();
    };
    window.addEventListener('mobile-back-pressed', handleMobileBack as EventListener);
    return () => window.removeEventListener('mobile-back-pressed', handleMobileBack as EventListener);
  }, [closeAllPanels, closeEscLikeWindows]);

  usePageModalManagement({
    hasUnsavedChanges,
    modalHistoryPushedRef,
    showMobileMenu,
    confirmDialog,
    saveDialog,
    showPCPanel,
    showFirewallPanel,
    showRouterPanel,
    showUnifiedDeviceModal,
    showAboutModal,
    showProjectPicker,
    showOnboarding,
    setShowMobileMenu,
    setConfirmDialog,
    setSaveDialog,
    setShowPCPanel,
    setShowRouterPanel,
    setShowUnifiedDeviceModal,
    setShowAboutModal,
    setShowProjectPicker,
    setShowOnboarding,
    setShowBasarilarim,
  });

  useEffect(() => {
    const timer = setTimeout(() => setHasHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Bootstrap performance monitoring in development without affecting production UX.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const intervalId = window.setInterval(() => {
      const metrics = performanceMonitor.getMetrics();
      const thresholdStatus = performanceMonitor.checkThresholds();
      (window as unknown as { __netsimPerformance?: unknown }).__netsimPerformance = {
        metrics,
        thresholdStatus,
        timestamp: Date.now(),
      };
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  // Helper functions for state setters to maintain compatibility
  const setTopologyDevices = setDevices;
  const setTopologyConnections = setConnections;
  const setTopologyNotes = setNotes;

  // Currently active device in terminal

  useNetworkSimulation(deviceStates, setTopologyDevices, networkLogic);

  const liveSummary = useMemo(
    () => computeLiveSummary(topologyDevices, topologyConnections, deviceStates),
    [topologyDevices, topologyConnections, deviceStates]
  );



  // Reset scroll when topology is reset or project loaded
  useEffect(() => {
    if (topologyContainerRef.current) {
      topologyContainerRef.current.scrollTop = 0;
      topologyContainerRef.current.scrollLeft = 0;
    }
  }, [topologyKey]);



  // Modal drag/resize — unified hook
  const pcDrag = useDrag({ mode: 'drag-resize', storageKey: 'pc-modal-position', defaultSize: { width: 800, height: 600 }, disableSnap: true });
  const firewallDrag = useDrag({ mode: 'drag-resize', storageKey: 'firewall-modal-position', defaultSize: { width: 600, height: 500 }, disableSnap: true });
  const unifiedDrag = useDrag({ mode: 'drag-resize', storageKey: 'unified-modal-position', defaultSize: { width: 800, height: 600 }, disableSnap: true });
  const routerDrag = useDrag({ mode: 'drag-resize', storageKey: 'router-modal-position', defaultSize: { width: 800, height: 600 }, disableSnap: true });

  // Get current state helper
  const getCurrentState = useCallback((): ProjectState => ({
    topologyDevices: Array.isArray(topologyDevices) ? [...topologyDevices] : [],
    topologyConnections: Array.isArray(topologyConnections) ? [...topologyConnections] : [],
    topologyNotes: Array.isArray(topologyNotes) ? [...topologyNotes] : [],
    deviceStates: new Map(deviceStates || []),
    deviceOutputs: new Map(deviceOutputs || []),
    pcOutputs: new Map(pcOutputs || []),
    pcHistories: new Map(pcHistories || []),
    cableInfo: { ...cableInfo },
    activeDeviceId: activeDeviceId || '',
    activeDeviceType: activeDeviceType || 'switchL2',
    zoom,
    pan: { ...pan },
    activeTab
  }), [topologyDevices, topologyConnections, topologyNotes, deviceStates, deviceOutputs, pcOutputs, pcHistories, cableInfo, activeDeviceId, activeDeviceType, zoom, pan, activeTab]);

  const { pushState, undo, redo, canUndo, canRedo, resetHistory, currentState, historyItems, historyIndex, jumpTo, loadHistory } = useHistory(getCurrentState());

  const historyApplyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markApplyingHistory = useCallback(() => {
    isApplyingHistoryRef.current = true;
    if (historyApplyTimerRef.current) {
      clearTimeout(historyApplyTimerRef.current);
    }
    historyApplyTimerRef.current = setTimeout(() => {
      isApplyingHistoryRef.current = false;
    }, 1200);
  }, []);

  const pendingActionDesc = useRef<string | null>(null);
  const commitAction = useCallback((desc: string) => {
    pendingActionDesc.current = desc;
  }, []);

  // Handle undo/redo execution
  const applyProjectState = useCallback((state: ProjectState) => {
    markApplyingHistory();
    // We use functional updates to ensure we're using latest state and prevent loops if possible
    // but here we just want to set EVERYTHING at once.
    setTopologyDevices(state.topologyDevices);
    setTopologyConnections(state.topologyConnections);
    setTopologyNotes(state.topologyNotes || []);
    setDeviceStates(new Map(state.deviceStates));
    setDeviceOutputs(new Map(state.deviceOutputs));
    setPcOutputs(new Map(state.pcOutputs));
    setPcHistories(new Map(state.pcHistories || []));
    setCableInfo(state.cableInfo);
    setActiveDeviceId(state.activeDeviceId);
    setActiveDeviceType(state.activeDeviceType);
    setZoom(state.zoom);
    setPan(state.pan);
    if (state.activeTab) {
      setActiveTab(state.activeTab as TabType);
    }
    lastPushedStateRef.current = serializeState(state);
  }, [markApplyingHistory, setTopologyDevices, setTopologyConnections, setTopologyNotes, setDeviceStates, setDeviceOutputs, setPcOutputs, setPcHistories, setCableInfo, setActiveDeviceId, setActiveDeviceType, setZoom, setPan, setActiveTab]);

  const handleUndo = useCallback(() => {
    if (activeTabRef.current !== 'topology') return;
    markApplyingHistory();
    pendingHistoryActionRef.current = 'undo';
    undo();
  }, [undo, markApplyingHistory]);

  const handleRedo = useCallback(() => {
    if (activeTabRef.current !== 'topology') return;
    markApplyingHistory();
    pendingHistoryActionRef.current = 'redo';
    redo();
  }, [redo, markApplyingHistory]);

  const handleJumpTo = useCallback((index: number) => {
    markApplyingHistory();
    pendingHistoryActionRef.current = 'jumpTo';
    jumpTo(index);
  }, [jumpTo, markApplyingHistory]);

  useEffect(() => {
    if (!isApplyingHistoryRef.current) return;
    if (!currentState) return;
    if (lastAppliedHistoryStateRef.current === currentState) return;

    applyProjectState(currentState);
    lastAppliedHistoryStateRef.current = currentState;
  }, [currentState, applyProjectState]);

  // Track changes and push to history
  // We need to debouncing this or use a ref to track if we're in the middle of an undo/redo

  // Initialize lastPushedStateRef with initial state to avoid redundant first push
  useEffect(() => {
    lastPushedStateRef.current = serializeState(getCurrentState());
  }, []); // Run once on mount

  useEffect(() => {
    if (isAppLoading) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const stateString = serializeState(getCurrentState());

    if (stateString !== lastPushedStateRef.current) {
      if (isApplyingHistoryRef.current) {
        // Keep lastPushedStateRef in sync while history is being navigated/played back
        lastPushedStateRef.current = stateString;
      } else if (pendingActionDesc.current) {
        // Small timeout ensures all React batch updates are captured
        // We do NOT clear pendingActionDesc.current synchronously to prevent losing actions on rapid re-renders
        timer = setTimeout(() => {
          const s = getCurrentState();
          const freshStateString = serializeState(s);

          if (pendingActionDesc.current) {
            pushState(s, activeTab === 'topology' ? 'topology' : 'ui', pendingActionDesc.current);
            pendingActionDesc.current = null;
          }
          lastPushedStateRef.current = freshStateString;
        }, 150); // Slightly larger debounce to capture all cascading state updates
      } else {
        // Auto-push state changes to history with debounce (coalesces rapid changes like drag)
        // CRITICAL GUARD: Only auto-push if we are at the end of history!
        // If navigating past steps, unprompted background diffs MUST NOT slice/corrupt future history!
        if (historyIndex === historyItems.length - 1) {
          timer = setTimeout(() => {
            if (isApplyingHistoryRef.current) return;
            const freshState = getCurrentState();
            pushState(freshState, activeTab === 'topology' ? 'topology' : 'ui', undefined);
            lastPushedStateRef.current = serializeState(freshState);
          }, 300);
        } else {
          lastPushedStateRef.current = stateString;
        }
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [topologyDevices, topologyConnections, topologyNotes, deviceStates, deviceOutputs, pcOutputs, pcHistories, cableInfo, activeDeviceId, activeDeviceType, zoom, pan, activeTab, isAppLoading, pushState, historyIndex, historyItems.length]);

  // Show hourglass cursor during app startup
  useEffect(() => {
    document.body.style.cursor = 'wait';
    return () => { document.body.style.cursor = ''; };
  }, []);

  useEffect(() => {
    if (!isAppLoading) {
      document.body.style.cursor = '';
    }
  }, [isAppLoading]);

  useEffect(() => {
    // Initial loading sequence: short splash, then skeleton, then content.
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const splashMs = prefersReducedMotion ? 300 : 700;
    const skeletonMs = splashMs + 400;

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, splashMs);

    const skeletonTimer = setTimeout(() => {
      setShowSkeleton(false);
    }, skeletonMs);

    return () => {
      clearTimeout(timer);
      clearTimeout(skeletonTimer);
    };
  }, []);



  // Legacy state for compatibility with other panels (uses active device's state)
  const state = useMemo(() => {
    if (!activeDeviceId || activeDeviceId.trim() === '') {
      return createInitialState();
    }
    const activeDevice = (topologyDevices || []).find(d => d.id === activeDeviceId);
    const resolvedType = activeDevice?.type ?? activeDeviceType;
    return getOrCreateDeviceState(activeDeviceId, resolvedType, activeDevice?.name, activeDevice?.macAddress, activeDevice?.switchModel);
  }, [activeDeviceId, activeDeviceType, topologyDevices, deviceStates, getOrCreateDeviceState]);
  const output = useMemo(() => {
    if (!activeDeviceId || activeDeviceId.trim() === '') {
      return [] as TerminalOutput[];
    }
    return getOrCreateDeviceOutputs(activeDeviceId, state);
  }, [activeDeviceId, state, getOrCreateDeviceOutputs]);
  const isTaskSystemEnabled = activeDeviceType === 'switchL2' || activeDeviceType === 'switchL3' || activeDeviceType === 'router';
  const activeDeviceTasks = useMemo(
    () => isTaskSystemEnabled
      ? [...topologyTasks, ...portTasks, ...vlanTasks, ...securityTasks, ...dhcpTasks, ...(activeDeviceType === 'router' || activeDeviceType === 'switchL3' ? routingTasks : []), ...(activeDeviceType !== 'switchL2' ? wirelessTasks : [])]
      : [],
    [activeDeviceType, isTaskSystemEnabled]
  );

  // Redundant declaration of activeTab removed (moved higher)
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Task context for task calculations
  const taskContext: TaskContext = {
    cableInfo,
    showPCPanel,
    showRouterPanel,
    selectedDevice,
    language,
    deviceStates,
    topologyConnections,
  };

  // Track task completion changes globally
  useTaskSync({
    isTaskSystemEnabled,
    activeDeviceTasks,
    state,
    taskContext,
    language,
    activeDeviceType,
    setLastTaskEvent
  });

  // Calculate total score
  const totalScore = isTaskSystemEnabled ? calculateTaskScore(activeDeviceTasks, state, taskContext) : 0;

  // Calculate max possible score
  const maxScore = activeDeviceTasks.reduce((acc, task) => acc + task.weight, 0);

  // Room sync data
  const completedTaskCount = activeDeviceTasks.filter(t => getTaskStatus(t, state, taskContext)).length;
  const totalTaskCount = activeDeviceTasks.length;
  const currentTaskName = activeDeviceTasks.length > 0
    ? activeDeviceTasks.find(t => !getTaskStatus(t, state, taskContext))?.name[language] ?? activeDeviceTasks[activeDeviceTasks.length - 1].name[language]
    : '';
  useRoomSync({
    roomCode: studentRoomCode,
    displayName: studentDisplayName,
    currentTask: currentTaskName,
    completedTasks: completedTaskCount,
    totalTasks: totalTaskCount,
    projectFile: projectName !== 'Untitled' ? projectName : undefined,
    durationMinutes: activeExam?.durationMinutes,
  });

  const { normalizeDeviceType, isValidIpv4, isSameSubnetByMask,
    buildLinkLocalLease, assignDhcpLeaseForPc, applyLinkLocalToUnconfiguredHosts,
    applyIotAutomationPass: iotAutomationPass } = networkLogic;



  // Persistence: Save to localStorage
  useProjectAutosave({
    isAppLoading,
    topologyDevices,
    topologyConnections,
    topologyNotes,
    deviceStates,
    deviceOutputs,
    pcOutputs,
    pcHistories,
    cableInfo,
    activeDeviceId,
    activeDeviceType,
    activeTab,
    zoom,
    pan,
    setLastSaveTime,
    setHasUnsavedChanges
  });

  // Restore saved position for refresh network report
  useEffect(() => {
    if (!refreshNetworkReport?.show || !refreshReportRef.current) return;
    if (isMobile) return; // Mobile'da floating davranışı gereksiz
    try {
      const saved = localStorage.getItem('draggable_position_refresh-network-report');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const el = refreshReportRef.current;
          const rect = el.getBoundingClientRect();
          // Güvenli bölgeye konumla (header altı, ekran dışına taşma koruması)
          const safeX = Math.max(4, Math.min(parsed.x, vw - rect.width - 4));
          const safeY = Math.max(128, Math.min(parsed.y, vh - rect.height - 4));
          el.style.position = 'fixed';
          el.style.left = `${safeX}px`;
          el.style.top = `${safeY}px`;
          el.style.right = 'auto';
          el.style.bottom = 'auto';
          el.style.transform = 'none';
        }
      }
    } catch { /* ignore */ }
  }, [refreshNetworkReport?.show, isMobile]);

  // Load project from JSON data
  const loadProjectData = useLoadProjectData({
    setDeviceStates,
    setDeviceOutputs,
    setPcOutputs,
    setPcHistories,
    setActiveDeviceId,
    setActiveDeviceType,
    setSelectedDevice,
    setCableInfo,
    setTopologyKey,
    setHasUnsavedChanges,
    resetHistory,
    loadHistory,
    normalizeDeviceType,
    applyLinkLocalToUnconfiguredHosts,
    resetWorkspaceUiState,
    startExamProject,
  });



  const handleRefreshNetwork = useRefreshNetwork({
    setActiveDeviceId,
    setSelectedDevice,
    setTopologyConnections,
    setPcOutputs,
    setDeviceStates,
    setTopologyDevices,
    setRefreshNetworkReport,
    topologyDevices,
    topologyConnections,
    deviceStates,
    pcOutputs,
    language,
    t,
    isValidIpv4,
    isSameSubnetByMask,
    iotAutomationPass,
    assignDhcpLeaseForPc,
    buildLinkLocalLease,
    toast,
  });


  // Auto-renew DHCP for devices with link-local IPs and sequential DHCP toasts
  useAutoDhcpRenewal({
    topologyDevices,
    deviceStates,
    assignDhcpLeaseForPc,
    buildLinkLocalLease,
    setTopologyDevices,
    pcOutputs,
    setPcOutputs,
    loadedExampleId,
    toast,
    language,
    t,
    handleRefreshNetwork,
    setLoadedExampleId
  });

  const {
    onboardingSteps,
    closeOnboardingForever,
    nextOnboarding,
    prevOnboarding
  } = useOnboarding({
    t,
    setShowOnboarding,
    setOnboardingStep,
    onboardingStep,
    isAppLoading,
    hasHydrated
  });

  // Sync active tab when device type changes
  useEffect(() => {
    const currentTabDef = ALL_TABS.find(t => t.id === activeTab);
    if (currentTabDef && !currentTabDef.showFor.includes(activeDeviceType)) {
      // Keep current tab when possible; otherwise fallback to topology
      setActiveTabWithHistory('topology');
    }
  }, [activeDeviceType, activeTab]);




  // Handle command using active device
  const { handleCommand, handleExecuteCommand } = useCommandExecution({
    activeDeviceId,
    activeDeviceType,
    topologyDevices,
    topologyConnections,
    deviceStates,
    state,
    isGuidedModeActive,
    showUnifiedDeviceModal,
    setActiveDeviceId,
    setActiveDeviceType,
    setActiveTab,
    setLastCommand,
    setLastOutput,
    commitAction,
    checkStepCompletionWithContext,
    handleCommandForDevice
  });

  const prompt = getPrompt(state);

  usePageGlobalEvents({
    topologyDevices,
    topologyConnections,
    deviceStates,
    state,
    isGuidedModeActive,
    setLastCommand,
    setLastOutput,
    commitAction,
    checkStepCompletionWithContext,
    setShowPCDeviceId,
    setPcPanelInitialTab,
    setShowPCPanel,
    setActiveDeviceId,
    setActiveDeviceType,
    setUnifiedDeviceActiveTab,
    setShowUnifiedDeviceModal,
    setActiveTab
  });



  const handleClearTerminal = () => {
    setDeviceOutputs(prev => {
      const newMap = new Map(prev);
      newMap.set(activeDeviceId, []);
      return newMap;
    });
  };

  const focusActiveTerminalInput = useCallback(() => {
    requestAnimationFrame(() => {
      const el = document.querySelector('[data-terminal-input]') as HTMLInputElement | null;
      const terminal = document.querySelector('[data-terminal-scroll]') as HTMLDivElement | null;
      if (terminal) {
        terminal.scrollTop = terminal.scrollHeight;
      }
      el?.focus();
    });
  }, []);

  // Handle device double click (Open terminal or PC panel)
  const handleDeviceDoubleClick = useCallback((device: DeviceType, deviceId: string) => {
    const { openDeviceWindow, restoreWindow } = useMultiWindowStore.getState();

    if (device === 'pc') {
      // PC - open Home modal
      setShowPCDeviceId(deviceId);
      getOrCreatePCOutputs(deviceId, topologyDevices);
      setPcPanelInitialTab('home');
      openDeviceWindow(deviceId, 'pc', 'home');
    } else if (device === 'iot' || device === 'router' || device === 'switchL2' || device === 'switchL3' || device === 'wlc' || device === 'hub' || device === 'cloud' || device === 'printer' || device === 'mobile') {
      // IoT, Switch, Router, WLC, Hub, Cloud, Printer, or Mobile - open device panel window
      const deviceObj = topologyDevices?.find(d => d.id === deviceId);
      const deviceState = getOrCreateDeviceState(deviceId, device, deviceObj?.name, deviceObj?.macAddress, deviceObj?.switchModel);
      getOrCreateDeviceOutputs(deviceId, deviceState);

      setActiveDeviceId(deviceId);
      setActiveDeviceType(device);
      setUnifiedDeviceActiveTab('console');
      openDeviceWindow(deviceId, device, 'console');
    }

    // Selecting/opening a device always brings its floating window to the
    // front and expands it if it was collapsed.
    restoreWindow(deviceId);
    useWindowStore.getState().setActiveWindow(deviceId);
  }, [getOrCreateDeviceState, getOrCreateDeviceOutputs, topologyDevices, setDeviceTabWithHistory, setShowPCDeviceId, setActiveDeviceId, setActiveDeviceType]);


  // Handle device deletion - update active device if needed
  const handleDeviceDelete = useDeviceDelete({
    showPCDeviceId,
    showRouterDeviceId,
    activeDeviceId,
    selectedDevice,
    setShowPCPanel,
    setShowPCDeviceId,
    setShowRouterPanel,
    setShowRouterDeviceId,
    setSelectedDevice,
    setActiveDeviceId,
    setActiveDeviceType,
    setTopologyConnections,
    setDeviceStates,
    setDeviceOutputs,
    setPcOutputs,
    setTopologyDevices,
    setActiveTab,
    setHasUnsavedChanges,
  });

  // Handle device rename - propagate topology label change to deviceStates hostname
  const handleDeviceRename = useCallback((deviceId: string, newName: string) => {
    setDeviceStates(prev => {
      const state = prev.get(deviceId);
      if (!state) return prev;
      const updated = { ...state, hostname: newName };
      updated.runningConfig = buildRunningConfig(updated);
      return new Map(prev).set(deviceId, updated);
    });
  }, [setDeviceStates]);

  const handleUpdateHistory = useCallback((deviceId: string, history: string[]) => {
    setDeviceStates(prev => {
      const state = prev.get(deviceId);
      if (state) {
        return new Map(prev).set(deviceId, { ...state, commandHistory: history });
      }
      return prev;
    });
  }, [setDeviceStates]);

  const handleUpdatePCHistory = useCallback((deviceId: string, history: string[]) => {
    setPcHistories(prev => new Map(prev).set(deviceId, history));
  }, [setPcHistories]);

  const { handleSaveProject, getFullProjectData } = useProjectExport({
    deviceStates,
    deviceOutputs,
    pcOutputs,
    pcHistories,
    topologyDevices,
    topologyConnections,
    topologyNotes,
    cableInfo,
    activeDeviceId,
    activeDeviceType,
    historyItems,
    historyIndex,
    activeExam,
    language,
    projectName,
    setProjectName,
    setHasUnsavedChanges,
    setLastSaveTime,
    toast,
    addProjectRecord,
    t
  });

  // Save project to JSON file


  // New project - reset everything
  const { resetToEmptyProject } = useProjectReset({
    setDeviceStates,
    setDeviceOutputs,
    setPcOutputs,
    setPcHistories,
    setTopologyDevices,
    setTopologyConnections,
    setTopologyNotes,
    setActiveDeviceId,
    setActiveDeviceType,
    setSelectedDevice,
    setShowPCPanel,
    setShowRouterPanel,
    setActiveTab,
    setHasUnsavedChanges,
    setTopologyKey,
    setZoom,
    setPan,
    closeGuidedMode,
    closeExam,
    setProjectName,
    setRefreshNetworkReport,
    resetHistory
  });

  const runWithSaveGuard = useCallback((action: () => void) => {
    if (hasUnsavedChanges) {
      setSaveDialog({
        show: true,
        message: t.unsavedChangesConfirm,
        onConfirm: (save: boolean) => {
          setSaveDialog(null);
          if (save) {
            handleSaveProject();
          }
          action();
        }
      });
      return;
    }
    action();
  }, [hasUnsavedChanges, handleSaveProject, setSaveDialog, t.unsavedChangesConfirm]);

  const handleGeneratedTopology = useCallback((data: {
    devices: CanvasDevice[];
    connections: CanvasConnection[];
    deviceStates: Map<string, SwitchState>;
    projectName?: string;
    projectDescription?: string;
  }) => {
    // Clear existing and set generated
    resetWorkspaceUiState();
    resetToEmptyProject();
    setDevices(data.devices);
    setConnections(data.connections);
    setDeviceStates(data.deviceStates);
    setNotes([]);
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    if (data.projectName) {
      setProjectName(data.projectName);
    }

    if (data.projectDescription) {
      localStorage.setItem('lastProjectDescription', data.projectDescription);
    } else {
      localStorage.removeItem('lastProjectDescription');
    }

    // Automatically trigger "add-summary-note" to create the summary canvas note
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('add-summary-note'));
    }, 500);
  }, [resetWorkspaceUiState, resetToEmptyProject, setDevices, setConnections, setDeviceStates, setNotes, setZoom, setPan, setProjectName]);

  useEffect(() => {
    const handleOpenGenerator = () => setIsGeneratorOpen(true);
    window.addEventListener('trigger-topology-generator', handleOpenGenerator);
    return () => window.removeEventListener('trigger-topology-generator', handleOpenGenerator);
  }, []);

  function handleNewProject() {
    setProjectSearchQuery(''); // Reset search when opening new project dialog
    closeExam();
    resetWorkspaceUiState();
    runWithSaveGuard(() => setShowProjectPicker(true));
  }

  // Sync hostname changes between Topology and Simulator
  useEffect(() => {
    if (!topologyDevices) return;

    let topologyChanged = false;

    const updatedTopologyDevices = topologyDevices.map(device => {
      if (device.type === 'pc') return device;

      const deviceState = deviceStates.get(device.id);
      if (!deviceState) return device;

      // If simulator has a different hostname than topology, simulator wins (manual change via CLI/Panel)
      if (deviceState.hostname !== device.name) {
        // If the simulator name changed, update topology
        topologyChanged = true;
        return { ...device, name: deviceState.hostname };
      }
      return device;
    });

    if (topologyChanged) {
      setTopologyDevices(updatedTopologyDevices);
      setTimeout(() => setHasUnsavedChanges(true), 0);
    }
  }, [deviceStates, topologyDevices, setTopologyDevices, setHasUnsavedChanges]);

  // Sync services (HTTP, etc.) from deviceStates to topologyDevices
  useEffect(() => {
    if (!topologyDevices) return;

    let topologyChanged = false;

    const updatedTopologyDevices = topologyDevices.map(device => {
      const deviceState = deviceStates.get(device.id);
      if (!deviceState) return device;

      // Check if services state differs
      const currentServices = device.services || {};
      const stateServices = deviceState.services || {};

      // Check HTTP service
      const httpEnabledFromState = stateServices.http?.enabled;
      const httpEnabled = typeof httpEnabledFromState === 'boolean' ? httpEnabledFromState : currentServices.http?.enabled;
      const currentHttpEnabled = currentServices.http?.enabled || false;

      // Only sync when the simulator actually has an opinion; avoid forcing false when state is undefined
      if (typeof httpEnabled === 'boolean' && httpEnabled !== currentHttpEnabled) {
        topologyChanged = true;
        return {
          ...device,
          services: {
            ...currentServices,
            http: {
              ...currentServices.http,
              enabled: httpEnabled,
              content: currentServices.http?.content || ''
            }
          }
        };
      }

      return device;
    });

    if (topologyChanged) {
      setTopologyDevices(updatedTopologyDevices);
      setTimeout(() => setHasUnsavedChanges(true), 0);
    }
  }, [deviceStates, topologyDevices, setTopologyDevices, setHasUnsavedChanges]);

  // Derive visible tabs based on current state
  const tabs = [{ ...ALL_TABS[0], label: t.networkTopology }];

  // Automatically trigger DHCP refresh when wireless clients connect
  const dhcpRefreshAttemptRef = useRef<string | null>(null);
  useEffect(() => {
    const dhcpClients = topologyDevices.filter(d => (d.type === 'pc' || d.type === 'iot') && d.ipConfigMode === 'dhcp');
    if (dhcpClients.length === 0) return;

    // Check if any client has no valid IP but is connected to WiFi or has a cable
    const needsDhcp = dhcpClients.some(pc => {
      const hasValidIp = (ip: string | undefined) => !!ip && ip !== '0.0.0.0' && !ip.startsWith('169.254.');
      if (hasValidIp(pc.ip)) return false;

      // Check if connected via WiFi
      if (pc.wifi?.enabled && pc.wifi?.ssid && pc.wifi?.bssid) return true;

      // Check if connected via cable
      const isConnectedViaCable = topologyConnections.some(c =>
        c.active !== false && (c.sourceDeviceId === pc.id || c.targetDeviceId === pc.id)
      );
      return isConnectedViaCable;
    });

    if (needsDhcp) {
      // Prevent an unsuccessful refresh from retriggering itself forever.
      // A changed client/IP/connection signature allows a later retry.
      const refreshSignature = [
        ...dhcpClients.map(d => `${d.id}:${d.ip || ''}:${d.wifi?.ssid || ''}`),
        ...topologyConnections
          .filter(c => c.active !== false)
          .map(c => `${c.id}:${c.sourceDeviceId}:${c.targetDeviceId}`)
      ].sort().join('|');
      if (dhcpRefreshAttemptRef.current === refreshSignature) return;
      // Mark the attempt before scheduling it. The refresh itself can change
      // topology state and clean up this effect before the timer fires.
      dhcpRefreshAttemptRef.current = refreshSignature;

      const timer = setTimeout(() => {
        handleRefreshNetwork();
      }, 2000); // Debounce refresh by 2 seconds
      return () => clearTimeout(timer);
    }
    return;
  }, [topologyDevices, topologyConnections, handleRefreshNetwork]);

  useKeyboardShortcuts({
    showMobileMenu,
    confirmDialog,
    saveDialog,
    showPCPanel,
    showRouterPanel,
    showFirewallPanel,
    showUnifiedDeviceModal,
    showAboutModal,
    showProjectPicker,
    showOnboarding,
    isTimelineMinimized,
    selectedDevice,
    activeDeviceId,
    activeTab,
    topologyDevices,
    activeTabRef,
    fileInputRef,
    handleSaveProject,
    handleNewProject,
    handleUndo,
    handleRedo,
    handleDeviceDoubleClick,
    handleRefreshNetwork,
    closeEscLikeWindows,
    getOrCreateDeviceState,
    getOrCreateDeviceOutputs,
    setShowMobileMenu,
    setShowPCPanel,
    setShowRouterPanel,
    setShowProjectPicker,
    setShowAboutModal,
    setTopologyKey,
    setIsTimelineMinimized,
    setClearSelectionTrigger,
    setSelectedDevice,
    setActiveDeviceId,
    setActiveDeviceType,
    setActiveTab,
    setUnifiedDeviceActiveTab,
    setShowUnifiedDeviceModal,
    tabs,
  });

  useNetworkEventListeners({
    setDeviceStates,
    deviceStates,
    activeTabRef,
    setActiveTab,
  });

  // Load project from JSON file
  const handleLoadProject = useLoadProject({
    loadProjectData: loadProjectData as (data: unknown) => boolean,
    setHasUnsavedChanges,
    setZoom,
    setPan,
    setProjectName,
    closeGuidedMode,
    closeExam,
    setRefreshNetworkReport,
    setIsExamLoadedFromFile,
    startExamProject,
    resetToEmptyProject,
    hasUnsavedChanges,
    handleSaveProject,
    setSaveDialog,
    language,
    t,
    toast,
  });

  const {
    applyExampleProjectAsTemplate,
    applyExampleProject,
    startExamFromCatalog,
    handleConvertProjectToExam,
    handleStartGuidedProject,
  } = useProjectApplication({
    loadProjectData,
    setShowProjectPicker,
    setZoom,
    setPan,
    setProjectName,
    setLoadedExampleId,
    setRefreshNetworkReport,
    closeGuidedMode,
    closeExam,
    startExamProject,
    startGuidedProject,
    toggleEditor,
    setIsExamLoadedFromFile,
    resetWorkspaceUiState,
    resetToEmptyProject,
    groupedExampleProjects,
    exampleLevelOrder,
    projectName,
    language,
    toast,
  });

  // Track project name from guided/exam mode
  useEffect(() => {
    if (activeGuidedProject) {
      setTimeout(() => setProjectName(activeGuidedProject.title), 0);

      // Auto-focus target device for the current step to act as a "Wizard pointer"
      if (guidedStepIndex < activeGuidedProject.steps.length) {
        const step = activeGuidedProject.steps[guidedStepIndex];
        const targetId = step.checkParams?.targetDeviceId || step.checkParams?.sourceDevice;
        if (targetId) {
          const device = topologyDevices.find(d => d.id === targetId);
          if (device) {
            setFocusDeviceId(targetId);
            // Pan and zoom to the target device
            focusDeviceInTopology(targetId, 1.0, device);
            // Auto-clear focus after 3 seconds so it doesn't stay locked
            setTimeout(() => setFocusDeviceId(null), 3000);
          }
        }
      }
    } else if (activeExam) {
      setTimeout(() => setProjectName(activeExam.title), 0);
      // Auto-open editor for blank templates
      if (activeExam.isCustom && activeExam.tasks.length === 0) {
        toggleEditor(true);
      }
    }
  }, [activeGuidedProject, activeExam, toggleEditor]);

  // Persistence: Load from URL ID or localStorage on mount
  useEffect(() => {
    if (initialProjectId) {
      // 1. Try example projects (dynamic import — not in initial bundle)
      import('@/lib/network/exampleProjects').then(({ exampleProjects }) => {
        const examples = exampleProjects(language);
        const example = examples.find(p => p.id === initialProjectId);
        if (example) {
          setTimeout(() => applyExampleProject(example.data, example.id), 0);
          return;
        }
      });

      // 2. Try guided projects (Lessons)
      const lessons = getGuidedProjects(language);
      const lesson = lessons.find(p => p.id === initialProjectId);
      if (lesson) {
        setTimeout(() => handleStartGuidedProject(lesson), 0);
        // Note: applyExampleProject or startGuidedProject handles topology loading
        return;
      }

      // 3. Try exams
      const exams = getExamProjects(language);
      const exam = exams.find(p => p.id === initialProjectId);
      if (exam) {
        setTimeout(() => startExamFromCatalog(exam), 0);
        return;
      }
    }

    let savedData: string | null = null;
    try { savedData = localStorage.getItem('netsim_autosave'); } catch { /* storage unavailable */ }
    if (savedData && savedData.trim() !== '' && savedData !== 'undefined' && savedData !== 'null') {
      try {
        const projectData = safeParse<unknown>(savedData);
        if (projectData && typeof projectData === 'object') {
          setTimeout(() => loadProjectData(projectData, { keepActiveDevice: true }), 0);
          // Load last save time from timestamp
          const parsedProject = projectData as Record<string, unknown>;
          if (parsedProject?.timestamp) {
            const date = new Date(String(parsedProject.timestamp));
            setTimeout(() => setLastSaveTime(date.toLocaleTimeString()), 0);
          } else {
            setTimeout(() => setLastSaveTime(new Date().toLocaleTimeString()), 0);
          }
        }
      } catch (e) {
        errorHandler.logError(STORAGE_ERRORS.LOAD_FAILED({ operation: 'autosave', error: String(e) }));
        try { localStorage.removeItem('netsim_autosave'); } catch { /* ignore */ }
      }
    }

  }, [loadProjectData]);

  const isDark = (effectiveTheme ?? theme) === 'dark';
  const isRoomEnabled = process.env.NEXT_PUBLIC_IS_ROOM_ENABLED === 'true';

  return (
    <AppErrorBoundary fallbackTitle={t.applicationError}>
      <div className={cn("h-dvh w-full flex flex-col relative transition-colors duration-700 overflow-x-hidden", isAppLoading ? 'bg-secondary-950' : (isDark ? 'bg-secondary-950' : 'bg-secondary-50'))}>
        {!isAppLoading && (
          <div className="fixed inset-0 pointer-events-none z-0 opacity-40 dark:opacity-20 transition-opacity duration-1000">
            <div className="absolute inset-0 mesh-gradient animate-liquid blur-[100px] scale-150 rotate-12" />
            <div className="absolute inset-0 bg-white/40 dark:bg-secondary-950/40" />
          </div>
        )}
        {/* App Loading Screen */}
        {isAppLoading && (
          <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-secondary-950">
            <div className="flex flex-col items-center animate-scale-in">
              <div className="relative mb-8">
                <div className="p-2 animate-glitch">
                  <Image src="/app.png" alt="Logo" width={64} height={64} className="w-16 h-16 object-contain" priority />
                </div>
                {/* Glitch overlays */}
                <div className="absolute inset-0 p-4 rounded-2xl bg-error-500/30 animate-glitch-skew mix-blend-screen" />
                <div className="absolute inset-0 p-4 rounded-2xl bg-primary-500/30 animate-glitch mix-blend-screen" style={{ animationDelay: '0.1s' }} />
              </div>

              <h1
                className="text-3xl font-black tracking-tighter text-white glitch-text mb-2 text-center"
                data-text="NETWORK SIMULATOR"
              >
                NETWORK SIMULATOR
              </h1>

              <div className="flex items-center gap-2 mt-4">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
                <span className="text-xs font-bold tracking-widest text-accent-500 ">
                  {t.initializingSystem}
                </span>
              </div>
            </div>

            {/* Background scanline effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%]" />
          </div>
        )}

        {/* Skeleton Loading State */}
        {showSkeleton && !isAppLoading && (
          <div className="fixed inset-0 z-[9998] bg-background">
            <AppSkeleton />
          </div>
        )}

        {/* Main Content with transition */}
        <div className="flex flex-col flex-1 animate-fade-in w-full max-w-[1920px] mx-auto">
          {/* Header */}
          <AppHeader
            t={t}
            isDark={isDark}
            theme={theme}
            language={language}
            isPingPanelOpen={isPingPanelOpen}
            isExamActive={isExamActive}
            setLanguage={setLanguage}
            setTheme={setTheme}
            graphicsQuality={graphicsQuality}
            setGraphicsQuality={setGraphicsQuality}
            activeDeviceType={activeDeviceType}
            activeDeviceId={activeDeviceId}
            totalScore={totalScore}
            maxScore={maxScore}
            topologyDevices={topologyDevices}
            deviceStates={deviceStates}
            handleNewProject={handleNewProject}
            handleSaveProject={handleSaveProject}
            handleLoadProject={handleLoadProject}
            fileInputRef={fileInputRef}
            showMobileMenu={showMobileMenu}
            setShowMobileMenu={setShowMobileMenu}
            setShowProjectPicker={setShowProjectPicker}
            setShowOnboarding={setShowOnboarding}
            setOnboardingStep={setOnboardingStep}
            handleRefreshNetwork={handleRefreshNetwork}
            setIsEnvironmentPanelOpen={setIsEnvironmentPanelOpen}
            isGuidedModeActive={isGuidedModeActive}
            isPanelMinimized={isPanelMinimized}
            expandPanel={expandPanel}
            setShowAboutModal={setShowAboutModal}
            showBasarilarim={showBasarilarim}
            setShowBasarilarim={setShowBasarilarim}
            helpLevel={helpLevel}
            setHelpLevel={useAppStore.getState().setHelpLevel}
          />

          {isGeneratorOpen && <TopologyGeneratorDialog
            open={isGeneratorOpen}
            onOpenChange={setIsGeneratorOpen}
            onGenerate={handleGeneratedTopology}
          />}

          {showProjectPicker && <ProjectPickerDialog
            open={showProjectPicker}
            onOpenChange={setShowProjectPicker}
            t={t}
            isDark={isDark}
            language={language}
            projectPickerTab={projectPickerTab}
            setProjectPickerTab={setProjectPickerTab}
            projectSearchQuery={projectSearchQuery}
            setProjectSearchQuery={setProjectSearchQuery}
            groupedExampleProjects={groupedExampleProjects}
            exampleLevelLabels={exampleLevelLabels}
            exampleLevelHints={exampleLevelHints}
            exampleLevelOrder={exampleLevelOrder}
            getAvailableProjects={getAvailableProjects}
            getAvailableExams={getAvailableExams}
            resetToEmptyProject={resetToEmptyProject}
            applyExampleProject={applyExampleProject}
            applyExampleProjectAsTemplate={applyExampleProjectAsTemplate}
            startGuidedProject={handleStartGuidedProject}
            startExamProject={startExamFromCatalog}
            loadProjectData={loadProjectData}
            setZoom={setZoom}
            setPan={setPan}
            closeProjectPicker={() => setShowProjectPicker(false)}
            onOpenFile={() => fileInputRef.current?.click()}
            onConvertProjectToExam={handleConvertProjectToExam}
          />}


          {showOnboarding && <OnboardingDialog
            open={showOnboarding}
            t={t}
            isDark={isDark}
            onboardingStep={onboardingStep}
            onboardingSteps={onboardingSteps}
            closeOnboardingForever={closeOnboardingForever}
            prevOnboarding={prevOnboarding}
            nextOnboarding={nextOnboarding}
          />}


          {/* Unified Device Panel (CLI + Tasks) */}
          <UnifiedDevicePanel
            isOpen={showUnifiedDeviceModal && !isTablet}
            onOpenChange={setShowUnifiedDeviceModal}
            activeTab={unifiedDeviceActiveTab}
            onTabChange={setUnifiedDeviceActiveTab}
            deviceId={activeDeviceId}
            deviceType={activeDeviceType}
            deviceStates={deviceStates}
            topologyDevices={topologyDevices}
            topologyConnections={topologyConnections}
            handleCommand={handleCommand}
            handleClearTerminal={handleClearTerminal}
            handleUpdateHistory={handleUpdateHistory}
            confirmDialog={confirmDialog}
            setConfirmDialog={setConfirmDialog}
            t={t}
            theme={theme}
            language={language}
            helpLevel={helpLevel}
            isDark={isDark}
            isExecutingCommand={isExecutingCommand}
            output={output}
            prompt={prompt}
            state={state}
            activeDeviceTasks={activeDeviceTasks}
            taskContext={taskContext}
            modalPosition={unifiedDrag.position}
            modalSize={unifiedDrag.size}
            handlePointerDown={unifiedDrag.handlePointerDown}
            handleResizeStart={unifiedDrag.handleResizeStart}
          />

          {/* Firewall Configuration Modal */}
          <FirewallWindow
            showFirewallPanel={showFirewallPanel}
            setShowFirewallPanel={setShowFirewallPanel}
            activeFirewallId={activeFirewallId}
            topologyDevices={topologyDevices}
            t={t}
            theme={theme}
            isDark={isDark}
            isTR={isTR}
            firewallActiveTab={firewallActiveTab}
            setFirewallActiveTab={setFirewallActiveTab}
            deviceStates={deviceStates}
            deviceOutputs={deviceOutputs}
            handleExecuteCommand={handleExecuteCommand}
            handleUpdateHistory={handleUpdateHistory}
            setConfirmDialog={setConfirmDialog}
            confirmDialog={confirmDialog}
            toggleDevicePower={toggleDevicePower}
            updateDeviceConfig={updateDeviceConfig}
            firewallDrag={firewallDrag}
          />

          {/* PC Terminal Modal */}
          <PCWindow
            showPCPanel={showPCPanel}
            setShowPCPanel={setShowPCPanel}
            isTablet={isTablet}
            showPCDeviceId={showPCDeviceId}
            topologyDevices={topologyDevices}
            topologyConnections={topologyConnections}
            cableInfo={cableInfo}
            pcPanelInitialTab={pcPanelInitialTab}
            deviceStates={deviceStates}
            deviceOutputs={deviceOutputs}
            pcOutputs={pcOutputs}
            setPcOutputs={setPcOutputs as PcOutputsSetter}
            pcHistories={pcHistories}
            handleUpdatePCHistory={handleUpdatePCHistory}
            handleExecuteCommand={handleExecuteCommand}
            handlePCPanelNavigateWrapper={handlePCPanelNavigateWrapper}
            handleDeviceDelete={handleDeviceDelete}
            focusedOverlay={focusedOverlay}
            isDark={isDark}
            t={t}
            toggleDevicePower={toggleDevicePower}
            pcDrag={pcDrag}
          />

          {/* Multi-Window Device Manager (Independent windows for PC, Switch, Router, Firewall, WLC) */}
          <MultiDeviceWindowManager
            topologyDevices={topologyDevices}
            topologyConnections={topologyConnections}
            cableInfo={cableInfo}
            deviceStates={deviceStates}
            deviceOutputs={deviceOutputs}
            pcOutputs={pcOutputs}
            setPcOutputs={setPcOutputs as PcOutputsSetter}
            pcHistories={pcHistories}
            handleUpdatePCHistory={handleUpdatePCHistory}
            handleUpdateHistory={handleUpdateHistory}
            handleExecuteCommand={handleExecuteCommand}
            handleDeviceDelete={handleDeviceDelete}
            isDark={isDark}
            language={language}
            theme={theme}
            t={t as any}
            toggleDevicePower={toggleDevicePower}
            updateDeviceConfig={updateDeviceConfig}
            confirmDialog={confirmDialog}
            setConfirmDialog={setConfirmDialog}
            isTablet={isTablet}
          />

          {/* Windows Task Manager Style Switcher Modal for Ctrl+Tab */}
          <WindowSwitcherModal
            topologyDevices={topologyDevices}
            isDark={isDark}
            language={language}
          />

          {/* Router Info Panel Modal */}
          <RouterPanel
            deviceId={showRouterDeviceId}
            isVisible={showRouterPanel && !isTablet}
            onClose={() => setShowRouterPanel(false)}
            topologyDevices={topologyDevices || undefined}
            topologyConnections={topologyConnections}
            deviceStates={deviceStates}
            modalPosition={routerDrag.position}
            modalSize={routerDrag.size}
            handlePointerDown={routerDrag.handlePointerDown}
            handleResizeStart={routerDrag.handleResizeStart}
            className={focusedOverlay === 'router-info' ? "border-emerald-400 shadow-[0_0_0_1px_rgba(52,211,153,0.35)]" : "border-emerald-950/80"}
          />

          {/* Main Content - Fits between header and footer with scroll */}
          <main className={cn(
            "overflow-hidden flex flex-col min-h-0 h-[calc(100vh-44px)] pt-14 sm:pt-16",
            activeTab === 'topology' ? 'md:pt-[116px]' : 'md:pt-16',
            isTablet && (showPCPanel || showUnifiedDeviceModal || showRouterPanel) && "flex-row md:pt-16"
          )}>
            <div className={cn(
              "w-full flex-1 flex flex-col min-h-0 overflow-hidden transition-all duration-500",
              isTablet && (showPCPanel || showUnifiedDeviceModal || showRouterPanel) && "w-full sm:w-1/2 flex-none border-r border-secondary-200/50 dark:border-secondary-800/50"
            )}>
              {/* Tab Content - Always render but hide non-active */}
              <div className={`flex-1 flex flex-col min-h-0 ${activeTab === 'topology' ? 'flex' : 'hidden'} print:flex`}>
                {/* Topology Toolbar */}
                {activeTab === 'topology' && (
                  <TopologyToolbar
                    isPingPanelOpen={isPingPanelOpen}
                    t={t}
                    isDark={isDark}
                    language={language}
                    topologyDevices={topologyDevices}
                    deviceStates={deviceStates}
                    activeDeviceId={activeDeviceId}
                    activeDeviceType={activeDeviceType}
                    cableInfo={cableInfo}
                    deviceSearchQuery={deviceSearchQuery}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    hasHydrated={hasHydrated}
                    isExamActive={isExamActive}
                    setDeviceSearchQuery={setDeviceSearchQuery}
                    setCableInfo={setCableInfo}
                    setZoom={setZoom}
                    setPan={setPan}
                    handleDeviceSelectFromMenu={handleDeviceSelectFromMenu}
                    handleUndo={handleUndo}
                    handleRedo={handleRedo}
                    handleRefreshNetwork={handleRefreshNetwork}
                    setIsEnvironmentPanelOpen={setIsEnvironmentPanelOpen}
                    onOpenStudentJoin={isRoomEnabled ? () => setShowRoomJoinDialog(true) : undefined}
                    onOpenTeacherPanel={isRoomEnabled && !studentRoomCode ? () => setShowTeacherPanel(true) : undefined}
                  />
                )}


                {/* Network Topology fills remaining space */}
                <div ref={topologyContainerRef} className="flex-1 w-full h-full min-h-0 overflow-hidden relative">
                  <NetworkTopology
                    onPingPanelOpenChange={setIsPingPanelOpen}
                    key={topologyKey}
                    cableInfo={cableInfo}
                    onCableChange={setCableInfo}
                    selectedDevice={selectedDevice}
                    onDeviceSelect={handleDeviceSelectFromCanvas}
                    onDeviceDoubleClick={handleDeviceDoubleClick}
                    onDeviceDelete={handleDeviceDelete}
                    onDeviceRename={handleDeviceRename}
                    initialDevices={topologyDevices || undefined}
                    initialConnections={topologyConnections || undefined}
                    initialNotes={topologyNotes || undefined}
                    isActive={activeTab === 'topology'}
                    activeDeviceId={activeDeviceId}
                    deviceStates={deviceStates}
                    onDeviceStatesChange={setDeviceStates}
                    zoom={zoom}
                    onZoomChange={setZoom}
                    pan={pan}
                    onPanChange={setPan}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onRefreshNetwork={handleRefreshNetwork}
                    focusDeviceId={focusDeviceId}
                    isExamActive={isExamActive}
                    isExamEditorOpen={isEditorOpen}
                    onOpenTasks={(deviceId: string) => {
                      setActiveDeviceId(deviceId);
                      const device = topologyDevices?.find(d => d.id === deviceId);
                      if (!device || device.type === 'pc') return;
                      setActiveDeviceType(device.type);
                      setUnifiedDeviceActiveTab('settings');
                      setShowUnifiedDeviceModal(true);
                    }}
                    clearSelectionTrigger={clearSelectionTrigger}
                    onPacketPanelFocus={() => setFocusedOverlay('packet')}
                    packetPanelZIndex={focusedOverlay === 'packet' ? 35 : 30}
                    onAction={commitAction}
                  />

                  {/* PC Info Popover - Bottom Right Mini Panel */}
                  {(() => {
                    const activeDevice = activeDeviceId
                      ? topologyDevices?.find(d => d.id === activeDeviceId) ?? null
                      : null;
                    const isPcDevice = activeDevice?.type === 'pc' || activeDeviceId?.startsWith('pc-');
                    return isPcDevice && activeDevice ? (
                      <PCInfoPopover
                        pc={activeDevice}
                        t={t}
                        language={language}
                        isDark={isDark}
                        isFocused={focusedOverlay === 'pc-info'}
                        onClose={() => {
                          setSelectedDevice(null);
                          setActiveDeviceId('');
                        }}
                        onFocus={() => setFocusedOverlay('pc-info')}
                        zIndex={focusedOverlay === 'pc-info' ? 36 : 25}
                        handleDeviceDoubleClick={handleDeviceDoubleClick}
                        onOpenPanel={(id) => handleDeviceDoubleClick('pc', id)}
                        onOpenSettings={(id) => {
                          setShowPCDeviceId(id);
                          getOrCreatePCOutputs(id, topologyDevices);
                          setPcPanelInitialTab('settings');
                          useMultiWindowStore.getState().openDeviceWindow(id, 'pc', 'settings');
                        }}
                        topologyDevices={topologyDevices}
                        deviceStates={deviceStates}
                      />
                    ) : null;
                  })()}

                  {activeDeviceId && (activeDeviceId.startsWith('router-') || topologyDevices?.find(d => d.id === activeDeviceId)?.type === 'router') && topologyDevices && (
                    <RouterInfoPopover
                      router={topologyDevices.find(d => d.id === activeDeviceId) as CanvasDevice}
                      routerState={deviceStates.get(activeDeviceId)}
                      t={t}
                      language={language}
                      isDark={isDark}
                      isFocused={focusedOverlay === 'router-info'}
                      onClose={() => {
                        setSelectedDevice(null);
                        setActiveDeviceId('');
                      }}
                      onFocus={() => setFocusedOverlay('router-info')}
                      zIndex={focusedOverlay === 'router-info' ? 36 : 25}
                      handleDeviceDoubleClick={handleDeviceDoubleClick}
                      onOpenPanel={(id) => handleDeviceDoubleClick('router', id)}
                      onOpenSettings={(id) => {
                        setActiveDeviceId(id);
                        const device = topologyDevices?.find(d => d.id === id);
                        if (device) setActiveDeviceType(device.type);
                        setUnifiedDeviceActiveTab('settings');
                        useMultiWindowStore.getState().openDeviceWindow(id, device?.type || 'router', 'settings');
                      }}
                      topologyConnections={topologyConnections}
                    />
                  )}
                </div>
              </div>


              {/* Terminal Sekmesi - Removed from inline, now shown as full-screen modal */}

              {/* Tasks Sekmesi - Removed from inline, now shown as modal */}

            </div>

            {/* Tablet Split View Panels (Docked Right) */}
            <TabletSplitView
              isDark={isDark}
              isTablet={isTablet}
              showPCPanel={showPCPanel}
              setShowPCPanel={setShowPCPanel}
              showUnifiedDeviceModal={showUnifiedDeviceModal}
              setShowUnifiedDeviceModal={setShowUnifiedDeviceModal}
              showRouterPanel={showRouterPanel}
              setShowRouterPanel={setShowRouterPanel}
              unifiedDeviceActiveTab={unifiedDeviceActiveTab}
              setUnifiedDeviceActiveTab={setUnifiedDeviceActiveTab}
              activeDeviceId={activeDeviceId}
              activeDeviceType={activeDeviceType}
              deviceStates={deviceStates}
              topologyDevices={topologyDevices}
              topologyConnections={topologyConnections}
              handleCommand={handleCommand}
              handleClearTerminal={handleClearTerminal}
              toggleDevicePower={toggleDevicePower}
              handleUpdateHistory={handleUpdateHistory}
              confirmDialog={confirmDialog}
              setConfirmDialog={setConfirmDialog}
              t={t}
              theme={theme}
              language={language}
              helpLevel={helpLevel}
              isExecutingCommand={isExecutingCommand}
              output={output}
              prompt={prompt}
              state={state}
              activeDeviceTasks={activeDeviceTasks}
              taskContext={taskContext}
              showPCDeviceId={showPCDeviceId}
              cableInfo={cableInfo}
              pcPanelInitialTab={pcPanelInitialTab}
              deviceOutputs={deviceOutputs}
              pcOutputs={pcOutputs}
              setPcOutputs={setPcOutputs as PcOutputsSetter}
              pcHistories={pcHistories}
              handleUpdatePCHistory={handleUpdatePCHistory}
              handleExecuteCommand={handleExecuteCommand}
              handlePCPanelNavigateWrapper={handlePCPanelNavigateWrapper}
              handleDeviceDelete={handleDeviceDelete}
              showRouterDeviceId={showRouterDeviceId}
              focusedOverlay={focusedOverlay}
            />

            {/* Network Refresh Report - Floating panel style on both Desktop and Mobile */}
            <RefreshReportPanel
              refreshNetworkReport={refreshNetworkReport}
              setRefreshNetworkReport={setRefreshNetworkReport}
              refreshReportRef={refreshReportRef}
              isMobile={isMobile}
              isDark={isDark}
              focusedOverlay={focusedOverlay}
              setFocusedOverlay={setFocusedOverlay}
              language={language}
              t={t}
              handleRefreshNetwork={handleRefreshNetwork}
              liveSummary={liveSummary}
              topologyDevices={topologyDevices}
              deviceStates={deviceStates}
              bringElementToFront={bringElementToFront}
              isExamActive={isExamActive}
            />
          </main>

          <AppFooter
            t={t}
            isDark={isDark}
            language={language}
            activeTab={activeTab}
            hasUnsavedChanges={hasUnsavedChanges}
            lastSaveTime={lastSaveTime}
            projectName={projectName}
            topologyDevices={topologyDevices}
            showProjectPicker={showProjectPicker}
            showOnboarding={showOnboarding}
            setShowAboutModal={setShowAboutModal}
            onShortcut={(shortcut) => handlePageShortcut(shortcut, topologyDevices, activeDeviceId, handleDeviceSelectFromMenu)}
          />



          {showAboutModal && <LazyAboutModal
            isOpen={showAboutModal}
            onClose={() => setShowAboutModal(false)}
            isExamActive={isExamActive}
            onStartTour={() => {
              setShowAboutModal(false);
              setShowOnboarding(true);
              setOnboardingStep(0);
            }}
          />}

          {showBasarilarim && <BasarilarimPanel
            t={t}
            language={language}
            isDark={isDark}
            onClose={() => setShowBasarilarim(false)}
            zIndex={60}
          />}

          {isEnvironmentPanelOpen && <EnvironmentSettingsPanel
            isOpen={isEnvironmentPanelOpen}
            onOpenChange={setIsEnvironmentPanelOpen}
          />}

          {/* Guided Mode Panel */}
          {isGuidedModeActive && <GuidedModePanel
            project={activeGuidedProject}
            currentStepIndex={guidedStepIndex}
            onStepComplete={completeStep}
            onStepUncomplete={uncompleteStep}
            onClose={togglePanelMinimize}
            onMinimize={togglePanelMinimize}
            isMinimized={isPanelMinimized}
            lastCompletedStep={lastCompletedStep}
            isCurrentStepReady={isCurrentStepReady}
            lastCommand={lastCommand}
            lastOutput={lastOutput}
            deviceAccessed={showUnifiedDeviceModal ? (activeDeviceType === 'switchL2' || activeDeviceType === 'switchL3' ? 'switch' : activeDeviceType === 'router' ? 'router' : 'pc') : null}
            deviceAccessedId={showUnifiedDeviceModal ? activeDeviceId : null}
            deviceState={state}
            deviceStates={deviceStates}
            topologyConnections={topologyConnections}
            topologyDevices={topologyDevices}
            onCheckAutoComplete={checkStepCompletionWithContext}
          />}

          {/* Exam Mode Panel */}
          {isExamActive && !isEditorOpen && <ExamModePanel
            project={activeExam}
            onClose={closeExam}
            onMinimize={toggleExamPanelMinimize}
            isMinimized={isExamPanelMinimized}
            isFinished={isExamFinished}
            onFinish={finishExam}
            score={examScore}
            lastCommand={lastCommand}
            lastOutput={lastOutput}
            deviceAccessed={showUnifiedDeviceModal ? (activeDeviceType === 'switchL2' || activeDeviceType === 'switchL3' ? 'switch' : activeDeviceType === 'router' ? 'router' : 'pc') : null}
            deviceAccessedId={showUnifiedDeviceModal ? activeDeviceId : null}
            deviceState={state}
            deviceStates={deviceStates}
            topologyConnections={topologyConnections}
            topologyDevices={topologyDevices}
            onCheckTasks={checkExamTasks}
            onOpenEditor={!isExamLoadedFromFile ? () => toggleEditor(true) : undefined}
          />}

          {/* Troubleshooting Mode Panel */}
          {activeTroubleshootingProject && showTroubleshootingPanel && (
            <TroubleshootingPanel
              project={activeTroubleshootingProject}
              deviceStates={deviceStates}
              topologyDevices={topologyDevices}
              tasks={'tasks' in activeTroubleshootingProject ? (activeTroubleshootingProject as unknown as { tasks: ExamTask[] }).tasks : []}
              onClose={() => setShowTroubleshootingPanel(false)}
              onMinimize={() => setIsTroubleshootingMinimized(!isTroubleshootingMinimized)}
              isMinimized={isTroubleshootingMinimized}
            />
          )}

          {/* Global Timeline History Panel */}
          <TimelinePanel
            historyItems={historyItems}
            historyIndex={historyIndex}
            onJumpTo={handleJumpTo}
            isMinimized={isTimelineMinimized}
            onMinimize={toggleTimelineMinimize}
            isMobile={isMobile}
          />

          {/* Exam Editor Panel */}
          {isEditorOpen && activeExam && (
            <ExamEditorPanel
              isOpen={isEditorOpen}
              onClose={() => toggleEditor(false)}
              activeExam={activeExam}
              addTask={addTask}
              updateTask={updateTask}
              deleteTask={deleteTask}
              updateExamMeta={updateExamMeta}
              moveTask={moveTask}
              smartBalanceWeights={smartBalanceWeights}
              exportExamFile={(projData) => {
                // Export final student .exam file using current project state
                exportExamFile(projData);
              }}
              projectData={getFullProjectData()}
              isDark={isDark}
            />
          )}

          <PageModals
            t={t}
            isDark={isDark}
            showWarning={showWarning}
            tabCount={tabCount}
            clearCurrentTabData={clearCurrentTabData}
            acknowledgeWarning={acknowledgeWarning}
            confirmDialog={confirmDialog}
            setConfirmDialog={setConfirmDialog}
            saveDialog={saveDialog}
            setSaveDialog={setSaveDialog}
            focusActiveTerminalInput={focusActiveTerminalInput}
          />
        </div>
      </div>
    </AppErrorBoundary>
  );
}


