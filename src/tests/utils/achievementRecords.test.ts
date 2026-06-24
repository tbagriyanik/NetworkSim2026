import { describe, it, expect, vi, beforeEach } from 'vitest';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock CustomEvent for window.dispatchEvent
const dispatchEventMock = vi.fn();
window.dispatchEvent = dispatchEventMock;

import {
  getSummary,
  addSessionDuration,
  addProjectRecord,
  addGuidedLessonRecord,
  addExamRecord,
  clearSummary,
} from '@/utils/achievementRecords';

describe('achievementRecords', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('getSummary', () => {
    it('should return empty summary when nothing stored', () => {
      const summary = getSummary();
      expect(summary.totalSessionSeconds).toBe(0);
      expect(summary.projects).toEqual([]);
      expect(summary.guidedLessons).toEqual([]);
      expect(summary.exams).toEqual([]);
    });
  });

  describe('addSessionDuration', () => {
    it('should accumulate session seconds', () => {
      addSessionDuration(100);
      addSessionDuration(50);
      expect(getSummary().totalSessionSeconds).toBe(150);
    });
  });

  describe('addProjectRecord', () => {
    it('should add new project', () => {
      addProjectRecord('My Project');
      const summary = getSummary();
      expect(summary.projects).toHaveLength(1);
      expect(summary.projects[0].name).toBe('My Project');
    });

    it('should update existing project date', () => {
      addProjectRecord('Project A');
      addProjectRecord('Project A');
      const summary = getSummary();
      expect(summary.projects).toHaveLength(1);
    });
  });

  describe('addGuidedLessonRecord', () => {
    it('should add new guided lesson', () => {
      addGuidedLessonRecord('Lesson 1', 80, 100);
      const summary = getSummary();
      expect(summary.guidedLessons).toHaveLength(1);
      expect(summary.guidedLessons[0].points).toBe(80);
    });

    it('should update only if new score is higher', () => {
      addGuidedLessonRecord('Lesson 1', 80, 100);
      addGuidedLessonRecord('Lesson 1', 60, 100);
      expect(getSummary().guidedLessons[0].points).toBe(80);

      addGuidedLessonRecord('Lesson 1', 90, 100);
      expect(getSummary().guidedLessons[0].points).toBe(90);
    });
  });

  describe('addExamRecord', () => {
    it('should add new exam', () => {
      addExamRecord('Exam 1', 85, 100);
      const summary = getSummary();
      expect(summary.exams).toHaveLength(1);
      expect(summary.exams[0].score).toBe(85);
    });

    it('should update only if new score is higher', () => {
      addExamRecord('Exam 1', 85, 100);
      addExamRecord('Exam 1', 70, 100);
      expect(getSummary().exams[0].score).toBe(85);

      addExamRecord('Exam 1', 95, 100);
      expect(getSummary().exams[0].score).toBe(95);
    });
  });

  describe('clearSummary', () => {
    it('should remove stored data', () => {
      addSessionDuration(100);
      addProjectRecord('Test');
      clearSummary();
      const summary = getSummary();
      expect(summary.totalSessionSeconds).toBe(0);
      expect(summary.projects).toEqual([]);
    });
  });
});
