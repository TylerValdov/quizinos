import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { loadImage } from '../lib/images';

export default function CardImage({ imageId, className = '' }: { imageId?: string; className?: string }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!uid || !imageId) {
      setSrc(null);
      return;
    }
    loadImage(uid, imageId).then((loaded) => {
      if (active) setSrc(loaded);
    });
    return () => {
      active = false;
    };
  }, [uid, imageId]);

  if (!imageId || !src) return null;
  return <img src={src} alt="" className={`max-w-full rounded-md ${className}`} />;
}
