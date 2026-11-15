import { Fragment, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMe, useStore } from '../lib/store';
import { useBattle } from '../lib/battle';
import { EXERCISES } from '../lib/exercises';
import {
  WORLDS, currentNode, isCleared, isUnlocked, starsOf, totalStars, worldStars,
  type PathNode, type World,
} from '../lib/path';
import { Icon } from '../components/Icon';
import { Avatar, Gems, Gold, Sheet, toast } from '../components/ui';
import { Scenery } from '../components/Scenery';

const HEADER = 205;
const GAP = 128;
const FOOT = 200;

/** Horizontale Lage einer Station (Prozent), schlängelnd je Welt */
const xOf = (w: number, i: number) => 50 + Math.sin(i * 1.15 + w * 1.7) * 27;
const yOf = (i: number) => HEADER + 40 + i * GAP;
const worldHeight = (w: World) => yOf(w.nodes.length - 1) + FOOT + 40;

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <div className="pnode-stars">
      {[0, 1, 2].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" style={{ transform: i === 1 ? 'translateY(-3px)' : undefined }}>
          <path d="M12 2l3 7h7l-5.5 4.5 2 7.5L12 17l-6.5 4 2-7.5L2 9h7z" fill={i < n ? '#ffd23f' : '#2a2d3a'} stroke={i < n ? '#8a5a00' : '#3d4152'} strokeWidth="1.2" />
        </svg>
      ))}
    </div>
  );
}

/** Gezeichnete Schatzkiste */
function Chest({ open, glow, size = 70 }: { open: boolean; glow: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 70 70" className={open ? '' : 'chest-wiggle'}>
      {open && <path d="M35 34 14 6M35 34l21-28M35 34V2" stroke={glow} strokeWidth="3" opacity=".7" strokeLinecap="round" />}
      <rect x="10" y="32" width="50" height="30" rx="4" fill="#7a3f12" stroke="#2e1606" strokeWidth="2" />
      <rect x="10" y="32" width="50" height="7" fill="#a0581f" />
      {open ? (
        <path d="M10 32 14 14h42l4 18z" fill="#5a2d0c" stroke="#2e1606" strokeWidth="2" />
      ) : (
        <path d="M10 32a25 14 0 0 1 50 0z" fill="#a0581f" stroke="#2e1606" strokeWidth="2" />
      )}
      <rect x="31" y="20" width="8" height="42" fill="#f5c242" stroke="#6b4400" strokeWidth="1.2" />
      <rect x="29" y="38" width="12" height="10" rx="2" fill="#ffe08a" stroke="#6b4400" strokeWidth="1.2" />
      {open && <circle cx="35" cy="30" r="6" fill={glow} opacity=".8" />}
    </svg>
  );
}

