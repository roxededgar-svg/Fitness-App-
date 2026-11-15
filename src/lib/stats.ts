import type { Profile, SessionRecord } from './types';
import { todayKey } from './rng';

export const dayOf = (ts: number) => todayKey(new Date(ts));

export function sessionsOn(p: Profile, key: string) {
  return p.sessions.filter((s) => dayOf(s.ts) === key);
}

/** Tage in Folge mit mindestens einer Einheit (heute oder gestern muss dabei sein). */
export function streak(sessions: SessionRecord[], now = new Date(), frozenDays: string[] = []): number {
  const days = new Set([...sessions.filter((s) => s.reps > 0).map((s) => dayOf(s.ts)), ...frozenDays]);
  const d = new Date(now);
  if (!days.has(todayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(todayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Wiederholungen Mo–So der aktuellen Woche, getrennt nach Training/PvP. */
export function weekStats(sessions: SessionRecord[], now = new Date()) {
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = todayKey(d);
    let training = 0, pvp = 0;
    for (const s of sessions) {
      if (dayOf(s.ts) !== key) continue;
      if (s.mode === 'pvp' || s.mode === 'ghost') pvp += s.reps;
      else training += s.reps;
    }
    return { key, training, pvp, isToday: key === todayKey(now) };
  });
}

/** Gesamtwerte: gespeicherte Lebenszeit-Summe, sonst aus dem Verlauf berechnet */
export function totals(p: Profile) {
  const fromSessions = sessionTotals(p);
  const l = p.lifetime;
  if (!l) return fromSessions;
  return {
    reps: Math.max(l.reps, fromSessions.reps),
    best: Math.max(l.best, fromSessions.best),
    trainings: Math.max(l.trainings, fromSessions.trainings),
    pvp: Math.max(l.pvp, fromSessions.pvp),
    dungeons: Math.max(l.dungeons, fromSessions.dungeons),
  };
}

export function sessionTotals(p: Pick<Profile, 'sessions'>) {
  let reps = 0, best = 0, trainings = 0, pvp = 0, dungeons = 0;
  for (const s of p.sessions) {
    reps += s.exercise === 'plank' ? 0 : s.reps;
    if (s.exercise !== 'plank') best = Math.max(best, s.reps);
    if (s.mode === 'training') trainings++;
    if (s.mode === 'pvp' || s.mode === 'ghost') pvp++;
    if (s.mode === 'dungeon' && s.result === 'win') dungeons++;
  }
  return { reps, best, trainings, pvp, dungeons };
}
