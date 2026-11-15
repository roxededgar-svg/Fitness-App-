import { useEffect, useRef, useState } from 'react';
import { useMe, useStore } from '../lib/store';
import { levelFromXp, rankFor, TIERS } from '../lib/progression';
import { bestPaceNorm, recentPaceNorm, tierPaceNorm, TIER_PACE } from '../lib/pace';
import { BADGES, type Badge } from '../lib/badges';
import { EXERCISES, EXERCISE_LIST } from '../lib/exercises';
import { Icon } from '../components/Icon';
import { Avatar, Gems, Gold, PageHeader, Section, Sheet, toast } from '../components/ui';
import { RankEmblem, tierPalette } from '../components/RankEmblem';
import { BadgeBack, BadgeFront, RankBack, RankFront } from '../components/MedalFaces';
import { MedalViewer } from '../components/MedalViewer';
import { cssClip, METALS, styleFor } from '../lib/badgeStyles';
import type { Tier } from '../lib/progression';
import type { SessionRecord } from '../lib/types';

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
const QUEUE_LABEL = { ranked: 'RANKED', casual: 'SCHNELL', custom: 'TEMPO' } as const;
const activityLabel = (s: SessionRecord) => (s.mode === 'pvp' && s.queue ? QUEUE_LABEL[s.queue] : MODE_LABEL[s.mode]);

