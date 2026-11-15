import { useId, type ReactNode } from 'react';
import { rankFor, TIERS, type Tier } from '../lib/progression';

/**
 * Rang-Embleme – mehrfarbig mit Metallrahmen, Edelsteinen und eigenem Motiv:
 *  Rookie   – Bronzescheibe mit Nieten, Schiefer-Kern, Aufstiegspfeil
 *  Ember    – Eisenschild mit lodernder Flammenkrone und Rubin
 *  Steel    – Silberschild mit seitlichen Klingen, goldenen Winkeln, Saphir
 *  Crystal  – facettierter Kristall in Eis- und Violetttönen mit Splittern
 *  Storm    – geflügelter Schild, Blitz in Gelb-Weiß, Amethyst
 *  Mythic   – roter Flammenschein, goldene Hörner, Wappen mit Stern und Rubin
 *  Legend   – Strahlenkranz, goldener Lorbeer, Krone mit drei Edelsteinen
 */

interface Pal {
  frame: [string, string, string, string];
  body: [string, string, string];
  accent: [string, string, string];
  gem: string;
  glow: string;
}

const PAL: Record<string, Pal> = {
  rookie: { frame: ['#ffe2c4', '#d4894b', '#8a4c1f', '#2e1606'], body: ['#a9bdd2', '#4b5d73', '#141b26'], accent: ['#ffe2c4', '#e0954f', '#7a3f12'], gem: '#7dd3fc', glow: '#c08457' },
  ember: { frame: ['#e7e5e4', '#8b8178', '#3f3a36', '#0f0d0c'], body: ['#ffb36b', '#e8420c', '#3d0a02'], accent: ['#fff7c2', '#ffb020', '#ff3d00'], gem: '#ff2147', glow: '#f97316' },
  steel: { frame: ['#ffffff', '#cbd5e1', '#64748b', '#1e293b'], body: ['#94a3b8', '#334155', '#0b1220'], accent: ['#fff3b0', '#f5c242', '#9a6a08'], gem: '#3b82f6', glow: '#93c5fd' },
  crystal: { frame: ['#ffffff', '#bae6fd', '#38bdf8', '#0c4a6e'], body: ['#e0f7ff', '#38bdf8', '#4c1d95'], accent: ['#ffffff', '#c4b5fd', '#7c3aed'], gem: '#e0f2fe', glow: '#38bdf8' },
  storm: { frame: ['#f3e8ff', '#a78bfa', '#5b21b6', '#1e0b3d'], body: ['#818cf8', '#3730a3', '#0b0a26'], accent: ['#ffffff', '#fde047', '#f59e0b'], gem: '#c084fc', glow: '#a855f7' },
  mythic: { frame: ['#fff6c8', '#f5c242', '#a16207', '#3b2503'], body: ['#f87171', '#991b1b', '#120202'], accent: ['#ffffff', '#fecaca', '#ef4444'], gem: '#ff1744', glow: '#ef4444' },
  legend: { frame: ['#fffbe0', '#f5c242', '#b07a12', '#4a3205'], body: ['#fffdf0', '#ffd75e', '#c47f00'], accent: ['#fffbe0', '#f5b100', '#7a4a00'], gem: '#10b981', glow: '#f5b100' },
};

/** Facettierter Edelstein */
function Gem({ cx, cy, r, color, id }: { cx: number; cy: number; r: number; color: string; id: string }) {
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".35" stopColor={color} />
          <stop offset="1" stopColor="#000" stopOpacity=".85" />
        </radialGradient>
      </defs>
      <path d={`M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}z`} fill={`url(#${id})`} stroke="#000" strokeOpacity=".5" strokeWidth=".6" />
      <path d={`M${cx} ${cy - r}L${cx + r * 0.45} ${cy}L${cx} ${cy + r}L${cx - r * 0.45} ${cy}z M${cx - r} ${cy}H${cx + r}`} fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth=".5" />
      <circle cx={cx - r * 0.3} cy={cy - r * 0.35} r={r * 0.18} fill="#fff" opacity=".9" />
    </g>
  );
}

function Rivet({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="2.3" fill="#000" opacity=".45" />
      <circle cx={x - 0.3} cy={y - 0.3} r="1.9" fill="#fff" opacity=".85" />
    </g>
  );
}

