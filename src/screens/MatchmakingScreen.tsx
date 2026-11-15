import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMe } from '../lib/store';
import { botPool, botTimeline, findMatch, type Opponent } from '../lib/bots';
import { todayKey } from '../lib/rng';
import { EXERCISES, PVP_EXERCISES, type ExerciseId } from '../lib/exercises';
import { useBattle } from '../lib/battle';
import { rankFor, rankLabel } from '../lib/progression';
import { Avatar, flag } from '../components/ui';
import { Icon } from '../components/Icon';

const DURATION = 60;

export function MatchmakingScreen() {
  const me = useMe()!;
  const nav = useNavigate();
  const start = useBattle((s) => s.start);
  const last = useBattle((s) => s.last);
  const [pick, setPick] = useState<ExerciseId | 'random'>('random');
  const [phase, setPhase] = useState<'choose' | 'search' | 'found'>('choose');
  const [opp, setOpp] = useState<Opponent | null>(null);
  const [ex, setEx] = useState<ExerciseId>('pushup');

  useEffect(() => {
    if (phase !== 'search') return;
    const t = setTimeout(() => {
      setOpp(findMatch(botPool(todayKey()), me.elo, last?.config.opponent?.id));
      setPhase('found');
    }, 1800 + Math.random() * 1600);
    return () => clearTimeout(t);
  }, [phase, me.elo, last]);

  useEffect(() => {
    if (phase !== 'found' || !opp) return;
    const t = setTimeout(() => {
      start({
        mode: 'pvp',
        exercise: ex,
        durationS: DURATION,
        ranked: true,
        opponent: { ...opp, timeline: botTimeline(ex, opp.elo, DURATION, Date.now()), tier: rankFor(opp.arenaPoints).tier.name },
      });
      nav('/battle', { replace: true });
    }, 2600);
    return () => clearTimeout(t);
  }, [phase, opp, ex, nav, start]);

  if (phase === 'choose') {
    return (
      <div className="mm">
        <div className="display" style={{ fontSize: 34, letterSpacing: '.12em' }}>SCHNELLKAMPF</div>
        <div className="muted">1 vs 1 · {DURATION} Sekunden · Wer mehr Wiederholungen schafft, gewinnt</div>
        <div className="grid2" style={{ width: '100%', maxWidth: 640 }}>
          <button className={`choice ${pick === 'random' ? 'on blue' : ''}`} style={{ gridColumn: '1 / -1', textAlign: 'center' }} onClick={() => setPick('random')}>🎲 Zufällige Übung</button>
          {PVP_EXERCISES.map((id) => (
            <button key={id} className={`choice ${pick === id ? 'on blue' : ''}`} onClick={() => setPick(id)}>{EXERCISES[id].name}</button>
          ))}
        </div>
        <div style={{ width: '100%', maxWidth: 640 }} className="stack">
          <button className="btn btn-primary solid" onClick={() => {
            setEx(pick === 'random' ? PVP_EXERCISES[Math.floor(Math.random() * PVP_EXERCISES.length)] : pick);
            setPhase('search');
          }}><Icon name="bolt" size={22} /> Gegner suchen</button>
          <button className="btn btn-ghost" onClick={() => nav(-1)}>Abbrechen</button>
        </div>
      </div>
    );
  }

  if (phase === 'search' || !opp) {
    return (
      <div className="mm">
        <div className="radar"><Avatar src={me.avatar} name={me.name} size={110} /></div>
        <div>
          <div className="display" style={{ fontSize: 28, letterSpacing: '.15em' }}>SUCHE GEGNER…</div>
          <div className="muted" style={{ marginTop: 8 }}>{EXERCISES[ex].name} · ELO {me.elo} ± 120</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setPhase('choose')}>Abbrechen</button>
      </div>
    );
  }

  return (
    <div className="mm">
      <div className="caps muted">Gegner gefunden</div>
      <div className="vs-intro">
        <div className="side">
          <Avatar src={me.avatar} name={me.name} size={120} ring="var(--blue)" />
          <div className="display blue" style={{ fontSize: 22 }}>{me.name}</div>
          <div className="muted" style={{ fontSize: 13 }}>{rankLabel(me.arenaPoints)} · {me.elo} ELO</div>
        </div>
        <div className="big-vs">VS</div>
        <div className="side r">
          <Avatar name={opp.name} size={120} color={opp.color} ring="var(--red)" />
          <div className="display red" style={{ fontSize: 22 }}>{flag(opp.country)} {opp.name}</div>
          <div className="muted" style={{ fontSize: 13 }}>{rankLabel(opp.arenaPoints)} · {opp.elo} ELO</div>
        </div>
      </div>
      <div className="display gold" style={{ fontSize: 22, letterSpacing: '.2em' }}>ÜBUNG: {EXERCISES[ex].name.toUpperCase()}</div>
      <div className="muted" style={{ maxWidth: 520 }}>📷 {EXERCISES[ex].setup}</div>
    </div>
  );
}
