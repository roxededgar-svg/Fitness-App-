import type { Profile } from './types';
import { streak, totals } from './stats';
import { bestPaceNorm } from './pace';

export interface Badge {
  id: string;
  name: string;
  desc: string;
  /** Name eines Symbols aus components/Icon */
  icon: string;
  color: string;
  earned(p: Profile): boolean;
}

export const BADGES: Badge[] = [
  { id: 'first_blood', name: 'Erster Sieg', desc: 'Gewinne deinen ersten Arena-Kampf', icon: 'swords', color: '#4f86ff', earned: (p) => p.wins >= 1 },
  { id: 'reps100', name: 'Hunderter', desc: '100 Wiederholungen insgesamt', icon: 'target', color: '#22c55e', earned: (p) => totals(p).reps >= 100 },
  { id: 'reps1000', name: 'Tausendsassa', desc: '1.000 Wiederholungen insgesamt', icon: 'fire', color: '#f97316', earned: (p) => totals(p).reps >= 1000 },
  { id: 'streak7', name: 'Eiserner Wille', desc: '7 Tage Streak', icon: 'calendar', color: '#a855f7', earned: (p) => streak(p.sessions, new Date(), p.frozenDays) >= 7 },
  { id: 'dungeon', name: 'Dungeon-Bezwinger', desc: 'Besiege deinen ersten Boss', icon: 'skull', color: '#ef4444', earned: (p) => p.dungeonsCleared.length >= 1 },
  { id: 'ember', name: 'Glut entfacht', desc: 'Erreiche Ember Rise', icon: 'shield', color: '#f97316', earned: (p) => p.arenaPoints >= 400 },
  { id: 'win10', name: 'Gladiator', desc: '10 Arena-Siege', icon: 'trophy', color: '#f5b100', earned: (p) => p.wins >= 10 },
  { id: 'set50', name: 'Maschine', desc: '50 Wdh. in einem Satz', icon: 'cog', color: '#38bdf8', earned: (p) => totals(p).best >= 50 },
  { id: 'steel', name: 'Stahlwille', desc: 'Erreiche Steel Vanguard', icon: 'swords', color: '#94a3b8', earned: (p) => p.arenaPoints >= 800 },
  { id: 'crystal', name: 'Kristallklar', desc: 'Erreiche Crystal Guard', icon: 'crystal', color: '#38bdf8', earned: (p) => p.arenaPoints >= 1200 },
  { id: 'storm', name: 'Sturmläufer', desc: 'Erreiche Storm Legion', icon: 'storm', color: '#a855f7', earned: (p) => p.arenaPoints >= 1600 },
  { id: 'mythic', name: 'Mythos', desc: 'Erreiche Mythic Ascendant', icon: 'trident', color: '#ef4444', earned: (p) => p.arenaPoints >= 2000 },
  { id: 'legend', name: 'Legende', desc: 'Erreiche den Legend-Rang', icon: 'crown', color: '#f5b100', earned: (p) => p.arenaPoints >= 2400 },
  { id: 'pace20', name: 'Flinke Hände', desc: 'Tempo 20 Wdh./Min*', icon: 'wind', color: '#22c55e', earned: (p) => bestPaceNorm(p) >= 20 },
  { id: 'pace30', name: 'Tempomacher', desc: 'Tempo 30 Wdh./Min*', icon: 'stopwatch', color: '#38bdf8', earned: (p) => bestPaceNorm(p) >= 30 },
  { id: 'pace40', name: 'Turbo', desc: 'Tempo 40 Wdh./Min*', icon: 'rocket', color: '#a855f7', earned: (p) => bestPaceNorm(p) >= 40 },
  { id: 'pace50', name: 'Blitzschlag', desc: 'Tempo 50 Wdh./Min*', icon: 'bolt', color: '#f5b100', earned: (p) => bestPaceNorm(p) >= 50 },
  { id: 'ranked1', name: 'Erste Trophäen', desc: 'Gewinne deinen ersten Ranked-Kampf', icon: 'trophy', color: '#3f7bfa', earned: (p) => p.sessions.some((s) => s.mode === 'pvp' && (s.queue ?? 'ranked') === 'ranked' && s.result === 'win' && s.ranked) },
  { id: 'earlybird', name: 'Frühaufsteher', desc: 'Trainiere vor 8 Uhr morgens', icon: 'sun', color: '#f59e0b', earned: (p) => p.sessions.some((s) => s.reps > 0 && new Date(s.ts).getHours() < 8) },
  { id: 'nightowl', name: 'Nachteule', desc: 'Trainiere nach 22 Uhr', icon: 'moon', color: '#6366f1', earned: (p) => p.sessions.some((s) => s.reps > 0 && new Date(s.ts).getHours() >= 22) },
  { id: 'bosses3', name: 'Bossjäger', desc: 'Besiege 3 verschiedene Bosse', icon: 'skull', color: '#dc2626', earned: (p) => p.dungeonsCleared.length >= 3 },
  { id: 'friend', name: 'Rivalität', desc: 'Schließe ein Freundes-Duell ab', icon: 'rivals', color: '#ec4899', earned: (p) => p.sessions.some((s) => s.mode === 'ghost') },
];

/** Ergänzt fehlende Erhalt-Daten; gibt Profil-Patch und neu erhaltene IDs zurück. */
export function syncBadgeDates(p: Profile, now = Date.now()): { badgeDates: Record<string, number>; added: string[] } {
  const dates = { ...(p.badgeDates ?? {}) };
  const added: string[] = [];
  for (const b of BADGES) {
    if (!dates[b.id] && b.earned(p)) {
      dates[b.id] = now;
      added.push(b.id);
    }
  }
  return { badgeDates: dates, added };
}
