import type { ExerciseId } from '../lib/exercises';

/** Minimal-Landmark wie von MediaPipe geliefert (normalisierte Koordinaten 0..1). */
export interface Lm {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export const LM = {
  nose: 0,
  lShoulder: 11, rShoulder: 12,
  lElbow: 13, rElbow: 14,
  lWrist: 15, rWrist: 16,
  lHip: 23, rHip: 24,
  lKnee: 25, rKnee: 26,
  lAnkle: 27, rAnkle: 28,
} as const;

export type Sensitivity = 'easy' | 'normal' | 'strict';

export interface CounterFrame {
  reps: number;
  /** true, wenn alle benötigten Gelenke sicher erkannt werden. */
  tracking: boolean;
  /** 0 = oben/Startposition, 1 = volle Tiefe (für die Tiefen-Anzeige). */
  depth: number;
  /** Kurzer Form-Hinweis, z. B. „Tiefer!“ */
  hint: string | null;
  /** true genau in dem Frame, in dem eine Wiederholung gezählt wurde. */
  repped: boolean;
}

export interface RepCounter {
  readonly exercise: ExerciseId;
  /** @param aspect Bildbreite / Bildhöhe, damit Winkel nicht verzerrt werden. */
  update(lms: Lm[] | null, tMs: number, aspect?: number): CounterFrame;
  reset(): void;
}

const MIN_VIS = 0.5;
const vis = (p?: Lm) => (p ? p.visibility ?? 1 : 0);

function pt(p: Lm, aspect: number) {
  return { x: p.x * aspect, y: p.y };
}

/** Innenwinkel bei b (Grad), Bildverhältnis-korrigiert. */
export function angle(a: Lm, b: Lm, c: Lm, aspect = 1): number {
  const A = pt(a, aspect), B = pt(b, aspect), C = pt(c, aspect);
  const v1x = A.x - B.x, v1y = A.y - B.y;
  const v2x = C.x - B.x, v2y = C.y - B.y;
  const dot = v1x * v2x + v1y * v2y;
  const m = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y);
  if (m === 0) return 180;
  return (Math.acos(Math.max(-1, Math.min(1, dot / m))) * 180) / Math.PI;
}

/** Neigung der Linie a→b gegenüber der Horizontalen (0 = waagrecht, 90 = senkrecht). */
export function tilt(a: Lm, b: Lm, aspect = 1): number {
  const A = pt(a, aspect), B = pt(b, aspect);
  return (Math.atan2(Math.abs(B.y - A.y), Math.abs(B.x - A.x)) * 180) / Math.PI;
}

type Side = 'l' | 'r';
const SIDE_IDX = {
  l: { s: LM.lShoulder, e: LM.lElbow, w: LM.lWrist, h: LM.lHip, k: LM.lKnee, a: LM.lAnkle },
  r: { s: LM.rShoulder, e: LM.rElbow, w: LM.rWrist, h: LM.rHip, k: LM.rKnee, a: LM.rAnkle },
};
type Joint = keyof (typeof SIDE_IDX)['l'];

/** Wählt die besser sichtbare Körperseite für die benötigten Gelenke. */
function bestSide(lms: Lm[], joints: Joint[]): { side: Side; ok: boolean } {
  const score = (s: Side) => Math.min(...joints.map((j) => vis(lms[SIDE_IDX[s][j]])));
  const l = score('l'), r = score('r');
  const side: Side = l >= r ? 'l' : 'r';
  return { side, ok: Math.max(l, r) >= MIN_VIS };
}

function j(lms: Lm[], side: Side, joint: Joint): Lm {
  return lms[SIDE_IDX[side][joint]];
}

const SENS: Record<Sensitivity, number> = { easy: 1, normal: 0, strict: -1 };

const emptyFrame = (reps: number): CounterFrame => ({ reps, tracking: false, depth: 0, hint: null, repped: false });

interface AngleSpec {
  joints: Joint[];
  /** Messwert (meist ein Winkel). null = Haltung ungültig (z. B. nicht waagrecht). */
  measure(lms: Lm[], side: Side, aspect: number): { value: number; hint?: string } | null;
  /** Wert in der Startposition (oben). */
  up: number;
  /** Wert in der Endposition (unten). */
  down: number;
  /** Mindestdauer einer Wiederholung in ms (gegen Zittern). */
  minRepMs: number;
  partialHint: string;
}

