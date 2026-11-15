import type { Profile, SessionRecord } from './types';
import type { ExerciseId } from './exercises';
import { hashStr, rng, todayKey } from './rng';
import { sessionsOn } from './stats';

export interface MissionDef {
  id: string;
  title: string;
  target: number;
  xp: number;
  gold: number;
  progress(today: SessionRecord[]): number;
}

const repsOf = (ex: ExerciseId) => (s: SessionRecord[]) =>
  s.filter((x) => x.exercise === ex).reduce((a, b) => a + b.reps, 0);

export const MISSION_POOL: MissionDef[] = [
  { id: 'squat100', title: '100 Kniebeugen', target: 100, xp: 80, gold: 40, progress: repsOf('squat') },
  { id: 'push50', title: '50 Liegestütze', target: 50, xp: 80, gold: 40, progress: repsOf('pushup') },
  { id: 'dungeon1', title: '1 Dungeon abschließen', target: 1, xp: 150, gold: 80, progress: (s) => s.filter((x) => x.mode === 'dungeon' && x.result === 'win').length },
  { id: 'pvpwin1', title: '1 Arena-Sieg', target: 1, xp: 120, gold: 60, progress: (s) => s.filter((x) => x.mode === 'pvp' && x.result === 'win').length },
  { id: 'pvp3', title: '3 Arena-Kämpfe', target: 3, xp: 100, gold: 50, progress: (s) => s.filter((x) => x.mode === 'pvp' && x.reps > 0).length },
  { id: 'jj80', title: '80 Jumping Jacks', target: 80, xp: 70, gold: 35, progress: repsOf('jumpingjack') },
  { id: 'burpee20', title: '20 Burpees', target: 20, xp: 90, gold: 45, progress: repsOf('burpee') },
  { id: 'situp40', title: '40 Sit-ups', target: 40, xp: 70, gold: 35, progress: repsOf('situp') },
  { id: 'plank60', title: '60 Sek. Plank', target: 60, xp: 70, gold: 35, progress: repsOf('plank') },
  { id: 'total150', title: '150 Wiederholungen gesamt', target: 150, xp: 110, gold: 55, progress: (s) => s.filter((x) => x.exercise !== 'plank').reduce((a, b) => a + b.reps, 0) },
];

export function dailyMissions(p: Profile, key = todayKey()) {
  const r = rng(hashStr(p.id + key));
  const pool = [...MISSION_POOL];
  const picks: MissionDef[] = [];
  while (picks.length < 3) picks.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  const today = sessionsOn(p, key);
  const claimed = p.claimed[key] ?? [];
  return picks.map((m) => {
    const prog = Math.min(m.target, m.progress(today));
    return { ...m, current: prog, done: prog >= m.target, claimed: claimed.includes(m.id) };
  });
}
