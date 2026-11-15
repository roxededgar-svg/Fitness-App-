import { describe, expect, it } from 'vitest';
import { createCounter, LM, type Lm } from '../src/pose/counters';

/** Baut ein 33-Punkte-Skelett aus wenigen Gelenken (Rest unsichtbar). */
function pose(points: Partial<Record<keyof typeof LM, [number, number]>>): Lm[] {
  const out: Lm[] = Array.from({ length: 33 }, () => ({ x: 0, y: 0, visibility: 0 }));
  for (const [k, v] of Object.entries(points)) out[LM[k as keyof typeof LM]] = { x: v![0], y: v![1], visibility: 0.99 };
  return out;
}

/** Seitliche Liegestütz-Pose; elbow = Ellbogenwinkel in Grad. */
function pushup(elbow: number): Lm[] {
  const s: [number, number] = [0.3, 0.5];
  const upper = 0.12;
  // Oberarm nach unten-hinten, Unterarm so drehen, dass der Winkel stimmt
  const a1 = (100 * Math.PI) / 180;
  const e: [number, number] = [s[0] + Math.cos(a1) * upper, s[1] + Math.sin(a1) * upper];
  const a2 = a1 + Math.PI - (elbow * Math.PI) / 180;
  const w: [number, number] = [e[0] + Math.cos(a2) * upper, e[1] + Math.sin(a2) * upper];
  return pose({ lShoulder: s, lElbow: e, lWrist: w, lHip: [0.6, 0.53], lKnee: [0.75, 0.55], lAnkle: [0.9, 0.57] });
}

function squat(knee: number): Lm[] {
  const h: [number, number] = [0.5, 0.5];
  const k: [number, number] = [0.6, 0.65];
  const thigh = Math.atan2(h[1] - k[1], h[0] - k[0]);
  const shin = thigh - (knee * Math.PI) / 180;
  const a: [number, number] = [k[0] + Math.cos(shin) * 0.18, k[1] + Math.sin(shin) * 0.18];
  return pose({ lShoulder: [0.48, 0.25], lHip: h, lKnee: k, lAnkle: a });
}

function run(ex: Parameters<typeof createCounter>[0], frames: Lm[][], stepMs = 60) {
  const c = createCounter(ex);
  let last = c.update(null, 0);
  frames.forEach((f, i) => (last = c.update(f, (i + 1) * stepMs)));
  return last;
}

const sweep = (from: number, to: number, n = 8) => Array.from({ length: n }, (_, i) => from + ((to - from) * i) / (n - 1));

describe('Liegestütz-Zähler', () => {
  it('zählt volle Wiederholungen', () => {
    const one = [...sweep(170, 80), ...sweep(80, 170)];
    const frames = [...one, ...one, ...one].map(pushup);
    expect(run('pushup', frames).reps).toBe(3);
  });

  it('zählt halbe Wiederholungen nicht', () => {
    const half = [...sweep(170, 125), ...sweep(125, 170)];
    const res = run('pushup', [...half, ...half].map(pushup));
    expect(res.reps).toBe(0);
  });

  it('braucht keine Hüfte / Beine – nur die Arme', () => {
    const armsOnly = (elbow: number) => {
      const p = pushup(elbow);
      for (const k of ['lHip', 'lKnee', 'lAnkle'] as const) p[LM[k]] = { x: 0, y: 0, visibility: 0 };
      return p;
    };
    const one = [...sweep(170, 80), ...sweep(80, 170)];
    expect(run('pushup', [...one, ...one].map(armsOnly)).reps).toBe(2);
  });

  it('zählt auch nicht ganz durchgestreckte Arme (oben ~150°)', () => {
    const one = [...sweep(150, 85), ...sweep(85, 150)];
    expect(run('pushup', [...one, ...one, ...one].map(pushup)).reps).toBe(3);
  });

  it('übersteht kurze Erkennungsaussetzer', () => {
    const c = createCounter('pushup');
    let t = 0;
    const feed = (f: Lm[] | null) => c.update(f, (t += 60));
    sweep(170, 80).forEach((a) => feed(pushup(a)));
    feed(pose({}));
    feed(pose({}));
    const last = sweep(80, 170).map((a) => feed(pushup(a))).pop()!;
    expect(last.reps).toBe(1);
  });

  it('zählt frontal (Kamera vor dem Kopf): Schultern sinken Richtung Hände', () => {
    // depth 0 = oben, 1 = unten
    const front = (depth: number) => {
      const sy = 0.4 + depth * 0.26;
      return pose({
        lShoulder: [0.42, sy], rShoulder: [0.58, sy],
        lElbow: [0.36 - depth * 0.1, (sy + 0.8) / 2], rElbow: [0.64 + depth * 0.1, (sy + 0.8) / 2],
        lWrist: [0.36, 0.8], rWrist: [0.64, 0.8],
      });
    };
    const one = [...sweep(0, 1), ...sweep(1, 0)];
    expect(run('pushup', [...one, ...one].map(front)).reps).toBe(2);
    const half = [...sweep(0, 0.3), ...sweep(0.3, 0)];
    expect(run('pushup', [...half, ...half].map(front)).reps).toBe(0);
  });

  it('meldet fehlendes Tracking ohne sichtbare Gelenke', () => {
    const c = createCounter('pushup');
    const f = c.update(pose({}), 100);
    expect(f.tracking).toBe(false);
  });
});

describe('Kniebeugen-Zähler', () => {
  it('zählt tiefe Kniebeugen', () => {
    const one = [...sweep(175, 85), ...sweep(85, 175)];
    expect(run('squat', [...one, ...one].map(squat)).reps).toBe(2);
  });
});

describe('Jumping-Jack-Zähler', () => {
  const closed = pose({ nose: [0.5, 0.2], lShoulder: [0.45, 0.3], rShoulder: [0.55, 0.3], lWrist: [0.44, 0.55], rWrist: [0.56, 0.55], lHip: [0.47, 0.55], rHip: [0.53, 0.55], lAnkle: [0.48, 0.9], rAnkle: [0.52, 0.9] });
  const open = pose({ nose: [0.5, 0.2], lShoulder: [0.45, 0.3], rShoulder: [0.55, 0.3], lWrist: [0.4, 0.1], rWrist: [0.6, 0.1], lHip: [0.47, 0.55], rHip: [0.53, 0.55], lAnkle: [0.38, 0.9], rAnkle: [0.62, 0.9] });
  it('zählt offen → geschlossen als 1 Wiederholung', () => {
    const frames = [closed, open, open, closed, closed, open, closed];
    expect(run('jumpingjack', frames, 200).reps).toBe(2);
  });
});

describe('Plank-Zähler', () => {
  it('zählt Sekunden in gerader Linie', () => {
    const plank = pose({ lShoulder: [0.3, 0.5], lHip: [0.55, 0.51], lAnkle: [0.85, 0.52] });
    const frames = Array.from({ length: 60 }, () => plank);
    expect(run('plank', frames, 100).reps).toBeGreaterThanOrEqual(5);
  });
});