function Design({ tier, u, p }: { tier: string; u: (k: string) => string; p: Pal }) {
  const F = `url(#${u('f')})`, B = `url(#${u('b')})`, A = `url(#${u('a')})`, S = `url(#${u('s')})`;
  const dark = p.frame[3];
  switch (tier) {
    case 'rookie':
      return (
        <>
          <circle cx="50" cy="48" r="42" fill={F} stroke={dark} strokeWidth="1.5" />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i * Math.PI) / 12;
            return <line key={i} x1={50 + Math.cos(a) * 38} y1={48 + Math.sin(a) * 38} x2={50 + Math.cos(a) * 41} y2={48 + Math.sin(a) * 41} stroke={dark} strokeWidth="1.2" opacity=".6" />;
          })}
          <circle cx="50" cy="48" r="34" fill={B} stroke={dark} strokeWidth="1.5" />
          <circle cx="50" cy="48" r="27" fill="none" stroke="#fff" strokeOpacity=".12" strokeWidth="4" />
          <path d="M50 26 70 50H59v16H41V50H30z" fill="#000" opacity=".35" transform="translate(1.5 2)" />
          <path d="M50 26 70 50H59v16H41V50H30z" fill={A} stroke={dark} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M50 30 63 46" stroke="#fff" strokeOpacity=".6" strokeWidth="1.5" strokeLinecap="round" />
          {[45, 135, 225, 315].map((d) => <Rivet key={d} x={50 + Math.cos((d * Math.PI) / 180) * 38} y={48 + Math.sin((d * Math.PI) / 180) * 38} />)}
          <ellipse cx="40" cy="30" rx="16" ry="7" fill={S} transform="rotate(-25 40 30)" />
        </>
      );
    case 'ember':
      return (
        <>
          <path d="M18 34C14 22 22 14 24 6c4 8 2 14 8 18 0-8 6-14 8-22 4 8 4 14 10 18 2-8 8-12 10-20 2 8 6 14 4 22 6-4 8-10 8-18 4 8 10 14 8 26z" fill={A} stroke="#7c1d06" strokeWidth="1" opacity=".95" />
          <path d="M50 14 84 24v24c0 21-15 35-34 44C31 83 16 69 16 48V24z" fill={F} stroke={dark} strokeWidth="1.5" />
          <path d="M50 20 78 28.5V48c0 17-12 29-28 37-16-8-28-20-28-37V28.5z" fill={B} stroke={dark} strokeWidth="1.2" />
          <path d="M50 20 78 28.5V36L50 27.5 22 36v-7.5z" fill="#fff" opacity=".12" />
          <path d="M50 30c4 9 15 13 15 26a15 15 0 0 1-30 0c0-7 5-11 8-15 0 5 2 8 5 8 0-9 2-13 2-19z" fill={A} stroke="#5a0f02" strokeWidth="1.2" />
          <path d="M50 46c2 5 7 7 7 13a7 7 0 0 1-14 0c0-4 3-6 4-8 1 3 2 4 3 4 0-4 0-6 0-9z" fill="#fffbe6" />
          <Gem cx={50} cy={80} r={5} color={p.gem} id={u('g1')} />
          <Rivet x={25} y={31} /><Rivet x={75} y={31} />
        </>
      );
    case 'steel':
      return (
        <>
          <path d="M22 40 2 30l10 18-8 12 22-6zM78 40l20-10-10 18 8 12-22-6z" fill={F} stroke={dark} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M50 8 84 18 80 54 50 92 20 54 16 18z" fill={F} stroke={dark} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M50 14 78 22.5 75 52 50 84 25 52 22 22.5z" fill={B} stroke={dark} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M50 14 78 22.5 76.5 36 50 27 23.5 36 22 22.5z" fill="#fff" opacity=".1" />
          <path d="M31 46 50 35l19 11v9L50 44 31 55zM31 61 50 50l19 11v9L50 59 31 70z" fill={A} stroke="#5a3d03" strokeWidth="1" strokeLinejoin="round" />
          <Gem cx={50} cy={25} r={5.5} color={p.gem} id={u('g1')} />
          <Rivet x={27} y={28} /><Rivet x={73} y={28} /><Rivet x={50} y={78} />
        </>
      );
    case 'crystal': {
      const facets: [string, string][] = [
        ['50,4 66,24 50,34', '#ffffff'], ['50,4 34,24 50,34', '#bae6fd'],
        ['66,24 82,32 70,58 50,34', '#7dd3fc'], ['34,24 18,32 30,58 50,34', '#38bdf8'],
        ['50,34 70,58 50,94', '#a78bfa'], ['50,34 30,58 50,94', '#6d28d9'],
        ['82,32 70,58 76,68', '#0ea5e9'], ['18,32 30,58 24,68', '#4c1d95'],
        ['70,58 76,68 50,94', '#7c3aed'], ['30,58 24,68 50,94', '#312e81'],
      ];
      return (
        <>
          <defs>
            <linearGradient id={u('cx')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#7dd3fc" /></linearGradient>
          </defs>
          <path d="M8 46l6-10 4 12-6 6zM92 46l-6-10-4 12 6 6zM14 74l6-4-1 8zM86 74l-6-4 1 8z" fill={A} stroke="#4c1d95" strokeWidth=".8" />
          <polygon points="50,0 86,30 80,70 50,98 20,70 14,30" fill={F} stroke={dark} strokeWidth="1.5" strokeLinejoin="round" />
          {facets.map(([pts, c], i) => <polygon key={i} points={pts} fill={c} stroke="#fff" strokeOpacity=".5" strokeWidth=".6" strokeLinejoin="round" />)}
          <path d="M50 22 60 38 50 56 40 38z" fill={`url(#${u('cx')})`} stroke="#fff" strokeWidth="1" />
          <path d="M44 12 38 24M56 12l6 12" stroke="#fff" strokeOpacity=".8" strokeWidth="1.2" strokeLinecap="round" />
        </>
      );
    }
    case 'storm':
      return (
        <>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <path d={`M30 ${34 + i * 9}C${16 - i * 3} ${26 + i * 9} ${4 - i * 2} ${30 + i * 11} 0 ${40 + i * 13}C10 ${38 + i * 10} 20 ${42 + i * 8} 30 ${46 + i * 8}z`} fill={F} stroke={dark} strokeWidth="1" />
              <path d={`M70 ${34 + i * 9}C${84 + i * 3} ${26 + i * 9} ${96 + i * 2} ${30 + i * 11} 100 ${40 + i * 13}C90 ${38 + i * 10} 80 ${42 + i * 8} 70 ${46 + i * 8}z`} fill={F} stroke={dark} strokeWidth="1" />
            </g>
          ))}
          <path d="M50 10 78 20v26c0 21-13 35-28 44C35 81 22 67 22 46V20z" fill={F} stroke={dark} strokeWidth="1.5" />
          <path d="M50 16 72 24v22c0 17-10 29-22 36-12-7-22-19-22-36V24z" fill={B} stroke={dark} strokeWidth="1.2" />
          <path d="M56 24 38 52h11l-5 26 20-32H53z" fill={A} stroke="#7a4a00" strokeWidth="1.2" strokeLinejoin="round" />
          <Gem cx={50} cy={19} r={4.5} color={p.gem} id={u('g1')} />
        </>
      );
    case 'mythic':
      return (
        <>
          <path d="M50 2C58 14 74 10 80 22c-6-2-10 0-12 4 10 2 18 10 18 22-6-6-12-6-16-4 6 8 6 20-2 30H28c-8-10-8-22-2-30-4-2-10-2-16 4 0-12 8-20 18-22-2-4-6-6-12-4C22 10 42 14 50 2z" fill="#ff3d00" opacity=".55" />
          <path d="M28 30C18 26 12 16 14 4c6 8 12 12 22 16zM72 30c10-4 16-14 14-26-6 8-12 12-22 16z" fill={F} stroke={dark} strokeWidth="1.2" />
          <path d="M50 18 82 30v18c0 21-15 34-32 42C33 82 18 69 18 48V30z" fill={F} stroke={dark} strokeWidth="1.5" />
          <path d="M50 24 76 34v14c0 17-12 28-26 35-14-7-26-18-26-35V34z" fill={B} stroke={dark} strokeWidth="1.2" />
          <path d="M50 34l4.2 10 10.8 1-8.2 7 2.5 10.6L50 57l-9.3 5.6 2.5-10.6-8.2-7 10.8-1z" fill={A} stroke="#7f1d1d" strokeWidth="1" strokeLinejoin="round" />
          <Gem cx={50} cy={50} r={4.2} color={p.gem} id={u('g1')} />
          <Rivet x={30} y={36} /><Rivet x={70} y={36} />
        </>
      );
    default: // legend
      return (
        <>
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i * Math.PI) / 8;
            const a1 = a - 0.09, a2 = a + 0.09;
            const R = i % 2 ? 46 : 52;
            return <path key={i} d={`M${50 + Math.cos(a1) * 30} ${54 + Math.sin(a1) * 30}L${50 + Math.cos(a) * R} ${54 + Math.sin(a) * R}L${50 + Math.cos(a2) * 30} ${54 + Math.sin(a2) * 30}z`} fill={F} opacity=".9" />;
          })}
          {Array.from({ length: 7 }, (_, i) => {
            const leaf = (deg: number, k: string) => {
              const r = (deg * Math.PI) / 180;
              const x = 50 + Math.cos(r) * 36, y = 54 - Math.sin(r) * 36;
              return <ellipse key={k} cx={x} cy={y} rx="7.5" ry="3.4" transform={`rotate(${-deg + 90} ${x} ${y})`} fill={F} stroke={dark} strokeWidth=".7" />;
            };
            return [leaf(160 + i * 18, `a${i}`), leaf(20 - i * 18, `b${i}`)];
          })}
          <circle cx="50" cy="54" r="27" fill={F} stroke={dark} strokeWidth="1.5" />
          <circle cx="50" cy="54" r="22" fill={B} stroke={dark} strokeWidth="1" />
          <path d="M50 40l4 8.4 9.2 1.1-6.8 6.3 1.8 9.1L50 60.3l-8.2 4.6 1.8-9.1-6.8-6.3 9.2-1.1z" fill="#fff" stroke="#b07a12" strokeWidth="1" strokeLinejoin="round" />
          <path d="M28 26 36 33 43 18 50 28 57 18 64 33 72 26 69 40H31z" fill={F} stroke={dark} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M31 36h38" stroke={dark} strokeWidth="1" />
          <Gem cx={43} cy={23} r={3} color="#ff1744" id={u('g1')} />
          <Gem cx={50} cy={31} r={3.6} color={p.gem} id={u('g2')} />
          <Gem cx={57} cy={23} r={3} color="#3b82f6" id={u('g3')} />
          <path d="M30 82h40l-4 6 4 6H30l4-6z" fill="#dc2626" stroke="#450a0a" strokeWidth="1" />
        </>
      );
  }
}

