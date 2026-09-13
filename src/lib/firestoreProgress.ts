import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { LearnProgress } from '../types';

function progressRef(uid: string, setId: string) {
  return doc(db, 'users', uid, 'progress', setId);
}

export async function loadProgress(uid: string, setId: string): Promise<LearnProgress | null> {
  const snap = await getDoc(progressRef(uid, setId));
  return snap.exists() ? (snap.data() as LearnProgress) : null;
}

export function saveProgress(uid: string, progress: LearnProgress): void {
  void setDoc(progressRef(uid, progress.setId), progress);
}

export function clearProgress(uid: string, setId: string): Promise<void> {
  return deleteDoc(progressRef(uid, setId));
}
