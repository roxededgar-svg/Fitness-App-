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
import { RankEmblem, tierPalette } from '../components/RankEmblem';
import { BadgeBack, BadgeFront, RankBack, RankFront } from '../components/MedalFaces';
import { MedalViewer } from '../components/MedalViewer';
import { BADGES } from '../lib/badges';

export function ResultScreen() {
  const last = useBattle((s) => s.last);
  const start = useBattle((s) => s.start);
  const me = useMe()!;
  const nav = useNavigate();
  const [barW, setBarW] = useState<number | null>(null);

  const rec = last?.rec;
  const before = rec ? rankFor(rec.arenaBefore ?? 0) : null;
  const after = rec ? rankFor((rec.arenaBefore ?? 0) + (rec.arenaDelta ?? 0)) : rankFor(me.arenaPoints);
  const DIVS = ['IV', 'III', 'II', 'I'];
  const rankedUp = !!before && (rec?.arenaDelta ?? 0) > 0 &&
    (before.tier.min < after.tier.min || (before.tier.id === after.tier.id && DIVS.indexOf(after.division ?? '') > DIVS.indexOf(before.division ?? '')));

  // Belohnungs-Enthüllungen nacheinander: Level-Up → Rang-Aufstieg → neue Abzeichen
  type Reveal = { kind: 'level' } | { kind: 'rank' } | { kind: 'badge'; id: string };
  const [queue, setQueue] = useState<Reveal[]>([]);
  const [showQueue, setShowQueue] = useState(false);
  useEffect(() => {
    if (!rec) return;
    const q: Reveal[] = [];
    if (rec.levelUp) q.push({ kind: 'level' });
    if (rankedUp) q.push({ kind: 'rank' });
    for (const id of rec.newBadges ?? []) q.push({ kind: 'badge', id });
    setQueue(q);
    if (q.length) {
      const t = setTimeout(() => setShowQueue(true), 1100);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec?.id]);
  const nextReveal = () => setQueue((q) => q.slice(1));
  const current = showQueue ? queue[0] : undefined;
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
              <div className="row" style={{ justifyContent: 'center', gap: 10, marginTop: 6 }}>
                <RankEmblem tier={after.tier} division={after.division} size={44} />
                <div className="display" style={{ fontSize: 20, color: after.tier.color }}>{rankLabel((rec.arenaBefore ?? 0) + (rec.arenaDelta ?? 0))}</div>
              </div>
              {before && before.tier.id !== after.tier.id && (
                <div className="display gold" style={{ fontSize: 14 }}><span className="ico-inline">{(rec.arenaDelta ?? 0) > 0 ? <><Icon name="up" size={14} /> AUFSTIEG!</> : <><Icon name="down" size={14} /> ABSTIEG</>}</span></div>
              )}
              <div className="rank-bar"><span style={{ width: `${(barW ?? 0) * 100}%`, background: after.tier.color }} /></div>
              {after.next && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Noch {after.pointsToNext} Trophäen bis zur nächsten Stufe</div>}
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
          <div className="reward-row"><Icon name="trophy" size={24} color={(rec.arenaDelta ?? 0) >= 0 ? 'var(--green)' : 'var(--red)'} />Trophäen
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

      {current?.kind === 'level' && (
        <div className="levelup" onClick={nextReveal}>
          <div className="caps gold">Level Up!</div>
          <div className="num">{rec.levelUp}</div>
          <div className="muted">Tippen zum Fortfahren</div>
        </div>
      )}
      {current?.kind === 'rank' && (
        <MedalViewer
          front={<RankFront tier={after.tier} division={after.division} />}
          back={<RankBack tier={after.tier} />}
          edge={tierPalette(after.tier.id).mid}
          color={tierPalette(after.tier.id).mid}
          shape="circle"
          title={before && before.tier.id !== after.tier.id ? `Aufstieg: ${after.tier.name}` : `Aufstieg: ${rankLabel((rec.arenaBefore ?? 0) + (rec.arenaDelta ?? 0))}`}
          subtitle={after.next ? `Noch ${after.pointsToNext} Trophäen bis zur nächsten Stufe` : 'Höchster Rang erreicht'}
          actions={<button className="btn btn-primary solid btn-sm" onClick={nextReveal}>Weiter</button>}
          onClose={nextReveal}
        />
      )}
      {current?.kind === 'badge' && (() => {
        const b = BADGES.find((x) => x.id === current.id);
        if (!b) return null;
        return (
          <MedalViewer
            key={b.id}
            front={<BadgeFront badge={b} earned />}
            back={<BadgeBack badge={b} earnedAt={rec.ts} />}
            edge={b.color}
            color={b.color}
            title={`Neues Abzeichen: ${b.name}`}
            subtitle={b.desc}
            actions={<button className="btn btn-purple btn-sm" onClick={nextReveal}>Weiter</button>}
            onClose={nextReveal}
          />
        );
      })()}
    </div>
  );
}
