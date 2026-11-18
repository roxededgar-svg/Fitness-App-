/**
 * Online-Raum: bis zu 4 Spieler auf eigenen Geräten, zwei Teams (1v1, 1v2, 2v2).
 * Der Gastgeber hält den Zustand und verteilt ihn an alle („Stern“-Verbindung).
 * Übertragen werden nur Namen, Teams und Wiederholungszahlen – nie Kamerabilder.
 * Die Verbindungsart ist austauschbar (PeerJS für echte Geräte, BroadcastChannel/Speicher für Tests).
 */
import type { ExerciseId } from './exercises';

export const MAX_PLAYERS = 4;
export const MAX_PER_TEAM = 2;
export const COUNTDOWN_MS = 3500;

export type Team = 0 | 1;
export type RoomPhase = 'lobby' | 'countdown' | 'live' | 'done';

export interface RoomPlayer {
  id: string;
  name: string;
  team: Team;
  ready: boolean;
  reps: number;
  trophies: number;
  host: boolean;
  online: boolean;
  finished: boolean;
}

export interface RoomSnapshot {
  code: string;
  phase: RoomPhase;
  exercise: ExerciseId;
  durationS: number;
  players: RoomPlayer[];
  /** Zähler, damit Clients einen neuen Start erkennen */
  round: number;
}

export type Msg =
  | { t: 'hello'; name: string; trophies: number }
  | { t: 'state'; s: RoomSnapshot; you: string }
  | { t: 'team'; team: Team }
  | { t: 'ready'; ready: boolean }
  | { t: 'cfg'; exercise: ExerciseId; durationS: number }
  | { t: 'rep'; reps: number }
  | { t: 'finished'; reps: number }
  | { t: 'start' }
  | { t: 'again' }
  | { t: 'full' };

/** Eine Verbindung zu genau einem Gegenüber */
export interface Link {
  id: string;
  send(m: Msg): void;
  onMessage(cb: (m: Msg) => void): void;
  onClose(cb: () => void): void;
  close(): void;
}

export const teamReps = (s: RoomSnapshot, team: Team) => s.players.filter((p) => p.team === team).reduce((a, p) => a + p.reps, 0);

export function canStart(s: RoomSnapshot) {
  const on = s.players.filter((p) => p.online);
  return s.phase === 'lobby' && on.some((p) => p.team === 0) && on.some((p) => p.team === 1) && on.every((p) => p.ready || p.host);
}

function freeTeam(players: RoomPlayer[]): Team | null {
  const a = players.filter((p) => p.team === 0 && p.online).length;
  const b = players.filter((p) => p.team === 1 && p.online).length;
  if (a >= MAX_PER_TEAM && b >= MAX_PER_TEAM) return null;
  if (a >= MAX_PER_TEAM) return 1;
  if (b >= MAX_PER_TEAM) return 0;
  return b < a ? 1 : 0;
}

type Listener = (s: RoomSnapshot) => void;

/** Gastgeber: hält den maßgeblichen Zustand */
export class HostRoom {
  private s: RoomSnapshot;
  private links = new Map<string, Link>();
  private listeners = new Set<Listener>();
  readonly selfId = 'host';

  constructor(code: string, host: { name: string; trophies: number }, exercise: ExerciseId, durationS: number) {
    this.s = {
      code, phase: 'lobby', exercise, durationS, round: 0,
      players: [{ id: this.selfId, name: host.name, team: 0, ready: true, reps: 0, trophies: host.trophies, host: true, online: true, finished: false }],
    };
  }

  get state() { return this.s; }
  subscribe(cb: Listener) { this.listeners.add(cb); cb(this.s); return () => void this.listeners.delete(cb); }

