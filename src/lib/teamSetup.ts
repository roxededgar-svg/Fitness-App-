import type { ExerciseId } from './exercises';
import type { Profile } from './types';
import type { Member, TeamConfig, TeamMode } from './team';
import type { TeamMemberRun } from './duel';
import { botPool } from './bots';
import { todayKey } from './rng';
import { humanTimeline, rankedOpponentRpm } from './pace';

/** Zwei KI-Gegner bzw. ein KI-Partner im Tempo deines Rangs */
export function aiMembers(me: Profile, ex: ExerciseId, durationS: number, n: number, exclude: string[] = []): Member[] {
  const pool = botPool(todayKey()).filter((b) => !exclude.includes(b.name));
  const start = Math.floor(Math.random() * Math.max(1, pool.length - n));
  return pool.slice(start, start + n).map((b, i) => ({
    name: b.name, kind: 'bot', country: b.country,
    timeline: humanTimeline(rankedOpponentRpm(ex, me) * (0.88 + Math.random() * 0.18), durationS, Date.now() + i * 977),
  }));
}

const meLive = (me: Profile, slot: 0 | 1 = 0): Member => ({ name: me.name, kind: 'live', slot, me: true, code: me.code, country: me.country, trophies: me.arenaPoints });
const ghost = (r: TeamMemberRun): Member => ({ name: r.n, kind: 'ghost', timeline: r.timeline, code: r.c, country: r.co, trophies: r.a });

export function buildConfig(opts: {
  mode: TeamMode; me: Profile; exercise: ExerciseId; durationS: number; guest?: string; teammate?: TeamMemberRun; rivals?: TeamMemberRun[];
}): TeamConfig {
  const { mode, me, exercise: ex, durationS: d } = opts;
  const guest = (opts.guest?.trim() || 'Gast').slice(0, 18);
  if (mode === 'local1v1') {
    return { mode, exercise: ex, durationS: d, left: [meLive(me, 0)], right: [{ name: guest, kind: 'live', slot: 1 }], leftName: me.name, rightName: guest };
  }
  let left: Member[];
  if (mode === 'local2v2') left = [meLive(me, 0), { name: guest, kind: 'live', slot: 1 }];
  else if (mode === 'link2v2' && opts.teammate) left = [meLive(me), ghost(opts.teammate)];
  else left = [meLive(me), ...aiMembers(me, ex, d, 1)];
  const right = opts.rivals?.length ? opts.rivals.map(ghost) : aiMembers(me, ex, d, 2, left.map((m) => m.name));
  const leftName = left.length > 1 ? `Team ${me.name}` : me.name;
  const rightName = opts.rivals?.length ? `Team ${opts.rivals[0].n}` : 'KI-Team';
  return { mode, exercise: ex, durationS: d, left, right, leftName, rightName };
}
