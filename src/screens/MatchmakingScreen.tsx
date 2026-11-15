import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMe } from '../lib/store';
import { botPool, botTimeline, findMatch, type Opponent } from '../lib/bots';
import { todayKey } from '../lib/rng';
import { EXERCISES, PVP_EXERCISES, type ExerciseId } from '../lib/exercises';
import { useBattle } from '../lib/battle';
import { rankFor, rankLabel } from '../lib/progression';
import { fromNorm, humanTimeline, rankedOpponentRpm, recentPaceNorm, tierPaceNorm } from '../lib/pace';
import type { Queue } from '../lib/types';
import { Avatar, Flag } from '../components/ui';
import { Icon } from '../components/Icon';
import { RankEmblem } from '../components/RankEmblem';

const DURATIONS = [30, 60, 90, 120];
const RANKED_DURATION = 60;

export const QUEUE_INFO: Record<Queue, { title: string; sub: string; color: string }> = {
  ranked: { title: 'RANKED', sub: 'Trophäen & ELO · Gegner-Tempo passt sich deinem Rang an', color: 'var(--blue)' },
  casual: { title: 'SCHNELLKAMPF', sub: 'Locker kämpfen · Übung & Dauer frei wählbar · keine Trophäen', color: 'var(--purple)' },
  custom: { title: 'EIGENES TEMPO', sub: 'Du bestimmst, wie schnell dein Gegner ist · ungewertet', color: 'var(--gold)' },
};

const durLabel = (d: number) => (d < 60 ? `${d} SEK` : d === 60 ? '1 MIN' : `${d / 60} MIN`);