/**
 * Generischer Zwei-Phasen-Zähler mit Hysterese:
 * Start (oben) → Tiefpunkt erreicht → zurück nach oben = 1 Wiederholung.
 */
class AngleCounter implements RepCounter {
  private reps = 0;
  private phase: 'up' | 'down' = 'up';
  private smooth: number | null = null;
  private lastRep = -Infinity;
  private maxDepth = 0;
  private hint: string | null = null;
  private hintUntil = 0;

  constructor(
    readonly exercise: ExerciseId,
    private spec: AngleSpec,
    private sens: Sensitivity,
  ) {}

  reset() {
    this.reps = 0;
    this.phase = 'up';
    this.smooth = null;
    this.lastRep = -Infinity;
    this.maxDepth = 0;
  }

  private setHint(h: string, t: number) {
    this.hint = h;
    this.hintUntil = t + 1500;
  }

  update(lms: Lm[] | null, t: number, aspect = 1): CounterFrame {
    if (t > this.hintUntil) this.hint = null;
    if (!lms) return { ...emptyFrame(this.reps), hint: this.hint };
    const { side, ok } = bestSide(lms, this.spec.joints);
    if (!ok) return { ...emptyFrame(this.reps), hint: 'Ganzen Körper ins Bild' };
    const m = this.spec.measure(lms, side, aspect);
    if (!m) return { ...emptyFrame(this.reps), tracking: true, hint: this.hint };
    if (m.hint) this.setHint(m.hint, t);

    this.smooth = this.smooth == null ? m.value : this.smooth * 0.45 + m.value * 0.55;
    const s = SENS[this.sens];
    const span = this.spec.up - this.spec.down;
    // raw: 0 = Startposition, 1 = volle Tiefe (kann darüber/darunter liegen)
    const raw = (this.spec.up - this.smooth) / span;
    const depth = Math.max(0, Math.min(1, raw));
    const downAt = 1 - s * 0.12;
    const upAt = 0.12 + s * 0.08;
    let repped = false;

    if (this.phase === 'up') {
      this.maxDepth = Math.max(this.maxDepth, raw);
      if (raw >= downAt) {
        this.phase = 'down';
      } else if (raw <= upAt) {
        // Halbe Bewegung gemacht und wieder hoch → Form-Hinweis
        if (this.maxDepth > 0.4) this.setHint(this.spec.partialHint, t);
        this.maxDepth = 0;
      }
    } else if (raw <= upAt) {
      this.phase = 'up';
      this.maxDepth = 0;
      if (t - this.lastRep >= this.spec.minRepMs) {
        this.reps += 1;
        this.lastRep = t;
        repped = true;
      }
    }
    return { reps: this.reps, tracking: true, depth, hint: this.hint, repped };
  }
}

const isHorizontal = (lms: Lm[], side: Side, aspect: number, max = 40) =>
  tilt(j(lms, side, 's'), j(lms, side, 'h'), aspect) < max;

function pushupSpec(): AngleSpec {
  return {
    joints: ['s', 'e', 'w', 'h'],
    up: 160,
    down: 95,
    minRepMs: 450,
    partialHint: 'Tiefer runter!',
    measure(lms, side, aspect) {
      if (!isHorizontal(lms, side, aspect, 45)) return null;
      const value = angle(j(lms, side, 's'), j(lms, side, 'e'), j(lms, side, 'w'), aspect);
      let hint: string | undefined;
      if (vis(j(lms, side, 'k')) > MIN_VIS) {
        const body = angle(j(lms, side, 's'), j(lms, side, 'h'), j(lms, side, 'k'), aspect);
        if (body < 140) hint = 'Hüfte gerade halten';
      }
      return { value, hint };
    },
  };
}

function squatSpec(): AngleSpec {
  return {
    joints: ['h', 'k', 'a', 's'],
    up: 165,
    down: 100,
    minRepMs: 500,
    partialHint: 'Tiefer in die Hocke!',
    measure(lms, side, aspect) {
      // Oberkörper muss eher aufrecht sein (keine Liegestütz-Position)
      if (tilt(j(lms, side, 's'), j(lms, side, 'h'), aspect) < 40) return null;
      return { value: angle(j(lms, side, 'h'), j(lms, side, 'k'), j(lms, side, 'a'), aspect) };
    },
  };
}

