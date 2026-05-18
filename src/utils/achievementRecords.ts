'use client';

export interface SessionRecord {
  type: 'session';
  date: string;
  durationSeconds: number;
}

export interface ProjectRecord {
  type: 'project';
  date: string;
  name: string;
}

export interface GuidedLessonRecord {
  type: 'guided-lesson';
  date: string;
  name: string;
  points: number;
  totalPoints: number;
}

export interface ExamRecord {
  type: 'exam';
  date: string;
  name: string;
  score: number;
  maxScore: number;
}

export type AchievementRecord = SessionRecord | ProjectRecord | GuidedLessonRecord | ExamRecord;

const STORAGE_KEY = 'netsim_achievement_records';

export function getRecords(): AchievementRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addRecord(record: AchievementRecord): void {
  try {
    const records = getRecords();
    records.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // storage error
  }
}

export function addSessionRecord(durationSeconds: number): void {
  addRecord({
    type: 'session',
    date: new Date().toISOString(),
    durationSeconds,
  });
}

export function addProjectRecord(name: string): void {
  addRecord({
    type: 'project',
    date: new Date().toISOString(),
    name,
  });
}

export function addGuidedLessonRecord(name: string, points: number, totalPoints: number): void {
  addRecord({
    type: 'guided-lesson',
    date: new Date().toISOString(),
    name,
    points,
    totalPoints,
  });
}

export function addExamRecord(name: string, score: number, maxScore: number): void {
  addRecord({
    type: 'exam',
    date: new Date().toISOString(),
    name,
    score,
    maxScore,
  });
}

export function getRecordsSorted(): AchievementRecord[] {
  return getRecords().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function clearRecords(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage error
  }
}
