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

import { fromNorm, humanTimeline, rankedOpponentRpm, tierPaceNorm, toNorm } from '../src/lib/pace';
import type { Profile } from '../src/lib/types';

describe('Tempo & Ranked', () => {
  const profile = (arenaPoints: number, sessions: SessionRecord[] = []) =>
    ({ arenaPoints, sessions } as unknown as Profile);
  const ranked = (reps: number): SessionRecord => ({ id: String(reps), ts: Date.now(), mode: 'pvp', queue: 'ranked', exercise: 'pushup', reps, durationS: 60, timeline: [], xp: 0, gold: 0, gems: 0, ranked: true });

  it('höherer Rang = schnelleres Ziel-Tempo', () => {
    expect(tierPaceNorm(0)).toBe(18);
    expect(tierPaceNorm(900)).toBeGreaterThan(tierPaceNorm(450));
    expect(tierPaceNorm(5000)).toBe(48);
  });
  it('Umrechnung zwischen Übungen ist umkehrbar', () => {
    expect(fromNorm('jumpingjack', toNorm('jumpingjack', 55))).toBeCloseTo(55);
    expect(toNorm('pushup', 32)).toBe(32);
  });
  it('Ranked-Gegner passt sich dem eigenen Tempo an', () => {
    const slow = rankedOpponentRpm('pushup', profile(0, [ranked(10), ranked(12)]));
    const fast = rankedOpponentRpm('pushup', profile(0, [ranked(40), ranked(42)]));
    expect(fast).toBeGreaterThan(slow);
    expect(rankedOpponentRpm('pushup', profile(0))).toBeCloseTo(18);
  });
  it('humanTimeline erreicht ungefähr das Ziel-Tempo', () => {
    for (const seed of [1, 2, 3]) {
      const n = humanTimeline(30, 60, seed).length;
      expect(n).toBeGreaterThanOrEqual(25);
      expect(n).toBeLessThanOrEqual(34);
    }
  });
});

import { BADGES, syncBadgeDates } from '../src/lib/badges';

describe('Abzeichen-Daten', () => {
  it('trägt nur neu erreichte Abzeichen mit Datum ein', () => {
    const p = { wins: 1, arenaPoints: 0, sessions: [], dungeonsCleared: [], badgeDates: {} } as unknown as Profile;
    const r1 = syncBadgeDates(p, 1000);
    expect(r1.added).toContain('first_blood');
    expect(r1.badgeDates.first_blood).toBe(1000);
    const r2 = syncBadgeDates({ ...p, badgeDates: r1.badgeDates } as Profile, 2000);
    expect(r2.added).toEqual([]);
    expect(r2.badgeDates.first_blood).toBe(1000);
  });
  it('jedes Abzeichen hat ein gültiges Symbol', () => {
    for (const b of BADGES) expect(b.icon).toMatch(/^[a-z0-9]+$/);
  });
});

import { ALL_NODES, WORLDS, currentNode, isUnlocked, starsFor, worldStars } from '../src/lib/path';

describe('Trainingspfad', () => {
  const prof = (path: Record<string, { stars: number; clearedAt: number }> = {}, dungeonsCleared: string[] = []) =>
    ({ path, dungeonsCleared } as unknown as Profile);

  it('7 Welten mit je 6 Stationen: 4 Kämpfe, 1 Kiste, 1 Boss', () => {
    expect(WORLDS).toHaveLength(7);
    for (const w of WORLDS) {
      expect(w.nodes.map((n) => n.kind)).toEqual(['fight', 'fight', 'chest', 'fight', 'fight', 'boss']);
      for (const n of w.nodes.filter((x) => x.kind !== 'chest')) expect(n.hp).toBeGreaterThan(0);
    }
  });
  it('Stationen schalten nacheinander frei', () => {
    const p = prof();
    expect(isUnlocked(p, ALL_NODES[0])).toBe(true);
    expect(isUnlocked(p, ALL_NODES[1])).toBe(false);
    const p2 = prof({ [ALL_NODES[0].id]: { stars: 2, clearedAt: 1 } });
    expect(isUnlocked(p2, ALL_NODES[1])).toBe(true);
    expect(currentNode(p2)?.id).toBe(ALL_NODES[1].id);
  });
  it('besiegter Alt-Boss schaltet die nächste Welt frei', () => {
    const p = prof({}, ['neonwald']);
    expect(currentNode(p)?.worldId).toBe('kristall');
    expect(worldStars(p, WORLDS[0]).got).toBe(5);
  });
  it('Sterne nach Restzeit', () => {
    expect(starsFor(0.5)).toBe(3);
    expect(starsFor(0.2)).toBe(2);
    expect(starsFor(0.01)).toBe(1);
  });
  it('spätere Welten sind schwerer', () => {
    const first = WORLDS[0].nodes[0], late = WORLDS[6].nodes[0];
    const perMin = (n: typeof first) => (n.hp! / n.durationS!) * 60;
    expect(perMin(late)).toBeGreaterThan(perMin(first) * 0.9);
  });
});

