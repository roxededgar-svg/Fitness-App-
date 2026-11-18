import type { CSSProperties, ReactNode } from 'react';
import { useArt } from '../lib/art';

/** Zeigt die echte Illustration/das Foto, falls vorhanden – sonst die gezeichnete Ersatzgrafik */
export function Art({ id, fallback, size, style, className, alt = '' }: { id?: string; fallback: ReactNode; size?: number; style?: CSSProperties; className?: string; alt?: string }) {
  const url = useArt(id);
  if (!url) return <>{fallback}</>;
  return <img src={url} alt={alt} className={`art-img ${className ?? ''}`} style={{ width: size, height: size, ...style }} draggable={false} />;
}
