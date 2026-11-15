import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EXERCISE_LIST, EXERCISES, type ExerciseId } from '../lib/exercises';
import { useBattle } from '../lib/battle';
import { useMe } from '../lib/store';
import { paceTimeline, rpmForElo } from '../lib/bots';
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
  const [opp, setOpp] = useState<'solo' | 'bot' | 'pb'>('solo');
  const [rpm, setRpm] = useState<number | null>(null);
  const effective = custom ? mins * 60 : dur;
  const pb = me.personalBests[ex];
  const exo = EXERCISES[ex];
  const botRpm = rpm ?? Math.round(exo.baseRpm);
  const arenaRpm = Math.round(rpmForElo(ex, me.elo));
  const presets = [
    { label: 'Locker', v: Math.round(exo.baseRpm * 0.6) },
    { label: 'Mittel', v: Math.round(exo.baseRpm) },
    { label: 'Stark', v: Math.round(exo.baseRpm * 1.4) },
    { label: 'Arena-Niveau', v: arenaRpm },
  ];
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

      <div className="caps" style={{ fontSize: 14, margin: '28px 0 14px' }}>Gegner</div>
      <div className="grid4" style={{ gridTemplateColumns: pbSession ? 'repeat(3,1fr)' : 'repeat(2,1fr)' }}>
        <button className={`choice ${opp === 'solo' ? 'on' : ''}`} onClick={() => setOpp('solo')}>Solo<small>Nur du</small></button>
        <button className={`choice ${opp === 'bot' ? 'on' : ''}`} onClick={() => setOpp('bot')}>🤖 Test-Bot<small>Tempo selbst einstellen</small></button>
        {pbSession && <button className={`choice ${opp === 'pb' ? 'on' : ''}`} onClick={() => setOpp('pb')}>👻 Rekord<small>{pb} {exo.unit}</small></button>}
      </div>

      {opp === 'bot' && ex !== 'plank' && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="row">
            <div className="caps" style={{ fontSize: 13 }}>Tempo des Bots</div>
            <div className="spacer" />
            <div className="display gold" style={{ fontSize: 26 }}>{botRpm}<span className="muted" style={{ fontSize: 14 }}> Wdh./Min</span></div>
          </div>
          <input type="range" min={5} max={Math.round(exo.baseRpm * 2.5)} value={botRpm} onChange={(e) => setRpm(Number(e.target.value))}
            style={{ width: '100%', margin: '18px 0 14px', accentColor: 'var(--gold)' }} />
          <div className="grid4">
            {presets.map((p) => (
              <button key={p.label} className={`choice ${botRpm === p.v ? 'on' : ''}`} style={{ minHeight: 54, textAlign: 'center', fontSize: 14 }} onClick={() => setRpm(p.v)}>
                {p.label}<small>{p.v}/Min</small>
              </button>
            ))}
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 12 }}>
            {effective
              ? `Der Bot schafft ca. ${Math.round((botRpm * Math.max(0, effective - 1)) / 60)} ${exo.unit} in ${effective >= 60 ? `${effective / 60} Min` : `${effective} Sek`}. „Arena-Niveau“ entspricht Gegnern mit deiner ELO (${me.elo}).`
              : 'Bei unbegrenzter Dauer läuft der Bot, bis du beendest.'}
          </div>
        </div>
      )}
      {opp === 'bot' && ex === 'plank' && <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>Für Plank gibt es keinen Test-Bot.</div>}

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
              opponent: opp === 'bot' && ex !== 'plank'
                ? { id: 'testbot', name: 'Test-Bot', country: '', elo: 0, arenaPoints: 0, level: 0, wins: 0, losses: 0, kind: 'bot', color: '#f5a524', tier: `${botRpm} Wdh./Min`, timeline: paceTimeline(botRpm, effective ?? 1800, Date.now()) }
                : opp === 'pb' && pbSession && effective
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
