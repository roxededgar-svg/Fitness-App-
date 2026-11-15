import { useId, type ReactNode } from 'react';
import { iconFilled, iconPath } from './Icon';
import { RankEmblem, tierPalette } from './RankEmblem';
import type { Badge } from '../lib/badges';
import type { Tier } from '../lib/progression';
import { TIER_PACE } from '../lib/pace';
import { METALS, styleFor, svgPoints, type BadgeStyle, type Pattern } from '../lib/badgeStyles';

const useSvgId = () => useId().replace(/[^a-zA-Z0-9]/g, '');
const C = 100; // Mittelpunkt im 200er-Raster

/** Symbol direkt als SVG-Pfad (zuverlässig auch in Safari-3D) */
function Glyph({ name, size, color = '#fff', width = 2.2, cx = C, cy = C }: { name: string; size: number; color?: string; width?: number; cx?: number; cy?: number }) {
  const k = size / 24;
  const filled = iconFilled(name);
  return (
    <g transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${k})`}>
      <path d={iconPath(name)} fill={filled ? color : 'none'} stroke={filled ? 'none' : color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fillRule="evenodd" />
    </g>
  );
}

/** Hintergrundmuster der Innenfläche */
function PatternLayer({ p, color }: { p: Pattern; color: string }) {
  const els: ReactNode[] = [];
  switch (p) {
    case 'rays':
      for (let i = 0; i < 24; i++) {
        const a1 = (i * Math.PI * 2) / 24, a2 = a1 + Math.PI / 24;
        els.push(<path key={i} d={`M${C} ${C}L${C + Math.cos(a1) * 150} ${C + Math.sin(a1) * 150}L${C + Math.cos(a2) * 150} ${C + Math.sin(a2) * 150}z`} fill={color} opacity={0.13} />);
      }
      break;
    case 'burst':
      els.push(<polygon key="b" points={Array.from({ length: 36 }, (_, i) => { const a = (i * Math.PI) / 18; const r = i % 2 ? 40 : 95; return `${C + Math.cos(a) * r},${C + Math.sin(a) * r}`; }).join(' ')} fill={color} opacity={0.22} />);
      els.push(<circle key="c" cx={C} cy={C} r={58} fill={color} opacity={0.12} />);
      break;
    case 'rings':
      for (let r = 18; r < 130; r += 14) els.push(<circle key={r} cx={C} cy={C} r={r} fill="none" stroke={color} strokeWidth={r % 28 === 4 ? 5 : 1.5} opacity={0.2} />);
      break;
    case 'stripes':
      for (let x = -200; x < 400; x += 18) els.push(<line key={x} x1={x} y1={0} x2={x + 200} y2={200} stroke={color} strokeWidth={7} opacity={0.14} />);
      break;
    case 'dots':
      for (let y = 10; y < 200; y += 16) for (let x = (y / 16) % 2 ? 18 : 10; x < 200; x += 16) els.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={2.4} fill={color} opacity={0.3} />);
      break;
    case 'chevrons':
      for (let y = -10; y < 220; y += 22) els.push(<path key={y} d={`M0 ${y + 20}L${C} ${y}L200 ${y + 20}`} fill="none" stroke={color} strokeWidth={6} opacity={0.15} />);
      break;
    case 'waves':
      for (let y = 10; y < 210; y += 16) els.push(<path key={y} d={`M0 ${y} Q25 ${y - 9} 50 ${y} T100 ${y} T150 ${y} T200 ${y}`} fill="none" stroke={color} strokeWidth={3} opacity={0.2} />);
      break;
    case 'grid':
      for (let i = -200; i < 400; i += 20) {
        els.push(<line key={`a${i}`} x1={i} y1={0} x2={i + 200} y2={200} stroke={color} strokeWidth={1.4} opacity={0.2} />);
        els.push(<line key={`b${i}`} x1={i} y1={200} x2={i + 200} y2={0} stroke={color} strokeWidth={1.4} opacity={0.2} />);
      }
      break;
  }
  return <>{els}</>;
}

function Sparkle({ x, y, s, color }: { x: number; y: number; s: number; color: string }) {
  return <path d={`M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z`} fill={color} />;
}

/** Metallverlauf mit mehreren Glanzstellen */
function MetalGradient({ id, st, flip = false }: { id: string; st: BadgeStyle; flip?: boolean }) {
  const m = METALS[st.metal];
  return (
    <linearGradient id={id} x1={flip ? '1' : '0'} y1="0" x2={flip ? '0' : '1'} y2="1">
      <stop offset="0" stopColor={m[1]} />
      <stop offset=".22" stopColor={m[0]} />
      <stop offset=".45" stopColor={m[2]} />
      <stop offset=".62" stopColor={m[1]} />
      <stop offset=".8" stopColor={m[0]} />
      <stop offset="1" stopColor={m[3]} />
    </linearGradient>
  );
}

/** Vorderseite einer Abzeichen-Medaille – eigene Form, mehrfarbig, Metallrand, Muster, Band */
export function BadgeFront({ badge, earned }: { badge: Badge; earned: boolean }) {
  const st = styleFor(badge.id);
  const m = METALS[st.metal];
  const id = useSvgId();
  const outer = svgPoints(st.shape);
  const bevel = svgPoints(st.shape, 200, 0.93);
  const innerEdge = svgPoints(st.shape, 200, 0.87);
  const inner = svgPoints(st.shape, 200, 0.85);
  const [c0, c1, c2] = st.colors;
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ display: 'block', overflow: 'visible', filter: earned ? undefined : 'grayscale(1) brightness(.55)' }}>
      <defs>
        <MetalGradient id={`${id}m`} st={st} />
        <radialGradient id={`${id}b`} cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor={c0} />
          <stop offset=".5" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </radialGradient>
        <radialGradient id={`${id}g`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={st.accent} stopOpacity=".55" />
          <stop offset="1" stopColor={st.accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".45" />
          <stop offset=".45" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={st.accent} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
        <clipPath id={`${id}c`}><polygon points={inner} /></clipPath>
      </defs>

      {/* Metallrand mit Fase */}
      <polygon points={outer} fill={`url(#${id}m)`} stroke={m[3]} strokeWidth="2" strokeLinejoin="round" />
      <polygon points={bevel} fill="none" stroke={m[0]} strokeOpacity=".7" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points={innerEdge} fill={m[3]} />

      {/* Innenfläche mit Muster */}
      <polygon points={inner} fill={`url(#${id}b)`} />
      <g clipPath={`url(#${id}c)`}>
        <PatternLayer p={st.pattern} color={st.accent} />
        <circle cx={C} cy={C - 4} r="62" fill={`url(#${id}g)`} />
        <polygon points={inner} fill={`url(#${id}s)`} />
      </g>

      {/* Medaillon mit Symbol */}
      <circle cx={C} cy={C - 6} r="40" fill={c2} fillOpacity=".55" stroke={st.accent} strokeWidth="2.5" />
      <circle cx={C} cy={C - 6} r="46" fill="none" stroke={m[0]} strokeOpacity=".55" strokeWidth="1" strokeDasharray="2 4" />
      <g style={{ filter: `drop-shadow(0 0 6px ${st.accent})` }}>
        <Glyph name={earned ? badge.icon : 'lock'} size={50} cy={C - 6} color="rgba(0,0,0,.45)" width={3.2} cx={C + 1.5} />
        <Glyph name={earned ? badge.icon : 'lock'} size={50} cy={C - 8} color="#fff" width={2.4} />
      </g>

      {/* Band mit Namen */}
      {st.ribbon ? (
        <g>
          <path d="M34 150h-14l8-9-8-9h14z M166 150h14l-8-9 8-9h-14z" fill={st.accent} stroke={m[3]} strokeWidth="1.2" strokeLinejoin="round" opacity=".9" />
          <path d="M30 132h140v20H30z" fill={`url(#${id}r)`} stroke={m[3]} strokeWidth="1.5" />
          <path d="M30 132h140" stroke="#fff" strokeOpacity=".5" />
          <text x={C} y="146.5" textAnchor="middle" fontSize="11" fontWeight="900" letterSpacing="1.6" fill="#fff" style={{ fontFamily: 'var(--display)', paintOrder: 'stroke' }} stroke="rgba(0,0,0,.45)" strokeWidth="2.5">
            {badge.name.toUpperCase().slice(0, 18)}
          </text>
        </g>
      ) : (
        <g>
          {[[52, 46, 5], [150, 58, 4], [142, 132, 3.5], [60, 140, 3]].map(([x, y, s], i) => <Sparkle key={i} x={x} y={y} s={s} color="#fff" />)}
        </g>
      )}
    </svg>
  );
}

