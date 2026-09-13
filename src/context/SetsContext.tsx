import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Card, StudySet } from '../types';
import { loadSets, saveSets, makeId, clearProgress } from '../lib/storage';

interface SetsContextValue {
  sets: StudySet[];
  getSet: (id: string) => StudySet | undefined;
  createSet: (title: string, description: string, cards: Card[]) => StudySet;
  updateSet: (id: string, patch: Partial<Pick<StudySet, 'title' | 'description' | 'cards'>>) => void;
  deleteSet: (id: string) => void;
}

const SetsContext = createContext<SetsContextValue | null>(null);

export function SetsProvider({ children }: { children: ReactNode }) {
  const [sets, setSets] = useState<StudySet[]>(() => loadSets());

  useEffect(() => {
    saveSets(sets);
  }, [sets]);

  const value = useMemo<SetsContextValue>(
    () => ({
      sets,
      getSet: (id) => sets.find((s) => s.id === id),
      createSet: (title, description, cards) => {
        const now = Date.now();
        const newSet: StudySet = {
          id: makeId(),
          title,
          description,
          cards,
          createdAt: now,
          updatedAt: now,
        };
        setSets((prev) => [newSet, ...prev]);
        return newSet;
      },
      updateSet: (id, patch) => {
        setSets((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s)),
        );
      },
      deleteSet: (id) => {
        setSets((prev) => prev.filter((s) => s.id !== id));
        clearProgress(id);
      },
    }),
    [sets],
  );

  return <SetsContext.Provider value={value}>{children}</SetsContext.Provider>;
}

export function useSets(): SetsContextValue {
  const ctx = useContext(SetsContext);
  if (!ctx) throw new Error('useSets must be used within a SetsProvider');
  return ctx;
}

export function makeCard(term: string, definition: string): Card {
  return { id: makeId(), term, definition };
}
