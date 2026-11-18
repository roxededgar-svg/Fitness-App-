import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { roomActions, useNet } from '../lib/net';
import { COUNTDOWN_MS, teamReps, type RoomPlayer, type RoomSnapshot, type Team } from '../lib/room';
import { useSettings, useStore } from '../lib/store';
import { EXERCISES } from '../lib/exercises';
import { usePoseTracker } from '../pose/usePoseTracker';
import { sfx, unlockAudio } from '../lib/feedback';
import { Avatar, TugBar } from '../components/ui';

/** Online-Kampf: eigene Kamera auf dem eigenen Gerät, live die Balken aller Mitspieler */
export function OnlineBattleScreen() {
  const room = useNet((s) => s.room);
  if (!room) return <Navigate to="/online" replace />;
  return <OnlineBattle key={room.round} />;
}

function OnlineBattle() {
  const room = useNet((s) => s.room)!;
  const net = useNet();
  const selfId = net.info.selfId;
  const isHost = net.role === 'host';
  const settings = useSettings();
  const finishMatch = useStore((s) => s.finishMatch);
  const nav = useNavigate();
  const ex = EXERCISES[room.exercise];
  const durMs = room.durationS * 1000;
  const self = room.players.find((p) => p.id === selfId);
  const myTeam: Team = self?.team ?? 0;
  const otherTeam: Team = myTeam === 0 ? 1 : 0;

  const [useTap, setUseTap] = useState(settings.tapMode);
  const [tap, setTap] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [countLeft, setCountLeft] = useState(3);
  const liveStart = useRef<number | null>(null);
  const timeline = useRef<number[]>([]);
  const sentFinish = useRef(false);
  const saved = useRef(false);

  const onRep = useCallback(() => {
    if (liveStart.current != null) timeline.current.push(Math.round(performance.now() - liveStart.current));
    sfx.rep();
  }, []);
  const live = room.phase === 'live' && !sentFinish.current;
  const t = usePoseTracker({
    exercise: room.exercise, sensitivity: settings.sensitivity, facing: settings.facing, mirror: settings.mirror,
    showSkeleton: settings.showSkeleton, counting: live && !useTap, paused: useTap || room.phase === 'done', onRep,
  });
  const myReps = useTap ? tap : t.frame.reps;

  // Countdown lokal anzeigen; der Gastgeber schaltet danach auf „live“
  useEffect(() => {
    if (room.phase !== 'countdown') return;
    unlockAudio();
    const start = performance.now();
    let last = -1;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((COUNTDOWN_MS - 500 - (performance.now() - start)) / 1000));
      if (left !== last) { last = left; setCountLeft(left); left > 0 ? sfx.tick() : sfx.go(); }
    }, 100);
    const done = isHost ? setTimeout(() => useNet.getState().host?.goLive(), COUNTDOWN_MS) : undefined;
    return () => { clearInterval(id); if (done) clearTimeout(done); };
  }, [room.phase, isHost]);

  // Live: eigene Uhr starten, Zähler zurücksetzen
  useEffect(() => {
    if (room.phase !== 'live' || liveStart.current != null) return;
    t.resetCount();
    setTap(0);
    timeline.current = [];
    liveStart.current = performance.now();
    const id = setInterval(() => setElapsed(Math.min(durMs, performance.now() - (liveStart.current ?? performance.now()))), 100);
    const force = isHost ? setTimeout(() => useNet.getState().host?.forceFinish(), durMs + 6000) : undefined;
    return () => { clearInterval(id); if (force) clearTimeout(force); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.phase]);

  // Eigene Wiederholungen an alle senden
  useEffect(() => {
    if (room.phase === 'live' && !sentFinish.current) roomActions().myReps(myReps);
  }, [myReps, room.phase]);

  // Zeit um → eigenes Ergebnis melden
  useEffect(() => {
    if (room.phase === 'live' && elapsed >= durMs && !sentFinish.current) {
      sentFinish.current = true;
      roomActions().myFinished(myReps);
    }
  }, [elapsed, durMs, room.phase, myReps]);

  // Ergebnis einmal speichern
  useEffect(() => {
    if (room.phase !== 'done' || saved.current) return;
    saved.current = true;
    const mine = teamReps(room, myTeam), theirs = teamReps(room, otherTeam);
    const outcome = mine > theirs ? 'win' : mine < theirs ? 'loss' : 'draw';
    finishMatch({
      mode: 'ghost', exercise: room.exercise, durationS: room.durationS, reps: myReps, timeline: [...timeline.current],
      oppName: room.players.filter((p) => p.team === otherTeam).map((p) => p.name).join(' & '), oppReps: theirs, outcome, ranked: !useTap,
    });
    outcome === 'win' ? sfx.win() : outcome === 'loss' ? sfx.loss() : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.phase]);

  // Gastgeber setzt zurück in die Lobby → zurück
  useEffect(() => {
    if (room.phase === 'lobby') nav('/online', { replace: true });
  }, [room.phase, nav]);

  // Für die Anzeige: eigener Wert sofort lokal, die anderen aus dem Raum
  const shown: RoomSnapshot = { ...room, players: room.players.map((p) => (p.id === selfId && room.phase === 'live' ? { ...p, reps: myReps } : p)) };
  const A = teamReps(shown, myTeam), B = teamReps(shown, otherTeam);
  const mates = shown.players.filter((p) => p.team === myTeam);
  const rivals = shown.players.filter((p) => p.team === otherTeam);
  const maxReps = Math.max(5, ...shown.players.map((p) => p.reps));
  const remaining = Math.max(0, durMs - elapsed);
  const fmt = (ms: number) => { const s = Math.ceil(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  const mirror = settings.mirror && settings.facing === 'user' ? 'mirror' : '';

  const Row = ({ p, color }: { p: RoomPlayer; color: string }) => (
    <div className={`ol-row ${p.id === selfId ? 'me' : ''} ${p.online ? '' : 'off'}`}>
      <Avatar name={p.name} size={30} color={color} />
      <div className="ol-main">
        <div className="ol-name">{p.id === selfId ? 'Du' : p.name}{!p.online && <small> · getrennt</small>}{p.finished && room.phase === 'live' && <small> · fertig</small>}</div>
        <div className="ol-bar"><span style={{ width: `${(p.reps / maxReps) * 100}%`, background: color }} /></div>
      </div>
      <b style={{ color }}>{p.reps}</b>
    </div>
  );

  if (room.phase === 'done') {
    const win = A > B, draw = A === B;
    return (
      <div className={`result ${draw ? '' : win ? 'win' : 'lose'}`}>
        <h1 style={{ color: draw ? 'var(--gold)' : win ? 'var(--green)' : 'var(--red)' }}>{draw ? 'UNENTSCHIEDEN' : win ? (mates.length > 1 ? 'TEAM-SIEG' : 'SIEG') : 'NIEDERLAGE'}</h1>
        <div className="hand" style={{ textAlign: 'center', fontSize: 24 }}>{draw ? 'Keiner gibt nach. Revanche!' : win ? 'Zusammen unschlagbar.' : 'Nächstes Mal holt ihr sie.'}</div>
        <div className="score">{A} <span style={{ color: 'var(--muted)' }}>·</span> {B}</div>
        <div className="grid2" style={{ marginTop: 18 }}>
          <div className="card stack" style={{ gap: 8 }}><div className="display blue" style={{ fontSize: 20 }}>Dein Team</div>{mates.map((p) => <Row key={p.id} p={p} color="#D7FF3B" />)}</div>
          <div className="card stack" style={{ gap: 8 }}><div className="display red" style={{ fontSize: 20 }}>Gegner</div>{rivals.map((p) => <Row key={p.id} p={p} color="#FF4D3D" />)}</div>
        </div>
        <div className="stack" style={{ marginTop: 22 }}>
          {isHost ? <button className="btn btn-primary solid" onClick={() => useNet.getState().host?.again()}>Nochmal (zurück in die Lobby)</button> : <div className="muted" style={{ textAlign: 'center' }}>Der Gastgeber kann eine neue Runde starten.</div>}
          <button className="btn btn-ghost" onClick={() => { net.leave(); nav('/arena', { replace: true }); }}>Raum verlassen</button>
        </div>
      </div>
    );
  }

  return (
    <div className="battle" onPointerDown={() => unlockAudio()}>
      <video ref={t.videoRef} playsInline muted autoPlay className={mirror} />
      <canvas ref={t.canvasRef} className={`overlay ${mirror}`} />
      <div className="shade" />
      {useTap && room.phase === 'live' && <div className="tap-zone" onPointerDown={() => { setTap((n) => n + 1); onRep(); }} />}

      <div className="hud" style={{ pointerEvents: 'none' }}>
        <div className="players">
          <div className="team-head" style={{ color: 'var(--blue)' }}>{mates.length > 1 ? 'Dein Team' : 'Du'}</div>
          <div className="timer-box">
            <div className="mode">ONLINE · {mates.length} gegen {rivals.length}</div>
            <div className={`timer ${room.phase === 'live' && remaining <= 10000 ? 'hot' : ''}`}>{room.phase === 'live' ? fmt(remaining) : fmt(durMs)}</div>
          </div>
          <div className="team-head right" style={{ color: 'var(--red)' }}>{rivals.length > 1 ? 'Gegner-Team' : rivals[0]?.name ?? 'Gegner'}</div>
        </div>
        <TugBar mine={A} theirs={B} />
        <div className="scores">
          <div><div key={`a${A}`} className="n blue bump">{A}</div></div>
          <div className="vs">VS</div>
          <div><div key={`b${B}`} className="n red bump">{B}</div></div>
        </div>
        <div className="tm-cols ol-cols">
          <div>{mates.map((p) => <Row key={p.id} p={p} color="#D7FF3B" />)}</div>
          <div>{rivals.map((p) => <Row key={p.id} p={p} color="#FF4D3D" />)}</div>
        </div>
      </div>

      <div className="center-msg">
        {room.phase === 'countdown' && <div key={countLeft} className="countdown">{countLeft > 0 ? countLeft : 'LOS!'}</div>}
        {room.phase === 'live' && sentFinish.current && <div className="setup-card"><div className="hand" style={{ fontSize: 24 }}>Geschafft! Warte auf die anderen …</div></div>}
      </div>

      <div className="footer">
        <div className="cam-status"><i className={useTap ? 'warn' : t.frame.tracking ? 'on' : t.status === 'ready' ? 'warn' : ''} />{useTap ? 'TIPP-MODUS' : 'KAMERA'}</div>
        <div style={{ textAlign: 'center' }}>
          {room.phase === 'live' && t.frame.hint && !useTap && <div className="hint-bubble">{t.frame.hint}</div>}
          <div className="exercise-label">Übung: {ex.name}</div>
        </div>
        {room.phase === 'countdown' && !useTap && ['denied', 'unsupported', 'error'].includes(t.status) ? (
          <button className="btn btn-ghost btn-sm" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 4 }} onClick={() => setUseTap(true)}>Tippen</button>
        ) : <div />}
      </div>
    </div>
  );
}