export function MatchmakingScreen() {
  const me = useMe()!;
  const nav = useNavigate();
  const [params] = useSearchParams();
  const queue = (['ranked', 'casual', 'custom'].includes(params.get('q') ?? '') ? params.get('q') : 'casual') as Queue;
  const info = QUEUE_INFO[queue];
  const start = useBattle((s) => s.start);
  const last = useBattle((s) => s.last);
  const [pick, setPick] = useState<ExerciseId | 'random'>('random');
  const [phase, setPhase] = useState<'choose' | 'search' | 'found'>('choose');
  const [opp, setOpp] = useState<Opponent | null>(null);
  const [ex, setEx] = useState<ExerciseId>('pushup');
  const [dur, setDur] = useState(queue === 'ranked' ? RANKED_DURATION : 60);
  const [rpm, setRpm] = useState<number | null>(null);
  const [oppRpm, setOppRpm] = useState(0);

  const shownEx: ExerciseId = pick === 'random' ? 'pushup' : pick;
  const exo = EXERCISES[shownEx];
  const customRpm = rpm ?? Math.round(exo.baseRpm);
  const rankedRpm = Math.round(rankedOpponentRpm(shownEx, me));
  const mineNorm = recentPaceNorm(me);

  useEffect(() => {
    if (phase !== 'search') return;
    const t = setTimeout(() => {
      setOpp(findMatch(botPool(todayKey()), me.elo, last?.config.opponent?.id));
      setPhase('found');
    }, queue === 'custom' ? 900 : 1800 + Math.random() * 1600);
    return () => clearTimeout(t);
  }, [phase, me.elo, last, queue]);

  useEffect(() => {
    if (phase !== 'found' || !opp) return;
    const t = setTimeout(() => {
      const seed = Date.now();
      const timeline = queue === 'casual' ? botTimeline(ex, opp.elo, dur, seed) : humanTimeline(oppRpm, dur, seed);
      start({
        mode: 'pvp',
        queue,
        exercise: ex,
        durationS: dur,
        ranked: true,
        opponent: { ...opp, timeline, rpm: queue === 'casual' ? undefined : oppRpm, tier: rankFor(opp.arenaPoints).tier.name },
      });
      nav('/battle', { replace: true });
    }, 2600);
    return () => clearTimeout(t);
  }, [phase, opp, ex, dur, oppRpm, queue, nav, start]);

  function go() {
    const e = pick === 'random' ? PVP_EXERCISES[Math.floor(Math.random() * PVP_EXERCISES.length)] : pick;
    setEx(e);
    if (queue === 'ranked') setOppRpm(rankedOpponentRpm(e, me, (Math.random() - 0.5) * 0.08));
    if (queue === 'custom') setOppRpm(pick === 'random' ? fromNorm(e, (customRpm * 32) / exo.baseRpm) : customRpm);
    setPhase('search');
  }

  if (phase === 'choose') {
    const rank = rankFor(me.arenaPoints);
    return (
      <div className="mm">
        <div className="display" style={{ fontSize: 34, letterSpacing: '.12em', color: info.color }}>{info.title}</div>
        <div className="muted" style={{ maxWidth: 640 }}>{info.sub}</div>

        {queue === 'ranked' && (
          <div className="card" style={{ width: '100%', maxWidth: 640, textAlign: 'left' }}>
            <div className="row">
              <RankEmblem tier={rank.tier} division={rank.division} size={46} />
              <div>
                <div className="display" style={{ fontSize: 20 }}>{rankLabel(me.arenaPoints)}</div>
                <div className="muted" style={{ fontSize: 13 }}>{me.arenaPoints} Trophäen · {me.elo} ELO</div>
              </div>
              <div className="spacer" />
              <div style={{ textAlign: 'right' }}>
                <div className="display gold" style={{ fontSize: 24 }}>~{rankedRpm}<span className="muted" style={{ fontSize: 13 }}> /Min</span></div>
                <div className="muted" style={{ fontSize: 12 }}>Gegner-Tempo ({exo.name})</div>
              </div>
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 12, lineHeight: 1.5 }}>
              Rang-Ziel: <b style={{ color: 'var(--text)' }}>{Math.round(fromNorm(shownEx, tierPaceNorm(me.arenaPoints)))} Wdh./Min</b>
              {mineNorm != null
                ? <> · Dein Ø-Tempo: <b style={{ color: 'var(--text)' }}>{Math.round(fromNorm(shownEx, mineNorm))} Wdh./Min</b>. Gegner werden etwas schneller als du – steigere dich, um aufzusteigen!</>
                : <> · Nach 2 Ranked-Kämpfen passt sich das Gegner-Tempo zusätzlich an dein eigenes Tempo an.</>}
              {' '}Dauer: {RANKED_DURATION} s.
            </div>
          </div>
        )}

        {queue !== 'ranked' && (
          <div className="dur-grid" style={{ width: '100%', maxWidth: 640 }}>
            {DURATIONS.map((d) => (
              <button key={d} className={`choice ${dur === d ? 'on blue' : ''}`} onClick={() => setDur(d)}>{durLabel(d)}</button>
            ))}
          </div>
        )}

        <div className="grid2" style={{ width: '100%', maxWidth: 640 }}>
          <button className={`choice ${pick === 'random' ? 'on blue' : ''}`} style={{ gridColumn: '1 / -1', textAlign: 'center' }} onClick={() => setPick('random')}><span className="ico-inline"><Icon name="dice" size={20} /> Zufällige Übung</span></button>
          {PVP_EXERCISES.map((id) => (
            <button key={id} className={`choice ${pick === id ? 'on blue' : ''}`} onClick={() => { setPick(id); setRpm(null); }}>{EXERCISES[id].name}</button>
          ))}
        </div>

        {queue === 'custom' && (
          <div className="card" style={{ width: '100%', maxWidth: 640, textAlign: 'left' }}>
            <div className="row">
              <div className="caps" style={{ fontSize: 13 }}>Gegner-Tempo{pick === 'random' ? ' (Liegestütz-Maßstab)' : ''}</div>
              <div className="spacer" />
              <div className="display gold" style={{ fontSize: 26 }}>{customRpm}<span className="muted" style={{ fontSize: 14 }}> Wdh./Min</span></div>
            </div>
            <input type="range" min={5} max={Math.round(exo.baseRpm * 2.5)} value={customRpm} onChange={(e) => setRpm(Number(e.target.value))}
              style={{ width: '100%', margin: '18px 0 14px', accentColor: 'var(--gold)' }} />
            <div className="grid4">
              {[
                { l: 'Locker', v: Math.round(exo.baseRpm * 0.6) },
                { l: 'Mittel', v: Math.round(exo.baseRpm) },
                { l: 'Stark', v: Math.round(exo.baseRpm * 1.4) },
                { l: 'Mein Rang', v: rankedRpm },
              ].map((p) => (
                <button key={p.l} className={`choice ${customRpm === p.v ? 'on' : ''}`} style={{ minHeight: 54, textAlign: 'center', fontSize: 14 }} onClick={() => setRpm(p.v)}>
                  {p.l}<small>{p.v}/Min</small>
                </button>
              ))}
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 12 }}>Der Gegner schafft ca. {Math.round((customRpm * dur) / 60)} Wdh. in {durLabel(dur).toLowerCase()}.</div>
          </div>
        )}

        <div style={{ width: '100%', maxWidth: 640 }} className="stack">
          <button className="btn btn-primary solid" onClick={go}><Icon name="bolt" size={22} /> {queue === 'custom' ? 'Kampf starten' : 'Gegner suchen'}</button>
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
          <div className="muted" style={{ marginTop: 8 }}>{info.title} · {EXERCISES[ex].name} · {dur}s{queue === 'casual' ? ` · ELO ${me.elo} ± 120` : ` · ~${Math.round(oppRpm)} Wdh./Min`}</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setPhase('choose')}>Abbrechen</button>
      </div>
    );
  }

  return (
    <div className="mm">
      <div className="caps" style={{ color: info.color }}>{info.title} · Gegner gefunden</div>
      <div className="vs-intro">
        <div className="side">
          <Avatar src={me.avatar} name={me.name} size={120} ring="var(--blue)" />
          <div className="display blue" style={{ fontSize: 22 }}>{me.name}</div>
          <div className="muted" style={{ fontSize: 13 }}>{rankLabel(me.arenaPoints)} · {me.elo} ELO</div>
        </div>
        <div className="big-vs">VS</div>
        <div className="side r">
          <Avatar name={opp.name} size={120} color={opp.color} ring="var(--red)" />
          <div className="display red" style={{ fontSize: 22 }}><Flag cc={opp.country} /> {opp.name}</div>
          <div className="muted" style={{ fontSize: 13 }}>
            {queue === 'casual' ? `${rankLabel(opp.arenaPoints)} · ${opp.elo} ELO` : `Tempo ~${Math.round(oppRpm)} Wdh./Min`}
          </div>
        </div>
      </div>
      <div className="display gold" style={{ fontSize: 22, letterSpacing: '.2em' }}>ÜBUNG: {EXERCISES[ex].name.toUpperCase()} · {dur}s</div>
      <div className="muted ico-inline" style={{ maxWidth: 520 }}><Icon name="camera" size={16} /> {EXERCISES[ex].setup}</div>
    </div>
  );
}
