/** Ziele aus der Einführung und daraus abgeleitete Empfehlungen */
import type { ExerciseId } from './exercises';

export type Goal = 'lose' | 'muscle' | 'fit' | 'endurance' | 'compete';
export type Fitness = 'beginner' | 'intermediate' | 'advanced';

export const GOALS: { id: Goal; label: string; sub: string; icon: string }[] = [
  { id: 'lose', label: 'Abnehmen', sub: 'Kalorien verbrennen, leichter werden', icon: 'fire' },
  { id: 'muscle', label: 'Muskeln aufbauen', sub: 'Stärker werden, zunehmen an Kraft', icon: 'dumbbell' },
  { id: 'fit', label: 'Fitter & gesünder', sub: 'Einfach in Bewegung bleiben', icon: 'heart' },
  { id: 'endurance', label: 'Mehr Ausdauer', sub: 'Länger durchhalten', icon: 'wind' },
  { id: 'compete', label: 'Spaß & Wettkampf', sub: 'Andere schlagen, Ränge erklimmen', icon: 'trophy' },
];

export const FITNESS: { id: Fitness; label: string; sub: string }[] = [
  { id: 'beginner', label: 'Einsteiger', sub: 'Ich fange gerade (wieder) an' },
  { id: 'intermediate', label: 'Fortgeschritten', sub: 'Ich trainiere ab und zu' },
  { id: 'advanced', label: 'Profi', sub: 'Ich trainiere regelmäßig und hart' },
];

export const PER_WEEK = [2, 3, 4, 6];

const START: Record<Fitness, Partial<Record<ExerciseId, number>>> = {
  beginner: { pushup: 5, squat: 12, situp: 8, plank: 20 },
  intermediate: { pushup: 15, squat: 25, situp: 20, plank: 45 },
  advanced: { pushup: 30, squat: 45, situp: 35, plank: 90 },
};

export interface Recommendation {
  planId: string;
  startMax: number;
  focus: ExerciseId[];
  text: string;
  mode: string;
}

export function recommend(goal: Goal, fitness: Fitness): Recommendation {
  const s = START[fitness];
  switch (goal) {
    case 'lose':
      return { planId: 'squat200', startMax: s.squat!, focus: ['burpee', 'jumpingjack', 'mountainclimber'], mode: 'Trainingspfad',
        text: 'Zum Abnehmen zählt Bewegung mit großen Muskeln: Kniebeugen, Burpees und Jumping Jacks verbrennen am meisten. Dein Plan: 200 Kniebeugen – und zwischendurch Monster auf dem Trainingspfad jagen.' };
    case 'muscle':
      return { planId: 'push100', startMax: s.pushup!, focus: ['pushup', 'squat'], mode: 'Trainingsplan',
        text: 'Für Muskelaufbau brauchst du steigende Wiederholungen. Dein Plan: 100 Liegestütze in 6 Wochen – jede Woche etwas mehr.' };
    case 'endurance':
      return { planId: 'plank3', startMax: s.plank!, focus: ['mountainclimber', 'jumpingjack', 'plank'], mode: 'Eigenes Tempo',
        text: 'Ausdauer baust du mit langen, gleichmäßigen Einheiten auf. Dein Plan: 3 Minuten Plank – und im Modus „Eigenes Tempo“ lange Duelle gegen einen ruhigen Gegner.' };
    case 'compete':
      return { planId: 'push100', startMax: s.pushup!, focus: ['pushup', 'burpee'], mode: 'Ranked',
        text: 'Du willst gewinnen? Dann ab in die Ranked-Arena! Mit dem Plan „100 Liegestütze“ wirst du schneller als deine Gegner.' };
    default:
      return { planId: 'core', startMax: s.situp!, focus: ['squat', 'situp', 'jumpingjack'], mode: 'Trainingspfad',
        text: 'Für mehr Fitness im Alltag ist ein starker Rumpf Gold wert. Dein Plan: Core-Stärke – und für Abwechslung der Trainingspfad.' };
  }
}

export const goalLabel = (g?: Goal) => GOALS.find((x) => x.id === g)?.label;
