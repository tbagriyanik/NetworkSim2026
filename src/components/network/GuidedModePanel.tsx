'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  GripHorizontal,
  Lightbulb, 
  Clock, 
  Target,
  ChevronDown,
  ChevronUp,
  X,
  BookOpen,
  Move
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { GuidedStep, GuidedProject, getProgressPercentage } from '@/lib/network/guidedMode';

interface GuidedModePanelProps {
  project: GuidedProject | null;
  currentStepIndex: number;
  onStepComplete: (stepId: string) => void;
  onStepUncomplete: (stepId: string) => void;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
  language: 'tr' | 'en';
  lastCompletedStep?: string | null;
  // Step readiness - controls if "Complete" button is enabled
  isCurrentStepReady?: boolean;
  // Auto-completion context
  lastCommand?: string;
  deviceAccessed?: 'switch' | 'router' | 'pc' | null;
  deviceState?: any;
  topologyConnections?: any[];
  topologyDevices?: any[];
  onCheckAutoComplete?: (context: {
    lastCommand?: string;
    deviceAccessed?: 'switch' | 'router' | 'pc' | null;
    deviceState?: any;
    topologyConnections?: any[];
    topologyDevices?: any[];
  }) => void;
}

const translations = {
  tr: {
    guidedMode: 'Rehberli Ders',
    step: 'Adım',
    of: '/',
    hint: 'İpucu',
    instructions: 'Detaylı Talimatlar',
    complete: 'Tamamlandı',
    completed: 'Tamamla',
    completedAt: 'Tamamlanma',
    uncomplete: 'Geri Al',
    progress: 'İlerleme',
    estimatedTime: 'Tahmini Süre',
    minutes: 'dakika',
    close: 'Kapat',
    minimize: 'Küçült',
    maximize: 'Büyüt',
    allStepsCompleted: 'Tüm adımlar tamamlandı!',
    nextStep: 'Sonraki Adım',
    currentStep: 'Mevcut Adım',
    showHint: 'İpucunu Göster',
    hideHint: 'İpucunu Gizle',
    difficulty: 'Zorluk',
    beginner: 'Başlangıç',
    intermediate: 'Orta',
    advanced: 'İleri'
  },
  en: {
    guidedMode: 'Guided Lesson',
    step: 'Step',
    of: 'of',
    hint: 'Hint',
    instructions: 'Detailed Instructions',
    complete: 'Complete',
    completed: 'Mark Complete',
    completedAt: 'Completed',
    uncomplete: 'Undo',
    progress: 'Progress',
    estimatedTime: 'Estimated Time',
    minutes: 'minutes',
    close: 'Close',
    minimize: 'Minimize',
    maximize: 'Maximize',
    allStepsCompleted: 'All steps completed!',
    nextStep: 'Next Step',
    currentStep: 'Current Step',
    showHint: 'Show Hint',
    hideHint: 'Hide Hint',
    difficulty: 'Difficulty',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced'
  }
};

