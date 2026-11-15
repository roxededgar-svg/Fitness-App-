import { rankFor, TIERS, type Tier } from '../lib/progression';

/**
 * Eigene Rang-Embleme – jedes Tier hat eine eigene Form und ein eigenes Motiv:
 *  Rookie   – Steinscheibe mit Pfeilspitze
 *  Ember    – Glut-Schild mit Flamme
 *  Steel    – kantiger Stahlschild mit Doppel-Winkel und Nieten
 *  Crystal  – geschliffener Kristall mit Facetten
 *  Storm    – geflügelter Schild mit Blitz
 *  Mythic   – gehörntes Wappen mit Stern-Auge
 *  Legend   – Lorbeerkranz mit Krone und Stern
 * Divisionen (IV → I) werden als Rauten unter dem Emblem gezeigt.
 */

const PALETTE: Record<string, { hi: string; mid: string; lo: string; glow: string; ink: string }> = {
  rookie: { hi: '#d4d8e2', mid: '#8a90a2', lo: '#3c4050', glow: '#9ca3af', ink: '#22252f' },
  ember: { hi: '#ffd08a', mid: '#f97316', lo: '#7c1d06', glow: '#f97316', ink: '#3a0d02' },
  steel: { hi: '#f1f5f9', mid: '#94a3b8', lo: '#334155', glow: '#cbd5e1', ink: '#1e293b' },
  crystal: { hi: '#e0f7ff', mid: '#38bdf8', lo: '#0c4a6e', glow: '#38bdf8', ink: '#062437' },
  storm: { hi: '#e9d5ff', mid: '#a855f7', lo: '#3b0764', glow: '#a855f7', ink: '#1e0533' },
  mythic: { hi: '#fecaca', mid: '#ef4444', lo: '#450a0a', glow: '#ef4444', ink: '#1f0404' },
  legend: { hi: '#fff3c4', mid: '#f5b100', lo: '#6b4400', glow: '#f5b100', ink: '#2e1d00' },
};

