import type { ExerciseId } from './exercises';

/** Ein asynchrones Duell: dein Lauf als „Ghost“, den ein Freund per Link herausfordern kann. */
export interface DuelPayload {
  v: 1;
  n: string; // Name
  c: string; // Spieler-Code
  co: string; // Land
  e: number; // ELO
  a: number; // Arena-Punkte
  l: number; // Level
  x: ExerciseId;
  d: number; // Dauer in s
  t: number[]; // Rep-Zeitpunkte in Zehntelsekunden (Deltas)
}

const toB64 = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64 = (s: string) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
};

export function encodeDuel(p: Omit<DuelPayload, 'v' | 't'> & { timeline: number[] }): string {
  let prev = 0;
  const t = p.timeline.map((ms) => {
    const ds = Math.round(ms / 100);
    const d = ds - prev;
    prev = ds;
    return d;
  });
  const { timeline: _omit, ...rest } = p;
  void _omit;
  return toB64(JSON.stringify({ v: 1, ...rest, t }));
}

export function decodeDuel(code: string): (DuelPayload & { timeline: number[] }) | null {
  try {
    const p = JSON.parse(fromB64(code.trim())) as DuelPayload;
    if (p.v !== 1 || !Array.isArray(p.t) || typeof p.n !== 'string') return null;
    let acc = 0;
    const timeline = p.t.map((d) => (acc += d) * 100);
    return { ...p, n: p.n.slice(0, 24), timeline };
  } catch {
    return null;
  }
}

/** Extrahiert den Duell-Code aus einem eingefügten Link oder Rohcode. */
export function extractDuelCode(input: string): string | null {
  const m = input.match(/[?&]c=([A-Za-z0-9_-]+)/);
  const code = m ? m[1] : input.trim();
  return decodeDuel(code) ? code : null;
}

export function duelUrl(code: string) {
  const base = window.location.href.split('#')[0];
  return `${base}#/duel?c=${code}`;
}

/* ---------- Team-Links: 1–2 aufgezeichnete Läufe ---------- */

export interface TeamMemberRun {
  n: string; // Name
  c: string; // Spieler-Code
  co: string; // Land
  a: number; // Trophäen
  timeline: number[];
}

interface TeamPayload {
  v: 1;
  k: 'team';
  x: ExerciseId;
  d: number;
  m: { n: string; c: string; co: string; a: number; t: number[] }[];
}

const toDeltas = (tl: number[]) => {
  let prev = 0;
  return tl.map((ms) => {
    const ds = Math.round(ms / 100);
    const d = ds - prev;
    prev = ds;
    return d;
  });
};
const fromDeltas = (t: number[]) => {
  let acc = 0;
  return t.map((d) => (acc += d) * 100);
};

export function encodeTeam(x: ExerciseId, d: number, members: TeamMemberRun[]): string {
  const p: TeamPayload = { v: 1, k: 'team', x, d, m: members.slice(0, 2).map((m) => ({ n: m.n.slice(0, 24), c: m.c, co: m.co, a: m.a, t: toDeltas(m.timeline) })) };
  return toB64(JSON.stringify(p));
}

export function decodeTeam(code: string): { x: ExerciseId; d: number; members: TeamMemberRun[] } | null {
  try {
    const p = JSON.parse(fromB64(code.trim())) as TeamPayload;
    if (p.v !== 1 || p.k !== 'team' || !Array.isArray(p.m) || !p.m.length || p.m.length > 2) return null;
    if (p.m.some((m) => typeof m.n !== 'string' || !Array.isArray(m.t))) return null;
    return { x: p.x, d: p.d, members: p.m.map((m) => ({ n: m.n.slice(0, 24), c: m.c, co: m.co, a: m.a, timeline: fromDeltas(m.t) })) };
  } catch {
    return null;
  }
}

export function teamUrl(code: string) {
  const base = window.location.href.split('#')[0];
  return `${base}#/team?c=${code}`;
}