function situpSpec(): AngleSpec {
  return {
    joints: ['s', 'h', 'k'],
    // Hüftwinkel: liegend groß (~130+), oben eingerollt klein (~60)
    up: 125,
    down: 70,
    minRepMs: 600,
    partialHint: 'Weiter hochkommen!',
    measure(lms, side, aspect) {
      return { value: angle(j(lms, side, 's'), j(lms, side, 'h'), j(lms, side, 'k'), aspect) };
    },
  };
}

/** Jumping Jacks: offen (Arme oben + Beine gespreizt) ↔ geschlossen. */
class JumpingJackCounter implements RepCounter {
  readonly exercise = 'jumpingjack' as const;
  private reps = 0;
  private open = false;
  private lastRep = -Infinity;
  constructor(private sens: Sensitivity) {}
  reset() {
    this.reps = 0;
    this.open = false;
  }
  update(lms: Lm[] | null, t: number, aspect = 1): CounterFrame {
    if (!lms) return emptyFrame(this.reps);
    const need = [LM.lShoulder, LM.rShoulder, LM.lWrist, LM.rWrist, LM.lAnkle, LM.rAnkle, LM.lHip, LM.rHip];
    if (need.some((i) => vis(lms[i]) < MIN_VIS)) return { ...emptyFrame(this.reps), hint: 'Ganzen Körper ins Bild' };
    const sw = Math.abs(lms[LM.lShoulder].x - lms[LM.rShoulder].x) * aspect || 0.0001;
    const shoulderY = (lms[LM.lShoulder].y + lms[LM.rShoulder].y) / 2;
    const noseY = lms[LM.nose]?.y ?? shoulderY - 0.1;
    const wristY = (lms[LM.lWrist].y + lms[LM.rWrist].y) / 2;
    const ankleSpread = (Math.abs(lms[LM.lAnkle].x - lms[LM.rAnkle].x) * aspect) / sw;
    const s = SENS[this.sens];
    const armsUp = wristY < noseY + s * 0.03;
    const armsDown = wristY > shoulderY + 0.05;
    const legsOpen = ankleSpread > 1.45 - s * 0.15;
    const legsClosed = ankleSpread < 1.15;
    const armRange = Math.max(0, Math.min(1, (shoulderY + 0.15 - wristY) / 0.3));
    let repped = false;
    if (!this.open && armsUp && legsOpen) this.open = true;
    else if (this.open && armsDown && legsClosed) {
      this.open = false;
      if (t - this.lastRep > 350) {
        this.reps += 1;
        this.lastRep = t;
        repped = true;
      }
    }
    const hint = armsUp && !legsOpen ? 'Beine weiter auseinander!' : null;
    return { reps: this.reps, tracking: true, depth: armRange, hint, repped };
  }
}

/** Burpee: Stand → Liegestützposition (waagrecht) → Stand = 1 Wiederholung. */
class BurpeeCounter implements RepCounter {
  readonly exercise = 'burpee' as const;
  private reps = 0;
  private stage: 'stand' | 'floor' = 'stand';
  private wasStanding = false;
  private lastRep = -Infinity;
  reset() {
    this.reps = 0;
    this.stage = 'stand';
    this.wasStanding = false;
  }
  update(lms: Lm[] | null, t: number, aspect = 1): CounterFrame {
    if (!lms) return emptyFrame(this.reps);
    const { side, ok } = bestSide(lms, ['s', 'h', 'k']);
    if (!ok) return { ...emptyFrame(this.reps), hint: 'Ganzen Körper ins Bild' };
    const torso = tilt(j(lms, side, 's'), j(lms, side, 'h'), aspect);
    const knee = vis(j(lms, side, 'a')) > MIN_VIS ? angle(j(lms, side, 'h'), j(lms, side, 'k'), j(lms, side, 'a'), aspect) : 170;
    const standing = torso > 60 && knee > 150;
    const horizontal = torso < 35;
    let repped = false;
    if (standing) this.wasStanding = true;
    if (this.stage === 'stand' && horizontal && this.wasStanding) this.stage = 'floor';
    else if (this.stage === 'floor' && standing) {
      this.stage = 'stand';
      if (t - this.lastRep > 1200) {
        this.reps += 1;
        this.lastRep = t;
        repped = true;
      }
    }
    const depth = Math.max(0, Math.min(1, (90 - torso) / 90));
    return { reps: this.reps, tracking: true, depth, hint: null, repped };
  }
}

