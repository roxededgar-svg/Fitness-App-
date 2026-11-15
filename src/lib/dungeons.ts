import type { ExerciseId } from './exercises';

export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
export interface Dungeon {
  id: string;
  name: string;
  rarity: Rarity;
  minLevel: number;
  boss: string;
  element: string;
  elementColor: string;
  exercise: ExerciseId;
  duration: number;
  bossElo: number;
  xp: number;
  gold: number;
  gems: number;
  lore: string;
}

export const RARITY_COLOR: Record<Rarity, string> = {
  COMMON: '#9ca3af', RARE: '#4f86ff', EPIC: '#a855f7', LEGENDARY: '#f5a524', MYTHIC: '#ef4444',
};

export const DUNGEONS: Dungeon[] = [
  { id: 'neonwald', name: 'Neonwald', rarity: 'COMMON', minLevel: 1, boss: 'Waldläufer Krix', element: 'NATURE', elementColor: '#22c55e', exercise: 'squat', duration: 45, bossElo: 820, xp: 120, gold: 50, gems: 5, lore: 'Krix springt durch die leuchtenden Bäume. Halte mit Kniebeugen mit!' },
  { id: 'kristall', name: 'Kristallhöhle', rarity: 'RARE', minLevel: 3, boss: 'Eiskönigin Vex', element: 'ICE', elementColor: '#38bdf8', exercise: 'pushup', duration: 60, bossElo: 900, xp: 200, gold: 90, gems: 10, lore: 'Vex friert jeden ein, der zu langsam ist. Liegestütze brechen das Eis.' },
  { id: 'feuer', name: 'Feueröde', rarity: 'RARE', minLevel: 5, boss: 'Lavatitan Ignax', element: 'FIRE', elementColor: '#ef4444', exercise: 'burpee', duration: 60, bossElo: 980, xp: 320, gold: 150, gems: 15, lore: 'Der Boden brennt – nur Burpees halten dich in Bewegung.' },
  { id: 'schatten', name: 'Schattentempel', rarity: 'EPIC', minLevel: 8, boss: 'Dunkelmagier Zoraq', element: 'DARK', elementColor: '#a855f7', exercise: 'situp', duration: 60, bossElo: 1060, xp: 500, gold: 220, gems: 25, lore: 'Zoraqs Flüche schwächen die Mitte. Stärke deinen Core.' },
  { id: 'himmel', name: 'Himmelsfestung', rarity: 'EPIC', minLevel: 12, boss: 'Sturmherr Aeolos', element: 'LIGHTNING', elementColor: '#eab308', exercise: 'jumpingjack', duration: 60, bossElo: 1150, xp: 720, gold: 320, gems: 35, lore: 'Blitze schlagen im Takt ein – springe schneller als der Sturm.' },
  { id: 'abyss', name: 'Abyss Zone', rarity: 'LEGENDARY', minLevel: 18, boss: 'Tiefenwächter Tholos', element: 'WATER', elementColor: '#06b6d4', exercise: 'mountainclimber', duration: 90, bossElo: 1250, xp: 1000, gold: 460, gems: 50, lore: 'In der Tiefe zählt nur Ausdauer. Klettere dem Licht entgegen.' },
  { id: 'olymp', name: 'Thron der Legenden', rarity: 'MYTHIC', minLevel: 25, boss: 'Der Ewige Champion', element: 'LEGEND', elementColor: '#f5b100', exercise: 'pushup', duration: 120, bossElo: 1400, xp: 1600, gold: 800, gems: 100, lore: 'Der letzte Gegner. Zwei Minuten. Alles, was du hast.' },
];
