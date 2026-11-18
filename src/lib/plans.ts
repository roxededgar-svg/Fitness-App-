/**
 * Trainingspläne: 6 Wochen × 3 Einheiten. Jede Einheit besteht aus 5 Sätzen,
 * der letzte Satz ist „so viele wie möglich“. Umfang wächst Woche für Woche
 * ausgehend von deinem Starttest (maximale Wiederholungen am Stück).
 */
import type { ExerciseId } from './exercises';

export interface Plan {
  id: string;
  name: string;
  exercise: ExerciseId;
  goal: number;
  desc: string;
  rest: number;
  color: string;
  icon: string;
}

export const PLANS: Plan[] = [
  { id: 'push100', name: '100 Liegestütze', exercise: 'pushup', goal: 100, desc: 'In 6 Wochen zu 100 Liegestützen in einer Einheit', rest: 75, color: '#D7FF3B', icon: 'dumbbell' },
  { id: 'squat200', name: '200 Kniebeugen', exercise: 'squat', goal: 200, desc: 'Beinkraft und Ausdauer für die Arena', rest: 60, color: '#22c55e', icon: 'bolt' },
  { id: 'core', name: 'Core-Stärke', exercise: 'situp', goal: 120, desc: 'Stabiler Rumpf mit Sit-ups', rest: 60, color: '#FF8A3D', icon: 'target' },
  { id: 'plank3', name: '3 Minuten Plank', exercise: 'plank', goal: 180, desc: 'Haltekraft für Liegestütze und Burpees', rest: 60, color: '#f5a524', icon: 'stopwatch' },
];

export const DAYS = 18; // 6 Wochen × 3

const PATTERN = [0.55, 0.65, 0.55, 0.45];

/** Sätze für einen Tag (Index 0..17). Der letzte Satz ist das Minimum für „so viele wie möglich“. */
export function daySets(plan: Plan, startMax: number, day: number): number[] {
  const week = Math.floor(day / 3);
  const inWeek = day % 3;
  const growth = 1 + week * 0.16 + inWeek * 0.04;
  const base = Math.max(plan.exercise === 'plank' ? 10 : 3, startMax);
  const sets = PATTERN.map((f) => Math.max(plan.exercise === 'plank' ? 10 : 2, Math.round(base * f * growth)));
  sets.push(Math.max(plan.exercise === 'plank' ? 15 : 3, Math.round(base * 0.75 * growth)));
  return sets;
}

export const planById = (id: string) => PLANS.find((p) => p.id === id);
