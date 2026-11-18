import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { decodeTeam } from '../lib/duel';
import { useMe } from '../lib/store';
import { useTeam } from '../lib/team';
import { buildConfig } from '../lib/teamSetup';
import { EXERCISES } from '../lib/exercises';
import { Avatar, Flag, MyAvatar } from '../components/ui';
import { Icon } from '../components/Icon';

/** Geöffneter Team-Link: Team beitreten (1 Lauf) oder Duo-Herausforderung annehmen (2 Läufe) */
export function TeamLinkScreen() {
  const [params] = useSearchParams();
  const code = params.get('c') ?? '';
  const team = useMemo(() => decodeTeam(code), [code]);
  const me = useMe()!;
  const start = useTeam((s) => s.start);
  const nav = useNavigate();
  const [guest, setGuest] = useState('');

  if (!team) {
    return (
      <div className="mm">
        <div className="display red" style={{ fontSize: 26 }}>Ungültiger Team-Link</div>
        <button className="btn btn-ghost btn-sm" onClick={() => nav('/', { replace: true })}>Zum Hauptmenü</button>
      </div>
    );
  }
  const ex = EXERCISES[team.x];
  const duo = team.members.length === 2;
  const total = team.members.reduce((a, m) => a + m.timeline.length, 0);
  const own = team.members.some((m) => m.c === me.code);
  const go = (mode: 'link2v2' | 'local2v2' | 'solo2v2') => {
    start(buildConfig({ mode, me, exercise: team.x, durationS: team.d, guest, teammate: duo ? undefined : team.members[0], rivals: duo ? team.members : undefined }));
    nav('/teambattle', { replace: true });
  };

  return (
    <div className="mm" style={{ justifyContent: 'safe center' }}>
      <div className="caps purple">{duo ? 'Duo-Herausforderung' : 'Team-Einladung'}</div>
      <div className="vs-intro">
        <div className="side">
          {duo ? <MyAvatar size={96} /> : (
            <div className="row" style={{ gap: -10 }}>
              <MyAvatar size={86} />
              <Avatar name={team.members[0].n} size={86} color="#FF8A3D" ring="var(--blue)" />
            </div>
          )}
          <div className="display blue" style={{ fontSize: 18 }}>{duo ? 'Euer Duo' : `${me.name} & ${team.members[0].n}`}</div>
        </div>
        <div className="big-vs">VS</div>
        <div className="side r">
          <div className="row" style={{ gap: 6 }}>
            {duo ? team.members.map((m) => <Avatar key={m.c} name={m.n} size={80} color="#ef4444" ring="var(--red)" />) : (
              <><div className="avatar" style={{ width: 80, height: 80, background: '#1d1b18' }}><Icon name="robot" size={36} color="#a39b8f" /></div><div className="avatar" style={{ width: 80, height: 80, background: '#1d1b18' }}><Icon name="robot" size={36} color="#a39b8f" /></div></>
            )}
          </div>
          <div className="display red" style={{ fontSize: 18 }}>{duo ? team.members.map((m) => m.n).join(' & ') : '2 KI-Gegner'}</div>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 560, textAlign: 'left' }}>
        <div className="display" style={{ fontSize: 20 }}>{ex.name} · {team.d} Sekunden</div>
        <div className="muted" style={{ marginTop: 8, lineHeight: 1.5 }}>
          {duo
            ? <>{team.members.map((m) => <span key={m.c}><Flag cc={m.co} /> {m.n}: <b style={{ color: 'var(--text)' }}>{m.timeline.length}</b> </span>)}– zusammen <b style={{ color: 'var(--text)' }}>{total} {ex.unit}</b>. Schafft ihr zu zweit mehr?</>
            : <><b style={{ color: 'var(--text)' }}>{team.members[0].n}</b> hat {team.members[0].timeline.length} {ex.unit} geschafft und will mit dir ein Team bilden. Ihr kämpft zusammen gegen zwei Gegner – der aufgezeichnete Lauf läuft live mit.</>}
        </div>
      </div>
      {own ? (
        <div className="muted">Das ist dein eigener Link – teile ihn mit Freunden!</div>
      ) : (
        <div className="stack" style={{ width: '100%', maxWidth: 560 }}>
          {duo && (
            <label className="field">
              <Icon name="user" size={20} />
              <input placeholder="Name deines Partners (für zu zweit)" value={guest} maxLength={18} onChange={(e) => setGuest(e.target.value)} />
            </label>
          )}
          {duo ? (
            <>
              <button className="btn btn-purple" onClick={() => go('local2v2')}><Icon name="users" size={20} /> Zu zweit an diesem Gerät</button>
              <button className="btn btn-ghost" onClick={() => go('solo2v2')}>Allein mit KI-Partner</button>
            </>
          ) : (
            <button className="btn btn-purple" onClick={() => go('link2v2')}><Icon name="users" size={20} /> Team beitreten</button>
          )}
        </div>
      )}
      <button className="btn btn-ghost btn-sm" onClick={() => nav('/', { replace: true })}>Später</button>
    </div>
  );
}
