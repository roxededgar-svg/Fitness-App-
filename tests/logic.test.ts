import { describe, expect, it } from 'vitest';
import { arenaDelta, eloDelta, levelFromXp, rankFor } from '../src/lib/progression';
import { botTimeline, repsAt } from '../src/lib/bots';
import { decodeDuel, encodeDuel, extractDuelCode } from '../src/lib/duel';
import { streak } from '../src/lib/stats';
import type { SessionRecord } from '../src/lib/types';

describe('Progression', () => {
  it('ELO ist symmetrisch', () => {
    expect(eloDelta(1000, 1000, 1)).toBe(16);
    expect(eloDelta(1000, 1000, 0)).toBe(-16);
  });
  it('Ränge & Divisionen', () => {
    expect(rankFor(0).tier.name).toBe('Rookie Realm');
    expect(rankFor(0).division).toBe('IV');
    expect(rankFor(450).tier.name).toBe('Ember Rise');
    expect(rankFor(3000).division).toBeNull();
  });
  it('Arena-Punkte: Sieg positiv, Niederlage negativ', () => {
    expect(arenaDelta(1, 1000, 1000)).toBeGreaterThan(0);
    expect(arenaDelta(0, 1000, 1000)).toBeLessThan(0);
  });
  it('Level aus XP', () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(200).level).toBe(2);
  });
});

describe('Bots', () => {
  it('stärkere Bots schaffen mehr Wiederholungen, aber realistisch', () => {
    const weak = botTimeline('pushup', 800, 60, 1).length;
    const strong = botTimeline('pushup', 1500, 60, 1).length;
    expect(strong).toBeGreaterThan(weak);
    expect(strong).toBeLessThan(80);
    expect(weak).toBeGreaterThan(5);
  });
  it('repsAt zählt Zeitpunkte bis ms', () => {
    expect(repsAt([100, 200, 300], 250)).toBe(2);
    expect(repsAt([100, 200, 300], 50)).toBe(0);
  });
});

describe('Duell-Links', () => {
  it('Roundtrip kodieren/dekodieren', () => {
    const code = encodeDuel({ n: 'Wurstkomet', c: 'GMX423', co: 'DE', e: 952, a: 0, l: 3, x: 'pushup', d: 60, timeline: [1500, 3100, 4800] });
    const d = decodeDuel(code)!;
    expect(d.n).toBe('Wurstkomet');
    expect(d.timeline).toEqual([1500, 3100, 4800]);
    expect(extractDuelCode(`https://x.app/#/duel?c=${code}`)).toBe(code);
    expect(decodeDuel('kaputt')).toBeNull();
  });
});

describe('Streak', () => {
  const s = (daysAgo: number): SessionRecord => ({ id: String(daysAgo), ts: Date.now() - daysAgo * 864e5, mode: 'training', exercise: 'pushup', reps: 10, durationS: 60, timeline: [], xp: 0, gold: 0, gems: 0, ranked: true });
  it('zählt aufeinanderfolgende Tage', () => {
    expect(streak([s(0), s(1), s(2), s(4)])).toBe(3);
    expect(streak([s(1), s(2)])).toBe(2);
    expect(streak([s(3)])).toBe(0);
  });
});
