import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { useMe } from '../lib/store';
import { itemById } from '../lib/shop';
import { rankFor } from '../lib/progression';

export const COUNTRY_NAMES: Record<string, string> = {
  DE: 'Deutschland', AT: 'Österreich', CH: 'Schweiz', US: 'USA', GB: 'Großbritannien', FR: 'Frankreich', ES: 'Spanien',
  IT: 'Italien', NL: 'Niederlande', PL: 'Polen', SE: 'Schweden', TR: 'Türkei', BR: 'Brasilien', JP: 'Japan',
};

/** Gezeichnete Mini-Fahne (keine Emoji-Flaggen). Unbekannte Länder → Länderkürzel. */
export function Flag({ cc, size = 18 }: { cc?: string; size?: number }) {
  if (!cc) return null;
  const w = size * 1.4, h = size;
  const H = (cols: string[]) => cols.map((c, i) => <rect key={i} x={0} y={(i * 14) / cols.length} width={20} height={14 / cols.length + 0.05} fill={c} />);
  const V = (cols: string[]) => cols.map((c, i) => <rect key={i} y={0} x={(i * 20) / cols.length} height={14} width={20 / cols.length + 0.05} fill={c} />);
  const art: Record<string, React.ReactNode> = {
    DE: H(['#111', '#dd0000', '#ffce00']),
    AT: H(['#ed2939', '#fff', '#ed2939']),
    NL: H(['#ae1c28', '#fff', '#21468b']),
    PL: H(['#fff', '#dc143c']),
    FR: V(['#0055a4', '#fff', '#ef4135']),
    IT: V(['#009246', '#fff', '#ce2b37']),
    ES: [<rect key={0} width={20} height={14} fill="#c60b1e" />, <rect key={1} y={3.5} width={20} height={7} fill="#ffc400" />],
    CH: [<rect key={0} width={20} height={14} fill="#d52b1e" />, <path key={1} d="M8.6 3.5h2.8v2.1h2.1v2.8h-2.1v2.1H8.6V8.4H6.5V5.6h2.1z" fill="#fff" />],
    SE: [<rect key={0} width={20} height={14} fill="#006aa7" />, <path key={1} d="M6 0h2.8v14H6zM0 5.6h20v2.8H0z" fill="#fecc00" />],
    JP: [<rect key={0} width={20} height={14} fill="#fff" />, <circle key={1} cx={10} cy={7} r={4} fill="#bc002d" />],
    TR: [<rect key={0} width={20} height={14} fill="#e30a17" />, <circle key={1} cx={8} cy={7} r={3.6} fill="#fff" />, <circle key={2} cx={9} cy={7} r={2.9} fill="#e30a17" />, <circle key={3} cx={12.6} cy={7} r={1.1} fill="#fff" />],
    BR: [<rect key={0} width={20} height={14} fill="#009c3b" />, <path key={1} d="M10 1.8 18 7l-8 5.2L2 7z" fill="#ffdf00" />, <circle key={2} cx={10} cy={7} r={2.8} fill="#002776" />],
    US: [<rect key={0} width={20} height={14} fill="#fff" />, ...[0, 2, 4, 6, 8, 10, 12].map((y) => <rect key={`s${y}`} y={y} width={20} height={1.08} fill="#b22234" />), <rect key="c" width={9} height={7.5} fill="#3c3b6e" />],
    GB: [<rect key={0} width={20} height={14} fill="#012169" />, <path key={1} d="M0 0l20 14M20 0L0 14" stroke="#fff" strokeWidth={2.6} />, <path key={2} d="M0 0l20 14M20 0L0 14" stroke="#c8102e" strokeWidth={1} />, <path key={3} d="M10 0v14M0 7h20" stroke="#fff" strokeWidth={4} />, <path key={4} d="M10 0v14M0 7h20" stroke="#c8102e" strokeWidth={2.2} />],
  };
  const a = art[cc];
  if (!a) return <span className="cc-chip">{cc}</span>;
  return (
    <svg width={w} height={h} viewBox="0 0 20 14" className="flag" aria-label={COUNTRY_NAMES[cc] ?? cc}>
      <clipPath id={`f-${cc}`}><rect width={20} height={14} rx={2.2} /></clipPath>
      <g clipPath={`url(#f-${cc})`}>{a}</g>
    </svg>
  );
}

/** Abzeichen-Medaille: Sechseck in der Abzeichenfarbe mit eigenem Symbol. */
export function BadgeMedal({ icon, color, size = 64, off = false }: { icon: string; color: string; size?: number; off?: boolean }) {
  const id = `m-${icon}-${color.replace('#', '')}`;
  return (
    <div className="medal" style={{ width: size, height: size, filter: off ? 'grayscale(1)' : undefined, opacity: off ? 0.4 : 1 }}>
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity={0.45} />
            <stop offset="1" stopColor={color} stopOpacity={0.12} />
          </linearGradient>
        </defs>
        <path d="M32 3 57 17.5v29L32 61 7 46.5v-29z" fill={`url(#${id})`} stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
        <path d="M32 9.5 51.5 20.8v22.4L32 54.5 12.5 43.2V20.8z" fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={1} />
      </svg>
      <span className="medal-ico"><Icon name={icon} size={size * 0.42} color="#fff" /></span>
    </div>
  );
}

/** Währungs-Symbole */
export const Gold = ({ size = 16 }: { size?: number }) => <Icon name="coin" size={size} color="var(--gold)" />;
export const Gems = ({ size = 16 }: { size?: number }) => <Icon name="gem" size={size} color="#60a5fa" />;

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

/** Dein eigener Avatar mit ausgerüstetem Shop-Rahmen */
export function MyAvatar({ size = 56, ring = 'var(--blue)' }: { size?: number; ring?: string }) {
  const me = useMe();
  if (!me) return null;
  const frame = itemById(me.equipped?.frame);
  const r = frame?.ring ?? ring;
  return (
    <div className={`av-ring ${frame ? 'framed' : ''} ${frame?.animated ? 'frame-anim' : ''}`} style={{ background: r, padding: frame ? Math.max(3, size / 22) : 3 }}>
      <Avatar src={me.avatar} name={me.name} size={size} />
    </div>
  );
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

/** Einheitlicher Seitenkopf: Überschrift links, optionaler Inhalt rechts (Platz für den Einstellungs-Button). */
export function PageHeader({ eyebrow, title, right }: { eyebrow: string; title: string; right?: ReactNode }) {
  return (
    <div className="page-head">
      <div style={{ minWidth: 0 }}>
        <div className="eyebrow caps">{eyebrow}</div>
        <h1>{title}</h1>
      </div>
      {right && <div className="page-head-right">{right}</div>}
    </div>
  );
}

/** Abschnittsüberschrift mit optionaler Aktion rechts. */
export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="section">
      <div className="section-title">
        <div className="caps">{title}</div>
        {action}
      </div>
      {children}
    </section>
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
        <div className="caps muted" style={{ fontSize: 12 }}>Diese Woche</div>
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
