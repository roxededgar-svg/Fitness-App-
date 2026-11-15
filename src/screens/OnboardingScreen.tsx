import { useEffect, useState, type ReactNode } from 'react';
import { useMe, useSettings, useStore } from '../lib/store';
import { usePoseTracker } from '../pose/usePoseTracker';
import { sfx, unlockAudio } from '../lib/feedback';
import { EXERCISES, type ExerciseId } from '../lib/exercises';
import { FITNESS, GOALS, PER_WEEK, recommend, type Fitness, type Goal } from '../lib/goals';
import { planById, daySets } from '../lib/plans';
import { Icon } from '../components/Icon';
import { Flux, Speech, type Mood } from '../components/Flux';

const GOAL = 3;
type Step = 'hello' | 'goal' | 'fitness' | 'week' | 'plan' | 'setup' | 'test' | 'tour' | 'done';
const ORDER: Step[] = ['hello', 'goal', 'fitness', 'week', 'plan', 'setup', 'test', 'tour', 'done'];

/** Einführung mit Begleiter Flux: 3 kurze Fragen, persönliche Empfehlung, Kameratest, kurze Tour */
export function OnboardingScreen() {
  const me = useMe()!;
  const { updateProfile, startPlan } = useStore();
  const [step, setStep] = useState<Step>('hello');
  const [goal, setGoal] = useState<Goal | null>(me.goal ?? null);
  const [fitness, setFitness] = useState<Fitness | null>(me.fitness ?? null);
  const [perWeek, setPerWeek] = useState<number | null>(me.perWeek ?? null);
  const [takePlan, setTakePlan] = useState(true);
  const [typed, setTyped] = useState(false);
  const idx = ORDER.indexOf(step);
  const go = (s: Step) => { setTyped(false); setStep(s); };
  const next = () => go(ORDER[idx + 1]);
  const back = () => idx > 0 && go(ORDER[idx - 1]);
  const rec = goal && fitness ? recommend(goal, fitness) : null;
  const plan = rec ? planById(rec.planId) : undefined;
  const goalName = GOALS.find((g) => g.id === goal)?.label;

  function finish() {
    updateProfile({ onboarded: true, goal: goal ?? undefined, fitness: fitness ?? undefined, perWeek: perWeek ?? 3 });
    if (takePlan && rec && !me.plans?.[rec.planId]) startPlan(rec.planId, rec.startMax);
    sfx.win();
  }

  let mood: Mood = 'happy';
  let say = '';
  let body: ReactNode = null;
  let action: ReactNode = null;

  switch (step) {
    case 'hello':
      mood = 'excited';
      say = `Hey ${me.name}! Ich bin Flux, dein Trainings-Begleiter. Ich zeige dir in einer Minute alles Wichtige – und stelle dir nur drei kurze Fragen.`;
      action = <button className="btn btn-primary solid" onClick={() => { unlockAudio(); next(); }}>Hi Flux!</button>;
      break;
    case 'goal':
      mood = 'think';
      say = 'Erste Frage: Warum willst du trainieren? Was ist dein Ziel?';
      body = (
        <div className="onb-options">
          {GOALS.map((g) => (
            <button key={g.id} className={`onb-opt ${goal === g.id ? 'on' : ''}`} onClick={() => { setGoal(g.id); setTimeout(next, 220); }}>
              <span className="onb-opt-ico"><Icon name={g.icon} size={22} /></span>
              <span><b>{g.label}</b><small>{g.sub}</small></span>
            </button>
          ))}
        </div>
      );
      break;
    case 'fitness':
      mood = 'happy';
      say = `${goalName} – starkes Ziel! Wie fit bist du gerade? Sei ehrlich, ich passe alles an dich an.`;
      body = (
        <div className="onb-options">
          {FITNESS.map((f) => (
            <button key={f.id} className={`onb-opt ${fitness === f.id ? 'on' : ''}`} onClick={() => { setFitness(f.id); setTimeout(next, 220); }}>
              <span className="onb-opt-ico"><Icon name={f.id === 'beginner' ? 'star' : f.id === 'intermediate' ? 'bolt' : 'fire'} size={22} /></span>
              <span><b>{f.label}</b><small>{f.sub}</small></span>
            </button>
          ))}
        </div>
      );
      break;
    case 'week':
      mood = 'think';
      say = 'Letzte Frage: Wie oft pro Woche möchtest du trainieren? Lieber realistisch – dranbleiben ist wichtiger als viel.';
      body = (
        <div className="onb-week">
          {PER_WEEK.map((n) => (
            <button key={n} className={`onb-opt center ${perWeek === n ? 'on' : ''}`} onClick={() => { setPerWeek(n); setTimeout(next, 220); }}>
              <b style={{ fontSize: 28 }}>{n === 6 ? '6+' : n}×</b><small>pro Woche</small>
            </button>
          ))}
        </div>
      );
      break;
    case 'plan':
      mood = 'proud';
      say = rec ? `Perfekt, ich hab was für dich! ${rec.text}` : '';
      body = plan && rec && (
        <div className="card onb-plan" style={{ borderColor: `${plan.color}88` }}>
          <div className="row" style={{ gap: 12 }}>
            <div className="t-ico" style={{ width: 52, height: 52, background: `${plan.color}22`, color: plan.color }}><Icon name={plan.icon} size={26} /></div>
            <div style={{ flex: 1 }}>
              <div className="display" style={{ fontSize: 19 }}>{plan.name}</div>
              <div className="muted" style={{ fontSize: 13 }}>6 Wochen · {perWeek ?? 3}× pro Woche · Start: {rec.startMax} {EXERCISES[plan.exercise].unit}</div>
            </div>
          </div>
          <div className="plan-sets">{daySets(plan, rec.startMax, 0).map((n, i, a) => <span key={i} style={{ borderColor: `${plan.color}66` }}>{n}{i === a.length - 1 ? '+' : ''}</span>)}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>
            Gut für dich: {rec.focus.map((e) => EXERCISES[e].name).join(', ')} · Tipp: Modus „{rec.mode}“
          </div>
        </div>
      );
      action = (
        <>
          <button className="btn btn-primary solid" onClick={() => { setTakePlan(true); next(); }}>Plan übernehmen</button>
          <button className="btn btn-ghost" onClick={() => { setTakePlan(false); next(); }}>Erstmal ohne Plan</button>
        </>
      );
      break;
    case 'setup':
      mood = 'wink';
      say = 'Jetzt das Wichtigste: Ich zähle deine Wiederholungen über die Kamera. Dafür muss ich dich gut sehen können. Keine Sorge – die Bilder bleiben auf deinem Gerät.';
      body = (
        <div className="onb-tips">
          <div><Icon name="camera" size={18} /> Gerät stabil auf den Boden stellen oder anlehnen</div>
          <div><Icon name="user" size={18} /> 1,5–2,5 m Abstand – ganzer Körper im Bild</div>
          <div><Icon name="sun" size={18} /> Gutes Licht, kein starkes Gegenlicht</div>
        </div>
      );
      action = (
        <>
          <button className="btn btn-primary solid" onClick={next}>Kamera testen</button>
          <button className="btn btn-ghost" onClick={() => go('tour')}>Später testen</button>
        </>
      );
      break;
    case 'test':
      return (
        <Shell idx={idx} onBack={back}>
          <div className="onb-flux-row">
            <Flux mood="happy" size={70} />
            <Speech text="Mach drei Wiederholungen – ich zähle mit!" />
          </div>
          <TestStep onDone={next} />
        </Shell>
      );
    case 'tour':
      mood = 'happy';
      say = 'Kurze Tour, dann geht’s los! Unten findest du vier Bereiche:';
      body = (
        <div className="onb-tour">
          <div><span className="onb-tour-ico"><Icon name="home" size={20} /></span><span><b>Start</b> – dein Tag: Plan, Missionen, Wochenziel</span></div>
          <div><span className="onb-tour-ico"><Icon name="map" size={20} /></span><span><b>Pfad</b> – 7 Welten voller Monster und Bosse</span></div>
          <div><span className="onb-tour-ico"><Icon name="bolt" size={20} /></span><span><b>Arena</b> – Ranked, Schnellkampf und Duelle mit Freunden</span></div>
          <div><span className="onb-tour-ico"><Icon name="user" size={20} /></span><span><b>Karriere</b> – Abzeichen, Rang und Fortschritt</span></div>
        </div>
      );
      action = <button className="btn btn-primary solid" onClick={next}>Verstanden</button>;
      break;
    case 'done':
      mood = 'excited';
      say = `Alles bereit, ${me.name}! Dein Ziel: ${goalName ?? 'fit werden'} mit ${perWeek ?? 3} Einheiten pro Woche. Ich bin auf der Startseite und gebe dir Tipps. Los geht’s!`;
      action = <button className="btn btn-gold" onClick={finish}>Training starten</button>;
      break;
  }

  return (
    <Shell idx={idx} onBack={step !== 'hello' ? back : undefined}>
      <div className="onb-flux">
        <Flux mood={mood} size={step === 'hello' || step === 'done' ? 150 : 104} />
        <Speech text={say} onDone={() => setTyped(true)} />
      </div>
      {body && <div className={`onb-body ${typed ? 'show' : ''}`}>{body}</div>}
      {action && <div className={`onb-actions ${typed ? 'show' : ''}`}>{action}</div>}
    </Shell>
  );
}

