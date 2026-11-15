import type { Profile } from './types';
import { streak, totals } from './stats';

export interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  earned(p: Profile): boolean;
}

export const BADGES: Badge[] = [
  { id: 'first_blood', name: 'Erster Sieg', desc: 'Gewinne deinen ersten Arena-Kampf', icon: '⚔️', color: '#4f86ff', earned: (p) => p.wins >= 1 },
  { id: 'reps100', name: 'Hunderter', desc: '100 Wiederholungen insgesamt', icon: '💯', color: '#22c55e', earned: (p) => totals(p).reps >= 100 },
  { id: 'reps1000', name: 'Tausendsassa', desc: '1.000 Wiederholungen insgesamt', icon: '🔥', color: '#f97316', earned: (p) => totals(p).reps >= 1000 },
  { id: 'streak7', name: 'Eiserner Wille', desc: '7 Tage Streak', icon: '📅', color: '#a855f7', earned: (p) => streak(p.sessions) >= 7 },
  { id: 'dungeon', name: 'Dungeon-Bezwinger', desc: 'Besiege deinen ersten Boss', icon: '💀', color: '#ef4444', earned: (p) => p.dungeonsCleared.length >= 1 },
  { id: 'ember', name: 'Glut entfacht', desc: 'Erreiche Ember Rise', icon: '🛡️', color: '#f97316', earned: (p) => p.arenaPoints >= 400 },
  { id: 'win10', name: 'Gladiator', desc: '10 Arena-Siege', icon: '🏆', color: '#f5b100', earned: (p) => p.wins >= 10 },
  { id: 'set50', name: 'Maschine', desc: '50 Wdh. in einem Satz', icon: '⚙️', color: '#38bdf8', earned: (p) => totals(p).best >= 50 },
  { id: 'friend', name: 'Rivalität', desc: 'Schließe ein Freundes-Duell ab', icon: '🤝', color: '#ec4899', earned: (p) => p.sessions.some((s) => s.mode === 'ghost') },
];