function Body({ id, g }: { id: string; g: string }) {
  const fill = `url(#${g})`;
  const edge = `url(#${g}e)`;
  switch (id) {
    case 'rookie':
      return (
        <>
          <circle cx="50" cy="48" r="34" fill={edge} />
          <circle cx="50" cy="48" r="30" fill={fill} />
          <path d="M50 30 66 54H56l-6-9-6 9H34z" fill="rgba(0,0,0,.35)" />
          <path d="M50 28 66 52H56l-6-9-6 9H34z" fill="#fff" fillOpacity=".9" />
        </>
      );
    case 'ember':
      return (
        <>
          <path d="M50 10 82 20v26c0 20-14 34-32 42C32 80 18 66 18 46V20z" fill={edge} />
          <path d="M50 15 77 23.5V46c0 17-12 29-27 36C35 75 23 63 23 46V23.5z" fill={fill} />
          <path d="M50 30c3 8 12 11 12 22a12 12 0 0 1-24 0c0-6 4-9 6-12 0 4 2 6 4 6 0-7 2-11 2-16z" fill="#fff" fillOpacity=".92" />
        </>
      );
    case 'steel':
      return (
        <>
          <path d="M50 8 84 18 80 52 50 90 20 52 16 18z" fill={edge} />
          <path d="M50 13 79 21.5 75.5 50.5 50 83 24.5 50.5 21 21.5z" fill={fill} />
          <path d="M33 40 50 30 67 40v8L50 38 33 48zM33 54 50 44 67 54v8L50 52 33 62z" fill="#fff" fillOpacity=".9" />
          {[[28, 26], [72, 26], [50, 74]].map(([x, y]) => <circle key={x + y} cx={x} cy={y} r="2.2" fill="#fff" fillOpacity=".7" />)}
        </>
      );
    case 'crystal':
      return (
        <>
          <path d="M50 6 80 26 74 66 50 92 26 66 20 26z" fill={edge} />
          <path d="M50 11 75 28 70 64 50 86 30 64 25 28z" fill={fill} />
          <path d="M50 11 62 30 50 86 38 30zM25 28h50M38 30l-8 34M62 30l8 34" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.4" />
          <path d="M50 11 62 30H38z" fill="#fff" fillOpacity=".35" />
        </>
      );
    case 'storm':
      return (
        <>
          <path d="M22 26C12 30 4 42 6 58c8-6 14-8 20-8M78 26c10 4 18 16 16 32-8-6-14-8-20-8" fill={edge} />
          <path d="M24 32c-7 4-12 12-13 21 6-4 10-5 15-5M76 32c7 4 12 12 13 21-6-4-10-5-15-5" fill={fill} />
          <path d="M50 10 76 20v24c0 20-12 34-26 42C36 78 24 64 24 44V20z" fill={edge} />
          <path d="M50 15 71 23v21c0 16-10 28-21 35-11-7-21-19-21-35V23z" fill={fill} />
          <path d="M54 26 40 50h9l-4 20 15-26h-9z" fill="#fff" fillOpacity=".95" />
        </>
      );
    case 'mythic':
      return (
        <>
          <path d="M22 14c2 10 8 16 14 18M78 14c-2 10-8 16-14 18" fill="none" stroke={edge} strokeWidth="7" strokeLinecap="round" />
          <path d="M50 18 80 30v18c0 20-14 32-30 40-16-8-30-20-30-40V30z" fill={edge} />
          <path d="M50 23 75 33v15c0 17-12 27-25 34-13-7-25-17-25-34V33z" fill={fill} />
          <path d="M50 36l3.5 8.5 9 .8-6.9 5.9 2.1 8.8L50 55.3l-7.7 4.7 2.1-8.8-6.9-5.9 9-.8z" fill="#fff" fillOpacity=".95" />
          <circle cx="50" cy="49" r="3" fill={PALETTE.mythic.lo} />
        </>
      );
    default: // legend
      return (
        <>
          {Array.from({ length: 7 }, (_, i) => {
            // Lorbeerblätter links (160° → 268°) und rechts (20° → -88°)
            const leaf = (deg: number, k: string) => {
              const r = (deg * Math.PI) / 180;
              const x = 50 + Math.cos(r) * 37;
              const y = 52 - Math.sin(r) * 37;
              return <ellipse key={k} cx={x} cy={y} rx="7.5" ry="3.3" transform={`rotate(${-deg + 90} ${x} ${y})`} fill={edge} />;
            };
            return [leaf(160 + i * 18, `a${i}`), leaf(20 - i * 18, `b${i}`)];
          })}
          <circle cx="50" cy="52" r="28" fill={edge} />
          <circle cx="50" cy="52" r="24" fill={fill} />
          <path d="M30 22 38 30 44 18 50 28 56 18 62 30 70 22 67 36H33z" fill={fill} stroke={edge} strokeWidth="2" strokeLinejoin="round" />
          <path d="M50 40l3.8 7.8 8.6 1.2-6.2 6 1.5 8.6L50 59.5l-7.7 4.1 1.5-8.6-6.2-6 8.6-1.2z" fill="#fff" fillOpacity=".95" />
        </>
      );
  }
}

let uid = 0;

export function RankEmblem({ tier, division, size = 64, glow = true }: { tier: Tier; division?: string | null; size?: number | string; glow?: boolean }) {
  const p = PALETTE[tier.id] ?? PALETTE.rookie;
  const g = `rk${tier.id}${++uid}`;
  const pips = division ? ['IV', 'III', 'II', 'I'].indexOf(division) + 1 : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible', filter: glow && typeof size === 'number' ? `drop-shadow(0 0 ${size / 10}px ${p.glow}66)` : undefined }} aria-label={tier.name}>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={p.hi} />
          <stop offset=".45" stopColor={p.mid} />
          <stop offset="1" stopColor={p.lo} />
        </linearGradient>
        <linearGradient id={`${g}e`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.mid} />
          <stop offset="1" stopColor={p.ink} />
        </linearGradient>
      </defs>
      <Body id={tier.id} g={g} />
      {pips > 0 && (
        <g>
          {Array.from({ length: 4 }, (_, i) => {
            const x = 50 + (i - 1.5) * 9;
            const on = i < pips;
            return <path key={i} d={`M${x} 91l3.4 3.4-3.4 3.4-3.4-3.4z`} fill={on ? p.hi : 'rgba(255,255,255,.15)'} stroke={on ? p.mid : 'none'} strokeWidth=".8" />;
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
export const tierPalette = (id: string) => PALETTE[id] ?? PALETTE.rookie;
