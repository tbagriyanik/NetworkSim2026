import { useEffect, useRef } from 'react';
import type { SwitchState } from '@/lib/network/types';
import { getTaskStatus, TaskContext, type TaskDefinition } from '@/lib/network/taskDefinitions';

export interface UseTaskSyncParams {
  isTaskSystemEnabled: boolean;
  activeDeviceTasks: TaskDefinition[];
  state: SwitchState;
  taskContext: TaskContext;
  language: 'tr' | 'en';
  activeDeviceType: string;
  setLastTaskEvent: (event: { type: 'completed' | 'failed'; taskName: string; timestamp: number } | null) => void;
}

export function useTaskSync({
  isTaskSystemEnabled,
  activeDeviceTasks,
  state,
  taskContext,
  language,
  activeDeviceType,
  setLastTaskEvent
}: UseTaskSyncParams) {
  const prevTaskStatusRef = useRef<Map<string, boolean>>(new Map());
  const shownToastsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isTaskSystemEnabled) {
      prevTaskStatusRef.current.clear();
      setTimeout(() => setLastTaskEvent(null), 0);
      return;
    }

    activeDeviceTasks.forEach(task => {
      const currentStatus = getTaskStatus(task, state, taskContext);
      const previousStatus = prevTaskStatusRef.current.get(task.id) ?? false;
      const toastKey = `${task.id}-${currentStatus}`;

      // Task completed - show in footer only once
      if (currentStatus && !previousStatus && !shownToastsRef.current.has(toastKey)) {
        const taskName = task.name[language];
        setLastTaskEvent({ type: 'completed', taskName, timestamp: Date.now() });
        shownToastsRef.current.add(toastKey);
        // Remove the failed toast key if it exists
        shownToastsRef.current.delete(`${task.id}-false`);
      }
      // Task failed (was completed but now it's not) - show in footer only once
      else if (!currentStatus && previousStatus && !shownToastsRef.current.has(toastKey)) {
        const taskName = task.name[language];
        setLastTaskEvent({ type: 'failed', taskName, timestamp: Date.now() });
        shownToastsRef.current.add(toastKey);
        // Remove the completed toast key if it exists
        shownToastsRef.current.delete(`${task.id}-true`);
      }

      // Update previous status
      prevTaskStatusRef.current.set(task.id, currentStatus);
    });
  }, [
    activeDeviceTasks, isTaskSystemEnabled, state,
    taskContext, language, activeDeviceType, setLastTaskEvent
  ]);
}
