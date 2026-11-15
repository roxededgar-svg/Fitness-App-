import { useRef, useState } from 'react';
import { useMe, useStore } from '../lib/store';
import { levelFromXp, rankFor, TIERS } from '../lib/progression';
import { bestPaceNorm, recentPaceNorm, TIER_PACE } from '../lib/pace';
import { BADGES } from '../lib/badges';
import { EXERCISES, EXERCISE_LIST } from '../lib/exercises';
import { Icon } from '../components/Icon';
import { Avatar, Sheet, toast } from '../components/ui';

async function resizeImage(file: File, size = 256): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const s = Math.min(img.width, img.height);
  c.getContext('2d')!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
  URL.revokeObjectURL(url);
  return c.toDataURL('image/jpeg', 0.82);
}

const MODE_LABEL = { pvp: 'ARENA', dungeon: 'DUNGEON', training: 'TRAINING', ghost: 'DUELL' } as const;

export function CareerScreen() {
  const me = useMe()!;
  const update = useStore((s) => s.updateProfile);
  const fileRef = useRef<HTMLInputElement>(null);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [ladderOpen, setLadderOpen] = useState(false);
  const best = bestPaceNorm(me);
  const recentPace = recentPaceNorm(me);
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(me.name);
  const lv = levelFromXp(me.xp).level;
  const rank = rankFor(me.arenaPoints);
  const earned = BADGES.filter((b) => b.earned(me));
  const favs = me.favBadges.map((id) => BADGES.find((b) => b.id === id)).filter(Boolean);
  const joined = new Date(me.createdAt).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  const recent = [...me.sessions].reverse().slice(0, 8);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow caps">Karriere</div>
          <h1>{me.name}</h1>
        </div>
      </div>

      <div className="card row" style={{ gap: 22 }}>
        <div style={{ position: 'relative' }}>
          <Avatar src={me.avatar} name={me.name} size={130} ring="var(--blue)" />
          <button className="fab" style={{ position: 'absolute', right: -2, bottom: -2, top: 'auto', width: 42, height: 42 }} onClick={() => fileRef.current?.click()} aria-label="Profilbild ändern">
            <Icon name="camera" size={20} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) update({ avatar: await resizeImage(f) });
          }} />
        </div>
        <div style={{ minWidth: 0 }}>
          {editName ? (
            <div className="row">
              <label className="field" style={{ minHeight: 46 }}><input value={name} maxLength={18} onChange={(e) => setName(e.target.value)} autoFocus /></label>
              <button className="btn btn-primary solid btn-sm" onClick={() => { if (name.trim().length >= 3) { update({ name: name.trim() }); setEditName(false); } else toast('Mind. 3 Zeichen'); }}>OK</button>
            </div>
          ) : (
            <>
              <div className="display" style={{ fontSize: 30, textTransform: 'uppercase' }}>{me.name}</div>
              <button className="muted caps" style={{ fontSize: 12, letterSpacing: '.1em', fontStyle: 'italic' }} onClick={() => setEditName(true)}>Namen ändern</button>
            </>
          )}
          <div className="row" style={{ marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
            <span className="pill" style={{ background: '#1d2236', color: '#c7cad8' }}>🎖 LVL {lv}</span>
            <span className="pill" style={{ background: '#1d2236', color: '#c7cad8' }}>📅 {joined}</span>
            <span className="pill" style={{ background: '#1d2236', color: 'var(--gold)' }}>🪙 {me.gold}</span>
            <span className="pill" style={{ background: '#1d2236', color: 'var(--blue)' }}>💎 {me.gems}</span>
          </div>
        </div>
      </div>

      <div className="section-title">
        <div className="caps">Lieblingsabzeichen</div>
        <button className="caps blue" style={{ fontSize: 13 }} onClick={() => setBadgesOpen(true)}>Verwalten ›</button>
      </div>
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', justifyItems: 'center', gap: 16, padding: '40px 20px' }}>
        {Array.from({ length: 6 }, (_, i) => {
          const b = favs[i];
          return b ? (
            <div key={i} className="badge-slot full" style={{ background: `${b.color}22` }} title={b.name}>{b.icon}</div>
          ) : (
            <button key={i} className="badge-slot" onClick={() => setBadgesOpen(true)}>+</button>
          );
        })}
      </div>

      <div className="grid2" style={{ marginTop: 22 }}>
        <button className="action-card blue" style={{ minHeight: 220 }} onClick={() => setLadderOpen(true)}>
          <div className="ico" style={{ background: 'none' }}><Icon name="shield" size={70} color={rank.tier.color} /></div>
          <p style={{ color: '#fff', fontWeight: 800 }}>Rangliste</p>
          <h3 style={{ marginTop: 4 }}>{rank.tier.name}</h3>
          <p style={{ marginTop: 6 }}>{rank.division ?? ''} · {me.arenaPoints} 🏆</p>
          {rank.next && (
            <>
              <div className="rank-bar" style={{ background: 'rgba(0,0,0,.25)' }}><span style={{ width: `${rank.progress * 100}%`, background: '#fff' }} /></div>
              <p style={{ marginTop: 6, letterSpacing: '.08em' }}>Noch {rank.pointsToNext} bis zum Aufstieg</p>
            </>
          )}
          <p style={{ marginTop: 6, letterSpacing: '.08em', color: '#fff' }}>Rang-Tempo {TIER_PACE[rank.tier.id]} Wdh./Min* · Leiter ›</p>
        </button>
        <button className="action-card dark" style={{ minHeight: 220 }} onClick={() => setBadgesOpen(true)}>
          <div className="ico" style={{ fontSize: 34 }}>🏅</div>
          <p className="purple" style={{ fontWeight: 800 }}>Abzeichen</p>
          <h3 style={{ marginTop: 4 }}>{earned.length}/{BADGES.length}</h3>
          <p>Sammlung</p>
        </button>
      </div>

      <div className="card code-box" style={{ marginTop: 22 }}>
        <div>
          <div className="caps muted" style={{ fontSize: 12 }}>Dein Spieler-Code</div>
          <div className="code" style={{ fontSize: 34 }}>{me.code}</div>
        </div>
        <Icon name="qr" size={40} color="#8a8fa6" />
      </div>

      <div className="section-title"><div className="caps">Persönliche Bestleistungen</div></div>
      <div className="grid4">
        {EXERCISE_LIST.map((e) => (
          <div key={e.id} className="card stat-card" style={{ padding: 14 }}>
            <div className="label" style={{ fontSize: 12 }}>{e.name}</div>
            <div className="value" style={{ fontSize: 26 }}>{me.personalBests[e.id] ?? '–'}</div>
          </div>
        ))}
      </div>

      <div className="section-title"><div className="caps">Letzte Aktivitäten</div></div>
      <div className="card">
        {recent.length === 0 && <div className="muted">Noch keine Einheiten. Leg los!</div>}
        {recent.map((s) => (
          <div className="history-row" key={s.id}>
            <span className="pill" style={{ background: s.result === 'win' ? '#10301e' : s.result === 'loss' ? '#3a1414' : '#1d2236', color: s.result === 'win' ? 'var(--green)' : s.result === 'loss' ? 'var(--red)' : '#c7cad8' }}>
              {MODE_LABEL[s.mode]}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b>{EXERCISES[s.exercise].name}</b> · {s.reps} {EXERCISES[s.exercise].unit}
              {s.oppName && <span className="muted"> vs {s.oppName} ({s.oppReps})</span>}
            </div>
            {!!s.eloDelta && <span className={s.eloDelta > 0 ? 'green' : 'red'}>{s.eloDelta > 0 ? '+' : ''}{s.eloDelta} ELO</span>}
            <span className="muted" style={{ fontSize: 12 }}>{new Date(s.ts).toLocaleDateString('de-DE')}</span>
          </div>
        ))}
      </div>

      {ladderOpen && (
        <Sheet title="RANG-LEITER" onClose={() => setLadderOpen(false)}>
          <div className="grid2" style={{ marginBottom: 16 }}>
            <div className="card stat-card"><div className="label caps">Dein Bestwert-Tempo*</div><div className="value gold">{best ? Math.round(best) : '–'}</div></div>
            <div className="card stat-card"><div className="label caps">Ø Ranked-Tempo*</div><div className="value blue">{recentPace ? Math.round(recentPace) : '–'}</div></div>
          </div>
          <div className="board">
            {[...TIERS].reverse().map((t) => {
              const current = rank.tier.id === t.id;
              const reached = me.arenaPoints >= t.min;
              return (
                <div key={t.id} className={`board-row ${current ? 'me' : ''}`} style={{ opacity: reached || current ? 1 : 0.6 }}>
                  <Icon name="shield" size={30} color={t.color} />
                  <div>
                    <div className="name">{t.name} {current && <span className="me-tag">DU</span>}</div>
                    <div className="sub">ab {t.min} Punkten{t.id !== 'legend' ? ' · Divisionen IV–I' : ''}</div>
                  </div>
                  <div className="pts">
                    <b style={{ color: best >= TIER_PACE[t.id] ? 'var(--green)' : 'var(--gold)' }}>{TIER_PACE[t.id]}</b>
                    <small>Wdh./Min*</small>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 14, lineHeight: 1.5 }}>
            Im Ranked-Modus laufen deine Gegner ungefähr im Tempo deines Rangs – gemischt mit deinem eigenen Ø-Tempo, damit es immer knapp bleibt.
            Steigst du auf, werden die Gegner schneller. Grün = Tempo hast du schon einmal erreicht.
            <br />* Liegestütz-Maßstab. Andere Übungen werden umgerechnet (z. B. Jumping Jacks sind von Natur aus schneller).
          </div>
        </Sheet>
      )}

      {badgesOpen && (
        <Sheet title="ABZEICHEN" onClose={() => setBadgesOpen(false)}>
          <div className="muted" style={{ marginBottom: 16 }}>Tippe auf freigeschaltete Abzeichen, um bis zu 6 Favoriten zu wählen. Tempo-Abzeichen (*) zählen im Liegestütz-Maßstab, gemessen in gewerteten Einheiten ab 30 s.</div>
          <div className="badge-grid">
            {BADGES.map((b) => {
              const has = b.earned(me);
              const fav = me.favBadges.includes(b.id);
              return (
                <button key={b.id} className={`badge-item ${has ? '' : 'off'} ${fav ? 'fav' : ''}`} disabled={!has}
                  onClick={() => {
                    if (fav) update({ favBadges: me.favBadges.filter((x) => x !== b.id) });
                    else if (me.favBadges.length < 6) update({ favBadges: [...me.favBadges, b.id] });
                    else toast('Maximal 6 Favoriten');
                  }}>
                  <div className="b-ico">{b.icon}</div>
                  <div className="b-name">{b.name}</div>
                  <div className="b-desc">{b.desc}</div>
                </button>
              );
            })}
          </div>
        </Sheet>
      )}
    </div>
  );
}
