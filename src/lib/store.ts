import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Friend, Mode, Profile, Queue, Result, SessionRecord, Settings } from './types';
import { EXERCISES, type ExerciseId } from './exercises';
import { arenaDelta, eloDelta, levelFromXp } from './progression';
import { todayKey, uid } from './rng';
import { dailyMissions } from './missions';
import { DUNGEONS } from './dungeons';
import { syncBadgeDates } from './badges';
import { nodeById, starsFor } from './path';
import { sessionTotals, dayOf } from './stats';
import { itemById } from './shop';
import { seasonId, seasonReward, softReset } from './season';
import { levelFromXp as lvl } from './progression';

async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  haptics: true,
  facing: 'user',
  mirror: true,
  showSkeleton: true,
  sensitivity: 'normal',
  tapMode: false,
};

export interface FinishInput {
  mode: Mode;
  exercise: ExerciseId;
  durationS: number;
  reps: number;
  timeline: number[];
  oppName?: string;
  oppElo?: number;
  oppReps?: number;
  oppTimeline?: number[];
  ranked: boolean;
  queue?: Queue;
  dungeonId?: string;
  /** Aufgegeben → zählt als Niederlage */
  forfeit?: boolean;
  /** Fester Ausgang (Dungeon: Boss besiegt oder nicht) */
  outcome?: Result;
  /** Trainingspfad-Station */
  pathNodeId?: string;
  /** Anteil der Restzeit beim Sieg (0..1) → Sterne */
  timeLeft?: number;
  bossMaxHp?: number;
  bossHpLeft?: number;
  maxCombo?: number;
}

interface State {
  profiles: Record<string, Profile>;
  currentId: string | null;
  settings: Settings;
  register(email: string, password: string, name: string): Promise<string | null>;
  login(email: string, password: string): Promise<string | null>;
  logout(): void;
  updateProfile(patch: Partial<Profile>): void;
  updateSettings(patch: Partial<Settings>): void;
  finishMatch(input: FinishInput): SessionRecord;
  claimMission(id: string): void;
  addFriend(f: Omit<Friend, 'addedAt'>): void;
  removeFriend(code: string): void;
  resetProgress(): void;
  /** Erhalt-Daten für bereits verdiente Abzeichen nachtragen (z. B. für bestehende Profile) */
  syncBadges(): void;
  /** Schatzkiste auf dem Pfad öffnen; gibt Belohnung zurück */
  openChest(nodeId: string): { xp: number; gold: number; gems: number } | null;
  /** Sicherung des aktuellen Profils als Text (JSON) */
  /** Shop-Artikel kaufen; gibt Fehlermeldung oder null zurück */
  buy(itemId: string): string | null;
  equip(kind: 'frame' | 'title', itemId: string | undefined): void;
  /** Setzt bei verpasstem Vortag automatisch einen Streak-Schutz ein; gibt true zurück, wenn genutzt */
  applyStreakFreeze(): boolean;
  /** Prüft Saisonwechsel: Belohnung + weicher Trophäen-Reset. Gibt Zusammenfassung zurück. */
  checkSeason(): { season: string; peak: number; gems: number; gold: number; tierName: string; before: number; after: number } | null;
  startPlan(planId: string, startMax: number): void;
  completePlanDay(planId: string): void;
  stopPlan(planId: string): void;
  exportBackup(): string;
  /** Sicherung einspielen; gibt Fehlermeldung oder null zurück */
  importBackup(json: string): string | null;
}

const findByEmail = (profiles: Record<string, Profile>, email: string) =>
  Object.values(profiles).find((p) => p.email === email.trim().toLowerCase());

