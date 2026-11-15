import type { Lm } from './counters';

/** Horizontale Mitte einer Person (Hüfte, sonst Schultern), bezogen auf das angezeigte Bild */
export function centerX(lms: Lm[], mirror: boolean) {
  const pick = (a: number, b: number) => {
    const p = lms[a], q = lms[b];
    if (!p || !q) return null;
    return (p.x + q.x) / 2;
  };
  const x = pick(23, 24) ?? pick(11, 12) ?? lms[0]?.x ?? 0.5;
  return mirror ? 1 - x : x;
}

/**
 * Ordnet erkannte Personen den Plätzen zu: Platz 0 = links im Bild, Platz 1 = rechts.
 * Ist nur eine Person sichtbar, entscheidet ihre Bildhälfte.
 */
export function assignSlots(poses: Lm[][], mirror: boolean): [Lm[] | null, Lm[] | null] {
  const list = poses.slice(0, 2).map((p) => ({ p, x: centerX(p, mirror) })).sort((a, b) => a.x - b.x);
  if (list.length === 0) return [null, null];
  if (list.length === 1) return list[0].x < 0.5 ? [list[0].p, null] : [null, list[0].p];
  return [list[0].p, list[1].p];
}
