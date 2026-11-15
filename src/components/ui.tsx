import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { rankFor } from '../lib/progression';

export const flag = (cc?: string) =>
  cc && /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 0x1f1a5 + c.charCodeAt(0))) : '';

export function Avatar({ src, name, size = 56, color = '#3f7bfa', ring }: { src?: string; name: string; size?: number; color?: string; ring?: string }) {
  const inner = src ? (
    <img src={src} alt="" className="avatar" style={{ width: size, height: size }} />
  ) : (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(${color}33, ${color}33), #12131b`, color }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
  if (!ring) return inner;
  return <div className="av-ring" style={{ background: ring }}>{inner}</div>;
}

export function TierShield({ points, size = 22 }: { points: number; size?: number }) {
  const r = rankFor(points);
  return <Icon name="shield" size={size} color={r.tier.color} />;
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="Schließen"><Icon name="close" size={26} /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

let toastSetter: ((s: string | null) => void) | null = null;
export const toast = (msg: string) => toastSetter?.(msg);
export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    toastSetter = setMsg;
    return () => void (toastSetter = null);
  }, []);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2400);
    return () => clearTimeout(t);
  }, [msg]);
  return msg ? <div className="toast">{msg}</div> : null;
}

export function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return <button className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} role="switch" aria-checked={on} />;
}

export function LevelRing({ level, xp, need }: { level: number; xp: number; need: number }) {
  const r = 46, c = 2 * Math.PI * r;
  const pct = Math.min(1, xp / need);
  return (
    <div className="ring-wrap">
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#171922" strokeWidth="6" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--blue)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset 1s ease', filter: 'drop-shadow(0 0 6px rgba(63,123,250,.6))' }} />
      </svg>
      <div className="ring-center">
        <div className="lvl caps">Level</div>
        <div className="num">{level}</div>
        <div className="xp">{xp} / {need} XP</div>
      </div>
    </div>
  );
}

const DAYS = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'];
export function WeekChart({ data }: { data: { training: number; pvp: number; isToday: boolean }[] }) {
  const max = Math.max(20, ...data.map((d) => d.training + d.pvp));
  const total = data.reduce((a, d) => a + d.training + d.pvp, 0);
  const today = data.find((d) => d.isToday);
  return (
    <div className="card week">
      <div className="row">
        <div className="caps" style={{ fontSize: 15 }}>Diese Woche</div>
        <div className="spacer" />
        <div className="display blue" style={{ fontSize: 17 }}>{total} Wdh.</div>
      </div>
      <div className="bars">
        {data.map((d, i) => (
          <div className="bar-col" key={i}>
            <div className="bar">
              <span style={{ height: `${(d.training / max) * 100}%`, background: 'var(--blue)' }} />
              <span style={{ height: `${(d.pvp / max) * 100}%`, background: 'var(--purple)' }} />
            </div>
            <div className={`day caps ${d.isToday ? 'today' : ''}`}>{DAYS[i]}</div>
          </div>
        ))}
      </div>
      <div className="row">
        <div className="legend"><span><i style={{ background: 'var(--blue)' }} />Training</span><span><i style={{ background: 'var(--purple)' }} />PvP</span></div>
        <div className="spacer" />
        <div style={{ fontSize: 13, letterSpacing: '.1em' }}>Heute: <b>{today ? today.training + today.pvp : 0}</b></div>
      </div>
    </div>
  );
}

/**
 * Tauziehen-Balken: Der blaue Anteil wächst mit deinen Wiederholungen
 * und schiebt die Grenze Richtung Gegner – und umgekehrt.
 */
export function TugBar({ mine, theirs }: { mine: number; theirs: number }) {
  const k = 2;
  const share = (mine + k) / (mine + theirs + 2 * k);
  const pct = Math.max(0, Math.min(100, share * 100));
  return (
    <div className="tug">
      <div className={`mine ${pct >= 99.5 ? 'full' : ''}`} style={{ width: `${pct}%` }} />
      <div className="mid" />
      <div className="spark" style={{ left: `${pct}%` }} />
    </div>
  );
}

/** Verlauf beider Spieler über die Zeit (SVG-Liniengrafik). */
export function RaceChart({ mine, theirs, durationS, oppName }: { mine: number[]; theirs?: number[]; durationS: number; oppName?: string }) {
  const W = 600, H = 160, pad = 8;
  const total = Math.max(1, durationS * 1000);
  const maxReps = Math.max(5, mine.length, theirs?.length ?? 0);
  const path = (tl: number[]) => {
    let d = `M${pad},${H - pad}`;
    tl.forEach((t, i) => {
      const x = pad + (Math.min(t, total) / total) * (W - 2 * pad);
      const y = H - pad - ((i + 1) / maxReps) * (H - 2 * pad);
      d += ` H${x.toFixed(1)} V${y.toFixed(1)}`;
    });
    return d + ` H${W - pad}`;
  };
  return (
    <div className="card chart">
      <div className="row" style={{ marginBottom: 8 }}>
        <div className="caps" style={{ fontSize: 13 }}>Match-Verlauf</div>
        <div className="spacer" />
        <div className="legend"><span><i style={{ background: 'var(--blue)' }} />Du</span>{theirs && <span><i style={{ background: 'var(--red)' }} />{oppName}</span>}</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={pad} x2={W - pad} y1={H * f} y2={H * f} stroke="#1f2230" />)}
        {theirs && <path d={path(theirs)} fill="none" stroke="var(--red)" strokeWidth="3" vectorEffect="non-scaling-stroke" />}
        <path d={path(mine)} fill="none" stroke="var(--blue)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
