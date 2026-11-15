import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useMe, useSettings, useStore } from '../lib/store';
import { daySets, planById } from '../lib/plans';
import { EXERCISES } from '../lib/exercises';
import { usePoseTracker } from '../pose/usePoseTracker';
import { sfx, unlockAudio } from '../lib/feedback';
import { Icon } from '../components/Icon';
import { toast } from '../components/ui';

type Phase = 'ready' | 'set' | 'rest' | 'done';

/** Geführte Einheit: Sätze mit Kamera-Zählung und Pausen-Timer */
export function WorkoutScreen() {
  const [params] = useSearchParams();
  const plan = planById(params.get('plan') ?? '');
  const me = useMe()!;
  const st = plan ? me.plans?.[plan.id] : undefined;
  if (!plan || !st) return <Navigate to="/plans" replace />;
  return <Workout planId={plan.id} />;
}

function Workout({ planId }: { planId: string }) {
  const plan = planById(planId)!;
  const me = useMe()!;
  const st = me.plans![planId];
  const settings = useSettings();
  const { finishMatch, completePlanDay } = useStore();
  const nav = useNavigate();
  const ex = EXERCISES[plan.exercise];
  const sets = useRef(daySets(plan, st.startMax, st.done)).current;
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [done, setDone] = useState<number[]>([]);
  const [rest, setRest] = useState(plan.rest);
  const [tap, setTap] = useState(0);
  const [useTap, setUseTap] = useState(settings.tapMode);
  const startRef = useRef(0);
  const timeline = useRef<number[]>([]);
  const offset = useRef(0);

  const onRep = useCallback(() => {
    timeline.current.push(Math.round(performance.now() - startRef.current));
    sfx.rep();
  }, []);
  const t = usePoseTracker({
    exercise: plan.exercise, sensitivity: settings.sensitivity, facing: settings.facing, mirror: settings.mirror,
    showSkeleton: settings.showSkeleton, counting: phase === 'set' && !useTap, paused: useTap || phase === 'done', onRep,
  });
  const reps = useTap ? tap : t.frame.reps;
  const target = sets[idx];
  const last = idx === sets.length - 1;
  const camFailed = ['denied', 'unsupported', 'error'].includes(t.status);

  const startSet = () => {
    unlockAudio();
    if (!startRef.current) startRef.current = performance.now();
    t.resetCount();
    setTap(0);
    sfx.go();
    setPhase('set');
  };

  const endSet = useCallback(() => {
    const got = useTap ? tap : t.frame.reps;
    setDone((d) => [...d, got]);
    offset.current += got;
    if (last) {
      setPhase('done');
    } else {
      setRest(plan.rest);
      setPhase('rest');
    }
  }, [useTap, tap, t.frame.reps, last, plan.rest]);

  // Satz automatisch beenden, wenn das Ziel erreicht ist (außer im letzten „so viele wie möglich“-Satz)
  useEffect(() => {
    if (phase === 'set' && !last && reps >= target) {
      sfx.lead();
      const id = setTimeout(endSet, 600);
      return () => clearTimeout(id);
    }
  }, [phase, reps, target, last, endSet]);

  // Pausen-Timer
  useEffect(() => {
    if (phase !== 'rest') return;
    if (rest <= 0) {
      setIdx((i) => i + 1);
      setPhase('ready');
      sfx.tick();
      return;
    }
    if (rest <= 3) sfx.tick();
    const id = setTimeout(() => setRest((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, rest]);

  // Einheit speichern
  const saved = useRef(false);
  useEffect(() => {
    if (phase !== 'done' || saved.current) return;
    saved.current = true;
    const total = done.reduce((a, b) => a + b, 0);
    finishMatch({
      mode: 'training', exercise: plan.exercise, durationS: Math.max(1, Math.round((performance.now() - startRef.current) / 1000)),
      reps: total, timeline: timeline.current, ranked: !useTap,
    });
    completePlanDay(plan.id);
    sfx.win();
  }, [phase, done, finishMatch, completePlanDay, plan, useTap]);

  const mirror = settings.mirror && settings.facing === 'user' ? 'mirror' : '';
  const total = done.reduce((a, b) => a + b, 0);

  return (
    <div className="battle workout" onPointerDown={() => unlockAudio()}>
      <video ref={t.videoRef} playsInline muted autoPlay className={mirror} />
      <canvas ref={t.canvasRef} className={`overlay ${mirror}`} />
      <div className="shade" />
      {useTap && phase === 'set' && <div className="tap-zone" onPointerDown={() => { setTap((n) => n + 1); onRep(); }} />}

      <div className="hud" style={{ pointerEvents: 'none' }}>
        <div className="row">
          <div>
            <div className="caps muted" style={{ fontSize: 11 }}>{plan.name} · Einheit {st.done + 1}</div>
            <div className="display" style={{ fontSize: 22 }}>{ex.name}</div>
          </div>
          <div className="spacer" />
          <button className="close-btn" style={{ pointerEvents: 'auto' }} onClick={() => { if (phase === 'done' || confirm('Einheit abbrechen? Sie wird nicht gewertet.')) nav('/plans', { replace: true }); }} aria-label="Schließen"><Icon name="close" size={22} /></button>
        </div>
        <div className="set-track">
          {sets.map((n, i) => (
            <div key={i} className={`set-chip ${i < done.length ? 'ok' : i === idx && phase !== 'done' ? 'cur' : ''}`} style={{ ['--c' as string]: plan.color }}>
              <div className="caps" style={{ fontSize: 9 }}>Satz {i + 1}</div>
              <b>{i < done.length ? done[i] : `${n}${i === sets.length - 1 ? '+' : ''}`}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="center-msg" style={{ pointerEvents: 'none' }}>
        {phase === 'set' && (
          <div className="workout-count">
            <div className="display" style={{ fontSize: 'clamp(90px, 22vw, 180px)', lineHeight: 1, color: plan.color }}>{reps}</div>
            <div className="caps" style={{ fontSize: 14 }}>{last ? `Ziel: mindestens ${target} – so viele wie möglich!` : `von ${target}`}</div>
            {!useTap && t.frame.hint && <div className="hint-bubble" style={{ marginTop: 14 }}>{t.frame.hint}</div>}
          </div>
        )}
        {phase === 'rest' && (
          <div className="setup-card" style={{ pointerEvents: 'auto', textAlign: 'center' }}>
            <div className="caps muted">Pause</div>
            <div className="display" style={{ fontSize: 96, lineHeight: 1 }}>{rest}</div>
            <div className="muted">Nächster Satz: {sets[idx + 1]}{idx + 1 === sets.length - 1 ? '+' : ''} {ex.unit}</div>
            <div className="row" style={{ justifyContent: 'center', gap: 10, marginTop: 14 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setRest((r) => r + 15)}>+15 s</button>
              <button className="btn btn-primary solid btn-sm" onClick={() => setRest(0)}>Weiter</button>
            </div>
          </div>
        )}
        {phase === 'ready' && (
          <div className="setup-card" style={{ pointerEvents: 'auto', textAlign: 'center' }}>
            <div className="caps muted">Satz {idx + 1} von {sets.length}</div>
            <div className="display" style={{ fontSize: 54 }}>{target}{last ? '+' : ''} <span style={{ fontSize: 22 }}>{ex.unit}</span></div>
            <div className="muted" style={{ fontSize: 14, margin: '6px 0 14px' }}>{t.status === 'ready' ? (t.frame.tracking ? 'Körper erkannt' : ex.setup) : camFailed ? 'Kamera nicht verfügbar – zähle per Tippen.' : 'Kamera wird geladen…'}</div>
            <div className="stack" style={{ gap: 10 }}>
              <button className="btn btn-primary solid" disabled={!useTap && t.status !== 'ready' && !camFailed} onClick={() => { if (camFailed) setUseTap(true); startSet(); }}>Satz starten</button>
              {!useTap && !camFailed && <button className="btn btn-ghost btn-sm" onClick={() => setUseTap(true)}>Per Tippen zählen (ungewertet)</button>}
            </div>
          </div>
        )}
        {phase === 'done' && (
          <div className="setup-card" style={{ pointerEvents: 'auto', textAlign: 'center' }}>
            <div className="display green" style={{ fontSize: 34 }}>Einheit geschafft!</div>
            <div className="display" style={{ fontSize: 60 }}>{total} <span style={{ fontSize: 22 }}>{ex.unit}</span></div>
            <div className="muted">{done.join(' · ')}</div>
            <button className="btn btn-primary solid" style={{ marginTop: 16 }} onClick={() => { toast('Einheit gespeichert'); nav('/plans', { replace: true }); }}>Fertig</button>
          </div>
        )}
      </div>

      {phase === 'set' && (
        <div className="footer" style={{ gridTemplateColumns: '1fr' }}>
          <button className="btn btn-gold" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 4 }} onClick={endSet}>{last ? 'Satz beenden' : 'Satz vorzeitig beenden'}</button>
        </div>
      )}
    </div>
  );
}
