import type { LearnProgress, StudySet } from '../types';

const SETS_KEY = 'quizletcopy:sets';
const PROGRESS_KEY_PREFIX = 'quizletcopy:progress:';

export function loadSets(): StudySet[] {
  try {
    const raw = localStorage.getItem(SETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSets(sets: StudySet[]): void {
  localStorage.setItem(SETS_KEY, JSON.stringify(sets));
}

export function loadProgress(setId: string): LearnProgress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY_PREFIX + setId);
    if (!raw) return null;
    return JSON.parse(raw) as LearnProgress;
  } catch {
    return null;
  }
}

export function saveProgress(progress: LearnProgress): void {
  localStorage.setItem(PROGRESS_KEY_PREFIX + progress.setId, JSON.stringify(progress));
}

export function clearProgress(setId: string): void {
  localStorage.removeItem(PROGRESS_KEY_PREFIX + setId);
}

export function makeId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