function blankProfile(email: string, passHash: string, name: string): Profile {
  const lang = (navigator.language || 'de-DE').split('-')[1]?.toUpperCase();
  return {
    id: uid(),
    email: email.trim().toLowerCase(),
    passHash,
    name: name.trim().slice(0, 18),
    code: newCode(),
    country: lang && lang.length === 2 ? lang : 'DE',
    createdAt: Date.now(),
    xp: 0,
    gold: 0,
    gems: 0,
    elo: 1000,
    arenaPoints: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    sessions: [],
    claimed: {},
    favBadges: [],
    friends: [],
    dungeonsCleared: [],
    personalBests: {},
    onboarded: false,
  };
}

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const patchMe = (fn: (p: Profile) => Profile) => {
        const { currentId, profiles } = get();
        if (!currentId || !profiles[currentId]) return;
        set({ profiles: { ...profiles, [currentId]: fn(profiles[currentId]) } });
      };

      return {
        profiles: {},
        currentId: null,
        settings: DEFAULT_SETTINGS,

        async register(email, password, name) {
          if (!/^\S+@\S+\.\S+$/.test(email)) return 'Bitte gültige E-Mail eingeben.';
          if (password.length < 6) return 'Passwort muss mind. 6 Zeichen haben.';
          if (name.trim().length < 3) return 'Name muss mind. 3 Zeichen haben.';
          if (findByEmail(get().profiles, email)) return 'Diese E-Mail ist bereits registriert.';
          const p = blankProfile(email, await sha256(password), name);
          set({ profiles: { ...get().profiles, [p.id]: p }, currentId: p.id });
          return null;
        },

        async login(email, password) {
          const p = findByEmail(get().profiles, email);
          if (!p || p.passHash !== (await sha256(password))) return 'E-Mail oder Passwort falsch.';
          set({ currentId: p.id });
          return null;
        },

        logout: () => set({ currentId: null }),
        updateProfile: (patch) => patchMe((p) => ({ ...p, ...patch })),
        updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),

        finishMatch(input) {
          const me = get().profiles[get().currentId!];
          const ex = EXERCISES[input.exercise];
          const active = input.reps > 0; // Anti-AFK: ohne Wiederholung keine Belohnung
          let result: Result | undefined;
          if (input.outcome) {
            result = input.forfeit ? 'loss' : input.outcome;
          } else if (input.oppReps != null) {
            result = input.forfeit ? 'loss' : input.reps > input.oppReps ? 'win' : input.reps < input.oppReps ? 'loss' : 'draw';
          }
          const score = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
          // Ranked: ELO + Rang-Punkte · Schnellkampf: nur Sieg/Niederlage · Eigenes Tempo: nichts
          const queue = input.queue ?? 'ranked';
          const isPvp = input.mode === 'pvp' && input.ranked && queue !== 'custom';
          const isRanked = isPvp && queue === 'ranked';
          const dElo = isRanked ? eloDelta(me.elo, input.oppElo ?? 1000, score) : 0;
          const dArena = isRanked ? Math.max(-me.arenaPoints, arenaDelta(score, me.elo, input.oppElo ?? 1000)) : 0;

          let xp = 0, gold = 0, gems = 0, firstClear = false;
          if (active) {
            xp = Math.round(input.reps * ex.xpPerRep);
            gold = Math.round(input.reps / 4);
            if (input.mode === 'pvp' || input.mode === 'ghost') {
              const f = input.queue === 'custom' ? 0.5 : input.queue === 'casual' ? 0.8 : 1;
              xp += Math.round((result === 'win' ? 60 : result === 'draw' ? 35 : 20) * f);
              gold += Math.round((result === 'win' ? 30 : 10) * f);
            }
            if (input.mode === 'dungeon' && result === 'win') {
              const node = input.pathNodeId ? nodeById(input.pathNodeId) : undefined;
              const d = DUNGEONS.find((x) => x.id === input.dungeonId);
              const reward = node ?? d!;
              firstClear = input.ranked && (node ? !me.path?.[node.id] && !(node.kind === 'boss' && me.dungeonsCleared.includes(node.worldId)) : !me.dungeonsCleared.includes(d!.id));
              const f = firstClear ? 1 : 0.4;
              xp += Math.round(reward.xp * f);
              gold += Math.round(reward.gold * f);
              gems += firstClear ? reward.gems : 0;
            }
          }
          if (!input.ranked) {
            xp = Math.round(xp * 0.5);
            gold = Math.round(gold * 0.5);
            gems = 0;
          }

          const before = levelFromXp(me.xp).level;
          const after = levelFromXp(me.xp + xp).level;
          const rec: SessionRecord = {
            id: uid(),
            ts: Date.now(),
            mode: input.mode,
            exercise: input.exercise,
            reps: input.reps,
            durationS: input.durationS,
            timeline: input.timeline,
            oppName: input.oppName,
            oppReps: input.oppReps,
            oppTimeline: input.oppTimeline,
            result,
            eloBefore: me.elo,
            eloDelta: dElo,
            arenaBefore: me.arenaPoints,
            arenaDelta: dArena,
            xp,
            gold,
            gems,
            ranked: input.ranked,
            queue: input.mode === 'pvp' ? queue : undefined,
            dungeonId: input.dungeonId,
            firstClear,
            bossMaxHp: input.bossMaxHp,
            bossHpLeft: input.bossHpLeft,
            maxCombo: input.maxCombo,
            pathNodeId: input.pathNodeId,
            stars: input.pathNodeId && result === 'win' && input.ranked ? starsFor(input.timeLeft ?? 0) : undefined,
            levelUp: after > before ? after : undefined,
          };
          patchMe((p) => ({
            ...p,
            xp: p.xp + xp,
            gold: p.gold + gold,
            gems: p.gems + gems,
            elo: p.elo + dElo,
            arenaPoints: p.arenaPoints + dArena,
            season: p.season ? { ...p.season, peak: Math.max(p.season.peak, p.arenaPoints + dArena) } : p.season,
            wins: p.wins + (isPvp && result === 'win' ? 1 : 0),
            losses: p.losses + (isPvp && result === 'loss' ? 1 : 0),
            draws: p.draws + (isPvp && result === 'draw' ? 1 : 0),
            lifetime: (() => {
              const base = p.lifetime ?? sessionTotals(p);
              const counted = input.exercise !== 'plank';
              return {
                reps: base.reps + (counted ? input.reps : 0),
                best: counted ? Math.max(base.best, input.reps) : base.best,
                trainings: base.trainings + (input.mode === 'training' ? 1 : 0),
                pvp: base.pvp + (input.mode === 'pvp' || input.mode === 'ghost' ? 1 : 0),
                dungeons: base.dungeons + (input.mode === 'dungeon' && result === 'win' ? 1 : 0),
              };
            })(),
            sessions: [...p.sessions, rec].slice(-500),
            dungeonsCleared:
              result === 'win' && input.dungeonId && input.ranked && !p.dungeonsCleared.includes(input.dungeonId) ? [...p.dungeonsCleared, input.dungeonId] : p.dungeonsCleared,
            path:
              rec.stars && input.pathNodeId
                ? { ...(p.path ?? {}), [input.pathNodeId]: { stars: Math.max(rec.stars, p.path?.[input.pathNodeId]?.stars ?? 0), clearedAt: p.path?.[input.pathNodeId]?.clearedAt ?? Date.now() } }
                : p.path,
            personalBests:
              input.ranked && input.reps > (p.personalBests[input.exercise] ?? 0) && input.durationS > 0
                ? { ...p.personalBests, [input.exercise]: input.reps }
                : p.personalBests,
          }));
          // Neu erreichte Abzeichen festhalten. Abzeichen, die schon VOR dem Kampf
          // verdient waren (z. B. bei älteren Profilen ohne Datum), zählen nicht als neu.
          const baseline = syncBadgeDates(me).badgeDates;
          const updated = get().profiles[get().currentId!];
          const { badgeDates, added } = syncBadgeDates({ ...updated, badgeDates: baseline });
          if (!added.length && Object.keys(baseline).length !== Object.keys(me.badgeDates ?? {}).length) {
            patchMe((p) => ({ ...p, badgeDates }));
          }
          if (added.length) {
            rec.newBadges = added;
            patchMe((p) => ({
              ...p,
              badgeDates,
              sessions: p.sessions.map((x) => (x.id === rec.id ? { ...x, newBadges: added } : x)),
            }));
          }
          return rec;
        },

        buy(itemId) {
          const item = itemById(itemId);
          const me = get().profiles[get().currentId!];
          if (!item) return 'Unbekannter Artikel';
          if (lvl(me.xp).level < item.minLevel) return `Ab Level ${item.minLevel} verfügbar`;
          if (item.kind !== 'freeze' && me.owned?.includes(item.id)) return 'Schon gekauft';
          const have = item.currency === 'gold' ? me.gold : me.gems;
          if (have < item.price) return item.currency === 'gold' ? 'Nicht genug Gold' : 'Nicht genug Edelsteine';
          patchMe((p) => ({
            ...p,
            gold: item.currency === 'gold' ? p.gold - item.price : p.gold,
            gems: item.currency === 'gems' ? p.gems - item.price : p.gems,
            owned: item.kind === 'freeze' ? p.owned : [...(p.owned ?? []), item.id],
            streakFreezes: item.kind === 'freeze' ? (p.streakFreezes ?? 0) + 1 : p.streakFreezes,
            equipped: item.kind === 'frame' || item.kind === 'title' ? { ...(p.equipped ?? {}), [item.kind]: item.id } : p.equipped,
          }));
          return null;
        },

        equip(kind, itemId) {
          patchMe((p) => (itemId && !p.owned?.includes(itemId) ? p : { ...p, equipped: { ...(p.equipped ?? {}), [kind]: itemId } }));
        },

        checkSeason() {
          const me = get().profiles[get().currentId!];
          if (!me) return null;
          const now = seasonId();
          if (!me.season) {
            patchMe((p) => ({ ...p, season: { id: now, peak: p.arenaPoints } }));
            return null;
          }
          if (me.season.id === now) return null;
          const peak = Math.max(me.season.peak, me.arenaPoints);
          const r = seasonReward(peak);
          const after = softReset(me.arenaPoints);
          const summary = { season: me.season.id, peak, gems: r.gems, gold: r.gold, tierName: r.tier.name, before: me.arenaPoints, after };
          patchMe((p) => ({ ...p, gems: p.gems + r.gems, gold: p.gold + r.gold, arenaPoints: after, season: { id: now, peak: after } }));
          return summary;
        },

        applyStreakFreeze() {
          const me = get().profiles[get().currentId!];
          if (!me || !(me.streakFreezes ?? 0)) return false;
          const active = new Set([...me.sessions.filter((s) => s.reps > 0).map((s) => dayOf(s.ts)), ...(me.frozenDays ?? [])]);
          const d = new Date();
          const today = todayKey(d);
          d.setDate(d.getDate() - 1);
          const yesterday = todayKey(d);
          d.setDate(d.getDate() - 1);
          const before = todayKey(d);
          // Nur retten, wenn gestern fehlt, aber vorgestern trainiert wurde (laufende Serie)
          if (active.has(yesterday) || active.has(today) || !active.has(before)) return false;
          patchMe((p) => ({ ...p, streakFreezes: (p.streakFreezes ?? 1) - 1, frozenDays: [...(p.frozenDays ?? []), yesterday].slice(-60) }));
          return true;
        },

        startPlan(planId, startMax) {
          patchMe((p) => ({ ...p, plans: { ...(p.plans ?? {}), [planId]: { startMax: Math.max(1, Math.round(startMax)), done: 0, startedAt: Date.now() } } }));
        },
        completePlanDay(planId) {
          patchMe((p) => {
            const cur = p.plans?.[planId];
            if (!cur) return p;
            return { ...p, plans: { ...p.plans, [planId]: { ...cur, done: cur.done + 1, lastAt: Date.now() } } };
          });
        },
        stopPlan(planId) {
          patchMe((p) => {
            const rest = { ...(p.plans ?? {}) };
            delete rest[planId];
            return { ...p, plans: rest };
          });
        },

        exportBackup() {
          const me = get().profiles[get().currentId!];
          return JSON.stringify({ app: 'vitalis', v: 1, exportedAt: Date.now(), profile: me });
        },

        importBackup(json) {
          let data: { app?: string; profile?: Profile };
          try {
            data = JSON.parse(json);
          } catch {
            return 'Datei ist keine gültige Sicherung.';
          }
          const p = data?.profile;
          if (data?.app !== 'vitalis' || !p || typeof p.id !== 'string' || !Array.isArray(p.sessions) || typeof p.email !== 'string') {
            return 'Datei ist keine Vitalis-Sicherung.';
          }
          const profiles = { ...get().profiles };
          for (const [id, other] of Object.entries(profiles)) if (other.email === p.email && id !== p.id) delete profiles[id];
          profiles[p.id] = { ...blankProfile(p.email, p.passHash, p.name), onboarded: true, ...p };
          set({ profiles, currentId: p.id });
          return null;
        },

        openChest(nodeId) {
          const node = nodeById(nodeId);
          const me = get().profiles[get().currentId!];
          if (!node || node.kind !== 'chest' || me.path?.[nodeId]) return null;
          const reward = { xp: node.xp, gold: node.gold, gems: node.gems };
          patchMe((p) => ({
            ...p,
            xp: p.xp + reward.xp,
            gold: p.gold + reward.gold,
            gems: p.gems + reward.gems,
            path: { ...(p.path ?? {}), [nodeId]: { stars: 0, clearedAt: Date.now() } },
          }));
          return reward;
        },

        syncBadges() {
          patchMe((p) => {
            const { badgeDates, added } = syncBadgeDates(p);
            return added.length ? { ...p, badgeDates } : p;
          });
        },

        claimMission(id) {
          patchMe((p) => {
            const key = todayKey();
            const m = dailyMissions(p, key).find((x) => x.id === id);
            if (!m || !m.done || m.claimed) return p;
            return {
              ...p,
              xp: p.xp + m.xp,
              gold: p.gold + m.gold,
              claimed: { ...p.claimed, [key]: [...(p.claimed[key] ?? []), id] },
            };
          });
        },

        addFriend(f) {
          patchMe((p) => {
            if (f.code === p.code) return p;
            const rest = p.friends.filter((x) => x.code !== f.code);
            return { ...p, friends: [...rest, { ...f, addedAt: Date.now() }] };
          });
        },
        removeFriend: (code) => patchMe((p) => ({ ...p, friends: p.friends.filter((f) => f.code !== code) })),

        resetProgress() {
          patchMe((p) => ({
            ...blankProfile(p.email, p.passHash, p.name),
            id: p.id,
            code: p.code,
            avatar: p.avatar,
            country: p.country,
            createdAt: p.createdAt,
            onboarded: true,
          }));
        },
      };
    },
    { name: 'vitalis-store', version: 1 },
  ),
);

export const useMe = () => useStore((s) => (s.currentId ? s.profiles[s.currentId] : null));
export const useSettings = () => useStore((s) => s.settings);
