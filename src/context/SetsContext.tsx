import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { Card, StudySet } from '../types';
import { db } from '../lib/firebase';
import { makeId } from '../lib/id';
import { clearProgress } from '../lib/firestoreProgress';
import { useAuth } from './AuthContext';

interface SetsContextValue {
  sets: StudySet[];
  loading: boolean;
  getSet: (id: string) => StudySet | undefined;
  createSet: (title: string, description: string, cards: Card[]) => StudySet;
  updateSet: (id: string, patch: Partial<Pick<StudySet, 'title' | 'description' | 'cards'>>) => void;
  deleteSet: (id: string) => void;
}

const SetsContext = createContext<SetsContextValue | null>(null);

export function SetsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [sets, setSets] = useState<StudySet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setSets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, 'users', uid, 'sets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setSets(snapshot.docs.map((d) => d.data() as StudySet));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [uid]);

  const value = useMemo<SetsContextValue>(
    () => ({
      sets,
      loading,
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
        if (uid) void setDoc(doc(db, 'users', uid, 'sets', newSet.id), newSet);
        return newSet;
      },
      updateSet: (id, patch) => {
        if (!uid) return;
        void updateDoc(doc(db, 'users', uid, 'sets', id), { ...patch, updatedAt: Date.now() });
      },
      deleteSet: (id) => {
        if (!uid) return;
        void deleteDoc(doc(db, 'users', uid, 'sets', id));
        void clearProgress(uid, id);
      },
    }),
    [sets, loading, uid],
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
