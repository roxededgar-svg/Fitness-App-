import { EXERCISES, type ExerciseId } from './exercises';
import { hashStr, rng } from './rng';

export interface Opponent {
  id: string;
  name: string;
  country: string;
  elo: number;
  arenaPoints: number;
  level: number;
  wins: number;
  losses: number;
  avatar?: string;
  kind: 'bot' | 'ghost' | 'boss';
  color?: string;
}

const NAMES = [
  'NeonRunner', 'TitanBreaker', 'Zephyra', 'IronVex', 'PulseRider', 'NovaFist', 'Kraftwerk99', 'BlitzKatze',
  'StahlFalke', 'ShadowRep', 'LunaLift', 'Granitherz', 'CometCrush', 'Frostbeisser', 'RepReaper', 'Wolfsblut',
  'AuroraFlex', 'Donnerkeil', 'VoltViking', 'NachtFuchs', 'EmberQueen', 'SpartanX', 'Muskelmaus', 'QuantumQuad',
  'Sturmläufer', 'GlitchGains', 'OrbitOx', 'PhoenixPush', 'Tigerauge', 'HexHammer', 'Kometenkind', 'Bärenkraft',
  'ArcticAce', 'RubyRush', 'Zugspitze', 'CobaltCore', 'Funkenflug', 'Wirbelwind', 'PixelPump', 'Eisenfaust',
];
const COUNTRIES = ['DE', 'DE', 'DE', 'AT', 'CH', 'US', 'GB', 'FR', 'ES', 'IT', 'NL', 'PL', 'SE', 'TR', 'BR', 'JP'];
const COLORS = ['#ef4444', '#f97316', '#22c55e', '#06b6d4', '#a855f7', '#ec4899', '#eab308'];

/** Feste Bot-Population für Rangliste & Matchmaking (leichte tägliche Bewegung). */
export function botPool(dayKey: string): Opponent[] {
  const dayDrift = rng(hashStr(dayKey));
  return NAMES.map((name, i) => {
    const r = rng(hashStr(name));
    const elo = Math.round(780 + r() * 900 + (dayDrift() - 0.5) * 30);
    const games = Math.floor(10 + r() * 220);
    const wr = Math.max(0.15, Math.min(0.85, 0.5 + (elo - 1150) / 1400 + (r() - 0.5) * 0.1));
    const wins = Math.round(games * wr);
    return {
      id: `bot_${i}`,
      name,
      country: COUNTRIES[Math.floor(r() * COUNTRIES.length)],
      elo,
      arenaPoints: Math.max(0, Math.round((elo - 800) * 1.6 + r() * 120 + (dayDrift() - 0.5) * 20)),
      level: Math.max(1, Math.round(1 + (elo - 750) / 45 + r() * 4)),
      wins,
      losses: games - wins,
      kind: 'bot',
      color: COLORS[i % COLORS.length],
    };
  });
}

/** Sucht einen Bot mit ähnlicher ELO (±120, wird bei Bedarf erweitert). */
export function findMatch(pool: Opponent[], myElo: number, exclude?: string): Opponent {
  for (const range of [120, 250, 600, 5000]) {
    const c = pool.filter((b) => Math.abs(b.elo - myElo) <= range && b.id !== exclude);
    if (c.length) return c[Math.floor(Math.random() * c.length)];
  }
  return pool[0];
}

/** Typisches Tempo (Wdh./Min) eines Spielers mit dieser ELO. */
export function rpmForElo(exercise: ExerciseId, elo: number) {
  const skill = Math.max(0.35, Math.min(1.8, 0.45 + (elo - 800) / 650));
  return EXERCISES[exercise].baseRpm * skill;
}

/** Test-Bot: gleichmäßiges, frei einstellbares Tempo mit leichter Streuung. */
export function paceTimeline(rpm: number, durationS: number, seed: number): number[] {
  const r = rng(seed);
  const out: number[] = [];
  const iv = 60000 / Math.max(1, rpm);
  let t = 1000;
  while (true) {
    t += iv * (0.9 + r() * 0.2);
    if (t >= durationS * 1000) break;
    out.push(Math.round(t));
  }
  return out;
}

/**
 * Erzeugt eine realistische Zeitleiste (ms) der Wiederholungen eines Bots:
 * Tempo abhängig von ELO, mit Startverzögerung, Ermüdung, Pausen und Zufall.
 */
export function botTimeline(exercise: ExerciseId, elo: number, durationS: number, seed: number): number[] {
  const r = rng(seed);
  const skill = Math.max(0.35, Math.min(1.8, 0.45 + (elo - 800) / 650));
  const rpm = rpmForElo(exercise, elo) * (0.88 + r() * 0.24);
  const out: number[] = [];
  let t = 1200 + r() * 1800; // Reaktionszeit / Position einnehmen
  const end = durationS * 1000;
  while (t < end) {
    const progress = t / end;
    const fatigue = 1 + progress * progress * (0.9 - skill * 0.25);
    const interval = (60000 / rpm) * fatigue * (0.8 + r() * 0.4);
    t += interval;
    if (r() < 0.04) t += 1200 + r() * 2500; // kurze Pause
    if (t < end) out.push(Math.round(t));
  }
  return out;
}

export const repsAt = (timeline: number[], ms: number) => {
  let lo = 0, hi = timeline.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (timeline[mid] <= ms) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};
