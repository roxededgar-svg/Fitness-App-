import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EXERCISE_LIST, EXERCISES, type ExerciseId } from '../lib/exercises';
import { useBattle } from '../lib/battle';
import { useMe } from '../lib/store';
import { Icon } from '../components/Icon';

const DURS: { s: number | null; label: string }[] = [
  { s: null, label: '∞' }, { s: 30, label: '30 SEK' }, { s: 60, label: '1 MIN' }, { s: 120, label: '2 MIN' },
  { s: 300, label: '5 MIN' }, { s: 600, label: '10 MIN' }, { s: 900, label: '15 MIN' }, { s: 1800, label: '30 MIN' },
];

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function TrainingSetupScreen() {
  const nav = useNavigate();
  const me = useMe()!;
  const start = useBattle((s) => s.start);
  const [ex, setEx] = useState<ExerciseId>('pushup');
  const [dur, setDur] = useState<number | null>(60);
  const [custom, setCustom] = useState(false);
  const [mins, setMins] = useState(3);
  const [ghost, setGhost] = useState(false);
  const effective = custom ? mins * 60 : dur;
  const pb = me.personalBests[ex];
  const pbSession = [...me.sessions].reverse().find((s) => s.exercise === ex && s.durationS === effective && s.reps === pb && s.timeline.length);

  return (
    <div className="page" style={{ paddingBottom: 0, background: 'radial-gradient(ellipse at 50% 0%, #121a08 0%, transparent 60%)' }}>
      <div className="row" style={{ marginBottom: 26 }}>
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="Zurück"><Icon name="back" size={22} /></button>
        <div style={{ flex: 1, textAlign: 'center', marginRight: 48 }}>
          <div className="display gold" style={{ fontSize: 'clamp(28px,4vw,40px)', letterSpacing: '.08em' }}>Freies Training</div>
          <div className="muted" style={{ letterSpacing: '.25em', fontSize: 12, marginTop: 4 }}>· TRAINING VORBEREITEN ·</div>
        </div>
      </div>

      <div className="caps" style={{ fontSize: 14, marginBottom: 14 }}>Übung wählen</div>
      <div className="grid2">
        {EXERCISE_LIST.map((e, i) => (
          <button key={e.id} className={`choice ${ex === e.id ? 'on' : ''}`} style={i === EXERCISE_LIST.length - 1 && EXERCISE_LIST.length % 2 ? { gridColumn: '1 / -1' } : undefined} onClick={() => setEx(e.id)}>
            {e.name}
            <small>{me.personalBests[e.id] ? `Bestwert: ${me.personalBests[e.id]} ${e.unit}` : e.unit === 'Sek.' ? 'Haltezeit in Sekunden' : 'Kamera zählt automatisch'}</small>
          </button>
        ))}
      </div>

      <div className="caps" style={{ fontSize: 14, margin: '28px 0 14px' }}>Dauer</div>
      <div className="dur-grid">
        {DURS.map((d) => (
          <button key={d.label} className={`choice ${!custom && dur === d.s ? 'on' : ''}`} onClick={() => { setDur(d.s); setCustom(false); }}>
            {d.label}
            {d.s === null && <small style={{ fontSize: 10, letterSpacing: '.1em' }}>Unbegrenzt</small>}
          </button>
        ))}
      </div>
      <button className={`choice ${custom ? 'on' : ''}`} style={{ width: '100%', marginTop: 12, textAlign: 'center' }} onClick={() => setCustom(true)}>
        ✎ Eigene Zeit
      </button>
      {custom && (
        <div className="row" style={{ marginTop: 12, justifyContent: 'center' }}>
          <button className="icon-btn" onClick={() => setMins(Math.max(1, mins - 1))}>−</button>
          <div className="display" style={{ fontSize: 28, minWidth: 120, textAlign: 'center' }}>{mins} MIN</div>
          <button className="icon-btn" onClick={() => setMins(Math.min(120, mins + 1))}>+</button>
        </div>
      )}

      {pbSession && (
        <label className="card row" style={{ marginTop: 18, cursor: 'pointer' }}>
          <input type="checkbox" checked={ghost} onChange={(e) => setGhost(e.target.checked)} style={{ width: 22, height: 22 }} />
          <div>
            <div className="display">👻 Gegen eigenen Bestwert antreten</div>
            <div className="muted" style={{ fontSize: 13 }}>Dein Rekordlauf ({pb} {EXERCISES[ex].unit}) läuft als Gegner im Tauziehen-Balken mit.</div>
          </div>
        </label>
      )}

      <div className="card" style={{ marginTop: 18, fontSize: 14 }}>
        <b>📷 Kamera-Tipp:</b> <span className="muted">{EXERCISES[ex].setup}</span>
      </div>

      <div className="sticky-bottom">
        <div className="muted" style={{ textAlign: 'center', letterSpacing: '.2em', marginBottom: 12 }}>
          {effective ? `${fmt(effective)} · Countdown` : '∞ · Offenes Ende'}
        </div>
        <button
          className="btn btn-gold"
          onClick={() => {
            start({
              mode: 'training',
              exercise: ex,
              durationS: effective,
              ranked: true,
              opponent: ghost && pbSession && effective
                ? { id: 'pb', name: 'Dein Rekord', country: me.country, elo: me.elo, arenaPoints: me.arenaPoints, level: 0, wins: 0, losses: 0, kind: 'ghost', avatar: me.avatar, color: '#a855f7', timeline: pbSession.timeline, tier: 'Ghost' }
                : undefined,
            });
            nav('/battle');
          }}
        >
          Training starten
        </button>
      </div>
    </div>
  );
}
