import { useEffect, useState } from 'react';
import { useMe, useSettings, useStore } from '../lib/store';
import { usePoseTracker } from '../pose/usePoseTracker';
import { sfx, unlockAudio } from '../lib/feedback';
import { EXERCISES, type ExerciseId } from '../lib/exercises';
import { Icon } from '../components/Icon';

const GOAL = 3;

/** Einführung für neue Spieler: Idee → Kamera aufstellen → Test-Wiederholungen */
export function OnboardingScreen() {
  const me = useMe()!;
  const update = useStore((s) => s.updateProfile);
  const [step, setStep] = useState(0);
  const finish = () => update({ onboarded: true });

  return (
    <div className="onb">
      <div className="onb-dots">{[0, 1, 2].map((i) => <span key={i} className={i <= step ? 'on' : ''} />)}</div>
      {step === 0 && (
        <div className="onb-card">
          <div className="onb-ico"><Icon name="bolt" size={44} /></div>
          <h1>Hallo {me.name}!</h1>
          <p>Vitalis zählt deine Wiederholungen <b>über die Kamera</b> – ganz ohne Sensoren. Jede Wiederholung zählt im Kampf: Sie zieht den Balken zu dir oder trifft das Monster.</p>
          <ul className="onb-list">
            <li><Icon name="shield" size={18} /> <span><b>Ranked</b> – kämpfe um Trophäen und steige im Rang auf</span></li>
            <li><Icon name="map" size={18} /> <span><b>Trainingspfad</b> – besiege Monster in 7 Welten</span></li>
            <li><Icon name="dumbbell" size={18} /> <span><b>Training</b> – frei üben oder Trainingspläne folgen</span></li>
          </ul>
          <p className="muted" style={{ fontSize: 13 }}>Die Kamerabilder bleiben auf deinem Gerät und werden nirgendwohin gesendet.</p>
          <button className="btn btn-primary solid" onClick={() => setStep(1)}>Weiter</button>
        </div>
      )}
      {step === 1 && (
        <div className="onb-card">
          <div className="onb-ico"><Icon name="camera" size={44} /></div>
          <h1>Gerät aufstellen</h1>
          <div className="onb-tips">
            <div><b>1.</b> Stell das Gerät stabil auf den Boden oder lehne es an eine Wand.</div>
            <div><b>2.</b> Abstand ca. <b>1,5–2,5 m</b>, damit dein ganzer Körper ins Bild passt.</div>
            <div><b>3.</b> Für Liegestütze seitlich oder vor dem Kopf, für Kniebeugen schräg vor dir.</div>
            <div><b>4.</b> Gutes Licht hilft – kein starkes Gegenlicht vom Fenster.</div>
          </div>
          <p className="muted" style={{ fontSize: 13 }}>Gleich fragt dein Browser nach der Kamera – tippe auf <b>„Erlauben“</b>.</p>
          <button className="btn btn-primary solid" onClick={() => { unlockAudio(); setStep(2); }}>Kamera testen</button>
          <button className="btn btn-ghost" onClick={finish}>Überspringen</button>
        </div>
      )}
      {step === 2 && <TestStep onDone={finish} />}
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
          <p>Die Erkennung funktioniert. Falls später zu viel oder zu wenig gezählt wird, ändere in den Einstellungen die <b>Zähl-Empfindlichkeit</b>.</p>
          <button className="btn btn-primary solid" onClick={onDone}>Los geht's</button>
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
