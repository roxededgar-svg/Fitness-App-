import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useBattle } from '../lib/battle';
import { useMe, useSettings, useStore } from '../lib/store';
import { EXERCISES } from '../lib/exercises';
import { repsAt } from '../lib/bots';
import { rankFor } from '../lib/progression';
import { usePoseTracker } from '../pose/usePoseTracker';
import { sfx, unlockAudio } from '../lib/feedback';
import { Avatar, TugBar } from '../components/ui';
import { Icon } from '../components/Icon';

type Phase = 'setup' | 'countdown' | 'live' | 'done';

const fmt = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const MODE_TITLE = { pvp: '1 vs 1', dungeon: 'BOSSKAMPF', training: 'TRAINING', ghost: 'FREUNDES-DUELL' } as const;

export function BattleScreen() {
  const config = useBattle((s) => s.config);
  if (!config) return <Navigate to="/" replace />;
  return <Battle key={JSON.stringify([config.mode, config.exercise, config.opponent?.id, config.opponent?.timeline.length])} />;
}

function Battle() {
  const config = useBattle((s) => s.config)!;
  const finishBattle = useBattle((s) => s.finish);
  const me = useMe()!;
  const settings = useSettings();
  const finishMatch = useStore((s) => s.finishMatch);
  const nav = useNavigate();
  const ex = EXERCISES[config.exercise];
  const opp = config.opponent;

  const [phase, setPhase] = useState<Phase>('setup');
  const [count, setCount] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [tapReps, setTapReps] = useState(0);
  const [useTap, setUseTap] = useState(false);
  const [flash, setFlash] = useState<{ text: string; color: string; id: number } | null>(null);
  const [bumpMine, setBumpMine] = useState(0);
  const [bumpOpp, setBumpOpp] = useState(0);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const startRef = useRef(0);
  const timelineRef = useRef<number[]>([]);
  const readySince = useRef<number | null>(null);
  const leaderRef = useRef<'me' | 'opp' | null>(null);
  const lastOppRef = useRef(0);

  const onRep = useCallback(() => {
    timelineRef.current.push(Math.round(performance.now() - startRef.current));
    setBumpMine((b) => b + 1);
    sfx.rep();
  }, []);

  const tracker = usePoseTracker({
    exercise: config.exercise,
    sensitivity: settings.sensitivity,
    facing: settings.facing,
    mirror: settings.mirror,
    showSkeleton: settings.showSkeleton,
    counting: phase === 'live' && !useTap,
    paused: useTap || phase === 'done',
    onRep,
  });

  const myReps = useTap ? tapReps : tracker.frame.reps;
  const durMs = config.durationS ? config.durationS * 1000 : null;
  const oppReps = opp ? repsAt(opp.timeline, elapsed) : 0;
  const ranked = config.ranked && !useTap;

  // Display schlafen verhindern
  useEffect(() => {
    let lock: { release(): Promise<void> } | null = null;
    const nav2 = navigator as Navigator & { wakeLock?: { request(t: 'screen'): Promise<{ release(): Promise<void> }> } };
    nav2.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => undefined);
    return () => void lock?.release().catch(() => undefined);
  }, []);

  // Automatischer Start, sobald der Körper ~1,2 s stabil erkannt wird
  useEffect(() => {
    if (phase !== 'setup' || useTap) return;
    if (tracker.status === 'ready' && tracker.frame.tracking) {
      readySince.current ??= performance.now();
      if (performance.now() - readySince.current > 1200) setPhase('countdown');
    } else readySince.current = null;
  }, [phase, tracker.status, tracker.frame, useTap]);

  // Countdown 3-2-1
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count === 0) {
      sfx.go();
      tracker.resetCount();
      timelineRef.current = [];
      startRef.current = performance.now();
      setPhase('live');
      return;
    }
    sfx.tick();
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, count]);

  // Spieluhr
  useEffect(() => {
    if (phase !== 'live') return;
    const id = setInterval(() => {
      const e = performance.now() - startRef.current;
      setElapsed(durMs ? Math.min(e, durMs) : e);
    }, 100);
    return () => clearInterval(id);
  }, [phase, durMs]);

  const end = useCallback(
    (forfeit = false) => {
      setPhase('done');
      const e = performance.now() - startRef.current;
      const durationS = config.durationS ?? Math.round(e / 1000);
      const finalOpp = opp ? repsAt(opp.timeline, durMs ?? e) : undefined;
      const rec = finishMatch({
        mode: config.mode,
        exercise: config.exercise,
        durationS,
        reps: myReps,
        timeline: [...timelineRef.current],
        oppName: opp?.name,
        oppElo: opp?.elo,
        oppReps: forfeit && opp ? repsAt(opp.timeline, e) : finalOpp,
        oppTimeline: opp?.timeline.filter((t) => t <= (forfeit ? e : durMs ?? e)),
        ranked,
        dungeonId: config.dungeonId,
        forfeit,
      });
      finishBattle(rec);
      if (rec.result === 'win') sfx.win();
      else if (rec.result === 'loss') sfx.loss();
      nav('/result', { replace: true });
    },
    [config, opp, durMs, myReps, ranked, finishMatch, finishBattle, nav],
  );

  // Zeit abgelaufen
  useEffect(() => {
    if (phase === 'live' && durMs && elapsed >= durMs) end();
  }, [phase, elapsed, durMs, end]);

  // Gegner-Wiederholungen & Führungswechsel
  useEffect(() => {
    if (phase !== 'live' || !opp) return;
    if (oppReps > lastOppRef.current) {
      lastOppRef.current = oppReps;
      setBumpOpp((b) => b + 1);
      sfx.oppRep();
    }
    const leader = myReps > oppReps ? 'me' : oppReps > myReps ? 'opp' : null;
    if (leader && leader !== leaderRef.current && myReps + oppReps > 1) {
      if (leader === 'me') {
        setFlash({ text: 'FÜHRUNG!', color: 'var(--blue)', id: Date.now() });
        sfx.lead();
      } else setFlash({ text: `${opp.name} führt!`, color: 'var(--red)', id: Date.now() });
    }
    if (leader) leaderRef.current = leader;
  }, [phase, myReps, oppReps, opp]);

  const remaining = durMs ? durMs - elapsed : elapsed;
  const hot = !!durMs && phase === 'live' && remaining <= 10000;
  const myRank = rankFor(me.arenaPoints);
  const oppRank = opp ? rankFor(opp.arenaPoints) : null;
  const camOk = tracker.status === 'ready';
  const camFailed = ['denied', 'unsupported', 'error'].includes(tracker.status);

  return (
    <div className="battle" onPointerDown={() => unlockAudio()}>
      <video ref={tracker.videoRef} playsInline muted autoPlay className={settings.mirror && settings.facing === 'user' ? 'mirror' : ''} />
      <canvas ref={tracker.canvasRef} className={`overlay ${settings.mirror && settings.facing === 'user' ? 'mirror' : ''}`} />
      <div className="shade" />

      {useTap && phase === 'live' && (
        <div className="tap-zone" onPointerDown={() => { setTapReps((r) => r + 1); onRep(); }} />
      )}

      <div className="hud" style={{ pointerEvents: 'none' }}>
        <div className="players">
          <div className="player">
            <div className="av-ring" style={{ background: 'var(--blue)' }}>
              <Avatar src={me.avatar} name={me.name} size={58} />
              <div className="tier-dot" style={{ background: myRank.tier.color }}><Icon name="shield" size={13} color="#fff" /></div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="pname blue">{me.name.toUpperCase()}</div>
              <div className="ptier" style={{ color: myRank.tier.color }}>{myRank.tier.name}</div>
              <div className="ptroph">🏆 {me.elo}</div>
            </div>
          </div>
          <div className="timer-box">
            <div className="mode">{MODE_TITLE[config.mode]} · {config.durationS ? `${config.durationS} SEK` : '∞'}</div>
            <div className={`timer ${hot ? 'hot' : ''}`}>{phase === 'setup' || phase === 'countdown' ? fmt(durMs ?? 0) : fmt(remaining)}</div>
          </div>
          {opp ? (
            <div className="player right">
              <div className="av-ring" style={{ background: 'var(--red)' }}>
                {opp.kind === 'boss' ? (
                  <div className="avatar" style={{ width: 58, height: 58, background: '#2a0f12', fontSize: 30 }}>💀</div>
                ) : (
                  <Avatar src={opp.avatar} name={opp.name} size={58} color={opp.color} />
                )}
                <div className="tier-dot" style={{ background: oppRank?.tier.color ?? '#555' }}><Icon name="shield" size={13} color="#fff" /></div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="pname red">{opp.name}</div>
                <div className="ptier" style={{ color: '#c7cad8' }}>{opp.tier ?? oppRank?.tier.name}</div>
                <div className="ptroph">🏆 {opp.elo}</div>
              </div>
            </div>
          ) : (
            <div />
          )}
        </div>

        {opp ? <TugBar mine={myReps} theirs={oppReps} /> : <div style={{ height: 16 }} />}

        <div className="scores">
          <div>
            <div key={`m${bumpMine}`} className="n blue bump">{myReps}</div>
            <div className="lbl">{ex.unit === 'Sek.' ? 'Sekunden' : 'Deine Reps'}</div>
          </div>
          <div className="vs">{opp ? 'VS' : ''}</div>
          <div>
            {opp && (
              <>
                <div key={`o${bumpOpp}`} className="n red bump">{oppReps}</div>
                <div className="lbl">Gegner-Reps</div>
              </>
            )}
            {!opp && config.durationS == null && phase === 'live' && (
              <button className="btn btn-gold btn-sm" style={{ pointerEvents: 'auto' }} onClick={() => end()}>Beenden</button>
            )}
          </div>
        </div>
      </div>

      {phase === 'live' && !useTap && camOk && <div className="depth-meter"><span style={{ height: `${tracker.frame.depth * 100}%` }} /></div>}

      <div className="center-msg">
        {phase === 'countdown' && count > 0 && <div key={count} className="countdown">{count}</div>}
        {phase === 'countdown' && count === 0 && <div className="countdown">LOS!</div>}
        {phase === 'live' && flash && (
          <div key={flash.id} className="toast-big" style={{ color: flash.color }} onAnimationEnd={() => setFlash(null)}>{flash.text}</div>
        )}
        {phase === 'setup' && (
          <div className="setup-card">
            {!camOk && !camFailed && (
              <div className="placeholder-figure" style={{ marginBottom: 16 }}>
                <Icon name="user" size={90} />
                <div className="caps" style={{ fontSize: 13 }}>{tracker.status === 'loading' ? 'Kamera & KI werden geladen…' : 'Kamera wird gestartet…'}</div>
              </div>
            )}
            {camFailed && (
              <div style={{ marginBottom: 16 }}>
                <div className="display red" style={{ fontSize: 20 }}>Kamera nicht verfügbar</div>
                <div className="muted" style={{ marginTop: 8, fontSize: 14 }}>
                  {tracker.status === 'denied'
                    ? 'Bitte erlaube den Kamerazugriff in den Browser-Einstellungen und lade die Seite neu.'
                    : 'Dein Browser unterstützt keine Kamera (HTTPS erforderlich).'}
                </div>
              </div>
            )}
            {camOk && (
              <>
                <div className="display" style={{ fontSize: 22 }}>{tracker.frame.tracking ? '✅ Körper erkannt – gleich geht’s los!' : 'Positioniere dich'}</div>
                <div className="muted" style={{ margin: '10px 0 16px', fontSize: 15 }}>{ex.setup}</div>
              </>
            )}
            {config.challenge && <div className="purple" style={{ fontSize: 14, marginBottom: 14 }}>🎬 Dein Lauf wird als Duell-Link aufgezeichnet.</div>}
            <div className="stack" style={{ gap: 10 }}>
              {camOk && <button className="btn btn-primary solid" onClick={() => { unlockAudio(); setPhase('countdown'); }}>Jetzt starten</button>}
              {(settings.tapMode || camFailed) && (settings.tapMode || config.mode === 'training') && (
                <button className="btn btn-ghost" onClick={() => { unlockAudio(); setUseTap(true); setPhase('countdown'); }}>
                  Tipp-Modus (ungewertet)
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => nav(-1)}>Zurück</button>
            </div>
          </div>
        )}
        {confirmQuit && (
          <div className="setup-card" style={{ pointerEvents: 'auto' }}>
            <div className="display" style={{ fontSize: 22 }}>{opp ? 'Kampf aufgeben?' : 'Training beenden?'}</div>
            <div className="muted" style={{ margin: '10px 0 18px' }}>{opp ? 'Aufgeben zählt als Niederlage.' : 'Deine bisherigen Wiederholungen werden gespeichert.'}</div>
            <div className="grid2">
              <button className="btn btn-ghost" onClick={() => setConfirmQuit(false)}>Weiter</button>
              <button className="btn btn-red" onClick={() => end(!!opp)}>{opp ? 'Aufgeben' : 'Beenden'}</button>
            </div>
          </div>
        )}
      </div>

      <div className="footer">
        <div className="cam-status">
          <i className={useTap ? 'warn' : tracker.frame.tracking ? 'on' : camOk ? 'warn' : ''} />
          {useTap ? 'TIPP-MODUS' : 'KAMERA ERKENNUNG'}
        </div>
        <div style={{ textAlign: 'center' }}>
          {phase === 'live' && tracker.frame.hint && !useTap && <div className="hint-bubble">{tracker.frame.hint}</div>}
          <div className="exercise-label">ÜBUNG: {ex.name}</div>
          {!ranked && phase === 'live' && <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>UNGEWERTET</div>}
        </div>
        {phase === 'live' ? (
          <button className="close-btn" onClick={() => setConfirmQuit(true)} aria-label="Beenden" style={{ position: 'relative', zIndex: 4 }}><Icon name="close" size={22} /></button>
        ) : <div />}
      </div>
    </div>
  );
}
