import { rankFor, TIERS } from './progression';

/** Saison = Kalendermonat */
export const seasonId = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export function seasonName(id: string) {
  const [y, m] = id.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}

/** Millisekunden bis Saisonende */
export function seasonEndsIn(now = new Date()) {
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return end.getTime() - now.getTime();
}

/** Weicher Reset: alles über Ember Rise (400) wird halbiert */
export const softReset = (t: number) => (t <= 400 ? t : 400 + Math.floor((t - 400) / 2));

/** Saison-Belohnung nach höchstem erreichtem Rang */
export function seasonReward(peak: number) {
  const idx = TIERS.indexOf(rankFor(peak).tier);
  return { gems: 5 + idx * 10, gold: 100 + idx * 150, tier: rankFor(peak).tier };
}
