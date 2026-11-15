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

import { applyRegen, applyRep, createBoss } from '../src/lib/boss';
import { paceTimeline } from '../src/lib/bots';

describe('Bosskampf', () => {
  it('jede Wiederholung macht Schaden, Combo erhöht ihn', () => {
    let b = createBoss(10);
    expect(b.maxHp).toBe(1000);
    const r1 = applyRep(b, 1000, 2000);
    expect(r1.hit.dmg).toBe(100);
    const r2 = applyRep(r1.state, 2500, 2000);
    expect(r2.hit.combo).toBe(2);
    expect(r2.hit.dmg).toBeGreaterThan(100);
    // nach langer Pause: Combo weg
    const r3 = applyRep(r2.state, 9000, 2000);
    expect(r3.hit.combo).toBe(1);
    b = r3.state;
    expect(b.hp).toBeLessThan(1000 - 300 + 1);
  });

  it('Boss fällt nach genug Wiederholungen', () => {
    let b = createBoss(12);
    let t = 0;
    for (let i = 0; i < 12 && b.hp > 0; i++) b = applyRep(b, (t += 1500), 2000).state;
    expect(b.hp).toBe(0);
  });

  it('Boss regeneriert bei Pause, aber nicht über Max-HP', () => {
    let b = applyRep(createBoss(10), 1000, 2000).state;
    expect(applyRegen(b, 2000, 100).healed).toBe(0);
    const r = applyRegen(b, 6000, 1000);
    expect(r.healed).toBeGreaterThan(0);
    b = r.state;
    for (let i = 0; i < 500; i++) b = applyRegen(b, 6000 + i * 100, 100).state;
    expect(b.hp).toBe(b.maxHp);
  });
});

describe('Test-Bot-Tempo', () => {
  it('liefert ungefähr das eingestellte Tempo', () => {
    const n = paceTimeline(30, 60, 7).length;
    expect(n).toBeGreaterThanOrEqual(27);
    expect(n).toBeLessThanOrEqual(31);
  });
});