export function CareerScreen() {
  const me = useMe()!;
  const update = useStore((s) => s.updateProfile);
  const fileRef = useRef<HTMLInputElement>(null);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [ladderOpen, setLadderOpen] = useState(false);
  const [viewBadge, setViewBadge] = useState<Badge | null>(null);
  const [viewTier, setViewTier] = useState<Tier | null>(null);
  const syncBadges = useStore((s) => s.syncBadges);
  useEffect(() => syncBadges(), [syncBadges]);
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
      <PageHeader eyebrow="Karriere" title="Profil" />

      {/* Profil */}
      <div className="card profile-card">
        <div style={{ position: 'relative' }}>
          <Avatar src={me.avatar} name={me.name} size={120} ring="var(--blue)" />
          <button className="fab" style={{ position: 'absolute', right: -2, bottom: -2, top: 'auto', width: 42, height: 42 }} onClick={() => fileRef.current?.click()} aria-label="Profilbild ändern">
            <Icon name="camera" size={20} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) update({ avatar: await resizeImage(f) });
          }} />
        </div>
        <div style={{ minWidth: 0, width: '100%' }}>
          {editName ? (
            <div className="row">
              <label className="field" style={{ minHeight: 46, flex: 1 }}><input value={name} maxLength={18} onChange={(e) => setName(e.target.value)} autoFocus /></label>
              <button className="btn btn-primary solid btn-sm" onClick={() => { if (name.trim().length >= 3) { update({ name: name.trim() }); setEditName(false); } else toast('Mind. 3 Zeichen'); }}>OK</button>
            </div>
          ) : (
            <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
              <div className="display" style={{ fontSize: 30, textTransform: 'uppercase' }}>{me.name}</div>
              <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => setEditName(true)} aria-label="Namen ändern"><Icon name="edit" size={16} /></button>
            </div>
          )}
          <div className="chips">
            <span className="pill ico-inline" style={{ background: '#1d2236', color: '#c7cad8' }}><Icon name="star" size={13} /> LVL {lv}</span>
            <span className="pill ico-inline" style={{ background: '#1d2236', color: '#c7cad8' }}><Icon name="calendar" size={13} /> Seit {joined}</span>
            <span className="pill ico-inline" style={{ background: '#1d2236', color: 'var(--gold)' }}><Gold size={13} /> {me.gold}</span>
            <span className="pill ico-inline" style={{ background: '#1d2236', color: 'var(--blue)' }}><Gems size={13} /> {me.gems}</span>
          </div>
          <button className="row" style={{ marginTop: 14, gap: 10 }} onClick={() => { navigator.clipboard?.writeText(me.code); toast('Spieler-Code kopiert'); }}>
            <span className="caps muted" style={{ fontSize: 11 }}>Spieler-Code</span>
            <span className="display blue" style={{ fontSize: 22, letterSpacing: '.18em' }}>{me.code}</span>
            <Icon name="copy" size={16} color="var(--muted)" />
          </button>
        </div>
      </div>

      {/* Rang & Abzeichen */}
      <div className="grid2" style={{ marginTop: 14 }}>
        <button className="tile primary" style={{ minHeight: 170 }} onClick={() => setLadderOpen(true)}>
          <div className="row" style={{ gap: 12 }}>
            <RankEmblem tier={rank.tier} division={rank.division} size={58} />
            <div style={{ minWidth: 0 }}>
              <div className="caps" style={{ fontSize: 11, color: 'rgba(255,255,255,.8)' }}>Rang</div>
              <div className="t-title" style={{ fontSize: 18 }}>{rank.tier.name} {rank.division ?? ''}</div>
            </div>
          </div>
          <div>
            {rank.next && <div className="rank-bar" style={{ background: 'rgba(0,0,0,.25)', marginTop: 0 }}><span style={{ width: `${rank.progress * 100}%`, background: '#fff' }} /></div>}
            <div className="t-sub" style={{ marginTop: 8 }}>
              {me.arenaPoints} Trophäen{rank.next ? ` · noch ${rank.pointsToNext} bis zum Aufstieg` : ''}<br />
              Rang-Tempo {Math.round(tierPaceNorm(me.arenaPoints))} Wdh./Min* · Rang-Leiter ›
            </div>
          </div>
        </button>
        <button className="tile" style={{ minHeight: 170 }} onClick={() => setBadgesOpen(true)}>
          <div className="row" style={{ gap: 12 }}>
            <div className="t-ico" style={{ background: '#221d3a', color: 'var(--purple)' }}><Icon name="medal" size={26} /></div>
            <div>
              <div className="caps purple" style={{ fontSize: 11 }}>Abzeichen</div>
              <div className="t-title" style={{ fontSize: 18 }}>{earned.length} / {BADGES.length}</div>
            </div>
          </div>
          <div>
            <div className="progress" style={{ marginTop: 0 }}><span style={{ width: `${(earned.length / BADGES.length) * 100}%` }} /></div>
            <div className="t-sub" style={{ marginTop: 8 }}>Sammlung ansehen & Favoriten wählen ›</div>
          </div>
        </button>
      </div>

      <Section title="Lieblingsabzeichen" action={<button className="section-link" onClick={() => setBadgesOpen(true)}>Verwalten ›</button>}>
        <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(84px, 1fr))', justifyItems: 'center', gap: 14, padding: '24px 16px' }}>
          {Array.from({ length: 6 }, (_, i) => {
            const b = favs[i];
            return b ? (
              <button key={i} className="medal-thumb" title={b.name} onClick={() => setViewBadge(b)} style={{ width: 88, height: 88 }}>
                <BadgeFront badge={b} earned />
              </button>
            ) : (
              <button key={i} className="badge-slot" onClick={() => setBadgesOpen(true)}>+</button>
            );
          })}
        </div>
      </Section>

      <Section title="Persönliche Bestleistungen">
        <div className="stat-grid four">
          {EXERCISE_LIST.map((e) => (
            <div key={e.id} className="mini">
              <div className="l" style={{ letterSpacing: '.08em' }}>{e.name}</div>
              <div className="v">{me.personalBests[e.id] ?? '–'} {me.personalBests[e.id] != null && <span className="muted" style={{ fontSize: 13 }}>{e.unit}</span>}</div>
            </div>
          ))}
          <div className="mini">
            <div className="l" style={{ letterSpacing: '.08em' }}>Bestes Tempo*</div>
            <div className="v gold">{best ? Math.round(best) : '–'} {best > 0 && <span className="muted" style={{ fontSize: 13 }}>/Min</span>}</div>
          </div>
        </div>
      </Section>

      <Section title="Letzte Aktivitäten">
        <div className="card">
          {recent.length === 0 && <div className="muted">Noch keine Einheiten. Leg los!</div>}
          {recent.map((s) => (
            <div className="history-row" key={s.id}>
              <span className="pill" style={{ minWidth: 92, textAlign: 'center', background: s.result === 'win' ? '#10301e' : s.result === 'loss' ? '#3a1414' : '#1d2236', color: s.result === 'win' ? 'var(--green)' : s.result === 'loss' ? 'var(--red)' : '#c7cad8' }}>
                {activityLabel(s)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{EXERCISES[s.exercise].name}</b> · {s.reps} {EXERCISES[s.exercise].unit}
                {s.oppName && <span className="muted"> vs {s.oppName}{s.oppReps != null ? ` (${s.oppReps})` : ''}</span>}
              </div>
              {!!s.eloDelta && <span className={s.eloDelta > 0 ? 'green' : 'red'}>{s.eloDelta > 0 ? '+' : ''}{s.eloDelta} ELO</span>}
              <span className="muted" style={{ fontSize: 12 }}>{new Date(s.ts).toLocaleDateString('de-DE')}</span>
            </div>
          ))}
        </div>
      </Section>

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
                  <button className="medal-thumb" onClick={() => setViewTier(t)} aria-label={`${t.name} ansehen`}><RankEmblem tier={t} size={46} glow={reached} /></button>
                  <div>
                    <div className="name">{t.name} {current && <span className="me-tag">DU</span>}</div>
                    <div className="sub">ab {t.min} Trophäen{t.id !== 'legend' ? ' · Divisionen IV–I' : ''}</div>
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
          <div className="muted" style={{ marginBottom: 16 }}>Tippe auf ein Abzeichen, um es in 3D anzusehen und zu drehen. Dort kannst du es auch als Favorit wählen (max. 6). Tempo-Abzeichen (*) zählen im Liegestütz-Maßstab, gemessen in gewerteten Einheiten ab 30 s.</div>
          <div className="badge-grid">
            {BADGES.map((b) => {
              const has = b.earned(me);
              const fav = me.favBadges.includes(b.id);
              return (
                <button key={b.id} className={`badge-item ${has ? '' : 'off'} ${fav ? 'fav' : ''}`} onClick={() => setViewBadge(b)}>
                  <div className="b-ico"><div style={{ width: 76, height: 76 }}><BadgeFront badge={b} earned={has} /></div></div>
                  <div className="b-name">{b.name}</div>
                  <div className="b-desc">{b.desc}</div>
                </button>
              );
            })}
          </div>
        </Sheet>
      )}
      {viewBadge && (() => {
        const b = viewBadge;
        const has = b.earned(me);
        const fav = me.favBadges.includes(b.id);
        const at = me.badgeDates?.[b.id];
        return (
          <MedalViewer
            key={b.id}
            front={<BadgeFront badge={b} earned={has} />}
            back={<BadgeBack badge={b} earnedAt={has ? at ?? Date.now() : undefined} />}
            edge={has ? METALS[styleFor(b.id).metal][2] : '#3a3e52'}
            clip={cssClip(styleFor(b.id).shape)}
            color={has ? styleFor(b.id).colors[1] : '#4b4f63'}
            title={b.name}
            subtitle={has ? <>{b.desc}<br />Erhalten am {new Date(at ?? Date.now()).toLocaleDateString('de-DE')}</> : <>Noch gesperrt · {b.desc}</>}
            actions={has && (
              <button className={`btn btn-sm ${fav ? 'btn-ghost' : 'btn-purple'}`} onClick={() => {
                if (fav) update({ favBadges: me.favBadges.filter((x) => x !== b.id) });
                else if (me.favBadges.length < 6) update({ favBadges: [...me.favBadges, b.id] });
                else toast('Maximal 6 Favoriten');
              }}>
                <Icon name="star" size={16} /> {fav ? 'Kein Favorit mehr' : 'Als Favorit'}
              </button>
            )}
            onClose={() => setViewBadge(null)}
          />
        );
      })()}

      {viewTier && (
        <MedalViewer
          key={viewTier.id}
          front={<RankFront tier={viewTier} division={viewTier.id === rank.tier.id ? rank.division : null} />}
          back={<RankBack tier={viewTier} />}
          edge={tierPalette(viewTier.id).mid}
          color={tierPalette(viewTier.id).mid}
          shape="circle"
          title={viewTier.name}
          subtitle={me.arenaPoints >= viewTier.min ? 'Erreicht' : `Noch ${viewTier.min - me.arenaPoints} Trophäen bis zu diesem Rang`}
          onClose={() => setViewTier(null)}
        />
      )}
    </div>
  );
}
