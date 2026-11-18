import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTeam, liveCount, MODE_LABEL, type Member, type TeamConfig } from '../lib/team';
import { useSettings, useStore } from '../lib/store';
import { EXERCISES } from '../lib/exercises';
import { repsAt } from '../lib/bots';
import { usePoseTracker, type CameraStatus } from '../pose/usePoseTracker';
import { useDuoTracker } from '../pose/useDuoTracker';
import { sfx, unlockAudio } from '../lib/feedback';
import { Avatar, MyAvatar, TugBar } from '../components/ui';
import { Icon } from '../components/Icon';

interface Cam {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  status: CameraStatus;
  reps: [number, number];
  tracking: [boolean, boolean];
  resetCount(): void;
}

const LEFT = '#D7FF3B';
const RIGHT = '#ef4444';

export function TeamBattleScreen() {
  const config = useTeam((s) => s.config);
  if (!config) return <Navigate to="/friends" replace />;
  return liveCount(config) >= 2 ? <DuoCam config={config} /> : <SoloCam config={config} />;
}

/** Hält Phase & Wiederholungs-Callback, damit die Kamera-Hooks darauf zugreifen können */
function useBattleCore() {
  const [phase, setPhase] = useState<'setup' | 'countdown' | 'live' | 'done'>('setup');
  const startRef = useRef(0);
  const lines = useRef<[number[], number[]]>([[], []]);
  const [bump, setBump] = useState<[number, number]>([0, 0]);
  const [useTap, setUseTap] = useState(false);
  const onRep = useCallback((slot: 0 | 1) => {
    lines.current[slot].push(Math.round(performance.now() - startRef.current));
    setBump((b) => (slot === 0 ? [b[0] + 1, b[1]] : [b[0], b[1] + 1]));
    sfx.rep();
  }, []);
  return { phase, setPhase, startRef, lines, bump, onRep, useTap, setUseTap };
}

function SoloCam({ config }: { config: TeamConfig }) {
  const settings = useSettings();
  const core = useBattleCore();
  const t = usePoseTracker({
    exercise: config.exercise, sensitivity: settings.sensitivity, facing: settings.facing, mirror: settings.mirror,
    showSkeleton: settings.showSkeleton, counting: core.phase === 'live' && !core.useTap, paused: core.useTap || core.phase === 'done', onRep: () => core.onRep(0),
  });
  const cam: Cam = { videoRef: t.videoRef, canvasRef: t.canvasRef, status: t.status, reps: [t.frame.reps, 0], tracking: [t.frame.tracking, false], resetCount: t.resetCount };
  return <TeamBattle config={config} cam={cam} core={core} />;
}

function DuoCam({ config }: { config: TeamConfig }) {
  const settings = useSettings();
  const core = useBattleCore();
  const coop = config.mode === 'local2v2';
  const t = useDuoTracker({
    exercise: config.exercise, sensitivity: settings.sensitivity, facing: settings.facing, mirror: settings.mirror,
    showSkeleton: settings.showSkeleton, counting: core.phase === 'live' && !core.useTap, paused: core.useTap || core.phase === 'done',
    colors: coop ? [LEFT, '#22d3ee'] : [LEFT, RIGHT], onRep: (slot) => core.onRep(slot),
  });
  const cam: Cam = { videoRef: t.videoRef, canvasRef: t.canvasRef, status: t.status, reps: [t.frames[0].reps, t.frames[1].reps], tracking: [t.frames[0].tracking, t.frames[1].tracking], resetCount: t.resetCount };
  return <TeamBattle config={config} cam={cam} core={core} />;
}

