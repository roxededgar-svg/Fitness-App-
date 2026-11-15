import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMe, useStore } from '../lib/store';
import { botPool, type Opponent } from '../lib/bots';
import { todayKey } from '../lib/rng';
import { levelFromXp, rankLabel } from '../lib/progression';
import { extractDuelCode } from '../lib/duel';
import { PVP_EXERCISES, EXERCISES, type ExerciseId } from '../lib/exercises';
import { useBattle } from '../lib/battle';
import { tierPaceNorm } from '../lib/pace';
import { Icon } from '../components/Icon';
import { Sheet, flag, toast, TierShield } from '../components/ui';

type Tab = 'global' | 'land' | 'friends';
type Row = Pick<Opponent, 'id' | 'name' | 'country' | 'elo' | 'arenaPoints' | 'level' | 'wins' | 'losses'> & { me?: boolean };

export function ArenaScreen() {
  const me = useMe()!;
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>('global');
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);

  const rows = useMemo(() => {
    const mine: Row = { id: me.id, name: me.name, country: me.country, elo: me.elo, arenaPoints: me.arenaPoints, level: levelFromXp(me.xp).level, wins: me.wins, losses: me.losses, me: true };
    const friends: Row[] = me.friends.map((f) => ({ ...f, id: f.code }));
    let list: Row[] =
      tab === 'friends' ? [mine, ...friends] : [mine, ...friends, ...botPool(todayKey())];
    if (tab === 'land') list = list.filter((r) => r.country === me.country);
    return list.sort((a, b) => b.arenaPoints - a.arenaPoints || b.elo - a.elo);
  }, [me, tab]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow caps">Arena</div>
          <h1>PvP Arena</h1>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--blue)', marginRight: 70 }} onClick={() => setFriendsOpen(true)}>
          <Icon name="users" size={20} /> Freunde
        </button>
      </div>

      <div className="card">
        <div className="grid4 arena-stats">
          <div className="box"><div className="l">ARENA-PUNKTE</div><div className="v blue">{me.arenaPoints}</div></div>
          <div className="box"><div className="l">ELO</div><div className="v purple">{me.elo}</div></div>
          <div className="box"><div className="l">SIEGE</div><div className="v green">{me.wins}</div></div>
          <div className="box"><div className="l">NIEDERLAGEN</div><div className="v red">{me.losses}</div></div>
        </div>
        <div className="row" style={{ margin: '14px 4px', fontSize: 14 }}>
          <TierShield points={me.arenaPoints} />
          <span className="display">{rankLabel(me.arenaPoints)}</span>
          <span className="spacer" />
          <span className="muted">Rang-Tempo: <b className="gold">{Math.round(tierPaceNorm(me.arenaPoints))} Wdh./Min</b>*</span>
        </div>
        <button className="btn btn-primary solid" onClick={() => nav('/matchmaking?q=ranked')}>
          <Icon name="shield" size={22} /> Ranked spielen
        </button>
        <div className="grid2" style={{ marginTop: 12 }}>
          <button className="btn btn-ghost" onClick={() => nav('/matchmaking?q=casual')} style={{ flexDirection: 'column', gap: 2, minHeight: 64 }}>
            <span><Icon name="bolt" size={16} color="var(--purple)" /> Schnellkampf</span>
            <small className="muted" style={{ fontFamily: 'var(--body)', letterSpacing: 0, textTransform: 'none', fontWeight: 500, fontSize: 12 }}>Locker, ohne Rang-Punkte</small>
          </button>
          <button className="btn btn-ghost" onClick={() => nav('/matchmaking?q=custom')} style={{ flexDirection: 'column', gap: 2, minHeight: 64 }}>
            <span>⏱️ Eigenes Tempo</span>
            <small className="muted" style={{ fontFamily: 'var(--body)', letterSpacing: 0, textTransform: 'none', fontWeight: 500, fontSize: 12 }}>Gegner-Tempo selbst wählen</small>
          </button>
        </div>
      </div>

      <div className="section-title">
        <div className="caps">1v1 Duelle</div>
        <button className="caps blue" style={{ fontSize: 13 }} onClick={() => setChallengeOpen(true)}>+ Herausfordern</button>
      </div>
      {me.friends.filter((f) => f.duel).length === 0 ? (
        <div className="empty">
          <Icon name="shield" size={34} color="#6b7085" />
          <div style={{ marginTop: 10 }}>Keine offenen Duelle. Fordere einen Freund heraus!</div>
        </div>
      ) : (
        <div className="board">
          {me.friends.filter((f) => f.duel).map((f) => (
            <div className="board-row" key={f.code}>
              <div>
                <div className="name">{flag(f.country)} {f.name}</div>
                <div className="sub">Ghost-Duell verfügbar</div>
              </div>
              <button className="btn btn-purple btn-sm" style={{ marginLeft: 'auto' }} onClick={() => nav(`/duel?c=${f.duel}`)}>Antreten</button>
            </div>
          ))}
        </div>
      )}

      <div className="tabs" style={{ marginTop: 26 }}>
        <button className={tab === 'global' ? 'on' : ''} onClick={() => setTab('global')}><Icon name="globe" size={18} />GLOBAL</button>
        <button className={tab === 'land' ? 'on' : ''} onClick={() => setTab('land')}><Icon name="flag" size={18} />{flag(me.country)} LAND</button>
        <button className={tab === 'friends' ? 'on' : ''} onClick={() => setTab('friends')}><Icon name="users" size={18} />FREUNDE</button>
      </div>

      <div className="board" style={{ marginTop: 16 }}>
        <div className="board-head"><span className="caps">Rangliste</span><span className="blue display">{rows.length}</span></div>
        {rows.map((r, i) => (
          <div key={r.id} className={`board-row ${r.me ? 'me' : ''}`}>
            <div className={`pos p${i + 1}`}>{String(i + 1).padStart(2, '0')}</div>
            <div style={{ minWidth: 0 }}>
              <div className="name">{flag(r.country)} {r.name} {r.me && <span className="me-tag">ME</span>}</div>
              <div className="sub">LVL {r.level} · {r.elo} ELO · {rankLabel(r.arenaPoints)}</div>
            </div>
            <div className="pts"><b>{r.arenaPoints}</b><small>{r.wins}W · {r.losses}L</small></div>
          </div>
        ))}
      </div>

      {friendsOpen && <FriendsSheet onClose={() => setFriendsOpen(false)} />}
      {challengeOpen && <ChallengeSheet onClose={() => setChallengeOpen(false)} />}
    </div>
  );
}