function Shell({ idx, onBack, children }: { idx: number; onBack?: () => void; children: ReactNode }) {
  return (
    <div className="onb">
      <div className="onb-top">
        {onBack ? <button className="icon-btn" style={{ width: 40, height: 40 }} onClick={onBack} aria-label="Zurück"><Icon name="back" size={18} /></button> : <span style={{ width: 40 }} />}
        <div className="onb-progress"><span style={{ width: `${((idx + 1) / ORDER.length) * 100}%` }} /></div>
        <span style={{ width: 40 }} />
      </div>
      <div className="onb-card">{children}</div>
    </div>
  );
}

function TestStep({ onDone }: { onDone: () => void }) {
  const settings = useSettings();
  const [ex, setEx] = useState<ExerciseId>('squat');
  const t = usePoseTracker({
    exercise: ex, sensitivity: settings.sensitivity, facing: settings.facing, mirror: settings.mirror,
    showSkeleton: true, counting: true, onRep: () => sfx.rep(),
  });
  const reps = t.frame.reps;
  const done = reps >= GOAL;
  useEffect(() => { if (done) sfx.win(); }, [done]);
  const mirror = settings.mirror && settings.facing === 'user' ? 'mirror' : '';
  const failed = ['denied', 'unsupported', 'error'].includes(t.status);

  return (
    <div className="onb-card onb-test">
      <div className="onb-cam">
        <video ref={t.videoRef} playsInline muted autoPlay className={mirror} />
        <canvas ref={t.canvasRef} className={mirror} />
        <div className="onb-count">
          <div className="display" style={{ fontSize: 64, lineHeight: 1 }}>{Math.min(reps, GOAL)}<span className="muted" style={{ fontSize: 28 }}>/{GOAL}</span></div>
          <div className="caps" style={{ fontSize: 11 }}>{EXERCISES[ex].name}</div>
        </div>
        <div className={`onb-status ${t.frame.tracking ? 'ok' : ''}`}>
          {t.status === 'loading' ? 'KI wird geladen…' : failed ? 'Kamera nicht verfügbar' : t.frame.tracking ? 'Körper erkannt' : 'Stell dich ganz ins Bild'}
        </div>
      </div>
      {done ? (
        <>
          <h1 className="green" style={{ marginTop: 6 }}>Perfekt!</h1>
          <p>Ich kann dich gut sehen. Falls ich später zu viel oder zu wenig zähle, stell in den Einstellungen die <b>Zähl-Empfindlichkeit</b> um.</p>
          <button className="btn btn-primary solid" onClick={onDone}>Weiter</button>
        </>
      ) : (
        <>
          <p style={{ marginTop: 6 }}>Mach <b>{GOAL} {EXERCISES[ex].name}</b>. Der Zähler oben sollte mitzählen.</p>
          <div className="seg" style={{ alignSelf: 'center' }}>
            {(['squat', 'pushup', 'jumpingjack'] as ExerciseId[]).map((e) => (
              <button key={e} className={ex === e ? 'on' : ''} onClick={() => { setEx(e); t.resetCount(); }}>{EXERCISES[e].name}</button>
            ))}
          </div>
          {failed && <p className="red" style={{ fontSize: 14 }}>{t.status === 'denied' ? 'Kamerazugriff wurde verweigert. Erlaube ihn in den Browser-Einstellungen.' : 'Dieser Browser unterstützt keine Kamera (HTTPS nötig).'}</p>}
          <button className="btn btn-ghost" onClick={onDone}>Später testen</button>
        </>
      )}
    </div>
  );
}