export function GuidedModePanel({
  project,
  currentStepIndex,
  onStepComplete,
  onStepUncomplete,
  onClose,
  onMinimize,
  isMinimized,
  language,
  lastCompletedStep,
  isCurrentStepReady = false,
  lastCommand,
  deviceAccessed,
  deviceState,
  topologyConnections,
  topologyDevices,
  onCheckAutoComplete
}: GuidedModePanelProps) {
  const t = translations[language];
  const [showHint, setShowHint] = React.useState(false);
  const [expandedSteps, setExpandedSteps] = React.useState<string[]>([]);
  
  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 80 }); // right-4 top-20 (x set in useEffect)
  
  // Set initial position on mount (client-side only)
  useEffect(() => {
    setPosition({ x: window.innerWidth - 336, y: 80 });
  }, []);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current step when it changes
  const activeStepRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (activeStepRef.current) {
      activeStepRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStepIndex, project]);

  // Auto-check completion when context changes
  useEffect(() => {
    if (onCheckAutoComplete && project && currentStepIndex < project.steps.length) {
      const currentStep = project.steps[currentStepIndex];
      if (currentStep && !currentStep.completed) {
        onCheckAutoComplete({
          lastCommand,
          deviceAccessed,
          deviceState,
          topologyConnections,
          topologyDevices
        });
      }
    }
  }, [lastCommand, deviceAccessed, deviceState, topologyConnections, topologyDevices, onCheckAutoComplete, project, currentStepIndex]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag from header
    const target = e.target as HTMLElement;
    if (!target.closest('[data-drag-handle]')) return;
    
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragRef.current) return;
    
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    // Mark as dragged if moved significantly
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      setHasDragged(true);
    }
    
    setPosition({
      x: Math.max(0, Math.min(window.innerWidth - 320, dragRef.current.initialX + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 200, dragRef.current.initialY + dy))
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragRef.current = null;
    // Reset hasDragged after a short delay to allow click to complete
    setTimeout(() => setHasDragged(false), 100);
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-drag-handle]')) return;
    
    const touch = e.touches[0];
    setIsDragging(true);
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: position.x,
      initialY: position.y
    };
  }, [position]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !dragRef.current) return;
    
    const touch = e.touches[0];
    const dx = touch.clientX - dragRef.current.startX;
    const dy = touch.clientY - dragRef.current.startY;
    
    // Mark as dragged if moved significantly
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      setHasDragged(true);
    }
    
    setPosition({
      x: Math.max(0, Math.min(window.innerWidth - 320, dragRef.current.initialX + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 200, dragRef.current.initialY + dy))
    });
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    dragRef.current = null;
    // Reset hasDragged after a short delay to allow click to complete
    setTimeout(() => setHasDragged(false), 100);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  if (!project) return null;

  const progress = getProgressPercentage(project.steps);
  const currentStep = project.steps[currentStepIndex];
  const completedCount = project.steps.filter(s => s.completed).length;
  const isAllCompleted = completedCount === project.steps.length;

  const toggleStepExpand = (stepId: string) => {
    setExpandedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return t.beginner;
      case 'intermediate': return t.intermediate;
      case 'advanced': return t.advanced;
      default: return difficulty;
    }
  };

  if (isMinimized) {
    return (
      <div 
        className="fixed z-50 flex flex-col gap-2"
        style={{ left: position.x, top: position.y }}
      >
        {/* Main Floating Button */}
        <div 
          data-drag-handle
          className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border-2 cursor-grab transition-all hover:scale-105",
            "bg-gradient-to-r from-blue-500 to-blue-600 border-blue-400 text-white",
            "animate-pulse hover:animate-none",
            isDragging && "cursor-grabbing scale-105"
          )}
          onClick={() => {
            // Only trigger click if not dragged
            if (!hasDragged) {
              onMinimize();
            }
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <GripHorizontal className="w-4 h-4 opacity-60" />
          <BookOpen className="w-5 h-5" />
          <span className="text-sm font-semibold">
            {language === 'tr' ? 'Rehberli Dersi Aç' : 'Open Guided Lesson'}
          </span>
          <div className="w-12 h-1.5 bg-white/30 rounded-full overflow-hidden ml-2">
            <div 
              className="h-full bg-white transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-medium opacity-80 ml-1">
            {progress}%
          </span>
          <ChevronUp className="w-4 h-4 ml-1 opacity-60" />
        </div>

        {/* Helper Text */}
        <div className="text-center">
          <span className="text-xs text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded-full shadow-sm">
            {language === 'tr' ? 'Sürüklemek için tutun' : 'Hold to drag'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={panelRef}
      className={cn(
        "fixed z-50 w-80 flex flex-col",
        isDragging && "cursor-grabbing"
      )}
      style={{ 
        left: position.x, 
        top: position.y,
        maxHeight: 'calc(100vh - 100px)'
      }}
    >
      <div 
        className={cn(
          "flex flex-col rounded-xl shadow-2xl border overflow-hidden",
          "bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm",
          "border-slate-200 dark:border-slate-700",
          "max-h-full"
        )}
      >
        {/* Header - Draggable */}
        <div 
          data-drag-handle
          className={cn(
            "flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white",
            "cursor-grab active:cursor-grabbing select-none"
          )}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="flex items-center gap-2">
            <GripHorizontal className="w-4 h-4 opacity-50" />
            <BookOpen className="w-5 h-5" />
            <div>
              <h3 className="font-semibold text-sm">{t.guidedMode}</h3>
              <p className="text-xs text-blue-100 truncate max-w-[160px]">{project.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onMinimize}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title={t.minimize}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title={t.close}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">{t.progress}</span>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {completedCount} {t.of} {project.steps.length}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-green-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {isAllCompleted && (
            <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium text-center animate-pulse">
              {t.allStepsCompleted}
              {project.startedAt && (() => {
                const lastCompletedStep = project.steps.filter(s => s.completed).sort((a, b) => 
                  (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
                )[0];
                if (lastCompletedStep?.completedAt) {
                  const duration = Math.round((new Date(lastCompletedStep.completedAt).getTime() - new Date(project.startedAt).getTime()) / 1000);
                  const minutes = Math.floor(duration / 60);
                  const seconds = duration % 60;
                  return (
                    <span className="ml-2 text-slate-500 dark:text-slate-400">
                      ({minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`})
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </div>

        {/* Current Step Highlight */}
        {currentStep && !currentStep.completed && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                {t.currentStep}: {currentStep.order}
              </span>
            </div>
            <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-1">
              {currentStep.title[language]}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
              {currentStep.description[language]}
            </p>
            
            {/* Hint Section */}
            <Collapsible open={showHint} onOpenChange={setShowHint}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors">
                  <Lightbulb className="w-3 h-3" />
                  {showHint ? t.hideHint : t.showHint}
                  {showHint ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
                  <Lightbulb className="w-3 h-3 inline mr-1" />
                  {currentStep.hint[language]}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Detailed Instructions */}
            {currentStep.detailedInstructions && (
              <Collapsible 
                open={expandedSteps.includes(currentStep.id)}
                onOpenChange={() => toggleStepExpand(currentStep.id)}
              >
                <CollapsibleTrigger asChild>
                  <button className="mt-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                    {t.instructions}
                    {expandedSteps.includes(currentStep.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ol className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400 pl-4">
                    {currentStep.detailedInstructions[language].map((instruction, idx) => (
                      <li key={idx} className="list-decimal">
                        {instruction}
                      </li>
                    ))}
                  </ol>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Complete Button */}
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                className={cn(
                  "flex-1 text-white transition-all",
                  isCurrentStepReady
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-slate-400 hover:bg-slate-400 cursor-not-allowed opacity-60"
                )}
                onClick={() => onStepComplete(currentStep.id)}
                disabled={currentStep.completed || !isCurrentStepReady}
                title={!isCurrentStepReady && !currentStep.completed
                  ? (language === 'tr'
                    ? 'Bu adımı tamamlamak için gerekli işlemi yapmalısınız'
                    : 'You must complete the required action to finish this step')
                  : undefined}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {currentStep.completed ? t.complete : t.completed}
              </Button>
            </div>
          </div>
        )}

        {/* Steps List */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            {project.steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = step.completed;
              const isFuture = index > currentStepIndex;

              return (
                <div
                  key={step.id}
                  ref={isActive ? activeStepRef : undefined}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-lg transition-all",
                    isActive && "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800",
                    isCompleted && !isActive && "bg-slate-100 dark:bg-slate-800 opacity-60",
                    !isActive && !isCompleted && "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  )}
                >
                  {/* Status Icon */}
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : isActive ? (
                      <Circle className="w-5 h-5 text-blue-500 animate-pulse" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>

                  {/* Undo button for completed steps - moved here */}
                  {isCompleted && (
                    <button
                      onClick={() => onStepUncomplete(step.id)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0"
                    >
                      {t.uncomplete}
                    </button>
                  )}

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs font-medium",
                        isActive && "text-blue-600 dark:text-blue-400",
                        isCompleted && "text-slate-600 dark:text-white line-through",
                        !isActive && !isCompleted && "text-slate-500 dark:text-slate-400"
                      )}>
                        {step.order}. {step.title[language]}
                      </span>
                    </div>
                    
                    {isActive && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                        {step.description[language]}
                      </p>
                    )}
                    
                    {/* Completion Time */}
                    {isCompleted && step.completedAt && project.startedAt && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-300 mt-0.5">
                        {t.completedAt}: {new Date(step.completedAt).toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        <span className="ml-1 text-slate-400">
                          ({(() => {
                            const duration = Math.round((new Date(step.completedAt).getTime() - new Date(project.startedAt).getTime()) / 1000);
                            const minutes = Math.floor(duration / 60);
                            const seconds = duration % 60;
                            return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                          })()})
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer Info */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {project.estimatedTimeMinutes} {t.minutes}
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            {getDifficultyText(project.difficulty)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuidedModePanel;
