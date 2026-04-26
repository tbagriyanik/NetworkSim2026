'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  GuidedProject, 
  GuidedStep, 
  getNextIncompleteStep, 
  getCompletedStepsCount,
  checkStepCompletion,
  getGuidedProjects
} from '@/lib/network/guidedMode';

interface UseGuidedModeReturn {
  // State
  activeProject: GuidedProject | null;
  currentStepIndex: number;
  isGuidedModeActive: boolean;
  isPanelMinimized: boolean;
  lastCompletedStep: string | null;
  
  // Actions
  startGuidedProject: (project: GuidedProject) => void;
  completeStep: (stepId: string) => void;
  uncompleteStep: (stepId: string) => void;
  skipStep: () => void;
  goToStep: (index: number) => void;
  closeGuidedMode: () => void;
  togglePanelMinimize: () => void;
  expandPanel: () => void;
  
  // Context check for auto-completion
  checkStepCompletionWithContext: (context: {
    lastCommand?: string;
    deviceAccessed?: 'switch' | 'router' | 'pc' | null;
    deviceState?: any;
  }) => void;
  
  // Helpers
  progress: number;
  completedCount: number;
  totalSteps: number;
  isAllCompleted: boolean;
  getAvailableProjects: (language: 'tr' | 'en') => GuidedProject[];
}

export function useGuidedMode(): UseGuidedModeReturn {
  const [activeProject, setActiveProject] = useState<GuidedProject | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [lastCompletedStep, setLastCompletedStep] = useState<string | null>(null);

  const isGuidedModeActive = activeProject !== null;

  // Calculate derived state
  const progress = useMemo(() => {
    if (!activeProject || activeProject.steps.length === 0) return 0;
    return Math.round((getCompletedStepsCount(activeProject.steps) / activeProject.steps.length) * 100);
  }, [activeProject]);

  const completedCount = useMemo(() => {
    if (!activeProject) return 0;
    return getCompletedStepsCount(activeProject.steps);
  }, [activeProject]);

  const totalSteps = useMemo(() => {
    return activeProject?.steps.length || 0;
  }, [activeProject]);

  const isAllCompleted = useMemo(() => {
    if (!activeProject) return false;
    return completedCount === totalSteps;
  }, [activeProject, completedCount, totalSteps]);

  // Auto-advance to next incomplete step when steps change
  useEffect(() => {
    if (!activeProject) return;
    
    // Find the next incomplete step
    const nextIndex = activeProject.steps.findIndex(s => !s.completed);
    if (nextIndex !== -1 && nextIndex !== currentStepIndex) {
      setCurrentStepIndex(nextIndex);
    }
  }, [activeProject?.steps, activeProject, currentStepIndex]);

  const startGuidedProject = useCallback((project: GuidedProject) => {
    // Reset all steps to incomplete
    const freshProject: GuidedProject = {
      ...project,
      steps: project.steps.map(s => ({ ...s, completed: false, completedAt: undefined })),
      startedAt: new Date()
    };
    setActiveProject(freshProject);
    setCurrentStepIndex(0);
    setIsPanelMinimized(false);
    setLastCompletedStep(null);
  }, []);

  const completeStep = useCallback((stepId: string) => {
    if (!activeProject) return;

    setActiveProject(prev => {
      if (!prev) return null;
      
      const updatedSteps = prev.steps.map(s => 
        s.id === stepId ? { ...s, completed: true, completedAt: new Date() } : s
      );
      
      return {
        ...prev,
        steps: updatedSteps
      };
    });

    setLastCompletedStep(stepId);
    
    // Auto-expand panel when step completes
    setIsPanelMinimized(false);
  }, [activeProject]);

  const uncompleteStep = useCallback((stepId: string) => {
    if (!activeProject) return;

    setActiveProject(prev => {
      if (!prev) return null;
      
      const stepIndex = prev.steps.findIndex(s => s.id === stepId);
      const updatedSteps = prev.steps.map((s, idx) => {
        // Uncomplete this step and all subsequent steps
        if (idx >= stepIndex) {
          return { ...s, completed: false };
        }
        return s;
      });
      
      // Move current index to the uncompleted step
      setCurrentStepIndex(stepIndex);
      
      return {
        ...prev,
        steps: updatedSteps
      };
    });

    setLastCompletedStep(null);
  }, [activeProject]);

  const skipStep = useCallback(() => {
    if (!activeProject) return;
    
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < activeProject.steps.length) {
      setCurrentStepIndex(nextIndex);
    }
  }, [activeProject, currentStepIndex]);

  const goToStep = useCallback((index: number) => {
    if (!activeProject) return;
    if (index >= 0 && index < activeProject.steps.length) {
      setCurrentStepIndex(index);
    }
  }, [activeProject]);

  const closeGuidedMode = useCallback(() => {
    setActiveProject(null);
    setCurrentStepIndex(0);
    setIsPanelMinimized(false);
    setLastCompletedStep(null);
  }, []);

  const togglePanelMinimize = useCallback(() => {
    setIsPanelMinimized(prev => !prev);
  }, []);

  const expandPanel = useCallback(() => {
    setIsPanelMinimized(false);
  }, []);

  const checkStepCompletionWithContext = useCallback((context: {
    lastCommand?: string;
    deviceAccessed?: 'switch' | 'router' | 'pc' | null;
    deviceState?: any;
  }) => {
    if (!activeProject) return;

    const currentStep = activeProject.steps[currentStepIndex];
    if (!currentStep || currentStep.completed) return;

    const shouldComplete = checkStepCompletion(currentStep, context);
    
    if (shouldComplete) {
      completeStep(currentStep.id);
    }
  }, [activeProject, currentStepIndex, completeStep]);

  const getAvailableProjects = useCallback((language: 'tr' | 'en') => {
    return getGuidedProjects(language);
  }, []);

  return {
    activeProject,
    currentStepIndex,
    isGuidedModeActive,
    isPanelMinimized,
    lastCompletedStep,
    startGuidedProject,
    completeStep,
    uncompleteStep,
    skipStep,
    goToStep,
    closeGuidedMode,
    togglePanelMinimize,
    expandPanel,
    checkStepCompletionWithContext,
    progress,
    completedCount,
    totalSteps,
    isAllCompleted,
    getAvailableProjects
  };
}

export default useGuidedMode;
