export type ExerciseId =
  | 'pushup'
  | 'squat'
  | 'burpee'
  | 'jumpingjack'
  | 'situp'
  | 'mountainclimber'
  | 'plank';

export interface Exercise {
  id: ExerciseId;
  name: string;
  unit: 'Wdh.' | 'Sek.';
  /** Durchschnittliche Wiederholungen pro Minute eines Trainierten (Bot-Tempo bei ELO 1000). */
  baseRpm: number;
  /** Kamera-Tipp für die Positionierung. */
  setup: string;
  /** In PvP-Matchmaking erlaubt. */
  pvp: boolean;
  xpPerRep: number;
}

export const EXERCISES: Record<ExerciseId, Exercise> = {
  pushup: {
    id: 'pushup', name: 'Liegestütze', unit: 'Wdh.', baseRpm: 32, pvp: true, xpPerRep: 2,
    setup: 'Gerät seitlich auf den Boden stellen, ca. 1,5–2 m entfernt. Ganzer Körper im Bild.',
  },
  squat: {
    id: 'squat', name: 'Kniebeugen', unit: 'Wdh.', baseRpm: 34, pvp: true, xpPerRep: 1.5,
    setup: 'Gerät seitlich oder schräg vor dir, ca. 2–3 m entfernt. Kopf bis Füße sichtbar.',
  },
  burpee: {
    id: 'burpee', name: 'Burpees', unit: 'Wdh.', baseRpm: 14, pvp: true, xpPerRep: 4,
    setup: 'Gerät seitlich, ca. 2,5–3 m entfernt. Stehen und Liegen müssen ins Bild passen.',
  },
  jumpingjack: {
    id: 'jumpingjack', name: 'Jumping Jacks', unit: 'Wdh.', baseRpm: 55, pvp: true, xpPerRep: 1,
    setup: 'Gerät frontal vor dir, ca. 2–3 m entfernt. Arme über dem Kopf müssen sichtbar sein.',
  },
  situp: {
    id: 'situp', name: 'Sit-ups', unit: 'Wdh.', baseRpm: 28, pvp: true, xpPerRep: 1.5,
    setup: 'Gerät seitlich auf den Boden, ca. 1,5–2 m entfernt.',
  },
  mountainclimber: {
    id: 'mountainclimber', name: 'Mountain Climber', unit: 'Wdh.', baseRpm: 60, pvp: true, xpPerRep: 1,
    setup: 'Gerät seitlich auf den Boden, ca. 1,5–2 m entfernt. Jeder Kniezug zählt.',
  },
  plank: {
    id: 'plank', name: 'Plank', unit: 'Sek.', baseRpm: 60, pvp: false, xpPerRep: 0.5,
    setup: 'Gerät seitlich auf den Boden. Zählt Sekunden mit gerader Körperlinie.',
  },
};

export const EXERCISE_LIST = Object.values(EXERCISES);
export const PVP_EXERCISES = EXERCISE_LIST.filter((e) => e.pvp).map((e) => e.id);
