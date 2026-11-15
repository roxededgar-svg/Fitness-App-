import { create } from 'zustand';
import type { ExerciseId } from './exercises';
import type { SessionRecord } from './types';

/**
 * Freundes-Modi:
 *  local1v1   – zwei Personen an einem Gerät gegeneinander
 *  local2v2   – zwei Personen an einem Gerät als Team gegen 2 Gegner (KI oder Team-Link)
 *  link2v2    – du live + Freund als aufgezeichneter Lauf (Team-Link) gegen 2 KI
 *  solo2v2    – du live + KI-Partner gegen 2 KI (erstellt einen Team-Link)
 */
export type TeamMode = 'local1v1' | 'local2v2' | 'link2v2' | 'solo2v2';

export interface Member {
  name: string;
  /** live: Kamera-Platz 0 (links) oder 1 (rechts); sonst aufgezeichneter Lauf */
  kind: 'live' | 'ghost' | 'bot';
  slot?: 0 | 1;
  timeline?: number[];
  me?: boolean;
  code?: string;
  country?: string;
  trophies?: number;
}

export interface TeamConfig {
  mode: TeamMode;
  exercise: ExerciseId;
  durationS: number;
  left: Member[];
  right: Member[];
  leftName: string;
  rightName: string;
}

interface TeamState {
  config: TeamConfig | null;
  result: { config: TeamConfig; left: number[][]; right: number[][]; rec: SessionRecord } | null;
  start(c: TeamConfig): void;
  finish(r: TeamState['result']): void;
}

export const useTeam = create<TeamState>((set) => ({
  config: null,
  result: null,
  start: (config) => set({ config, result: null }),
  finish: (result) => set({ result }),
}));

export const MODE_LABEL: Record<TeamMode, string> = {
  local1v1: '1 GEGEN 1',
  local2v2: '2 GEGEN 2',
  link2v2: 'TEAM-DUELL',
  solo2v2: '2 GEGEN 2',
};

/** Anzahl live erkannter Personen in einem Modus */
export const liveCount = (c: TeamConfig) => [...c.left, ...c.right].filter((m) => m.kind === 'live').length;
