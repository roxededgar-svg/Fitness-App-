import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useBattle } from '../lib/battle';
import { useMe } from '../lib/store';
import { EXERCISES } from '../lib/exercises';
import { rankFor, rankLabel } from '../lib/progression';
import { botTimeline } from '../lib/bots';
import { humanTimeline, sessionRpm } from '../lib/pace';
import { DUNGEONS } from '../lib/dungeons';
import { duelUrl, encodeDuel } from '../lib/duel';
import { levelFromXp } from '../lib/progression';
import { shareOrCopy } from '../lib/share';
import { Icon } from '../components/Icon';
import { Gems, Gold, RaceChart } from '../components/ui';

export function ResultScreen() {
  const last = useBattle((s) => s.last);
  const start = useBattle((s) => s.start);
  const me = useMe()!;
  const nav = useNavigate();
  const [showLevel, setShowLevel] = useState(false);
  const [barW, setBarW] = useState<number | null>(null);

  const rec = last?.rec;
  useEffect(() => {
    if (rec?.levelUp) {
      const t = setTimeout(() => setShowLevel(true), 900);
      return () => clearTimeout(t);
    }
  }, [rec]);

  const before = rec ? rankFor(rec.arenaBefore ?? 0) : null;
  const after = rankFor(me.arenaPoints);
  useEffect(() => {
    if (!before) return;
    setBarW(before.progress);
    const t = setTimeout(() => setBarW(after.progress), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec?.id]);

  const duelCode = useMemo(() => {
    if (!rec || !rec.durationS || rec.timeline.length === 0 || rec.exercise === 'plank') return null;
    if (!(last!.config.challenge || rec.mode === 'ghost' || rec.mode === 'pvp')) return null;
    return encodeDuel({
      n: me.name, c: me.code, co: me.country, e: me.elo, a: me.arenaPoints, l: levelFromXp(me.xp).level,
      x: rec.exercise, d: rec.durationS, timeline: rec.timeline,
    });
  }, [rec, last, me]);

  if (!last || !rec) return <Navigate to="/" replace />;
  const { config } = last;
  const ex = EXERCISES[rec.exercise];
  const r = rec.result;
  const dungeon = DUNGEONS.find((d) => d.id === rec.dungeonId);

  let title = 'TRAINING BEENDET';
  let color = 'var(--blue)';
  if (r === 'win') { title = config.mode === 'dungeon' ? 'BOSS BESIEGT' : 'SIEG'; color = 'var(--green)'; }
  if (r === 'loss') { title = config.mode === 'dungeon' ? 'BOSS ENTKOMMEN' : 'NIEDERLAGE'; color = 'var(--red)'; }
  if (r === 'draw') { title = 'UNENTSCHIEDEN'; color = 'var(--gold)'; }
  if (!r && config.challenge) title = 'DUELL AUFGEZEICHNET';

  function rematch(newOpp: boolean) {
    if (config.mode === 'pvp' && newOpp) return nav(`/matchmaking?q=${config.queue ?? 'casual'}`, { replace: true });
    const o = config.opponent;
    start({
      ...config,
      opponent: o && o.kind === 'bot' && o.id !== 'testbot'
        ? { ...o, timeline: o.rpm ? humanTimeline(o.rpm, config.durationS ?? 60, Date.now()) : botTimeline(config.exercise, o.elo, config.durationS ?? 60, Date.now()) }
        : o,
    });
    nav('/battle', { replace: true });
  }

  const shareText =
    r && rec.oppName
      ? `${title}! ${rec.reps}:${rec.oppReps} ${ex.name} gegen ${rec.oppName} in Vitalis. Schaffst du mehr?`
      : `Ich habe ${rec.reps} ${ex.unit} ${ex.name} in ${rec.durationS}s geschafft – Vitalis. Fordere mich heraus!`;

  return (
    <div className={`result ${r === 'loss' ? 'lose' : r === 'win' ? 'win' : ''}`}>
      <h1 style={{ color }}>{title}</h1>
      <div className="score">{rec.reps}{rec.oppReps != null && <> <span style={{ color: 'var(--muted)' }}>·</span> {rec.oppReps}</>}</div>
      <div className="muted" style={{ textAlign: 'center', marginBottom: 26, fontSize: 17 }}>
        {rec.oppName ? `vs ${rec.oppName}` : `${ex.name} · ${rec.durationS}s`}
        {rec.queue === 'casual' && ' · Schnellkampf'}
        {rec.queue === 'custom' && ' · Eigenes Tempo'}
        {!rec.ranked && ' · ungewertet'}
        {rec.reps === 0 && ' · Keine Wiederholungen → keine Belohnung'}
      </div>

      <div className="card stack">
        {rec.durationS >= 10 && rec.exercise !== 'plank' && (
          <div className="row" style={{ justifyContent: 'center', gap: 28, fontSize: 15 }}>
            <span>Dein Tempo: <b className="blue">{Math.round(sessionRpm(rec))} Wdh./Min</b></span>
            {rec.oppReps != null && <span>Gegner: <b className="red">{Math.round((rec.oppReps / rec.durationS) * 60)} Wdh./Min</b></span>}
          </div>
        )}
        {rec.mode === 'pvp' && rec.ranked && rec.queue !== 'casual' && rec.queue !== 'custom' && (
          <div className="grid2">
            <div style={{ textAlign: 'center' }}>
              <div className="caps muted" style={{ fontSize: 12 }}>ELO</div>
              <div className="display" style={{ fontSize: 30, marginTop: 6 }}>
                {rec.eloBefore} <span className="muted">→</span> <span style={{ color: (rec.eloDelta ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>{(rec.eloBefore ?? 0) + (rec.eloDelta ?? 0)}</span>
              </div>
              <div className="display" style={{ fontSize: 26, color: (rec.eloDelta ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>{(rec.eloDelta ?? 0) >= 0 ? '+' : ''}{rec.eloDelta}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="caps muted" style={{ fontSize: 12 }}>Rang</div>
              <div className="display" style={{ fontSize: 22, marginTop: 6, color: after.tier.color }}>{rankLabel(me.arenaPoints)}</div>
              {before && before.tier.id !== after.tier.id && (
                <div className="display gold" style={{ fontSize: 14 }}><span className="ico-inline">{(rec.arenaDelta ?? 0) > 0 ? <><Icon name="up" size={14} /> AUFSTIEG!</> : <><Icon name="down" size={14} /> ABSTIEG</>}</span></div>
              )}
              <div className="rank-bar"><span style={{ width: `${(barW ?? 0) * 100}%`, background: after.tier.color }} /></div>
              {after.next && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Noch {after.pointsToNext} Punkte bis zur nächsten Stufe</div>}
            </div>
          </div>
        )}
        {dungeon && rec.bossMaxHp != null && (
          <div>
            <div className="row" style={{ fontSize: 14 }}>
              <span className="caps muted" style={{ fontSize: 12 }}>{dungeon.boss}</span>
              <div className="spacer" />
              <span className="display">{rec.bossHpLeft} / {rec.bossMaxHp} HP</span>
            </div>
            <div className="rank-bar" style={{ height: 14 }}>
              <span style={{ width: `${((rec.bossHpLeft ?? 0) / rec.bossMaxHp) * 100}%`, background: 'linear-gradient(90deg,#b91c1c,#ef4444)' }} />
            </div>
            <div className="row muted" style={{ fontSize: 13, marginTop: 8 }}>
              <span>Schaden: <b style={{ color: 'var(--text)' }}>{rec.bossMaxHp - (rec.bossHpLeft ?? 0)}</b></span>
              <span>Beste Combo: <b className="gold">x{rec.maxCombo ?? 0}</b></span>
              {r === 'loss' && <span>Noch {Math.ceil((rec.bossHpLeft ?? 0) / 100)} Wdh. gefehlt</span>}
            </div>
          </div>
        )}
        {dungeon && r === 'win' && rec.firstClear && (
          <div className="display gold ico-inline" style={{ justifyContent: 'center', width: '100%', fontSize: 18 }}><Icon name="crown" size={20} /> Erster Sieg über {dungeon.boss}!</div>
        )}
        <div className="grid2">
          <div className="reward-row"><Icon name="star" size={24} color="var(--blue)" />XP erhalten<b className="blue">+{rec.xp}</b></div>
          <div className="reward-row"><Gold size={24} />Gold erhalten<b className="gold">+{rec.gold}</b></div>
        </div>
        {(rec.mode === 'pvp' && rec.ranked && (rec.queue ?? 'ranked') === 'ranked') && (
          <div className="reward-row"><Icon name="trophy" size={24} color={(rec.arenaDelta ?? 0) >= 0 ? 'var(--green)' : 'var(--red)'} />Arena-Punkte
            <b style={{ color: (rec.arenaDelta ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>{(rec.arenaDelta ?? 0) >= 0 ? '+' : ''}{rec.arenaDelta}</b></div>
        )}
        {rec.gems > 0 && <div className="reward-row"><Gems size={24} />Edelsteine<b className="blue">+{rec.gems}</b></div>}
      </div>

      {rec.durationS > 0 && (
        <div style={{ marginTop: 16 }}>
          <RaceChart mine={rec.timeline} theirs={rec.oppTimeline} durationS={rec.durationS} oppName={rec.oppName} />
        </div>
      )}

      {duelCode && (
        <div className="card" style={{ marginTop: 16, borderColor: '#3b2a6b' }}>
          <div className="display purple ico-inline" style={{ fontSize: 18 }}><Icon name="swords" size={20} /> Fordere Freunde heraus</div>
          <div className="muted" style={{ margin: '6px 0 14px', fontSize: 14 }}>Dein Lauf wird zum Gegner: Wer den Link öffnet, tritt live gegen deine {rec.reps} {ex.unit} an.</div>
          <button className="btn btn-purple" onClick={() => shareOrCopy(`${me.name} fordert dich zu ${ex.name} heraus! ${rec.reps} in ${rec.durationS}s – schlägst du das?`, duelUrl(duelCode))}>
            <Icon name="share" size={20} /> Duell-Link teilen
          </button>
        </div>
      )}

      <div className="stack" style={{ marginTop: 22 }}>
        {config.opponent && config.mode !== 'ghost' && (
          <button className="btn btn-purple" onClick={() => rematch(false)}>{config.mode === 'dungeon' ? 'Erneut kämpfen' : 'Revanche'}</button>
        )}
        <div className="grid2">
          {config.mode === 'pvp' ? (
            <button className="btn btn-ghost" onClick={() => rematch(true)}>Neuer Gegner</button>
          ) : (
            <button className="btn btn-ghost" onClick={() => (config.opponent ? nav(config.mode === 'dungeon' ? '/map' : '/', { replace: true }) : rematch(false))}>
              {config.opponent ? (config.mode === 'dungeon' ? 'Weltkarte' : 'Zurück') : 'Nochmal'}
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => shareOrCopy(shareText, duelCode ? duelUrl(duelCode) : undefined)}>Ergebnis teilen</button>
        </div>
        <button className="btn btn-ghost" onClick={() => nav('/', { replace: true })}>Hauptmenü</button>
      </div>

      {showLevel && rec.levelUp && (
        <div className="levelup" onClick={() => setShowLevel(false)}>
          <div className="caps gold">Level Up!</div>
          <div className="num">{rec.levelUp}</div>
          <div className="muted">Tippen zum Fortfahren</div>
        </div>
      )}
    </div>
  );
}
