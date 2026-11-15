import { iconFilled, iconPath } from './Icon';
import { RankEmblem, tierPalette } from './RankEmblem';
import type { Badge } from '../lib/badges';
import type { Tier } from '../lib/progression';
import { TIER_PACE } from '../lib/pace';

const HEX = '100,4 183,52 183,148 100,196 17,148 17,52';
const HEX_IN = '100,22 167,61 167,139 100,178 33,139 33,61';
/** Symbol direkt als SVG-Pfad (zuverlässig auch in Safari-3D) */
function Glyph({ name, x, y, size }: { name: string; x: number; y: number; size: number }) {
  const k = size / 24;
  const filled = iconFilled(name);
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.5))' }}>
      <path d={iconPath(name)} fill={filled ? '#fff' : 'none'} stroke={filled ? 'none' : '#fff'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fillRule="evenodd" />
    </g>
  );
}

function wrap(text: string, max: number) {
  const out: string[] = [];
  let line = '';
  for (const w of text.split(' ')) {
    if ((line + ' ' + w).trim().length > max && line) {
      out.push(line);
      line = w;
    } else line = (line + ' ' + w).trim();
  }
  if (line) out.push(line);
  return out.slice(0, 3);
}

const fmtDate = (ts?: number) => (ts ? new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }) : '');

/** Vorderseite einer Abzeichen-Medaille */
export function BadgeFront({ badge, earned }: { badge: Badge; earned: boolean }) {
  const c = earned ? badge.color : '#6b7085';
  const id = `bf-${badge.id}-${earned ? 1 : 0}`;
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ display: 'block' }}>
      <defs>
        <radialGradient id={`${id}g`} cx="35%" cy="25%" r="85%">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".25" stopColor={c} />
          <stop offset="1" stopColor="#0b0c12" />
        </radialGradient>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".9" />
          <stop offset=".5" stopColor={c} />
          <stop offset="1" stopColor="#fff" stopOpacity=".5" />
        </linearGradient>
      </defs>
      <polygon points={HEX} fill={`url(#${id}g)`} />
      <polygon points={HEX} fill="none" stroke={`url(#${id}r)`} strokeWidth="8" />
      <polygon points={HEX_IN} fill="rgba(0,0,0,.18)" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1="100" y1="100" x2={100 + Math.cos((i * Math.PI) / 6) * 70} y2={100 + Math.sin((i * Math.PI) / 6) * 70} stroke="#fff" strokeOpacity=".05" strokeWidth="10" />
      ))}
      <Glyph name={earned ? badge.icon : 'lock'} x={66} y={56} size={68} />
      <text x="100" y="164" textAnchor="middle" fill="#fff" fillOpacity=".85" fontSize="11" fontWeight="800" letterSpacing="2.5" style={{ fontFamily: 'var(--display)', textTransform: 'uppercase' }}>
        {badge.name.toUpperCase()}
      </text>
    </svg>
  );
}

/** Rückseite mit Gravur: Name, Beschreibung, Datum */
export function BadgeBack({ badge, earnedAt }: { badge: Badge; earnedAt?: number }) {
  const c = earnedAt ? badge.color : '#6b7085';
  const id = `bb-${badge.id}`;
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c} stopOpacity=".55" />
          <stop offset="1" stopColor="#0b0c12" />
        </linearGradient>
      </defs>
      <polygon points={HEX} fill={`url(#${id}g)`} />
      <polygon points={HEX} fill="none" stroke={c} strokeWidth="8" strokeOpacity=".8" />
      <polygon points={HEX_IN} fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="1.5" strokeDasharray="3 4" />
      <g style={{ fontFamily: 'var(--display)' }} fill="#fff" textAnchor="middle">
        <text x="100" y="62" fontSize="9" letterSpacing="4" fillOpacity=".6">VITALIS</text>
        <text x="100" y="92" fontSize="15" fontWeight="900">{badge.name}</text>
        {wrap(badge.desc, 24).map((line, i) => (
          <text key={i} x="100" y={112 + i * 12} fontSize="9.5" fillOpacity=".75" style={{ fontFamily: 'var(--body)' }}>{line}</text>
        ))}
        <text x="100" y="152" fontSize="8.5" letterSpacing="1.5" fillOpacity=".8">{earnedAt ? `ERHALTEN ${fmtDate(earnedAt).toUpperCase()}` : 'NOCH GESPERRT'}</text>
      </g>
    </svg>
  );
}

/** Vorderseite eines Rang-Emblems als Medaille */
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