import { useStore } from '../src/lib/store';

describe('Neue Abzeichen nach Kampf', () => {
  it('meldet bereits vorher verdiente Abzeichen nicht als neu', () => {
    const p = {
      id: 'x', email: 'x@y.de', passHash: '', name: 'Test', code: 'ABC123', country: 'DE', createdAt: 0, xp: 0, gold: 0, gems: 0,
      elo: 1000, arenaPoints: 0, wins: 3, losses: 0, draws: 0, sessions: [], claimed: {}, favBadges: [], friends: [],
      dungeonsCleared: [], personalBests: {},
    } as unknown as Profile;
    useStore.setState({ profiles: { x: p }, currentId: 'x' });
    const rec = useStore.getState().finishMatch({ mode: 'training', exercise: 'squat', durationS: 30, reps: 5, timeline: [], ranked: true });
    expect(rec.newBadges ?? []).not.toContain('first_blood');
    expect(useStore.getState().profiles.x.badgeDates?.first_blood).toBeDefined();
  });
});

describe('Pfad-Kampf speichert Sterne', () => {
  it('Sieg mit viel Restzeit = 3 Sterne, nächste Station frei', () => {
    const p = {
      id: 'y', email: 'y@y.de', passHash: '', name: 'Test', code: 'ABC124', country: 'DE', createdAt: 0, xp: 0, gold: 0, gems: 0,
      elo: 1000, arenaPoints: 0, wins: 0, losses: 0, draws: 0, sessions: [], claimed: {}, favBadges: [], friends: [],
      dungeonsCleared: [], personalBests: {},
    } as unknown as Profile;
    useStore.setState({ profiles: { y: p }, currentId: 'y' });
    const n = ALL_NODES[0];
    const rec = useStore.getState().finishMatch({ mode: 'dungeon', exercise: n.exercise!, durationS: n.durationS!, reps: n.hp!, timeline: [], ranked: true, outcome: 'win', pathNodeId: n.id, timeLeft: 0.6 });
    expect(rec.stars).toBe(3);
    const after = useStore.getState().profiles.y;
    expect(after.path?.[n.id]?.stars).toBe(3);
    expect(currentNode(after)?.id).toBe(ALL_NODES[1].id);
    expect(rec.xp).toBeGreaterThan(0);
  });
});

import { recommend, GOALS, FITNESS } from '../src/lib/goals';
import { planById } from '../src/lib/plans';
import { fluxTip, weekDaysTrained } from '../src/lib/tips';

describe('Einführung & Flux', () => {
  it('jede Kombination aus Ziel und Fitness ergibt einen gültigen Plan', () => {
    for (const g of GOALS) for (const f of FITNESS) {
      const r = recommend(g.id, f.id);
      expect(planById(r.planId)).toBeDefined();
      expect(r.startMax).toBeGreaterThan(0);
    }
  });
  it('Profis starten höher als Einsteiger', () => {
    expect(recommend('muscle', 'advanced').startMax).toBeGreaterThan(recommend('muscle', 'beginner').startMax);
  });
  it('Tipp lobt nach Training und zählt Wochentage', () => {
    const now = new Date();
    const p = { sessions: [{ id: 'a', ts: now.getTime(), mode: 'training', exercise: 'squat', reps: 20, durationS: 60, timeline: [], xp: 0, gold: 0, gems: 0, ranked: true }], perWeek: 3, goal: 'lose' } as unknown as Profile;
    expect(weekDaysTrained(p, now)).toBe(1);
    expect(fluxTip(p, now).text).toContain('20 Wiederholungen');
  });
});