export function MapScreen() {
  const me = useMe()!;
  const nav = useNavigate();
  const start = useBattle((s) => s.start);
  const openChest = useStore((s) => s.openChest);
  const [sel, setSel] = useState<PathNode | null>(null);
  const [chestReward, setChestReward] = useState<{ xp: number; gold: number; gems: number } | null>(null);
  const cur = currentNode(me);
  const curRef = useRef<HTMLButtonElement>(null);
  const stars = totalStars(me);
  const maxStars = WORLDS.reduce((a, w) => a + worldStars(me, w).max, 0);

  useEffect(() => {
    const t = setTimeout(() => curRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
    return () => clearTimeout(t);
  }, []);

  function fight(n: PathNode) {
    const w = WORLDS.find((x) => x.id === n.worldId)!;
    start({
      mode: 'dungeon',
      exercise: n.exercise!,
      durationS: n.durationS!,
      bossHp: n.hp,
      pathNodeId: n.id,
      dungeonId: n.kind === 'boss' ? w.id : undefined,
      ranked: true,
      opponent: {
        id: n.id, name: n.name, country: '', elo: 0, arenaPoints: 0, level: 0, wins: 0, losses: 0,
        kind: 'boss', color: n.kind === 'boss' ? '#ef4444' : w.glow, tier: w.name, icon: n.icon, timeline: [],
      },
    });
    nav('/battle');
  }

  const selWorld = sel ? WORLDS.find((w) => w.id === sel.worldId)! : null;

  return (
    <div className="path-page">
      <div className="path-top">
        <div>
          <div className="eyebrow caps muted" style={{ fontSize: 11 }}>Story-Modus</div>
          <div className="display" style={{ fontSize: 24, letterSpacing: '.06em' }}>TRAININGSPFAD</div>
        </div>
        <div className="spacer" />
        <div className="currency gold"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.5 4.5 2 7.5L12 17l-6.5 4 2-7.5L2 9h7z" fill="#ffd23f" /></svg> {stars} / {maxStars}</div>
        {cur && <button className="btn btn-ghost btn-sm" onClick={() => curRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Zur Station</button>}
      </div>

      {WORLDS.map((w, wi) => {
        const H = worldHeight(w);
        const ws = worldStars(me, w);
        const worldOpen = isUnlocked(me, w.nodes[0]);
        const pts = w.nodes.map((_, i) => [xOf(wi, i), yOf(i)] as const);
        const seg = (i: number) => {
          const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
          const my = (y1 + y2) / 2;
          return `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`;
        };
        const bossBeaten = me.dungeonsCleared.includes(w.id);
        const next = WORLDS[wi + 1];
        return (
          <Fragment key={w.id}>
            <section className={`world ${worldOpen ? '' : 'world-locked'}`} style={{ height: H, background: `radial-gradient(ellipse at 50% 0%, ${w.glow}22, transparent 55%), linear-gradient(180deg, ${w.sky}, ${w.ground})` }}>
              <Scenery theme={w.theme} glow={w.glow} height={H} seed={wi + 3} />
              <div className="world-inner" style={{ height: H }}>

              {/* Welten-Banner */}
              <div className="world-banner" style={{ borderColor: `${w.glow}66`, boxShadow: `0 20px 50px -25px ${w.glow}` }}>
                <div className="world-num" style={{ background: w.glow }}>{wi + 1}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="display" style={{ fontSize: 24 }}>{w.name}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{w.tagline}</div>
                  <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {[...new Set(w.nodes.filter((n) => n.exercise).map((n) => n.exercise!))].map((e) => (
                      <span key={e} className="pill" style={{ background: `${w.glow}22`, color: w.glow }}>{EXERCISES[e].name}</span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="display" style={{ fontSize: 18, color: '#ffd23f' }}>★ {ws.got}/{ws.max}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Boss: {w.dungeon.boss}</div>
                </div>
              </div>

              {/* Pfad */}
              <svg className="path-svg" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" style={{ height: H }}>
                {pts.slice(0, -1).map((_, i) => (
                  <path key={`b${i}`} d={seg(i)} fill="none" stroke="rgba(0,0,0,.45)" strokeWidth="22" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                ))}
                {pts.slice(0, -1).map((_, i) => {
                  const done = isCleared(me, w.nodes[i]);
                  return (
                    <path key={`p${i}`} d={seg(i)} fill="none" stroke={done ? w.glow : '#3a3e52'} strokeWidth={done ? 9 : 6}
                      strokeDasharray={done ? undefined : '2 14'} strokeLinecap="round" vectorEffect="non-scaling-stroke"
                      style={done ? { filter: `drop-shadow(0 0 6px ${w.glow})` } : undefined} />
                  );
                })}
              </svg>

              {/* Stationen */}
              {w.nodes.map((n, i) => {
                const done = isCleared(me, n);
                const open = isUnlocked(me, n);
                const isCur = cur?.id === n.id;
                const st = starsOf(me, n);
                const cls = `pnode ${n.kind} ${done ? 'done' : open ? 'open' : 'locked'} ${isCur ? 'current' : ''}`;
                return (
                  <button key={n.id} ref={isCur ? curRef : undefined} className={cls}
                    style={{ left: `${pts[i][0]}%`, top: pts[i][1], ['--glow' as string]: w.glow }}
                    onClick={() => (open ? setSel(n) : toast(n.kind === 'boss' || i > 0 ? 'Schließe zuerst die vorherige Station ab' : `Besiege zuerst ${WORLDS[wi - 1]?.dungeon.boss}`))}>
                    {isCur && (
                      <div className="pnode-me">
                        <Avatar src={me.avatar} name={me.name} size={34} ring={w.glow} />
                        <span style={{ background: w.glow }}>{n.kind === 'chest' ? 'ÖFFNEN' : 'LOS!'}</span>
                      </div>
                    )}
                    {n.kind === 'chest' ? (
                      <Chest open={done} glow={w.glow} size={74} />
                    ) : (
                      <div className="pnode-stone">
                        <div className="pnode-side" />
                        <div className="pnode-top">
                          <Icon name={open ? n.icon : 'lock'} size={n.kind === 'boss' ? 40 : 28} color={done || open ? '#fff' : '#6b7085'} />
                        </div>
                      </div>
                    )}
                    {n.kind !== 'chest' && done && <Stars n={st} />}
                    {n.kind === 'boss' && <div className="boss-plate" style={{ borderColor: w.glow }}>{n.name}</div>}
                    {n.kind === 'fight' && open && !done && <div className="pnode-label">{n.name}</div>}
                  </button>
                );
              })}

              {/* Portal zur nächsten Welt */}
              {next && (
                <div className={`portal ${bossBeaten ? 'portal-open' : ''}`} style={{ ['--glow' as string]: next.glow }}>
                  <svg width="120" height="80" viewBox="0 0 120 80">
                    <path d="M14 78V40a46 38 0 0 1 92 0v38" fill="none" stroke="#2a2d3a" strokeWidth="12" />
                    <path d="M14 78V40a46 38 0 0 1 92 0v38" fill="none" stroke={bossBeaten ? next.glow : '#4b4f63'} strokeWidth="4" />
                    <path d="M24 78V42a36 30 0 0 1 72 0v36z" fill={bossBeaten ? next.glow : '#16171f'} opacity={bossBeaten ? 0.35 : 0.9} />
                  </svg>
                  <div className="caps" style={{ fontSize: 11, color: bossBeaten ? next.glow : 'var(--muted)' }}>
                    {bossBeaten ? `Portal nach ${next.name} offen` : `Besiege ${w.dungeon.boss}, um das Portal zu öffnen`}
                  </div>
                </div>
              )}
              </div>
            </section>
          </Fragment>
        );
      })}

      {/* Stations-Details */}
      {sel && selWorld && sel.kind !== 'chest' && (
        <Sheet title={sel.kind === 'boss' ? 'BOSSKAMPF' : 'STATION'} onClose={() => setSel(null)}>
          <div className="row" style={{ gap: 16 }}>
            <div className="station-ico" style={{ background: `${sel.kind === 'boss' ? '#ef4444' : selWorld.glow}22`, color: sel.kind === 'boss' ? '#ef4444' : selWorld.glow }}>
              <Icon name={sel.icon} size={40} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="display" style={{ fontSize: 24 }}>{sel.name}</div>
              <div className="muted">{selWorld.name} · Station {sel.index + 1} von 6</div>
            </div>
            {isCleared(me, sel) && <Stars n={starsOf(me, sel)} size={22} />}
          </div>
          <div className="stat-grid four" style={{ marginTop: 16 }}>
            <div className="mini"><div className="l">Übung</div><div className="v" style={{ fontSize: 18 }}>{EXERCISES[sel.exercise!].name}</div></div>
            <div className="mini"><div className="l">Leben</div><div className="v red" style={{ fontSize: 22 }}>{sel.hp! * 100}</div><div className="s">≈ {sel.hp} {EXERCISES[sel.exercise!].unit}</div></div>
            <div className="mini"><div className="l">Zeit</div><div className="v" style={{ fontSize: 22 }}>{sel.durationS}s</div></div>
            <div className="mini"><div className="l">Belohnung</div><div className="v" style={{ fontSize: 20 }}>+{sel.xp} XP</div><div className="s ico-inline"><Gold size={12} /> {sel.gold}{sel.gems > 0 && <> · <Gems size={12} /> {sel.gems}</>}</div></div>
          </div>
          <div className="card" style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6 }}>
            <b>Sterne:</b> <span className="muted">Besiege das Monster schnell – ★★★ mit mindestens 40 % Restzeit, ★★ mit 15 %, ★ wenn es knapp wird. Pausen über 3 s lassen es heilen.</span>
          </div>
          <button className="btn btn-primary solid" style={{ marginTop: 16 }} onClick={() => { const n = sel; setSel(null); fight(n); }}>
            <Icon name="swords" size={20} /> {isCleared(me, sel) ? 'Erneut kämpfen' : 'Kampf starten'}
          </button>
        </Sheet>
      )}

      {/* Schatzkiste */}
      {sel && selWorld && sel.kind === 'chest' && (
        <Sheet title="SCHATZKISTE" onClose={() => { setSel(null); setChestReward(null); }}>
          <div style={{ display: 'grid', placeItems: 'center', gap: 14, padding: '10px 0 6px' }}>
            <div className={chestReward ? 'chest-pop' : ''}><Chest open={isCleared(me, sel)} glow={selWorld.glow} size={140} /></div>
            {chestReward ? (
              <div className="row" style={{ gap: 18, fontFamily: 'var(--display)', fontWeight: 900, fontSize: 20 }}>
                <span className="blue">+{chestReward.xp} XP</span>
                <span className="gold ico-inline"><Gold size={20} /> +{chestReward.gold}</span>
                <span className="ico-inline" style={{ color: '#60a5fa' }}><Gems size={20} /> +{chestReward.gems}</span>
              </div>
            ) : isCleared(me, sel) ? (
              <div className="muted">Diese Kiste hast du schon geöffnet.</div>
            ) : (
              <button className="btn btn-gold" onClick={() => { const r = openChest(sel.id); if (r) setChestReward(r); }}>Kiste öffnen</button>
            )}
          </div>
        </Sheet>
      )}
    </div>
  );
}