export function RankEmblem({ tier, division, size = 64, glow = true }: { tier: Tier; division?: string | null; size?: number | string; glow?: boolean }) {
  const p = PAL[tier.id] ?? PAL.rookie;
  const base = useId().replace(/[^a-zA-Z0-9]/g, '');
  const u = (k: string) => `${base}${k}`;
  const pips = division ? ['IV', 'III', 'II', 'I'].indexOf(division) + 1 : 0;
  const defs: ReactNode = (
    <defs>
      <linearGradient id={u('f')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={p.frame[1]} />
        <stop offset=".25" stopColor={p.frame[0]} />
        <stop offset=".5" stopColor={p.frame[2]} />
        <stop offset=".7" stopColor={p.frame[1]} />
        <stop offset="1" stopColor={p.frame[3]} />
      </linearGradient>
      <radialGradient id={u('b')} cx="40%" cy="30%" r="80%">
        <stop offset="0" stopColor={p.body[0]} />
        <stop offset=".55" stopColor={p.body[1]} />
        <stop offset="1" stopColor={p.body[2]} />
      </radialGradient>
      <linearGradient id={u('a')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={p.accent[0]} />
        <stop offset=".5" stopColor={p.accent[1]} />
        <stop offset="1" stopColor={p.accent[2]} />
      </linearGradient>
      <linearGradient id={u('s')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".55" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
  return (
    <svg width={size} height={size} viewBox="-4 -4 108 108" style={{ overflow: 'visible', filter: glow && typeof size === 'number' ? `drop-shadow(0 0 ${size / 9}px ${p.glow}77)` : undefined }} aria-label={tier.name}>
      {defs}
      <Design tier={tier.id} u={u} p={p} />
      {pips > 0 && (
        <g>
          {Array.from({ length: 4 }, (_, i) => {
            const x = 50 + (i - 1.5) * 9.5;
            const on = i < pips;
            return <path key={i} d={`M${x} 95l3.6 3.6-3.6 3.6-3.6-3.6z`} fill={on ? p.accent[1] : '#2a2d3a'} stroke={on ? p.accent[0] : '#555a6e'} strokeWidth=".9" />;
          })}
        </g>
      )}
    </svg>
  );
}

/** Emblem für eine Trophäen-Anzahl */
export function TrophyRank({ trophies, size = 64 }: { trophies: number; size?: number }) {
  const r = rankFor(trophies);
  return <RankEmblem tier={r.tier} division={r.division} size={size} />;
}

export const tierById = (id: string) => TIERS.find((t) => t.id === id) ?? TIERS[0];
/** Farben für Hintergründe/Ränder */
export const tierPalette = (id: string) => {
  const p = PAL[id] ?? PAL.rookie;
  return { hi: p.frame[0], mid: p.glow, lo: p.body[2], glow: p.glow, ink: p.frame[3] };
};