const fmtDay = (ts: number) => new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
const fmtYear = (ts: number) => String(new Date(ts).getFullYear());

/** Rückseite: gebürstetes Metall mit eingebrannter Brandmarke und Datum */
export function BadgeBack({ badge, earnedAt }: { badge: Badge; earnedAt?: number }) {
  const st = styleFor(badge.id);
  const m = METALS[st.metal];
  const id = useSvgId();
  const outer = svgPoints(st.shape);
  const inner = svgPoints(st.shape, 200, 0.86);
  const ring = 'VITALIS · RISE OF LEGENDS · TRAINIERE · KÄMPFE · ';
  const ringLen = 2 * Math.PI * 47 - 3; // Text genau einmal um den Kreis verteilen
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ display: 'block' }}>
      <defs>
        <MetalGradient id={`${id}m`} st={st} flip />
        <linearGradient id={`${id}d`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={m[2]} />
          <stop offset=".5" stopColor={m[3]} />
          <stop offset="1" stopColor={m[2]} />
        </linearGradient>
        <radialGradient id={`${id}burn`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#2a1206" />
          <stop offset=".6" stopColor="#170802" />
          <stop offset=".86" stopColor="#0b0401" />
          <stop offset=".95" stopColor="#5a2306" />
          <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
        </radialGradient>
        {/* unregelmäßiger, verkohlter Rand */}
        <filter id={`${id}scorch`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" seed={badge.id.length * 7} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* glühende, eingebrannte Schrift */}
        <filter id={`${id}glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <clipPath id={`${id}c`}><polygon points={inner} /></clipPath>
        <path id={`${id}arc`} d={`M${C} ${C}m-47 0a47 47 0 1 1 94 0a47 47 0 1 1-94 0`} />
      </defs>

      <polygon points={outer} fill={`url(#${id}m)`} stroke={m[3]} strokeWidth="2" strokeLinejoin="round" />
      <polygon points={inner} fill={`url(#${id}d)`} />
      {/* gebürstete Struktur */}
      <g clipPath={`url(#${id}c)`} opacity=".18">
        {Array.from({ length: 50 }, (_, i) => <line key={i} x1="0" y1={i * 4 + 1} x2="200" y2={i * 4 + 1} stroke={i % 3 ? '#fff' : '#000'} strokeWidth=".6" />)}
      </g>

      {earnedAt ? (
        <g>
          {/* Brandfleck */}
          <g filter={`url(#${id}scorch)`}>
            <circle cx={C} cy={C - 4} r="64" fill="#ff7a1a" opacity=".18" />
            <circle cx={C} cy={C - 4} r="60" fill={`url(#${id}burn)`} />
          </g>
          {/* Stempelringe */}
          <g filter={`url(#${id}glow)`} fill="none" stroke="#c2581b" strokeOpacity=".85">
            <circle cx={C} cy={C - 4} r="54" strokeWidth="1.8" />
            <circle cx={C} cy={C - 4} r="38" strokeWidth="1.2" strokeDasharray="3 3" />
          </g>
          <g transform="translate(0 -4)" filter={`url(#${id}glow)`}>
            <text fontSize="8" fontWeight="800" fill="#e07a2f" style={{ fontFamily: 'var(--display)' }}>
              <textPath href={`#${id}arc`} textLength={ringLen} lengthAdjust="spacing">{ring}</textPath>
            </text>
          </g>
          <g filter={`url(#${id}glow)`} textAnchor="middle" style={{ fontFamily: 'var(--display)' }}>
            <text x={C} y={C - 18} fontSize="7.5" letterSpacing="2.5" fill="#d9772f" fontWeight="800">ERREICHT</text>
            <text x={C} y={C + 4} fontSize="22" fontWeight="900" fill="#ffb066" stroke="#3a1504" strokeWidth=".8">{fmtDay(earnedAt)}</text>
            <text x={C} y={C + 18} fontSize="11" fontWeight="900" letterSpacing="3" fill="#ff9a4a">{fmtYear(earnedAt)}</text>
          </g>
        </g>
      ) : (
        <g textAnchor="middle" style={{ fontFamily: 'var(--display)' }}>
          <circle cx={C} cy={C - 4} r="54" fill="none" stroke={m[0]} strokeOpacity=".35" strokeWidth="1.5" strokeDasharray="4 5" />
          <text x={C} y={C - 2} fontSize="10" letterSpacing="2" fill={m[0]} fillOpacity=".7" fontWeight="800">NOCH NICHT</text>
          <text x={C} y={C + 12} fontSize="10" letterSpacing="2" fill={m[0]} fillOpacity=".7" fontWeight="800">ERREICHT</text>
        </g>
      )}

      {/* gravierter Name */}
      <text x={C} y="172" textAnchor="middle" fontSize="10" fontWeight="900" letterSpacing="1.5" fill="#000" fillOpacity=".5" style={{ fontFamily: 'var(--display)' }}>{badge.name.toUpperCase()}</text>
      <text x={C} y="171" textAnchor="middle" fontSize="10" fontWeight="900" letterSpacing="1.5" fill={m[0]} fillOpacity=".85" style={{ fontFamily: 'var(--display)' }}>{badge.name.toUpperCase()}</text>
    </svg>
  );
}

export function RankFront({ tier, division }: { tier: Tier; division?: string | null }) {
  const p = tierPalette(tier.id);
  return (
    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: `radial-gradient(circle at 35% 25%, ${p.mid}55, #0b0c12 75%)` }}>
      <div style={{ width: '74%', height: '74%' }}>
        <RankEmblem tier={tier} division={division} size="100%" glow={false} />
      </div>
    </div>
  );
}

export function RankBack({ tier }: { tier: Tier }) {
  const p = tierPalette(tier.id);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center', padding: '18%', background: `linear-gradient(180deg, ${p.mid}66, #0b0c12)`, fontFamily: 'var(--display)' }}>
      <div style={{ fontSize: '0.7em', letterSpacing: '.3em', opacity: 0.6 }}>RANG</div>
      <div style={{ fontWeight: 900, fontSize: '1.3em', lineHeight: 1.1 }}>{tier.name}</div>
      <div style={{ fontSize: '0.8em', opacity: 0.8 }}>ab {tier.min} Trophäen</div>
      <div style={{ fontSize: '0.8em', color: p.hi }}>Ziel-Tempo {TIER_PACE[tier.id]}/Min</div>
    </div>
  );
}
