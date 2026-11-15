import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Friend, Mode, Profile, Queue, Result, SessionRecord, Settings } from './types';
import { EXERCISES, type ExerciseId } from './exercises';
import { arenaDelta, eloDelta, levelFromXp } from './progression';
import { todayKey, uid } from './rng';
import { dailyMissions } from './missions';
import { DUNGEONS } from './dungeons';
import { syncBadgeDates } from './badges';

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
              const d = DUNGEONS.find((x) => x.id === input.dungeonId)!;
              firstClear = input.ranked && !me.dungeonsCleared.includes(d.id);
              const f = firstClear ? 1 : 0.4;
              xp += Math.round(d.xp * f);
              gold += Math.round(d.gold * f);
              gems += firstClear ? d.gems : 0;
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
            levelUp: after > before ? after : undefined,
          };
          patchMe((p) => ({
            ...p,
            xp: p.xp + xp,
            gold: p.gold + gold,
            gems: p.gems + gems,
            elo: p.elo + dElo,
            arenaPoints: p.arenaPoints + dArena,
            wins: p.wins + (isPvp && result === 'win' ? 1 : 0),
            losses: p.losses + (isPvp && result === 'loss' ? 1 : 0),
            draws: p.draws + (isPvp && result === 'draw' ? 1 : 0),
            sessions: [...p.sessions, rec].slice(-500),
            dungeonsCleared:
              firstClear && input.dungeonId && input.ranked ? [...p.dungeonsCleared, input.dungeonId] : p.dungeonsCleared,
            personalBests:
              input.ranked && input.reps > (p.personalBests[input.exercise] ?? 0) && input.durationS > 0
                ? { ...p.personalBests, [input.exercise]: input.reps }
                : p.personalBests,
          }));
          // Neu erreichte Abzeichen festhalten
          const updated = get().profiles[get().currentId!];
          const { badgeDates, added } = syncBadgeDates(updated);
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
          }));
        },
      };
    },
    { name: 'vitalis-store', version: 1 },
  ),
);

export const useMe = () => useStore((s) => (s.currentId ? s.profiles[s.currentId] : null));
export const useSettings = () => useStore((s) => s.settings);
