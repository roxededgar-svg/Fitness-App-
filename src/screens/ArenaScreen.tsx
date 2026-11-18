import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMe, useStore } from '../lib/store';
import { botPool, type Opponent } from '../lib/bots';
import { todayKey } from '../lib/rng';
import { levelFromXp, rankFor, rankLabel } from '../lib/progression';
import { extractDuelCode } from '../lib/duel';
import { PVP_EXERCISES, EXERCISES, type ExerciseId } from '../lib/exercises';
import { useBattle } from '../lib/battle';
import { tierPaceNorm } from '../lib/pace';
import { Icon } from '../components/Icon';
import { RankEmblem } from '../components/RankEmblem';
import { seasonEndsIn, seasonId, seasonName, seasonReward } from '../lib/season';
import { Flag, PageHeader, Section, Sheet, toast } from '../components/ui';

type Tab = 'global' | 'land' | 'friends';
type Row = Pick<Opponent, 'id' | 'name' | 'country' | 'elo' | 'arenaPoints' | 'level' | 'wins' | 'losses'> & { me?: boolean; bot?: boolean };

export function ArenaScreen() {
  const me = useMe()!;
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>('global');
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const rows = useMemo(() => {
    const mine: Row = { id: me.id, name: me.name, country: me.country, elo: me.elo, arenaPoints: me.arenaPoints, level: levelFromXp(me.xp).level, wins: me.wins, losses: me.losses, me: true };
    const friends: Row[] = me.friends.map((f) => ({ ...f, id: f.code }));
    let list: Row[] =
      tab === 'friends' ? [mine, ...friends] : [mine, ...friends, ...botPool(todayKey()).map((b) => ({ ...b, bot: true }))];
    if (tab === 'land') list = list.filter((r) => r.country === me.country);
    return list.sort((a, b) => b.arenaPoints - a.arenaPoints || b.elo - a.elo);
  }, [me, tab]);

  const myIndex = rows.findIndex((r) => r.me);
  const rank = rankFor(me.arenaPoints);
  // Kompakte Rangliste: Top 10 + deine Umgebung, außer alles wird angezeigt
  const visible = showAll || rows.length <= 12
    ? rows.map((r, i) => ({ r, i }))
    : [
        ...rows.slice(0, 10).map((r, i) => ({ r, i })),
        ...(myIndex >= 10 ? rows.slice(Math.max(10, myIndex - 1), myIndex + 2).map((r, k) => ({ r, i: Math.max(10, myIndex - 1) + k })) : []),
      ];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Arena"
        title="PvP Arena"
        right={
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--blue)' }} onClick={() => setFriendsOpen(true)}>
            <Icon name="users" size={20} /> Freunde
          </button>
        }
      />

      {/* Saison */}
      <div className="season-bar">
        <span className="caps" style={{ fontSize: 11 }}>Saison {seasonName(seasonId())}</span>
        <span className="spacer" />
        <span className="muted" style={{ fontSize: 13 }}>Endet in {Math.ceil(seasonEndsIn() / 864e5)} Tagen · Belohnung jetzt: <b className="gold">{seasonReward(Math.max(me.season?.peak ?? 0, me.arenaPoints)).gold} Gold</b> + <b style={{ color: '#4CC9F0' }}>{seasonReward(Math.max(me.season?.peak ?? 0, me.arenaPoints)).gems} Edelsteine</b></span>
      </div>

      {/* Rang-Übersicht */}
      <div className="card">
        <div className="rank-summary">
          <RankEmblem tier={rank.tier} division={rank.division} size={72} />
          <div style={{ minWidth: 0 }}>
            <div className="r-name">{rankLabel(me.arenaPoints)}</div>
            <div className="r-sub">
              <span className="ico-inline"><Icon name="trophy" size={13} color="var(--gold)" /> {me.arenaPoints} Trophäen</span>{rank.next ? ` · noch ${rank.pointsToNext} bis zur nächsten Stufe` : ''}
            </div>
            {rank.next && <div className="rank-bar"><span style={{ width: `${rank.progress * 100}%`, background: rank.tier.color }} /></div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="caps muted" style={{ fontSize: 11 }}>Rang-Tempo*</div>
            <div className="display gold" style={{ fontSize: 26 }}>{Math.round(tierPaceNorm(me.arenaPoints))}<span className="muted" style={{ fontSize: 13 }}> /Min</span></div>
          </div>
        </div>
        <div className="stat-grid four" style={{ marginTop: 16 }}>
          <div className="mini" style={{ background: 'var(--card2)' }}><div className="l">Trophäen</div><div className="v gold">{me.arenaPoints}</div></div>
          <div className="mini" style={{ background: 'var(--card2)' }}><div className="l">Siege</div><div className="v green">{me.wins}</div></div>
          <div className="mini" style={{ background: 'var(--card2)' }}><div className="l">Niederlagen</div><div className="v red">{me.losses}</div></div>
          <div className="mini" style={{ background: 'var(--card2)' }}><div className="l">Platz</div><div className="v blue">#{myIndex + 1}</div></div>
        </div>
      </div>

      <Section title="Spielmodi">
        <div className="tiles three">
          <button className="tile primary" onClick={() => nav('/matchmaking?q=ranked')}>
            <div className="t-ico"><Icon name="shield" size={24} /></div>
            <div>
              <div className="t-title">Ranked</div>
              <div className="t-sub">Um Trophäen · Gegner im Tempo deines Rangs · 60 s</div>
            </div>
          </button>
          <button className="tile" onClick={() => nav('/matchmaking?q=casual')}>
            <div className="t-ico" style={{ background: '#2e2216', color: 'var(--purple)' }}><Icon name="bolt" size={24} /></div>
            <div>
              <div className="t-title">Schnellkampf</div>
              <div className="t-sub">Übung & Dauer frei wählbar · keine Trophäen</div>
            </div>
          </button>
          <button className="tile" onClick={() => nav('/matchmaking?q=custom')}>
            <div className="t-ico" style={{ background: '#2a2108', color: 'var(--gold)' }}><Icon name="stopwatch" size={24} /></div>
            <div>
              <div className="t-title">Eigenes Tempo</div>
              <div className="t-sub">Gegner-Tempo selbst einstellen · ungewertet</div>
            </div>
          </button>
        </div>
      </Section>

      <Section title="Mit Freunden">
        <button className="card plan-cta friends-cta" onClick={() => nav('/friends')}>
          <div className="t-ico" style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #D7FF3B33, #ef444433)', color: '#fff' }}><Icon name="users" size={28} /></div>
          <div style={{ flex: 1 }}>
            <div className="display" style={{ fontSize: 18 }}>Gegeneinander oder im Team</div>
            <div className="muted" style={{ fontSize: 13 }}>1 vs 1 oder 2 vs 2 – zu zweit an einem Gerät oder per Team-Link</div>
          </div>
          <Icon name="back" size={18} style={{ transform: 'rotate(180deg)' }} />
        </button>
      </Section>

      <Section title="1v1 Duelle" action={<button className="section-link" onClick={() => setChallengeOpen(true)}>+ Herausfordern</button>}>
        {me.friends.filter((f) => f.duel).length === 0 ? (
          <div className="empty">
            <Icon name="shield" size={30} color="#7a7368" />
            <div style={{ marginTop: 8 }}>Gerade fordert dich keiner heraus. Dann mach du den ersten Schritt.</div>
          </div>
        ) : (
          <div className="board">
            {me.friends.filter((f) => f.duel).map((f) => (
              <div className="board-row" key={f.code}>
                <div>
                  <div className="name"><Flag cc={f.country} /> {f.name}</div>
                  <div className="sub">Ghost-Duell verfügbar</div>
                </div>
                <button className="btn btn-purple btn-sm" style={{ marginLeft: 'auto' }} onClick={() => nav(`/duel?c=${f.duel}`)}>Antreten</button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Rangliste" action={<span className="blue display" style={{ fontSize: 14 }}>{rows.length} Spieler</span>}>
        <div className="tabs">
          <button className={tab === 'global' ? 'on' : ''} onClick={() => setTab('global')}><Icon name="globe" size={18} />GLOBAL</button>
          <button className={tab === 'land' ? 'on' : ''} onClick={() => setTab('land')}><Icon name="flag" size={18} /><Flag cc={me.country} size={14} /> LAND</button>
          <button className={tab === 'friends' ? 'on' : ''} onClick={() => setTab('friends')}><Icon name="users" size={18} />FREUNDE</button>
        </div>
        <div className="board" style={{ marginTop: 12 }}>
          {visible.map(({ r, i }, k) => (
            <div key={r.id}>
              {k > 0 && i - visible[k - 1].i > 1 && <div className="board-gap">···</div>}
              <div className={`board-row ${r.me ? 'me' : ''}`}>
                <div className={`pos p${i + 1}`}>{String(i + 1).padStart(2, '0')}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="name"><Flag cc={r.country} /> {r.name} {r.me && <span className="me-tag">ME</span>}{r.bot && <span className="ai-tag">KI</span>}</div>
                  <div className="sub">LVL {r.level}<span className="rk"> · {rankLabel(r.arenaPoints)}</span></div>
                </div>
                <div className="pts"><b>{r.arenaPoints}</b><small>{r.wins}W · {r.losses}L</small></div>
              </div>
            </div>
          ))}
          {rows.length > 12 && (
            <button className="board-more" onClick={() => setShowAll(!showAll)}>{showAll ? 'Weniger anzeigen' : `Alle ${rows.length} anzeigen`}</button>
          )}
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>KI = computergesteuerter Gegner. Echte Spieler kommen über Duell-Links als Freunde dazu.<br />* Rang-Tempo im Liegestütz-Maßstab, andere Übungen werden umgerechnet.</div>
      </Section>

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
            <Flag cc={f.country} size={22} />
            <div style={{ flex: 1 }}>
              <div className="display">{f.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>{f.code} · LVL {f.level} · {f.arenaPoints} Trophäen</div>
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