function FriendsSheet({ onClose }: { onClose: () => void }) {
  const me = useMe()!;
  const nav = useNavigate();
  const remove = useStore((s) => s.removeFriend);
  const [input, setInput] = useState('');

  function add() {
    const code = extractDuelCode(input);
    if (!code) return toast('Ungültiger Duell-Link. Lass dir von deinem Freund einen Duell-Link schicken.');
    onClose();
    nav(`/duel?c=${code}`);
  }

  return (
    <Sheet title="FREUNDE" onClose={onClose}>
      <div className="card code-box">
        <div>
          <div className="caps muted" style={{ fontSize: 12 }}>Dein Spieler-Code</div>
          <div className="code">{me.code}</div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--blue)' }} onClick={() => { navigator.clipboard?.writeText(me.code); toast('Code kopiert'); }}>
          <Icon name="copy" size={18} /> Kopieren
        </button>
      </div>
      <div className="caps" style={{ margin: '22px 0 6px', fontSize: 13 }}>Freund hinzufügen</div>
      <div className="muted" style={{ fontSize: 14, marginBottom: 12 }}>
        Füge den Duell-Link deines Freundes ein. Ihr werdet automatisch Freunde, sobald du sein Duell annimmst.
      </div>
      <div className="row">
        <label className="field" style={{ flex: 1 }}>
          <Icon name="link" size={20} />
          <input placeholder="Duell-Link einfügen" value={input} onChange={(e) => setInput(e.target.value)} />
        </label>
        <button className="btn btn-primary solid btn-sm" style={{ minHeight: 58 }} disabled={!input.trim()} onClick={add}>Hinzufügen</button>
      </div>
      <div className="caps" style={{ margin: '24px 0 10px', fontSize: 13 }}>Freunde ({me.friends.length})</div>
      {me.friends.length === 0 ? (
        <div className="muted" style={{ textAlign: 'center', fontStyle: 'italic', padding: 20 }}>Du hast noch keine Freunde. Fordere jemanden mit „Herausfordern“ heraus!</div>
      ) : (
        me.friends.map((f) => (
          <div className="history-row" key={f.code}>
            <span style={{ fontSize: 22 }}>{flag(f.country)}</span>
            <div style={{ flex: 1 }}>
              <div className="display">{f.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>{f.code} · LVL {f.level} · {f.elo} ELO</div>
            </div>
            {f.duel && <button className="btn btn-purple btn-sm" onClick={() => { onClose(); nav(`/duel?c=${f.duel}`); }}>Duell</button>}
            <button className="icon-btn" style={{ width: 40, height: 40 }} onClick={() => remove(f.code)} aria-label="Entfernen"><Icon name="close" size={16} /></button>
          </div>
        ))
      )}
    </Sheet>
  );
}

function ChallengeSheet({ onClose }: { onClose: () => void }) {
  const nav = useNavigate();
  const start = useBattle((s) => s.start);
  const [ex, setEx] = useState<ExerciseId>('pushup');
  return (
    <Sheet title="HERAUSFORDERN" onClose={onClose}>
      <div className="muted" style={{ marginBottom: 16, lineHeight: 1.5 }}>
        Absolviere einen 60-Sekunden-Lauf. Danach bekommst du einen <b style={{ color: 'var(--text)' }}>Duell-Link</b>. Dein Freund tritt gegen deinen
        aufgezeichneten Lauf an – Wiederholung für Wiederholung, live im Tauziehen-Balken.
      </div>
      <div className="grid2">
        {PVP_EXERCISES.map((id) => (
          <button key={id} className={`choice ${ex === id ? 'on blue' : ''}`} onClick={() => setEx(id)}>{EXERCISES[id].name}</button>
        ))}
      </div>
      <button
        className="btn btn-primary"
        style={{ marginTop: 20 }}
        onClick={() => {
          start({ mode: 'training', exercise: ex, durationS: 60, ranked: true, challenge: true });
          nav('/battle');
        }}
      >
        Lauf aufzeichnen
      </button>
    </Sheet>
  );
}
