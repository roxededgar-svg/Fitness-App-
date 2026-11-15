/**
 * Gestaltung der Abzeichen: jede Medaille hat eigene Form, Farben, Metallrand und Muster.
 * Formen werden als Punktliste erzeugt und sowohl im SVG (Zeichnung) als auch
 * als CSS-clip-path (3D-Rand) verwendet, damit beides exakt übereinstimmt.
 */

export type Shape = 'circle' | 'hex' | 'octagon' | 'pentagon' | 'diamond' | 'star' | 'rosette' | 'shield' | 'roundsq' | 'cross' | 'gear' | 'drop';
export type Metal = 'gold' | 'silver' | 'bronze' | 'onyx' | 'rose' | 'emerald';
export type Pattern = 'rays' | 'rings' | 'stripes' | 'dots' | 'chevrons' | 'waves' | 'grid' | 'burst';

export interface BadgeStyle {
  shape: Shape;
  metal: Metal;
  /** Verlauf der Innenfläche: hell → dunkel */
  colors: [string, string, string];
  /** Akzentfarbe (Muster, Band, Leuchten) */
  accent: string;
  pattern: Pattern;
  /** Band mit Namen anzeigen */
  ribbon?: boolean;
}

/** Metall-Verläufe für Rand und Rückseite (hell → dunkel) */
export const METALS: Record<Metal, [string, string, string, string]> = {
  gold: ['#fff6c8', '#f5c242', '#b07a12', '#4a3205'],
  silver: ['#ffffff', '#cfd6e0', '#7d879a', '#30364a'],
  bronze: ['#ffe2c4', '#d4894b', '#8a4c1f', '#371b08'],
  onyx: ['#8a8fa6', '#3a3e52', '#16171f', '#050507'],
  rose: ['#ffe6ee', '#f19ab4', '#ad4b6b', '#3f1022'],
  emerald: ['#d9ffe9', '#3fd28a', '#137a48', '#04291a'],
};

export const BADGE_STYLES: Record<string, BadgeStyle> = {
  first_blood: { shape: 'shield', metal: 'silver', colors: ['#7fb0ff', '#2f5fe0', '#0b1a4d'], accent: '#ff5a5a', pattern: 'chevrons', ribbon: true },
  reps100: { shape: 'circle', metal: 'bronze', colors: ['#7ef0b0', '#1fa864', '#063d24'], accent: '#ffe08a', pattern: 'rings', ribbon: true },
  reps1000: { shape: 'star', metal: 'gold', colors: ['#ffd27a', '#f26b1d', '#5a1406'], accent: '#fff1a8', pattern: 'burst' },
  streak7: { shape: 'roundsq', metal: 'rose', colors: ['#d8b4fe', '#8b3fe0', '#2a0b52'], accent: '#ffd1f0', pattern: 'grid', ribbon: true },
  dungeon: { shape: 'pentagon', metal: 'onyx', colors: ['#ff8a8a', '#c21b1b', '#2b0303'], accent: '#ffb347', pattern: 'stripes' },
  ember: { shape: 'drop', metal: 'bronze', colors: ['#ffd38a', '#f97316', '#4a1203'], accent: '#ffe66b', pattern: 'waves' },
  win10: { shape: 'rosette', metal: 'gold', colors: ['#fff0a8', '#e8a10c', '#5a3b02'], accent: '#ff4d6d', pattern: 'rays', ribbon: true },
  set50: { shape: 'gear', metal: 'silver', colors: ['#bfefff', '#2aa6d9', '#06324a'], accent: '#ffd166', pattern: 'grid' },
  steel: { shape: 'octagon', metal: 'silver', colors: ['#e2e8f0', '#64748b', '#0f172a'], accent: '#60a5fa', pattern: 'chevrons', ribbon: true },
  crystal: { shape: 'diamond', metal: 'silver', colors: ['#d9f6ff', '#38bdf8', '#2e1065'], accent: '#c4b5fd', pattern: 'rays' },
  storm: { shape: 'hex', metal: 'onyx', colors: ['#c4b5fd', '#7c3aed', '#14052e'], accent: '#fde047', pattern: 'burst', ribbon: true },
  mythic: { shape: 'cross', metal: 'gold', colors: ['#ff9a9a', '#b91c1c', '#1a0202'], accent: '#ffd700', pattern: 'rays' },
  legend: { shape: 'star', metal: 'gold', colors: ['#fffbe0', '#f5b100', '#4d2c00'], accent: '#ff3b6b', pattern: 'burst', ribbon: true },
  pace20: { shape: 'circle', metal: 'emerald', colors: ['#bbf7d0', '#16a34a', '#052e16'], accent: '#a3e635', pattern: 'waves' },
  pace30: { shape: 'hex', metal: 'silver', colors: ['#a5f3fc', '#0891b2', '#082f49'], accent: '#f0abfc', pattern: 'rings' },
  pace40: { shape: 'diamond', metal: 'rose', colors: ['#f5d0fe', '#c026d3', '#2e0538'], accent: '#67e8f9', pattern: 'stripes', ribbon: true },
  pace50: { shape: 'star', metal: 'onyx', colors: ['#fff59d', '#facc15', '#3b2a00'], accent: '#60a5fa', pattern: 'burst' },
  ranked1: { shape: 'shield', metal: 'gold', colors: ['#93c5fd', '#2563eb', '#0b1640'], accent: '#ffd166', pattern: 'rays', ribbon: true },
  earlybird: { shape: 'rosette', metal: 'bronze', colors: ['#fff3b0', '#fb923c', '#7c2d12'], accent: '#fde68a', pattern: 'rays' },
  nightowl: { shape: 'circle', metal: 'silver', colors: ['#a5b4fc', '#3730a3', '#0b0a26'], accent: '#fde68a', pattern: 'dots', ribbon: true },
  bosses3: { shape: 'pentagon', metal: 'gold', colors: ['#fca5a5', '#991b1b', '#170202'], accent: '#a3e635', pattern: 'chevrons', ribbon: true },
  friend: { shape: 'roundsq', metal: 'rose', colors: ['#fbcfe8', '#db2777', '#3b0322'], accent: '#93c5fd', pattern: 'dots' },
};

