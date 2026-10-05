import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { makeId } from './id';

// A Firestore document caps out at 1 MiB; leave room for the rest of the set.
const MAX_DATA_URL_CHARS = 900_000;

const cache = new Map<string, Promise<string | null>>();

function imageRef(uid: string, imageId: string) {
  return doc(db, 'users', uid, 'images', imageId);
}

export async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  for (const maxDim of [1024, 800, 600]) {
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not process that image.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    for (const quality of [0.82, 0.7, 0.55]) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= MAX_DATA_URL_CHARS) return dataUrl;
    }
  }
  bitmap.close();
  throw new Error('That image is too large to store — try a smaller one.');
}

export function saveImage(uid: string, dataUrl: string): string {
  const imageId = makeId();
  void setDoc(imageRef(uid, imageId), { dataUrl, createdAt: Date.now() });
  cache.set(`${uid}/${imageId}`, Promise.resolve(dataUrl));
  return imageId;
}

export function loadImage(uid: string, imageId: string): Promise<string | null> {
  const key = `${uid}/${imageId}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const pending = getDoc(imageRef(uid, imageId))
    .then((snap) => (snap.exists() ? (snap.data().dataUrl as string) : null))
    .catch(() => null);
  cache.set(key, pending);
  return pending;
}
