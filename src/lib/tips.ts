/** Persönliche Tipps von Flux für die Startseite */
import type { Profile } from './types';
import { dayOf } from './stats';
import { todayKey } from './rng';
import { DAYS, PLANS, daySets } from './plans';
import { EXERCISES } from './exercises';
import type { Mood } from '../components/Flux';
import { goalLabel } from './goals';

export function weekDaysTrained(p: Profile, now = new Date()) {
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return new Set(p.sessions.filter((s) => s.reps > 0 && s.ts >= monday.getTime()).map((s) => dayOf(s.ts))).size;
}

const GOAL_TIPS: Record<string, string[]> = {
  lose: ['Burpees und Jumping Jacks sind deine besten Freunde – sie verbrennen am meisten.', 'Ein kurzer Monsterkampf auf dem Pfad zählt auch! Jede Minute Bewegung hilft.', 'Mehrere kurze Einheiten pro Woche bringen mehr als eine lange.'],
  muscle: ['Gib deinen Muskeln einen Tag Pause zwischen harten Einheiten – dann wachsen sie.', 'Saubere, tiefe Wiederholungen bringen mehr als schnelle halbe.', 'Steigere dich langsam: jede Woche ein paar Wiederholungen mehr.'],
  fit: ['Regelmäßigkeit schlägt Intensität. Lieber 10 Minuten jeden zweiten Tag.', 'Probier mal etwas Neues – Mountain Climber oder Sit-ups.', 'Ein Spaziergang zählt nicht bei mir, aber er tut dir trotzdem gut!'],
  endurance: ['Versuch im Modus „Eigenes Tempo“ ein langes Duell mit ruhigem Gegner.', 'Gleichmäßiges Tempo schlägt Sprints, wenn du lange durchhalten willst.', 'Plank ist Ausdauer für den ganzen Körper.'],
  compete: ['In Ranked zählt jede Wiederholung. Ein schneller Start kann das Match entscheiden.', 'Schau dir in der Rang-Leiter an, welches Tempo dein nächster Rang braucht.', 'Fordere einen Freund per Duell-Link heraus!'],
};

export function fluxTip(p: Profile, now = new Date()): { text: string; mood: Mood } {
  const today = todayKey(now);
  const todayReps = p.sessions.filter((s) => dayOf(s.ts) === today && s.exercise !== 'plank').reduce((a, s) => a + s.reps, 0);
  const goal = p.perWeek ?? 3;
  const week = weekDaysTrained(p, now);
  const plan = PLANS.find((x) => p.plans?.[x.id] && p.plans[x.id].done < DAYS);
  const st = plan ? p.plans![plan.id] : undefined;
  const planToday = st?.lastAt && dayOf(st.lastAt) === today;
  const pool = GOAL_TIPS[p.goal ?? 'fit'];
  const daily = pool[(now.getDate() + now.getMonth()) % pool.length];

  if (week >= goal && todayReps > 0) return { mood: 'proud', text: `Wochenziel geschafft – ${week} von ${goal} Tagen! Alles, was jetzt kommt, ist Bonus. ${daily}` };
  if (todayReps > 0) {
    if (plan && !planToday) return { mood: 'happy', text: `Schon ${todayReps} Wiederholungen heute, stark! Deine Plan-Einheit ${st!.done + 1} wartet noch: ${daySets(plan, st!.startMax, st!.done).join(' · ')}+ ${EXERCISES[plan.exercise].name}.` };
    return { mood: 'excited', text: `${todayReps} Wiederholungen heute – weiter so! Noch ${Math.max(0, goal - week)} Trainingstag${goal - week === 1 ? '' : 'e'} bis zum Wochenziel.` };
  }
  if (plan) return { mood: 'wink', text: `Heute steht Einheit ${st!.done + 1} von „${plan.name}“ an: ${daySets(plan, st!.startMax, st!.done).join(' · ')}+. Tippe hier und wir legen los!` };
  const g = goalLabel(p.goal);
  return { mood: 'happy', text: `${g ? `Für dein Ziel „${g}“: ` : ''}${daily}` };
}