export const styleFor = (id: string): BadgeStyle =>
  BADGE_STYLES[id] ?? { shape: 'hex', metal: 'silver', colors: ['#cbd5e1', '#64748b', '#0f172a'], accent: '#60a5fa', pattern: 'rays' };

/* ---------- Formen als Punktlisten (Einheitskoordinaten 0..1) ---------- */

type Pt = [number, number];
const polar = (n: number, r: (i: number) => number, rot = -Math.PI / 2): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const a = rot + (i * 2 * Math.PI) / n;
    const rr = r(i);
    return [0.5 + Math.cos(a) * rr, 0.5 + Math.sin(a) * rr];
  });

function roundRect(rad: number, steps = 6): Pt[] {
  const pts: Pt[] = [];
  const c: [number, number, number][] = [
    [1 - rad, rad, -Math.PI / 2], [1 - rad, 1 - rad, 0], [rad, 1 - rad, Math.PI / 2], [rad, rad, Math.PI],
  ];
  const m = 0.03;
  for (const [cx, cy, a0] of c) {
    for (let k = 0; k <= steps; k++) {
      const a = a0 + (k / steps) * (Math.PI / 2);
      pts.push([m + (cx + Math.cos(a) * rad) * (1 - 2 * m), m + (cy + Math.sin(a) * rad) * (1 - 2 * m)]);
    }
  }
  return pts;
}

function shieldPts(): Pt[] {
  const pts: Pt[] = [[0.5, 0.03], [0.93, 0.15], [0.93, 0.5]];
  for (let k = 1; k <= 8; k++) {
    const t = k / 8;
    pts.push([0.93 - 0.43 * t, 0.5 + 0.47 * Math.sin((t * Math.PI) / 2)]);
  }
  for (let k = 7; k >= 0; k--) {
    const t = k / 8;
    pts.push([0.07 + 0.43 * t, 0.5 + 0.47 * Math.sin((t * Math.PI) / 2)]);
  }
  pts.push([0.07, 0.15]);
  return pts;
}

function dropPts(): Pt[] {
  const pts: Pt[] = [[0.5, 0.02]];
  for (let k = 0; k <= 24; k++) {
    const a = -Math.PI / 6 + (k / 24) * (Math.PI + Math.PI / 3);
    pts.push([0.5 + Math.cos(a) * 0.36, 0.6 + Math.sin(a) * 0.36]);
  }
  return pts;
}

function crossPts(): Pt[] {
  // Tatzenkreuz: vier sich verbreiternde Arme
  const w = 0.13, o = 0.47;
  const arm = (ang: number): Pt[] => {
    const c = Math.cos(ang), s = Math.sin(ang);
    const P = (x: number, y: number): Pt => [0.5 + x * c - y * s, 0.5 + x * s + y * c];
    // innere Ecke + zwei Außenecken; die nächste innere Ecke liefert der folgende Arm
    return [P(w, -w), P(o, -0.24), P(o, 0.24)];
  };
  return [...arm(-Math.PI / 2), ...arm(0), ...arm(Math.PI / 2), ...arm(Math.PI)];
}

export function shapePoints(shape: Shape): Pt[] {
  switch (shape) {
    case 'circle': return polar(48, () => 0.48);
    case 'hex': return polar(6, () => 0.49);
    case 'octagon': return polar(8, () => 0.49, -Math.PI / 2 + Math.PI / 8);
    case 'pentagon': return polar(5, () => 0.5).map(([x, y]) => [x, y + 0.04] as Pt);
    case 'diamond': return [[0.5, 0.01], [0.88, 0.5], [0.5, 0.99], [0.12, 0.5]];
    case 'star': return polar(16, (i) => (i % 2 ? 0.34 : 0.5));
    case 'rosette': return polar(48, (i) => (i % 2 ? 0.44 : 0.49));
    case 'gear': return polar(40, (i) => (i % 4 < 2 ? 0.49 : 0.42), -Math.PI / 2 + Math.PI / 40);
    case 'shield': return shieldPts();
    case 'roundsq': return roundRect(0.2);
    case 'cross': return crossPts();
    case 'drop': return dropPts();
  }
}

/** SVG-Punkte in einem Quadrat der Größe `size`, optional skaliert um die Mitte */
export function svgPoints(shape: Shape, size = 200, scale = 1) {
  return shapePoints(shape)
    .map(([x, y]) => `${((0.5 + (x - 0.5) * scale) * size).toFixed(2)},${((0.5 + (y - 0.5) * scale) * size).toFixed(2)}`)
    .join(' ');
}

/** CSS clip-path passend zur Form */
export function cssClip(shape: Shape) {
  return `polygon(${shapePoints(shape).map(([x, y]) => `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`).join(', ')})`;
}
