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
  measure(lms: Lm[], side: Side, aspect: number): { value: number; hint?: string; alt?: number } | null;
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
  /** Selbst-Kalibrierung: tiefste gemessene Startposition (raw), passt sich langsam an */
  private topRef: number | null = null;
  private lostSince: number | null = null;

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
    this.topRef = null;
    this.lostSince = null;
  }

  private setHint(h: string, t: number) {
    this.hint = h;
    this.hintUntil = t + 1500;
  }

  /** Beide Körperseiten messen, wenn sichtbar, und mitteln (stabiler als eine Seite) */
  private measureBoth(lms: Lm[], aspect: number) {
    const sideScore = (sd: Side) => Math.min(...this.spec.joints.map((jn) => vis(lms[SIDE_IDX[sd][jn]])));
    const sides = (['l', 'r'] as Side[]).filter((sd) => sideScore(sd) >= MIN_VIS);
    if (!sides.length) {
      const { side, ok } = bestSide(lms, this.spec.joints);
      if (!ok) return undefined;
      sides.push(side);
    }
    const ms = sides.map((sd) => this.spec.measure(lms, sd, aspect)).filter((m): m is NonNullable<typeof m> => !!m);
    if (!ms.length) return null;
    const value = ms.reduce((a, m) => a + m.value, 0) / ms.length;
    const alts = ms.map((m) => m.alt).filter((a): a is number => a != null);
    return { value, alt: alts.length ? alts.reduce((a, b) => a + b, 0) / alts.length : undefined, hint: ms.find((m) => m.hint)?.hint };
  }

  update(lms: Lm[] | null, t: number, aspect = 1): CounterFrame {
    if (t > this.hintUntil) this.hint = null;
    const keep = (tracking: boolean, hint: string | null): CounterFrame => ({ reps: this.reps, tracking, depth: 0, hint, repped: false });
    if (!lms) return keep(false, this.hint);
    const m = this.measureBoth(lms, aspect);
    if (m === undefined) {
      // kurze Aussetzer überbrücken – der Zählzustand bleibt erhalten
      this.lostSince ??= t;
      return keep(false, t - this.lostSince > 800 ? 'Ganzen Körper ins Bild' : this.hint);
    }
    this.lostSince = null;
    if (!m) return keep(true, this.hint);
    if (m.hint) this.setHint(m.hint, t);

    this.smooth = this.smooth == null ? m.value : this.smooth * 0.45 + m.value * 0.55;
    const s = SENS[this.sens];
    const span = this.spec.up - this.spec.down;
    // raw: 0 = Startposition, 1 = volle Tiefe. Zweites Signal (z. B. Hüfthöhe) hilft bei frontaler Kamera.
    const angleRaw = (this.spec.up - this.smooth) / span;
    const raw = m.alt != null ? Math.max(angleRaw, m.alt) : angleRaw;
    const depth = Math.max(0, Math.min(1, raw));
    // Selbst-Kalibrierung der Startposition: wer z. B. die Knie oben nicht ganz streckt, wird trotzdem gezählt
    if (this.topRef == null || raw < this.topRef) this.topRef = raw;
    else this.topRef += (raw - this.topRef) * 0.002;
    const downAt = 1 - s * 0.12;
    const upAt = Math.min(0.45, Math.max(0.12 + s * 0.08, this.topRef + 0.15));
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

function squatSpec(): AngleSpec {
  const legRef: Record<Side, number> = { l: 0, r: 0 };
  return {
    joints: ['h', 'k', 'a', 's'],
    up: 165,
    down: 100,
    minRepMs: 500,
    partialHint: 'Tiefer in die Hocke!',
    measure(lms, side, aspect) {
      // Oberkörper muss eher aufrecht sein (keine Liegestütz-Position)
      if (tilt(j(lms, side, 's'), j(lms, side, 'h'), aspect) < 40) return null;
      const H = pt(j(lms, side, 'h'), aspect), K = pt(j(lms, side, 'k'), aspect), A = pt(j(lms, side, 'a'), aspect);
      const len = Math.hypot(H.x - K.x, H.y - K.y) + Math.hypot(K.x - A.x, K.y - A.y);
      legRef[side] = Math.max(len, legRef[side] * 0.995);
      // Hüfthöhe über dem Knöchel relativ zur Beinlänge: stehend ≈ 0,95, tiefe Hocke ≈ 0,5 (funktioniert auch frontal)
      const h = legRef[side] > 0.02 ? (A.y - H.y) / legRef[side] : 1;
      const alt = Math.max(-0.3, Math.min(1.3, (0.92 - h) / (0.92 - 0.52)));
      return { value: angle(j(lms, side, 'h'), j(lms, side, 'k'), j(lms, side, 'a'), aspect), alt };
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

/**
 * Liegestütze – nur die Arme entscheiden.
 *
 * Pro sichtbarem Arm werden zwei Signale kombiniert:
 *  1. Ellbogenwinkel (Schulter–Ellbogen–Handgelenk): gestreckt ≈ 165°, unten ≈ 85°
 *  2. Höhe der Schulter über dem Handgelenk, relativ zur Armlänge:
 *     oben ≈ volle Armlänge, unten deutlich kleiner.
 *     Funktioniert auch, wenn die Kamera frontal vor dem Kopf steht.
 * Beide Arme werden gemittelt, Hüfte/Beine werden nicht benötigt.
 * Runter (Tiefe ≥ Schwelle) → wieder hoch (Tiefe ≤ Schwelle) = 1 Wiederholung.
 */
class PushupCounter implements RepCounter {
  readonly exercise = 'pushup' as const;
  private reps = 0;
  private phase: 'up' | 'down' = 'up';
  private smooth: number | null = null;
  private lastRep = -Infinity;
  private maxDepthInRep = 0;
  private armRef: Record<Side, number> = { l: 0, r: 0 };
  private lostSince: number | null = null;
  private hint: string | null = null;
  private hintUntil = 0;

  constructor(private sens: Sensitivity) {}

  reset() {
    this.reps = 0;
    this.phase = 'up';
    this.smooth = null;
    this.lastRep = -Infinity;
    this.maxDepthInRep = 0;
  }

  /** Tiefe 0 (Arm gestreckt) … 1 (ganz unten) für einen Arm, oder null. */
  private armDepth(lms: Lm[], side: Side, aspect: number): number | null {
    const sh = j(lms, side, 's'), el = j(lms, side, 'e'), wr = j(lms, side, 'w');
    if (Math.min(vis(sh), vis(el), vis(wr)) < 0.35) return null;
    const P = (p: Lm) => pt(p, aspect);
    const S = P(sh), E = P(el), W = P(wr);
    const len = Math.hypot(S.x - E.x, S.y - E.y) + Math.hypot(E.x - W.x, E.y - W.y);
    if (len < 0.02) return null;
    // Referenz-Armlänge: größte gesehene Länge, passt sich langsam an (Abstand zur Kamera)
    this.armRef[side] = Math.max(len, this.armRef[side] * 0.995);
    const ref = this.armRef[side];

    const ang = angle(sh, el, wr, aspect);
    const dAngle = (165 - ang) / (165 - 85);
    // Schulter über Handgelenk (Bild-y wächst nach unten)
    const height = (W.y - S.y) / ref;
    const dHeight = (0.9 - height) / (0.9 - 0.4);
    // Steht die Kamera seitlich, ist der Winkel sehr zuverlässig; frontal die Höhe.
    const sideView = Math.abs(S.x - W.x) < Math.abs(S.y - W.y) * 0.8 ? 0.5 : 0.65;
    const d = sideView * dAngle + (1 - sideView) * dHeight;
    return Math.max(-0.3, Math.min(1.3, d));
  }

  update(lms: Lm[] | null, t: number, aspect = 1): CounterFrame {
    if (t > this.hintUntil) this.hint = null;
    const keep = (tracking: boolean, hint: string | null): CounterFrame => ({
      reps: this.reps, tracking, depth: Math.max(0, Math.min(1, this.smooth ?? 0)), hint, repped: false,
    });
    if (!lms) return keep(false, this.hint);

    const ds = (['l', 'r'] as Side[]).map((sd) => this.armDepth(lms, sd, aspect)).filter((d): d is number => d != null);
    if (!ds.length) {
      this.lostSince ??= t;
      // kurze Aussetzer überbrücken, Zustand bleibt erhalten
      return keep(false, t - this.lostSince > 800 ? 'Arme ins Bild bringen' : this.hint);
    }
    this.lostSince = null;
    const raw = ds.reduce((a, b) => a + b, 0) / ds.length;
    this.smooth = this.smooth == null ? raw : this.smooth * 0.4 + raw * 0.6;
    const d = this.smooth;

    const s = SENS[this.sens];
    const downAt = 0.62 - s * 0.12; // locker 0.50 · normal 0.62 · streng 0.74
    const upAt = 0.3 + s * 0.08; //    locker 0.38 · normal 0.30 · streng 0.22
    let repped = false;

    if (this.phase === 'up') {
      this.maxDepthInRep = Math.max(this.maxDepthInRep, d);
      if (d >= downAt) {
        this.phase = 'down';
      } else if (d <= upAt) {
        if (this.maxDepthInRep > downAt * 0.6) {
          this.hint = 'Tiefer runter!';
          this.hintUntil = t + 1500;
        }
        this.maxDepthInRep = 0;
      }
    } else if (d <= upAt) {
      this.phase = 'up';
      this.maxDepthInRep = 0;
      if (t - this.lastRep >= 350) {
        this.reps += 1;
        this.lastRep = t;
        repped = true;
      }
    }
    return { reps: this.reps, tracking: true, depth: Math.max(0, Math.min(1, d)), hint: this.hint, repped };
  }
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
      return new PushupCounter(sens);
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
