import type { ExerciseId } from './exercises';
import type { Sensitivity } from '../pose/counters';

export type Mode = 'pvp' | 'dungeon' | 'training' | 'ghost';
export type Result = 'win' | 'loss' | 'draw';
/** Arena-Modus: Ranked (Rang & ELO), Schnellkampf (locker), Eigenes Tempo (Gegner-Tempo selbst gewählt) */
export type Queue = 'ranked' | 'casual' | 'custom';

export interface SessionRecord {
  id: string;
  ts: number;
  mode: Mode;
  exercise: ExerciseId;
  reps: number;
  durationS: number;
  /** Zeitpunkte (ms) jeder eigenen Wiederholung – für Ghost-Duelle & Verlaufsgrafik */
  timeline: number[];
  oppName?: string;
  oppReps?: number;
  oppTimeline?: number[];
  result?: Result;
  eloBefore?: number;
  eloDelta?: number;
  arenaBefore?: number;
  arenaDelta?: number;
  xp: number;
  gold: number;
  gems: number;
  ranked: boolean;
  queue?: Queue;
  dungeonId?: string;
  firstClear?: boolean;
  /** Dungeon: maximale und verbleibende Boss-HP */
  bossMaxHp?: number;
  bossHpLeft?: number;
  maxCombo?: number;
  levelUp?: number;
}

export interface Friend {
  code: string;
  name: string;
  country: string;
  elo: number;
  arenaPoints: number;
  level: number;
  wins: number;
  losses: number;
  addedAt: number;
  /** Zuletzt erhaltener Duell-Code (zum erneuten Spielen gegen den Ghost) */
  duel?: string;
}

export interface Profile {
  id: string;
  email: string;
  passHash: string;
  name: string;
  code: string;
  country: string;
  avatar?: string;
  createdAt: number;
  xp: number;
  gold: number;
  gems: number;
  elo: number;
  arenaPoints: number;
  wins: number;
  losses: number;
  draws: number;
  sessions: SessionRecord[];
  /** pro Tag eingeforderte Missionen */
  claimed: Record<string, string[]>;
  favBadges: string[];
  friends: Friend[];
  dungeonsCleared: string[];
  personalBests: Partial<Record<ExerciseId, number>>;
}

export interface Settings {
  sound: boolean;
  haptics: boolean;
  facing: 'user' | 'environment';
  mirror: boolean;
  showSkeleton: boolean;
  sensitivity: Sensitivity;
  /** Test-Modus: Tippen zählt Wiederholungen. Matches sind dann ungewertet. */
  tapMode: boolean;
}
