import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Spin3D, type MedalShape } from './Spin3D';
import { Icon } from './Icon';

/** Vollbild-Ansicht einer drehbaren 3D-Medaille (Abzeichen oder Rang). */
export function MedalViewer({
  front, back, edge, shape = 'hex', title, subtitle, color, spinIn = true, actions, onClose,
}: {
  front: ReactNode; back: ReactNode; edge: string; shape?: MedalShape; title: string; subtitle?: ReactNode;
  color: string; spinIn?: boolean; actions?: ReactNode; onClose: () => void;
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const size = Math.min(300, Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.6));
  return createPortal(
    <div className="medal-viewer" style={{ background: `radial-gradient(circle at 50% 38%, ${color}40, rgba(6,7,10,.97) 62%)` }}>
      <button className="icon-btn medal-close" onClick={onClose} aria-label="Schließen"><Icon name="close" size={22} /></button>
      <div className="medal-stage">
        <Spin3D front={front} back={back} size={size} edge={edge} shape={shape} spinIn={spinIn} idle />
        <div className="medal-floor" style={{ background: `radial-gradient(ellipse, ${color}55, transparent 70%)` }} />
      </div>
      <div className="medal-info">
        <div className="display" style={{ fontSize: 28 }}>{title}</div>
        {subtitle && <div className="muted" style={{ marginTop: 8, lineHeight: 1.5 }}>{subtitle}</div>}
        <div className="caps muted" style={{ fontSize: 11, marginTop: 14, opacity: 0.7 }}>Zum Drehen wischen</div>
        {actions && <div className="row" style={{ justifyContent: 'center', marginTop: 18, gap: 10 }}>{actions}</div>}
      </div>
    </div>,
    document.body,
  );
}
