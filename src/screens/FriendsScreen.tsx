import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMe } from '../lib/store';
import { useTeam, type TeamMode } from '../lib/team';
import { buildConfig } from '../lib/teamSetup';
import { EXERCISES, PVP_EXERCISES, type ExerciseId } from '../lib/exercises';
import { Icon } from '../components/Icon';
import { PageHeader, Section } from '../components/ui';

const MODES: { id: TeamMode; title: string; sub: string; icon: string; badge: string }[] = [
  { id: 'local1v1', title: 'Gegeneinander', sub: 'Du gegen einen Freund – beide vor einer Kamera', icon: 'swords', badge: '1 vs 1 · 1 Gerät' },
  { id: 'local2v2', title: 'Zu zweit im Team', sub: 'Ihr beide zusammen gegen zwei KI-Gegner', icon: 'users', badge: '2 vs 2 · 1 Gerät' },
  { id: 'solo2v2', title: 'Team-Link erstellen', sub: 'Spiel mit KI-Partner – dann lädst du einen Freund in dein Team ein', icon: 'link', badge: '2 vs 2 · online' },
];

export function FriendsScreen() {
  const me = useMe()!;
  const nav = useNavigate();
  const start = useTeam((s) => s.start);
  const [mode, setMode] = useState<TeamMode>('local1v1');
  const [ex, setEx] = useState<ExerciseId>('squat');
  const [dur, setDur] = useState(60);
  const [guest, setGuest] = useState('');
  const local = mode === 'local1v1' || mode === 'local2v2';

  return (
    <div className="page">
      <div className="row" style={{ marginBottom: 6 }}>
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="Zurück"><Icon name="back" size={22} /></button>
      </div>
      <PageHeader eyebrow="Arena" title="Mit Freunden" />

      <Section title="Modus">
        <div className="stack" style={{ gap: 10 }}>
          {MODES.map((m) => (
            <button key={m.id} className={`onb-opt friend-mode ${mode === m.id ? 'on' : ''}`} onClick={() => setMode(m.id)}>
              <span className="onb-opt-ico"><Icon name={m.icon} size={22} /></span>
              <span style={{ flex: 1 }}><b>{m.title}</b><small>{m.sub}</small></span>
              <span className="pill" style={{ background: '#24211d', color: '#a39b8f', whiteSpace: 'nowrap' }}>{m.badge}</span>
            </button>
          ))}
        </div>
        <div className="muted" style={{ fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>
          {local
            ? 'Die Kamera erkennt zwei Personen gleichzeitig: Wer links steht, ist Spieler 1, wer rechts steht, Spieler 2. Am besten frontal mit ca. 3 m Abstand.'
            : 'Dein Lauf wird aufgezeichnet. Danach teilst du einen Team-Link – dein Freund kämpft dann mit dir im Team, und euer Duo kann andere Duos herausfordern.'}
        </div>
      </Section>

      {local && (
        <Section title="Name deines Freundes">
          <label className="field">
            <Icon name="user" size={20} />
            <input placeholder="z. B. Alex" value={guest} maxLength={18} onChange={(e) => setGuest(e.target.value)} />
          </label>
        </Section>
      )}

      <Section title="Übung">
        <div className="grid2">
          {PVP_EXERCISES.map((id) => (
            <button key={id} className={`choice ${ex === id ? 'on blue' : ''}`} onClick={() => setEx(id)}>
              {EXERCISES[id].name}
              {local && (id === 'squat' || id === 'jumpingjack') && <small>Ideal für zwei Personen</small>}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Dauer">
        <div className="dur-grid">
          {[30, 60, 90, 120].map((d) => (
            <button key={d} className={`choice ${dur === d ? 'on blue' : ''}`} onClick={() => setDur(d)}>{d < 60 ? `${d} SEK` : d === 60 ? '1 MIN' : `${d / 60} MIN`}</button>
          ))}
        </div>
      </Section>

      <div className="sticky-bottom">
        <button className="btn btn-primary solid" onClick={() => { start(buildConfig({ mode, me, exercise: ex, durationS: dur, guest })); nav('/teambattle'); }}>
          <Icon name="swords" size={20} /> Kampf starten
        </button>
      </div>
    </div>
  );
}
