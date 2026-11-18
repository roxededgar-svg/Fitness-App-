import { useMemo, useState } from 'react';
import { EXERCISE_LIST, EXERCISES, type ExerciseId } from '../lib/exercises';
import type { SessionRecord } from '../lib/types';

/** Verlauf pro Übung: Wiederholungen und Tempo der letzten 20 Einheiten */
export function ProgressChart({ sessions }: { sessions: SessionRecord[] }) {
  const used = useMemo(() => EXERCISE_LIST.filter((e) => sessions.some((s) => s.exercise === e.id && s.reps > 0)), [sessions]);
  const [ex, setEx] = useState<ExerciseId | null>(null);
  const cur = ex ?? used[0]?.id ?? null;
  if (!cur) return <div className="card muted">Noch keine Daten – trainiere ein paar Mal, dann siehst du hier deine Kurve.</div>;
  const list = sessions.filter((s) => s.exercise === cur && s.reps > 0).slice(-20);
  const W = 600, H = 170, P = 24;
  const max = Math.max(5, ...list.map((s) => s.reps));
  const x = (i: number) => P + (list.length < 2 ? (W - 2 * P) / 2 : (i * (W - 2 * P)) / (list.length - 1));
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const line = list.map((s, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(s.reps).toFixed(1)}`).join(' ');
  const area = `${line} L${x(list.length - 1)} ${H - P} L${x(0)} ${H - P}Z`;
  const first = list[0]?.reps ?? 0, last = list[list.length - 1]?.reps ?? 0;
  const diff = last - first;
  const unit = EXERCISES[cur].unit;
  return (
    <div className="card">
      <div className="seg" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
        {used.map((e) => <button key={e.id} className={cur === e.id ? 'on' : ''} onClick={() => setEx(e.id)}>{e.name}</button>)}
      </div>
      <div className="row" style={{ fontSize: 13, marginBottom: 4 }}>
        <span className="muted">Letzte {list.length} Einheiten</span>
        <span className="spacer" />
        <span>Bestwert <b>{Math.max(...list.map((s) => s.reps))} {unit}</b></span>
        {list.length > 1 && <span className={diff >= 0 ? 'green' : 'red'} style={{ fontWeight: 700 }}>{diff >= 0 ? '+' : ''}{diff}</span>}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="170" preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="pc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D7FF3B" stopOpacity=".45" />
            <stop offset="1" stopColor="#D7FF3B" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={P} x2={W - P} y1={P + f * (H - 2 * P)} y2={P + f * (H - 2 * P)} stroke="#2c2924" />)}
        {list.length > 1 && <path d={area} fill="url(#pc-fill)" />}
        {list.length > 1 && <path d={line} fill="none" stroke="#D7FF3B" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />}
        {list.map((s, i) => <circle key={s.id} cx={x(i)} cy={y(s.reps)} r="4" fill={s.mode === 'pvp' || s.mode === 'ghost' ? '#FF8A3D' : '#D7FF3B'} stroke="#0b0c12" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />)}
      </svg>
      <div className="legend" style={{ marginTop: 6 }}><span><i style={{ background: 'var(--blue)' }} />Training / Pfad</span><span><i style={{ background: 'var(--purple)' }} />Kampf</span></div>
    </div>
  );
}
