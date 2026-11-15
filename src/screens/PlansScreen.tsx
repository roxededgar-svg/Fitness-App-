import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMe, useStore } from '../lib/store';
import { DAYS, PLANS, daySets, type Plan } from '../lib/plans';
import { EXERCISES } from '../lib/exercises';
import { Icon } from '../components/Icon';
import { PageHeader, Section, Sheet } from '../components/ui';

export function PlansScreen() {
  const me = useMe()!;
  const nav = useNavigate();
  const { startPlan, stopPlan } = useStore();
  const [setup, setSetup] = useState<Plan | null>(null);
  const [max, setMax] = useState(10);

  return (
    <div className="page">
      <div className="row" style={{ marginBottom: 6 }}>
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="Zurück"><Icon name="back" size={22} /></button>
      </div>
      <PageHeader eyebrow="Training" title="Trainingspläne" />
      <div className="muted" style={{ fontSize: 14, marginTop: -8 }}>
        6 Wochen, 3 Einheiten pro Woche. Jede Einheit hat 5 Sätze mit Pausen – die Kamera zählt mit, der letzte Satz heißt: so viele wie möglich.
      </div>

      <Section title="Pläne">
        <div className="stack" style={{ gap: 12 }}>
          {PLANS.map((p) => {
            const st = me.plans?.[p.id];
            const ex = EXERCISES[p.exercise];
            const done = st ? Math.min(st.done, DAYS) : 0;
            const finished = st && st.done >= DAYS;
            return (
              <div key={p.id} className="card plan-card" style={{ borderColor: st ? `${p.color}88` : undefined }}>
                <div className="row" style={{ gap: 14 }}>
                  <div className="t-ico" style={{ width: 56, height: 56, background: `${p.color}22`, color: p.color }}><Icon name={p.icon} size={28} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="display" style={{ fontSize: 20 }}>{p.name}</div>
                    <div className="muted" style={{ fontSize: 13 }}>{p.desc}</div>
                  </div>
                </div>
                {st ? (
                  <>
                    <div className="row" style={{ marginTop: 14, fontSize: 13 }}>
                      <span className="muted">Woche {Math.min(6, Math.floor(done / 3) + 1)} · Einheit {done + 1 > DAYS ? DAYS : done + 1} von {DAYS}</span>
                      <span className="spacer" />
                      <span className="muted">Start: {st.startMax} {ex.unit}</span>
                    </div>
                    <div className="progress"><span style={{ width: `${(done / DAYS) * 100}%`, background: p.color }} /></div>
                    {!finished && (
                      <div className="plan-sets">
                        {daySets(p, st.startMax, done).map((n, i, a) => (
                          <span key={i} style={{ borderColor: `${p.color}66` }}>{n}{i === a.length - 1 ? '+' : ''}</span>
                        ))}
                      </div>
                    )}
                    <div className="row" style={{ marginTop: 12, gap: 10 }}>
                      {finished ? (
                        <div className="display green" style={{ flex: 1 }}>Plan abgeschlossen!</div>
                      ) : (
                        <button className="btn btn-primary solid" style={{ flex: 1 }} onClick={() => nav(`/workout?plan=${p.id}`)}>
                          <Icon name="play" size={18} /> Einheit {done + 1} starten
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={() => { if (confirm(`Plan „${p.name}“ beenden? Der Fortschritt geht verloren.`)) stopPlan(p.id); }}>{finished ? 'Neu' : 'Beenden'}</button>
                    </div>
                  </>
                ) : (
                  <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={() => { setMax(p.exercise === 'plank' ? 30 : 10); setSetup(p); }}>Plan starten</button>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {setup && (
        <Sheet title="STARTTEST" onClose={() => setSetup(null)}>
          <div className="muted" style={{ lineHeight: 1.5 }}>
            Wie viele <b style={{ color: 'var(--text)' }}>{EXERCISES[setup.exercise].name}</b> schaffst du am Stück{setup.exercise === 'plank' ? ' (in Sekunden)' : ''}?
            Danach richtet sich dein Plan. {me.personalBests[setup.exercise] ? `Dein Bestwert: ${me.personalBests[setup.exercise]}.` : ''}
          </div>
          <div className="row" style={{ justifyContent: 'center', margin: '22px 0' }}>
            <button className="icon-btn" onClick={() => setMax(Math.max(1, max - (setup.exercise === 'plank' ? 5 : 1)))}>−</button>
            <div className="display" style={{ fontSize: 48, minWidth: 120, textAlign: 'center' }}>{max}</div>
            <button className="icon-btn" onClick={() => setMax(max + (setup.exercise === 'plank' ? 5 : 1))}>+</button>
          </div>
          <div className="muted" style={{ fontSize: 13, textAlign: 'center', marginBottom: 14 }}>
            Erste Einheit: {daySets(setup, max, 0).join(' · ')}+ {EXERCISES[setup.exercise].unit}
          </div>
          <button className="btn btn-primary solid" onClick={() => { startPlan(setup.id, max); setSetup(null); }}>Plan starten</button>
        </Sheet>
      )}
    </div>
  );
}