/** Mountain Climber: jedes Knie zur Brust in waagrechter Position zählt. */
class MountainClimberCounter implements RepCounter {
  readonly exercise = 'mountainclimber' as const;
  private reps = 0;
  private driven: Record<Side, boolean> = { l: false, r: false };
  private lastRep = -Infinity;
  constructor(private sens: Sensitivity) {}
  reset() {
    this.reps = 0;
    this.driven = { l: false, r: false };
  }
  update(lms: Lm[] | null, t: number, aspect = 1): CounterFrame {
    if (!lms) return emptyFrame(this.reps);
    const { side, ok } = bestSide(lms, ['s', 'h']);
    if (!ok) return { ...emptyFrame(this.reps), hint: 'Ganzen Körper ins Bild' };
    if (!isHorizontal(lms, side, aspect, 45)) return { ...emptyFrame(this.reps), tracking: true, hint: 'In Stützposition gehen' };
    const s = SENS[this.sens];
    let repped = false;
    let depth = 0;
    for (const sd of ['l', 'r'] as Side[]) {
      if (vis(j(lms, sd, 'k')) < 0.35 || vis(j(lms, sd, 'h')) < 0.35) continue;
      const hipA = angle(j(lms, sd, 's'), j(lms, sd, 'h'), j(lms, sd, 'k'), aspect);
      depth = Math.max(depth, Math.max(0, Math.min(1, (170 - hipA) / 80)));
      if (!this.driven[sd] && hipA < 110 + s * 10) {
        this.driven[sd] = true;
        if (t - this.lastRep > 180) {
          this.reps += 1;
          this.lastRep = t;
          repped = true;
        }
      } else if (this.driven[sd] && hipA > 145) {
        this.driven[sd] = false;
      }
    }
    return { reps: this.reps, tracking: true, depth, hint: null, repped };
  }
}

/** Plank: zählt Sekunden mit waagrechter, gerader Körperlinie. */
class PlankCounter implements RepCounter {
  readonly exercise = 'plank' as const;
  private held = 0;
  private lastT: number | null = null;
  private lastWhole = 0;
  reset() {
    this.held = 0;
    this.lastT = null;
    this.lastWhole = 0;
  }
  update(lms: Lm[] | null, t: number, aspect = 1): CounterFrame {
    const dt = this.lastT == null ? 0 : Math.min(250, t - this.lastT);
    this.lastT = t;
    if (!lms) return emptyFrame(Math.floor(this.held));
    const { side, ok } = bestSide(lms, ['s', 'h', 'a']);
    if (!ok) return { ...emptyFrame(Math.floor(this.held)), hint: 'Ganzen Körper ins Bild' };
    const line = angle(j(lms, side, 's'), j(lms, side, 'h'), j(lms, side, 'a'), aspect);
    const flat = tilt(j(lms, side, 's'), j(lms, side, 'a'), aspect) < 30;
    const good = flat && line > 155;
    if (good) this.held += dt / 1000;
    const whole = Math.floor(this.held);
    const repped = whole > this.lastWhole;
    this.lastWhole = whole;
    let hint: string | null = null;
    if (flat && !good) hint = line < 155 ? 'Körper gerade – Hüfte ausrichten' : null;
    if (!flat) hint = 'In Plank-Position gehen';
    return { reps: whole, tracking: true, depth: good ? 1 : 0, hint, repped };
  }
}

export function createCounter(ex: ExerciseId, sens: Sensitivity = 'normal'): RepCounter {
  switch (ex) {
    case 'pushup':
      return new AngleCounter(ex, pushupSpec(), sens);
    case 'squat':
      return new AngleCounter(ex, squatSpec(), sens);
    case 'situp':
      return new AngleCounter(ex, situpSpec(), sens);
    case 'jumpingjack':
      return new JumpingJackCounter(sens);
    case 'burpee':
      return new BurpeeCounter();
    case 'mountainclimber':
      return new MountainClimberCounter(sens);
    case 'plank':
      return new PlankCounter();
  }
}
