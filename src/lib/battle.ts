import { create } from 'zustand';
import type { ExerciseId } from './exercises';
import type { Mode, SessionRecord } from './types';
import type { Opponent } from './bots';

export interface BattleConfig {
  mode: Mode;
  exercise: ExerciseId;
  /** null = unbegrenzt (nur freies Training) */
  durationS: number | null;
  opponent?: Opponent & { timeline: number[]; tier?: string };
  dungeonId?: string;
  ranked: boolean;
  /** Lauf wird als teilbares Duell aufgezeichnet */
  challenge?: boolean;
  /** Duell-Code des Gegners (Ghost) */
  duelCode?: string;
}

interface BattleState {
  config: BattleConfig | null;
  last: { config: BattleConfig; rec: SessionRecord } | null;
  start(c: BattleConfig): void;
  finish(rec: SessionRecord): void;
}

export const useBattle = create<BattleState>((set, get) => ({
  config: null,
  last: null,
  start: (config) => set({ config }),
  finish: (rec) => set({ last: { config: get().config!, rec } }),
}));
