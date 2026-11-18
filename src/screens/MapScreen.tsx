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
import { Art } from '../components/Art';
import { artIdForNode } from '../lib/art';
import { Gems, Gold, MyAvatar, Sheet, toast } from '../components/ui';
import { Backdrop, Particles, Scenery } from '../components/Scenery';

const HEADER = 330;
const GAP = 150;
const FOOT = 260;

/** Horizontale Lage einer Station (Prozent), schlängelnd je Welt */
const xOf = (w: number, i: number) => 50 + Math.sin(i * 1.15 + w * 1.7) * 26;
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const yOf = (i: number) => HEADER + 40 + i * GAP;
const worldHeight = (w: World) => yOf(w.nodes.length - 1) + FOOT + 40;

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <div className="pnode-stars">
      {[0, 1, 2].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" style={{ transform: i === 1 ? 'translateY(-3px)' : undefined }}>
          <path d="M12 2l3 7h7l-5.5 4.5 2 7.5L12 17l-6.5 4 2-7.5L2 9h7z" fill={i < n ? '#ffd23f' : '#34302a'} stroke={i < n ? '#8a5a00' : '#4a443b'} strokeWidth="1.2" />
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

  // Parallax: Bergketten verschieben sich beim Scrollen unterschiedlich stark
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      document.querySelectorAll<HTMLElement>('.world').forEach((el) => {
        const top = el.getBoundingClientRect().top;
        if (top > window.innerHeight || top < -el.offsetHeight) return;
        el.querySelectorAll<SVGElement>('.ridge').forEach((r) => {
          const depth = Number(r.dataset.depth ?? 0.2);
          r.style.transform = `translateY(${(-top * depth).toFixed(1)}px)`;
        });
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
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
        {cur && <button className="btn btn-ghost btn-sm" onClick={() => curRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Zu mir</button>}
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
        const full = pts.slice(0, -1).map((_, i) => seg(i)).join(' ');
        const bossBeaten = me.dungeonsCleared.includes(w.id);
        const next = WORLDS[wi + 1];
        return (
          <Fragment key={w.id}>
            <section className={`world ${worldOpen ? '' : 'world-locked'}`} style={{ height: H, ['--glow' as string]: w.glow, background: `radial-gradient(ellipse at 50% 18%, ${w.glow}26, transparent 60%), linear-gradient(180deg, ${w.sky} 0%, color-mix(in srgb, ${w.sky} 60%, ${w.ground}) 40%, ${w.ground} 100%)` }}>
              <Backdrop theme={w.theme} sky={w.sky} glow={w.glow} seed={wi + 1} />
              <Particles theme={w.theme} glow={w.glow} height={H} seed={wi + 1} />
              <Scenery theme={w.theme} glow={w.glow} height={H} seed={wi + 3} />
              <div className="world-inner" style={{ height: H }}>

              {/* Kinoreifer Welttitel */}
              <Art id={`world-${w.id}`} className="world-art" fallback={null} />
              <div className="world-title">
                <div className="chapter" style={{ color: w.glow }}>KAPITEL {ROMAN[wi]}</div>
                <h2 className="world-name" style={{ backgroundImage: `linear-gradient(180deg, #fff 20%, ${w.glow})`, filter: `drop-shadow(0 0 18px ${w.glow}aa)` }}>{w.name.toUpperCase()}</h2>
                <div className="world-tag">{w.tagline}</div>
                <div className="row" style={{ justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <span className="wt-pill" style={{ borderColor: '#ffd23f88', color: '#ffd23f' }}>★ {ws.got} / {ws.max}</span>
                  <span className="wt-pill" style={{ borderColor: '#ef444488', color: '#fca5a5' }}><Icon name="skull" size={13} /> {w.dungeon.boss}</span>
                  {[...new Set(w.nodes.filter((n) => n.exercise).map((n) => n.exercise!))].map((e) => (
                    <span key={e} className="wt-pill" style={{ borderColor: `${w.glow}66`, color: w.glow }}>{EXERCISES[e].name}</span>
                  ))}
                </div>
              </div>

              {/* Steinstraße mit fließendem Licht */}
              <svg className="path-svg" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" style={{ height: H }}>
                <path d={full} fill="none" stroke="rgba(0,0,0,.55)" strokeWidth="44" strokeLinecap="round" vectorEffect="non-scaling-stroke" transform="translate(0 6)" />
                <path d={full} fill="none" style={{ stroke: `color-mix(in srgb, ${w.glow} 18%, #1c1a17)` }} strokeWidth="38" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <path d={full} fill="none" style={{ stroke: `color-mix(in srgb, ${w.glow} 10%, #4a443b)` }} strokeWidth="30" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <path d={full} fill="none" stroke="#24211c" strokeWidth="30" strokeDasharray="2 17" vectorEffect="non-scaling-stroke" />
                <path d={full} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="22" strokeLinecap="round" vectorEffect="non-scaling-stroke" transform="translate(0 -2)" />
                {pts.slice(0, -1).map((_, i) => {
                  const done = isCleared(me, w.nodes[i]);
                  if (!done) return <path key={`l${i}`} d={seg(i)} fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="30" vectorEffect="non-scaling-stroke" />;
                  return (
                    <g key={`p${i}`}>
                      <path d={seg(i)} fill="none" stroke={w.glow} strokeOpacity=".22" strokeWidth="34" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                      <path d={seg(i)} fill="none" stroke={w.glow} strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 0 6px ${w.glow})` }} />
                      <path className="flow" d={seg(i)} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 26" vectorEffect="non-scaling-stroke" />
                    </g>
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
                    {(open || done) && <div className="pnode-aura" />}
                    {isCur && (
                      <div className="pnode-me">
                        <MyAvatar size={38} ring={w.glow} />
                        <span style={{ background: w.glow }}>{n.kind === 'chest' ? 'ÖFFNEN' : n.kind === 'boss' ? 'BOSS!' : 'LOS!'}</span>
                      </div>
                    )}
                    {isCur && n.kind !== 'boss' && (
                      <svg className="rune-ring" viewBox="0 0 120 120" width="128" height="128">
                        <circle cx="60" cy="60" r="54" fill="none" stroke={w.glow} strokeWidth="1.5" strokeDasharray="4 6" />
                        <circle cx="60" cy="60" r="46" fill="none" stroke={w.glow} strokeOpacity=".5" strokeWidth="1" />
                        {Array.from({ length: 8 }, (_, k) => {
                          const a = (k * Math.PI) / 4;
                          return <path key={k} d={`M${60 + Math.cos(a) * 50} ${60 + Math.sin(a) * 50}l3 -3 3 3 -3 3z`} fill={w.glow} />;
                        })}
                      </svg>
                    )}
                    {n.kind === 'chest' ? (
                      <div className="chest-wrap">
                        {open && !done && <div className="chest-rays" style={{ background: `repeating-conic-gradient(${w.glow}55 0 10deg, transparent 10deg 30deg)` }} />}
                        <Chest open={done} glow={w.glow} size={84} />
                      </div>
                    ) : n.kind === 'boss' ? (
                      <div className="boss-node">
                        {open && <div className="boss-aura" />}
                        <svg className="boss-frame" viewBox="0 0 160 160" width="150" height="150">
                          <defs>
                            <radialGradient id={`bf${wi}`} cx="50%" cy="40%" r="60%">
                              <stop offset="0" stopColor={open ? '#ff8a6a' : '#5c564d'} />
                              <stop offset=".6" stopColor={open ? '#b91c1c' : '#34302a'} />
                              <stop offset="1" stopColor={open ? '#2a0303' : '#111218'} />
                            </radialGradient>
                          </defs>
                          {/* Hörner */}
                          <path d="M44 52C28 44 20 26 24 6c8 14 18 22 32 28zM116 52c16-8 24-26 20-46-8 14-18 22-32 28z" fill={open ? '#e7d3a8' : '#4a443b'} stroke="#000" strokeOpacity=".5" strokeWidth="2" />
                          {/* Zackenkranz */}
                          <polygon points={Array.from({ length: 28 }, (_, k) => { const a = (k * Math.PI) / 14; const r = k % 2 ? 58 : 70; return `${80 + Math.cos(a) * r},${84 + Math.sin(a) * r}`; }).join(' ')} fill={open ? '#3a0a06' : '#1d1b18'} stroke={open ? '#ef4444' : '#4a443b'} strokeWidth="2" />
                          <circle cx="80" cy="84" r="52" fill={`url(#bf${wi})`} stroke={open ? '#fca5a5' : '#5c564d'} strokeWidth="3" />
                          <circle cx="80" cy="84" r="44" fill="none" stroke="#000" strokeOpacity=".35" strokeWidth="4" />
                        </svg>
                        <div className="boss-face">
                          {open ? <Art id={artIdForNode(n.id)} size={86} style={{ borderRadius: '50%' }} fallback={<Icon name={n.icon} size={54} color="#fff" />} /> : <Icon name="lock" size={54} color="#7a7368" />}
                        </div>
                        <div className="boss-tag">BOSS</div>
                      </div>
                    ) : (
                      <div className="pnode-stone">
                        <div className="pnode-side" />
                        <div className="pnode-top">
                          <div className="pnode-inner">
                            {open ? <Art id={artIdForNode(n.id)} size={52} fallback={<Icon name={n.icon} size={32} color="#fff" />} /> : <Icon name="lock" size={32} color="#7a7368" />}
                          </div>
                        </div>
                      </div>
                    )}
                    {n.kind !== 'chest' && done && <Stars n={st} size={n.kind === 'boss' ? 20 : 16} />}
                    {n.kind === 'boss' && <div className="boss-plate" style={{ borderColor: '#ef4444' }}>{n.name}</div>}
                    {n.kind === 'fight' && open && !done && <div className="pnode-label">{n.name}</div>}
                  </button>
                );
              })}

              {/* Wirbelndes Portal zur nächsten Welt */}
              {next && (
                <div className={`portal ${bossBeaten ? 'portal-open' : ''}`} style={{ ['--glow' as string]: next.glow }}>
                  <div className="portal-gate">
                    <div className="portal-vortex" style={{ background: bossBeaten ? `conic-gradient(from 0deg, ${next.glow}, transparent 25%, ${next.glow}aa 40%, transparent 60%, ${next.glow} 80%, transparent)` : 'radial-gradient(circle, #1d1b18, #07070a)' }} />
                    <svg viewBox="0 0 180 150" width="180" height="150" className="portal-arch">
                      <path d="M22 148V70a68 62 0 0 1 136 0v78" fill="none" stroke="#1a1814" strokeWidth="22" />
                      <path d="M22 148V70a68 62 0 0 1 136 0v78" fill="none" stroke={bossBeaten ? next.glow : '#5c564d'} strokeWidth="5" />
                      {Array.from({ length: 9 }, (_, k) => {
                        const a = Math.PI + (k * Math.PI) / 8;
                        return <rect key={k} x={90 + Math.cos(a) * 68 - 5} y={70 + Math.sin(a) * 62 - 5} width="10" height="10" transform={`rotate(45 ${90 + Math.cos(a) * 68} ${70 + Math.sin(a) * 62})`} fill={bossBeaten ? next.glow : '#4a443b'} />;
                      })}
                      {!bossBeaten && <path d="M58 100h64M58 116h64M70 92v34M110 92v34" stroke="#5c564d" strokeWidth="4" strokeLinecap="round" />}
                    </svg>
                  </div>
                  <div className="caps portal-text" style={{ color: bossBeaten ? next.glow : 'var(--muted)' }}>
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
              <Art id={artIdForNode(sel.id)} size={72} style={{ borderRadius: 20 }} fallback={<Icon name={sel.icon} size={40} />} />
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
                <span className="ico-inline" style={{ color: '#4CC9F0' }}><Gems size={20} /> +{chestReward.gems}</span>
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
