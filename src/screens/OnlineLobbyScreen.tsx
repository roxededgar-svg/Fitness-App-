import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMe } from '../lib/store';
import { inviteUrl, netMode, roomActions, useNet } from '../lib/net';
import { canStart, MAX_PER_TEAM, type RoomPlayer, type Team } from '../lib/room';
import { EXERCISES, PVP_EXERCISES, type ExerciseId } from '../lib/exercises';
import { shareOrCopy } from '../lib/share';
import { Icon } from '../components/Icon';
import { Avatar, PageHeader, Section, toast } from '../components/ui';

const TEAM_COLOR = ['var(--blue)', 'var(--red)'];

/** Online spielen: Raum erstellen / beitreten, Teams wählen, starten. Jeder bleibt an seinem Gerät. */
export function OnlineLobbyScreen() {
  const me = useMe()!;
  const nav = useNavigate();
  const [params] = useSearchParams();
  const net = useNet();
  const [code, setCode] = useState(params.get('join')?.toUpperCase() ?? '');
  const [ex, setEx] = useState<ExerciseId>('pushup');
  const [dur, setDur] = useState(60);
  const meInfo = { name: me.name, trophies: me.arenaPoints };
  const room = net.room;
  const selfId = net.info.selfId;
  const isHost = net.role === 'host';
  const self = room?.players.find((p) => p.id === selfId);

  // Einladungslink direkt beitreten
  useEffect(() => {
    const j = params.get('join');
    if (j && net.role === 'none') net.join(j, meInfo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kampf beginnt → in die Kampfansicht
  useEffect(() => {
    if (room && (room.phase === 'countdown' || room.phase === 'live')) nav('/onlinebattle');
  }, [room?.phase, room?.round, nav]);

  const leave = () => { net.leave(); nav('/arena', { replace: true }); };

  /* ---------- Noch kein Raum ---------- */
  if (!room) {
    return (
      <div className="page">
        <div className="row" style={{ marginBottom: 6 }}>
          <button className="icon-btn" onClick={() => { net.leave(); nav(-1); }} aria-label="Zurück"><Icon name="back" size={22} /></button>
        </div>
        <PageHeader eyebrow="Online" title="Zusammen spielen" />
        <div className="muted" style={{ marginTop: -8, lineHeight: 1.5 }}>
          Jeder bleibt an seinem eigenen Gerät. Du siehst dich in deiner Kamera – und live die Balken deiner Freunde. Bis zu 4 Spieler: 1 gegen 1, 1 gegen 2 oder 2 gegen 2.
          Übertragen werden nur die Zahlen, nie Kamerabilder.
        </div>

        {net.status === 'connecting' && <div className="card" style={{ marginTop: 18 }}><div className="hand" style={{ fontSize: 22 }}>Verbinde …</div></div>}
        {net.status === 'error' && <div className="card" style={{ marginTop: 18, borderColor: 'var(--red)' }}><b className="red">Hat nicht geklappt.</b> <span className="muted">{net.error}</span></div>}

        <Section title="Raum beitreten">
          <div className="row">
            <label className="field" style={{ flex: 1 }}>
              <Icon name="users" size={20} />
              <input placeholder="Raum-Code, z. B. K7QX2" value={code} maxLength={5} onChange={(e) => setCode(e.target.value.toUpperCase())} style={{ letterSpacing: '.2em', fontWeight: 800 }} />
            </label>
            <button className="btn btn-primary solid btn-sm" style={{ minHeight: 58 }} disabled={code.length < 5 || net.status === 'connecting'} onClick={() => net.join(code, meInfo)}>Beitreten</button>
          </div>
        </Section>

        <Section title="Oder neuen Raum erstellen">
          <div className="grid2">
            {PVP_EXERCISES.map((id) => (
              <button key={id} className={`choice ${ex === id ? 'on blue' : ''}`} onClick={() => setEx(id)}>{EXERCISES[id].name}</button>
            ))}
          </div>
          <div className="dur-grid" style={{ marginTop: 12 }}>
            {[30, 60, 90, 120].map((d) => (
              <button key={d} className={`choice ${dur === d ? 'on blue' : ''}`} onClick={() => setDur(d)}>{d < 60 ? `${d} Sek` : d === 60 ? '1 Min' : `${d / 60} Min`}</button>
            ))}
          </div>
          <button className="btn btn-primary solid" style={{ marginTop: 14 }} disabled={net.status === 'connecting'} onClick={() => net.create(meInfo, ex, dur)}>
            <Icon name="users" size={20} /> Raum erstellen
          </button>
        </Section>
        {netMode() === 'local' && <div className="muted" style={{ fontSize: 12, marginTop: 14 }}>Testmodus: Verbindung nur zwischen Tabs dieses Browsers.</div>}
      </div>
    );
  }

  /* ---------- Lobby ---------- */
  const teams: RoomPlayer[][] = [room.players.filter((p) => p.team === 0), room.players.filter((p) => p.team === 1)];
  const startable = canStart(room);
  const notReady = room.players.filter((p) => !p.ready && !p.host).length;

  return (
    <div className="page">
      <div className="row" style={{ marginBottom: 6 }}>
        <button className="icon-btn" onClick={leave} aria-label="Raum verlassen"><Icon name="back" size={22} /></button>
      </div>
      <PageHeader eyebrow={isHost ? 'Dein Raum' : 'Raum'} title="Lobby" />

      <div className="card room-code">
        <div>
          <div className="caps muted" style={{ fontSize: 12 }}>Raum-Code</div>
          <div className="code-big">{room.code}</div>
          <div className="muted" style={{ fontSize: 13 }}>{EXERCISES[room.exercise].name} · {room.durationS} Sek</div>
        </div>
        <button className="btn btn-primary solid btn-sm" onClick={() => shareOrCopy(`${me.name} lädt dich zu Vitalis ein! Raum-Code: ${room.code}`, inviteUrl(room.code))}>
          <Icon name="share" size={18} /> Einladen
        </button>
      </div>

      <div className="team-cols">
        {([0, 1] as Team[]).map((t) => (
          <div key={t} className="team-col" style={{ borderColor: TEAM_COLOR[t] }}>
            <div className="display" style={{ fontSize: 22, color: TEAM_COLOR[t], fontStyle: 'italic' }}>Team {t === 0 ? 'A' : 'B'}</div>
            {teams[t].map((p) => (
              <div key={p.id} className={`lobby-player ${p.id === selfId ? 'me' : ''} ${p.online ? '' : 'off'}`}>
                <Avatar name={p.name} size={36} color={t === 0 ? '#D7FF3B' : '#FF4D3D'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{p.name}{p.id === selfId && ' (du)'}</b>
                  <small>{p.host ? 'Gastgeber' : p.ready ? 'bereit' : 'wartet …'}</small>
                </div>
                {(p.ready || p.host) && <Icon name="check" size={18} color="var(--green)" />}
              </div>
            ))}
            {Array.from({ length: MAX_PER_TEAM - teams[t].length }, (_, i) => <div key={i} className="lobby-player empty-slot hand">frei</div>)}
            {self && self.team !== t && teams[t].length < MAX_PER_TEAM && (
              <button className="btn btn-ghost btn-sm" onClick={() => roomActions().setTeam(t)}>Hierher wechseln</button>
            )}
          </div>
        ))}
      </div>

      <div className="sticky-bottom stack" style={{ gap: 10 }}>
        {isHost ? (
          <>
            <button className="btn btn-primary solid" disabled={!startable} onClick={() => useNet.getState().host?.start()}>
              <Icon name="swords" size={20} /> Kampf starten
            </button>
            {!startable && (
              <div className="muted" style={{ textAlign: 'center', fontSize: 14 }}>
                {teams[0].length === 0 || teams[1].length === 0 ? 'In jedem Team muss mindestens einer sein. Teile den Code!' : `Warte auf ${notReady} Spieler …`}
              </div>
            )}
          </>
        ) : (
          <button className={`btn ${self?.ready ? 'btn-ghost' : 'btn-primary solid'}`} onClick={() => { roomActions().setReady(!self?.ready); if (!self?.ready) toast('Bereit! Der Gastgeber startet.'); }}>
            {self?.ready ? 'Doch nicht bereit' : 'Ich bin bereit'}
          </button>
        )}
        <button className="btn btn-ghost btn-sm" onClick={leave}>Raum verlassen</button>
      </div>
    </div>
  );
}
