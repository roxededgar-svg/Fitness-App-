/**
 * Tempo-System: Wiederholungen pro Minute (Wdh./Min).
 *
 * Damit Übungen vergleichbar sind, wird alles in ein „Liegestütz-Äquivalent“
 * umgerechnet (Referenz: Liegestütze mit 32 Wdh./Min als Durchschnitt).
 * Jeder Rang hat ein Ziel-Tempo – Ranked-Gegner laufen auf diesem Tempo,
 * angepasst an dein eigenes gemessenes Tempo.
 */
import { EXERCISES, type ExerciseId } from './exercises';
import { rankFor, TIERS } from './progression';
import type { Profile, SessionRecord } from './types';
import { rng } from './rng';

const REF = 32;

/** Rang-Ziel-Tempo im Liegestütz-Äquivalent (Wdh./Min). */
export const TIER_PACE: Record<string, number> = {
  rookie: 18, ember: 23, steel: 28, crystal: 33, storm: 38, mythic: 43, legend: 48,
};

export const toNorm = (ex: ExerciseId, rpm: number) => (rpm * REF) / EXERCISES[ex].baseRpm;
export const fromNorm = (ex: ExerciseId, norm: number) => (norm * EXERCISES[ex].baseRpm) / REF;

export const sessionRpm = (s: SessionRecord) => (s.durationS > 0 ? (s.reps / s.durationS) * 60 : 0);

/** Ziel-Tempo deines aktuellen Rangs (stufenlos bis zum nächsten Rang). */
export function tierPaceNorm(arenaPoints: number) {
  const r = rankFor(arenaPoints);
  const base = TIER_PACE[r.tier.id];
  if (!r.next) return base;
  const span = r.next.min - r.tier.min;
  const f = (Math.max(0, arenaPoints) - r.tier.min) / span;
  return base + (TIER_PACE[r.next.id] - base) * f;
}

/** Durchschnittstempo (Liegestütz-Äquivalent) deiner letzten gewerteten Kämpfe. */
export function recentPaceNorm(p: Profile, n = 5): number | null {
  const list = p.sessions
    .filter((s) => s.mode === 'pvp' && s.ranked && (s.queue ?? 'ranked') === 'ranked' && s.durationS >= 30 && s.reps > 0 && s.exercise !== 'plank')
    .slice(-n);
  if (list.length < 2) return null;
  return list.reduce((a, s) => a + toNorm(s.exercise, sessionRpm(s)), 0) / list.length;
}

/** Bestes Tempo (Liegestütz-Äquivalent) aus gewerteten Einheiten ≥ 30 s. */
export function bestPaceNorm(p: Profile): number {
  let best = 0;
  for (const s of p.sessions) {
    if (!s.ranked || s.durationS < 30 || s.reps <= 0 || s.exercise === 'plank') continue;
    best = Math.max(best, toNorm(s.exercise, sessionRpm(s)));
  }
  return best;
}

/**
 * Gegner-Tempo im Ranked-Modus: Mischung aus Rang-Ziel-Tempo und deinem
 * eigenen Tempo (+4 %), damit es immer knapp und fordernd bleibt.
 */
export function rankedOpponentRpm(ex: ExerciseId, p: Profile, jitter = 0): number {
  const tierNorm = tierPaceNorm(p.arenaPoints);
  const mine = recentPaceNorm(p);
  const norm = mine == null ? tierNorm : tierNorm * 0.5 + mine * 1.04 * 0.5;
  return Math.max(4, fromNorm(ex, norm) * (1 + jitter));
}

/**
 * Menschlich wirkende Zeitleiste mit Durchschnittstempo ≈ rpm:
 * kurze Startverzögerung, am Anfang etwas schneller, gegen Ende Ermüdung.
 */
export function humanTimeline(rpm: number, durationS: number, seed: number): number[] {
  const r = rng(seed);
  const out: number[] = [];
  const end = durationS * 1000;
  const start = 800 + r() * 800;
  const iv = (60000 / Math.max(1, rpm)) * ((end - start) / end);
  let t = start;
  while (true) {
    const progress = t / end;
    t += iv * (0.88 + progress * 0.24) * (0.85 + r() * 0.3);
    if (t >= end) break;
    out.push(Math.round(t));
  }
  return out;
}

export const tierPaceTable = () =>
  TIERS.map((t) => ({ tier: t, norm: TIER_PACE[t.id] }));