function TeamBattle({ config, cam, core }: { config: TeamConfig; cam: Cam; core: ReturnType<typeof useBattleCore> }) {
  const settings = useSettings();
  const finishMatch = useStore((s) => s.finishMatch);
  const finish = useTeam((s) => s.finish);
  const nav = useNavigate();
  const ex = EXERCISES[config.exercise];
  const { phase, setPhase, startRef, lines } = core;
  const [count, setCount] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [tap, setTap] = useState<[number, number]>([0, 0]);
  const { useTap, setUseTap } = core;
  const durMs = config.durationS * 1000;
  const lives = liveCount(config);
  const camFailed = ['denied', 'unsupported', 'error'].includes(cam.status);

  const liveReps = (slot: 0 | 1) => (useTap ? tap[slot] : cam.reps[slot]);
  const repsOf = (m: Member) => (m.kind === 'live' ? liveReps(m.slot ?? 0) : repsAt(m.timeline ?? [], elapsed));
  const leftReps = config.left.map(repsOf);
  const rightReps = config.right.map(repsOf);
  const L = leftReps.reduce((a, b) => a + b, 0);
  const R = rightReps.reduce((a, b) => a + b, 0);

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count === 0) {
      sfx.go();
      cam.resetCount();
      lines.current = [[], []];
      startRef.current = performance.now();
      setPhase('live');
      return;
    }
    sfx.tick();
    const id = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, count]);

  useEffect(() => {
    if (phase !== 'live') return;
    const id = setInterval(() => setElapsed(Math.min(durMs, performance.now() - startRef.current)), 100);
    return () => clearInterval(id);
  }, [phase, durMs, startRef]);

  // Gegner-Wiederholungen hörbar machen
  const lastRight = useRef(0);
  useEffect(() => {
    const ghosts = config.right.filter((m) => m.kind !== 'live').reduce((a, m) => a + repsAt(m.timeline ?? [], elapsed), 0);
    if (ghosts > lastRight.current) sfx.oppRep();
    lastRight.current = ghosts;
  }, [elapsed, config.right]);

  const end = useCallback(() => {
    if (phase === 'done') return;
    setPhase('done');
    const outcome = L > R ? 'win' : L < R ? 'loss' : 'draw';
    const meMember = config.left.find((m) => m.me) ?? config.left[0];
    const myReps = meMember.kind === 'live' ? liveReps(meMember.slot ?? 0) : 0;
    const rec = finishMatch({
      mode: 'ghost', exercise: config.exercise, durationS: config.durationS, reps: myReps,
      timeline: [...lines.current[meMember.slot ?? 0]], oppName: config.rightName, oppReps: R, outcome, ranked: !useTap,
    });
    const tl = (m: Member) => (m.kind === 'live' ? [...lines.current[m.slot ?? 0]] : (m.timeline ?? []).filter((t) => t <= durMs));
    finish({ config, left: config.left.map(tl), right: config.right.map(tl), rec });
    if (outcome === 'win') sfx.win();
    else if (outcome === 'loss') sfx.loss();
    nav('/teamresult', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, L, R, config, useTap, tap, cam.reps]);

  useEffect(() => {
    if (phase === 'live' && elapsed >= durMs) end();
  }, [phase, elapsed, durMs, end]);

  const remaining = Math.max(0, durMs - elapsed);
  const fmt = (ms: number) => { const s = Math.ceil(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  const mirror = settings.mirror && settings.facing === 'user' ? 'mirror' : '';
  const ready = cam.status === 'ready' && cam.tracking.filter(Boolean).length >= lives;
  const coop = config.mode !== 'local1v1';

  const MemberRow = ({ m, reps, color }: { m: Member; reps: number; color: string }) => (
    <div className="tm-member">
      {m.me ? <MyAvatar size={30} ring={color} /> : (
        <div className="av-ring" style={{ background: color }}>
          {m.kind === 'bot' ? <div className="avatar" style={{ width: 30, height: 30, background: '#1d1b18' }}><Icon name="robot" size={16} color="#a39b8f" /></div> : <Avatar name={m.name} size={30} color={color} />}
        </div>
      )}
      <span className="tm-name">{m.name}{m.kind === 'ghost' && <small> · Lauf</small>}{m.kind === 'bot' && <small> · KI</small>}{m.kind === 'live' && lives === 2 && <small> · {m.slot === 0 ? 'links' : 'rechts'}</small>}</span>
      <b style={{ color }}>{reps}</b>
    </div>
  );

  return (
    <div className="battle" onPointerDown={() => unlockAudio()}>
      <video ref={cam.videoRef} playsInline muted autoPlay className={mirror} />
      <canvas ref={cam.canvasRef} className={`overlay ${mirror}`} />
      <div className="shade" />
      {useTap && phase === 'live' && (
        <>
          <div className="tap-zone" style={{ right: lives === 2 ? '50%' : 0 }} onPointerDown={() => { setTap(([a, b]) => [a + 1, b]); core.onRep(0); }} />
          {lives === 2 && <div className="tap-zone" style={{ left: '50%' }} onPointerDown={() => { setTap(([a, b]) => [a, b + 1]); core.onRep(1); }} />}
        </>
      )}
      {lives === 2 && phase !== 'done' && <div className="duo-divider" />}

      <div className="hud" style={{ pointerEvents: 'none' }}>
        <div className="players">
          <div className="team-head" style={{ color: LEFT }}>{config.leftName}</div>
          <div className="timer-box">
            <div className="mode">{MODE_LABEL[config.mode]} · {config.durationS} SEK</div>
            <div className={`timer ${phase === 'live' && remaining <= 10000 ? 'hot' : ''}`}>{phase === 'live' ? fmt(remaining) : fmt(durMs)}</div>
          </div>
          <div className="team-head right" style={{ color: coop ? RIGHT : RIGHT }}>{config.rightName}</div>
        </div>
        <TugBar mine={L} theirs={R} />
        <div className="scores">
          <div><div key={`l${core.bump[0]}`} className="n blue bump">{L}</div></div>
          <div className="vs">VS</div>
          <div><div key={`r${core.bump[1]}`} className="n red bump">{R}</div></div>
        </div>
        <div className="tm-cols">
          <div>{config.left.map((m, i) => <MemberRow key={i} m={m} reps={leftReps[i]} color={m.kind === 'live' && m.slot === 1 && coop ? '#22d3ee' : LEFT} />)}</div>
          <div>{config.right.map((m, i) => <MemberRow key={i} m={m} reps={rightReps[i]} color={RIGHT} />)}</div>
        </div>
      </div>

      <div className="center-msg">
        {phase === 'countdown' && <div key={count} className="countdown">{count > 0 ? count : 'LOS!'}</div>}
        {phase === 'setup' && (
          <div className="setup-card" style={{ pointerEvents: 'auto' }}>
            <div className="display" style={{ fontSize: 22 }}>
              {lives === 2 ? (config.mode === 'local1v1' ? 'Stellt euch nebeneinander' : 'Stellt euch als Team nebeneinander') : 'Positioniere dich'}
            </div>
            <div className="muted" style={{ margin: '10px 0 14px', fontSize: 14, lineHeight: 1.5 }}>
              {lives === 2
                ? `Gerät frontal vor euch, ca. 3 m Abstand, beide ganz im Bild. Links: ${config.left.find((m) => m.slot === 0)?.name ?? config.right.find((m) => m.slot === 0)?.name} · Rechts: ${[...config.left, ...config.right].find((m) => m.kind === 'live' && m.slot === 1)?.name}. Am besten Kniebeugen oder Jumping Jacks.`
                : ex.setup}
            </div>
            {cam.status === 'ready' && (
              <div className="row" style={{ justifyContent: 'center', gap: 14, marginBottom: 12 }}>
                {Array.from({ length: lives }, (_, i) => (
                  <span key={i} className={`pill ${cam.tracking[i] ? 'ok-pill' : ''}`}>{i === 0 ? (lives === 2 ? 'Links' : 'Du') : 'Rechts'}: {cam.tracking[i] ? 'erkannt' : 'nicht im Bild'}</span>
                ))}
              </div>
            )}
            {!camFailed && cam.status !== 'ready' && <div className="muted" style={{ marginBottom: 12 }}>Kamera & KI werden geladen…</div>}
            {camFailed && <div className="red" style={{ marginBottom: 12, fontSize: 14 }}>Kamera nicht verfügbar – ihr könnt per Tippen zählen.</div>}
            <div className="stack" style={{ gap: 10 }}>
              <button className="btn btn-primary solid" disabled={cam.status !== 'ready'} onClick={() => { unlockAudio(); setPhase('countdown'); }}>
                {ready ? 'Los!' : 'Trotzdem starten'}
              </button>
              {(settings.tapMode || camFailed) && (
                <button className="btn btn-ghost" onClick={() => { unlockAudio(); setUseTap(true); setPhase('countdown'); }}>
                  Tipp-Modus {lives === 2 ? '(links / rechts tippen)' : ''} – ungewertet
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => nav(-1)}>Zurück</button>
            </div>
          </div>
        )}
      </div>

      <div className="footer">
        <div className="cam-status"><i className={useTap ? 'warn' : cam.tracking.slice(0, lives).every(Boolean) ? 'on' : cam.status === 'ready' ? 'warn' : ''} />{useTap ? 'TIPP-MODUS' : `${lives} ${lives === 2 ? 'PERSONEN' : 'PERSON'}`}</div>
        <div className="exercise-label">ÜBUNG: {ex.name}</div>
        {phase === 'live' ? <button className="close-btn" style={{ position: 'relative', zIndex: 4 }} onClick={() => confirm('Kampf abbrechen?') && end()} aria-label="Beenden"><Icon name="close" size={22} /></button> : <div />}
      </div>
    </div>
  );
}
