/** ELO, Arena-Ränge und Level-System. */

export const K_FACTOR = 32;

export function expectedScore(a: number, b: number) {
  return 1 / (1 + 10 ** ((b - a) / 400));
}

/** score: 1 = Sieg, 0.5 = Unentschieden, 0 = Niederlage */
export function eloDelta(me: number, opp: number, score: number, k = K_FACTOR) {
  return Math.round(k * (score - expectedScore(me, opp)));
}

/** Arena-Punkte (Trophäen): Siege bringen mehr bei stärkeren Gegnern; nie unter 0. */
export function arenaDelta(score: number, me: number, opp: number) {
  if (score === 0.5) return 5;
  const diff = Math.max(-200, Math.min(200, opp - me));
  if (score === 1) return Math.round(25 + diff / 20);
  return -Math.round(12 - diff / 40);
}

export interface Tier {
  id: string;
  name: string;
  min: number;
  color: string;
}

export const TIERS: Tier[] = [
  { id: 'rookie', name: 'Rookie Realm', min: 0, color: '#9ca3af' },
  { id: 'ember', name: 'Ember Rise', min: 400, color: '#f97316' },
  { id: 'steel', name: 'Steel Vanguard', min: 800, color: '#94a3b8' },
  { id: 'crystal', name: 'Crystal Guard', min: 1200, color: '#38bdf8' },
  { id: 'storm', name: 'Storm Legion', min: 1600, color: '#a855f7' },
  { id: 'mythic', name: 'Mythic Ascendant', min: 2000, color: '#ef4444' },
  { id: 'legend', name: 'Legend', min: 2400, color: '#f5b100' },
];

const DIVS = ['IV', 'III', 'II', 'I'];

export interface RankInfo {
  tier: Tier;
  division: string | null;
  /** Fortschritt in der aktuellen Division 0..1 */
  progress: number;
  next: Tier | null;
  pointsToNext: number;
}

export function rankFor(points: number): RankInfo {
  const p = Math.max(0, points);
  let idx = 0;
  for (let i = 0; i < TIERS.length; i++) if (p >= TIERS[i].min) idx = i;
  const tier = TIERS[idx];
  const next = TIERS[idx + 1] ?? null;
  if (!next) return { tier, division: null, progress: 1, next: null, pointsToNext: 0 };
  const span = (next.min - tier.min) / 4;
  const d = Math.min(3, Math.floor((p - tier.min) / span));
  const divStart = tier.min + d * span;
  return {
    tier,
    division: DIVS[d],
    progress: (p - divStart) / span,
    next,
    pointsToNext: Math.ceil(divStart + span - p),
  };
}

export const rankLabel = (points: number) => {
  const r = rankFor(points);
  return r.division ? `${r.tier.name} ${r.division}` : r.tier.name;
};

/** XP, die für das Aufsteigen von Level l → l+1 benötigt werden. */
export const xpForLevel = (l: number) => 200 + 130 * (l - 1);

export function levelFromXp(totalXp: number) {
  let level = 1;
  let rest = totalXp;
  while (rest >= xpForLevel(level)) {
    rest -= xpForLevel(level);
    level++;
  }
  return { level, xpInLevel: rest, xpNeeded: xpForLevel(level) };
}