  private set(fn: (s: RoomSnapshot) => RoomSnapshot) {
    this.s = fn(this.s);
    for (const [id, l] of this.links) l.send({ t: 'state', s: this.s, you: id });
    this.listeners.forEach((cb) => cb(this.s));
  }
  private patchPlayer(id: string, patch: Partial<RoomPlayer>) {
    this.set((s) => ({ ...s, players: s.players.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  }

  /** Neue eingehende Verbindung */
  addLink(link: Link) {
    link.onMessage((m) => this.onMsg(link, m));
    link.onClose(() => {
      this.links.delete(link.id);
      if (this.s.phase === 'lobby') this.set((s) => ({ ...s, players: s.players.filter((p) => p.id !== link.id) }));
      else this.patchPlayer(link.id, { online: false, finished: true });
      this.maybeFinish();
    });
  }

  private onMsg(link: Link, m: Msg) {
    const id = link.id;
    switch (m.t) {
      case 'hello': {
        const existing = this.s.players.find((p) => p.id === id);
        if (existing) { this.links.set(id, link); this.patchPlayer(id, { online: true, name: m.name.slice(0, 18) }); return; }
        const online = this.s.players.filter((p) => p.online).length;
        const team = freeTeam(this.s.players);
        if (online >= MAX_PLAYERS || team == null || this.s.phase !== 'lobby') { link.send({ t: 'full' }); link.close(); return; }
        this.links.set(id, link);
        this.set((s) => ({ ...s, players: [...s.players, { id, name: m.name.slice(0, 18) || 'Gast', team, ready: false, reps: 0, trophies: m.trophies, host: false, online: true, finished: false }] }));
        return;
      }
      case 'team': this.setTeam(id, m.team); return;
      case 'ready': if (this.s.phase === 'lobby') this.patchPlayer(id, { ready: m.ready }); return;
      case 'rep': if (this.s.phase === 'live' || this.s.phase === 'countdown') this.patchPlayer(id, { reps: Math.max(0, Math.round(m.reps)) }); return;
      case 'finished': this.patchPlayer(id, { reps: Math.max(0, Math.round(m.reps)), finished: true }); this.maybeFinish(); return;
      default: return;
    }
  }

  setTeam(id: string, team: Team) {
    if (this.s.phase !== 'lobby') return;
    const count = this.s.players.filter((p) => p.team === team && p.online && p.id !== id).length;
    if (count >= MAX_PER_TEAM) return;
    this.patchPlayer(id, { team });
  }
  configure(exercise: ExerciseId, durationS: number) {
    if (this.s.phase === 'lobby') this.set((s) => ({ ...s, exercise, durationS }));
  }
  start() {
    if (!canStart(this.s)) return false;
    this.set((s) => ({ ...s, phase: 'countdown', round: s.round + 1, players: s.players.filter((p) => p.online).map((p) => ({ ...p, reps: 0, finished: false })) }));
    return true;
  }
  /** Countdown vorbei (nur Gastgeber-Uhr entscheidet) */
  goLive() { if (this.s.phase === 'countdown') this.set((s) => ({ ...s, phase: 'live' })); }
  myReps(reps: number) { this.patchPlayer(this.selfId, { reps }); }
  myFinished(reps: number) { this.patchPlayer(this.selfId, { reps, finished: true }); this.maybeFinish(); }
  /** Spätestens nach Ablauf + Puffer beenden, auch wenn jemand hängt */
  forceFinish() { if (this.s.phase === 'live') this.set((s) => ({ ...s, phase: 'done' })); }
  again() {
    if (this.s.phase !== 'done') return;
    this.set((s) => ({ ...s, phase: 'lobby', players: s.players.filter((p) => p.online).map((p) => ({ ...p, reps: 0, finished: false, ready: p.host })) }));
  }
  private maybeFinish() {
    if (this.s.phase === 'live' && this.s.players.filter((p) => p.online).every((p) => p.finished)) this.set((s) => ({ ...s, phase: 'done' }));
  }
  close() { this.links.forEach((l) => l.close()); this.links.clear(); }
}

/** Mitspieler: spiegelt den Zustand des Gastgebers */
export class GuestRoom {
  private s: RoomSnapshot | null = null;
  private listeners = new Set<(s: RoomSnapshot | null, info: { selfId: string; full?: boolean; lost?: boolean }) => void>();
  selfId = '';
  private full = false;
  private lost = false;

  constructor(private link: Link, me: { name: string; trophies: number }) {
    link.onMessage((m) => {
      if (m.t === 'state') { this.s = m.s; this.selfId = m.you; this.emit(); }
      if (m.t === 'full') { this.full = true; this.emit(); }
    });
    link.onClose(() => { this.lost = true; this.emit(); });
    link.send({ t: 'hello', name: me.name, trophies: me.trophies });
  }
  get state() { return this.s; }
  private emit() { this.listeners.forEach((cb) => cb(this.s, { selfId: this.selfId, full: this.full, lost: this.lost })); }
  subscribe(cb: (s: RoomSnapshot | null, info: { selfId: string; full?: boolean; lost?: boolean }) => void) { this.listeners.add(cb); cb(this.s, { selfId: this.selfId, full: this.full, lost: this.lost }); return () => void this.listeners.delete(cb); }
  setTeam(team: Team) { this.link.send({ t: 'team', team }); }
  setReady(ready: boolean) { this.link.send({ t: 'ready', ready }); }
  myReps(reps: number) { this.link.send({ t: 'rep', reps }); }
  myFinished(reps: number) { this.link.send({ t: 'finished', reps }); }
  close() { this.link.close(); }
}

/* ---------- Test-/Speicher-Verbindung ---------- */

/** Zwei miteinander verbundene Enden im selben Prozess (für Tests) */
export function memoryPair(idA = 'host', idB = Math.random().toString(36).slice(2, 8)): [Link, Link] {
  const make = (selfId: string) => {
    const msgs: ((m: Msg) => void)[] = [];
    const closes: (() => void)[] = [];
    return { selfId, msgs, closes, other: null as null | { msgs: ((m: Msg) => void)[]; closes: (() => void)[] }, open: true };
  };
  const a = make(idA), b = make(idB);
  a.other = b; b.other = a;
  const link = (me: ReturnType<typeof make>, remoteId: string): Link => ({
    id: remoteId,
    send: (m) => { if (me.open) me.other!.msgs.forEach((cb) => cb(JSON.parse(JSON.stringify(m)))); },
    onMessage: (cb) => void me.msgs.push(cb),
    onClose: (cb) => void me.closes.push(cb),
    close: () => {
      if (!me.open) return;
      me.open = false;
      me.other && (me.other as ReturnType<typeof make>).open && ((me.other as ReturnType<typeof make>).open = false);
      me.closes.forEach((cb) => cb());
      me.other!.closes.forEach((cb) => cb());
    },
  });
  // Host-Seite sieht den Gast unter dessen ID, Gast-Seite sieht den Host
  return [link(a, idB), link(b, idA)];
}
