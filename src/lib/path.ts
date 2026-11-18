/**
 * Trainingspfad: 7 Welten, jede mit 6 Stationen
 *   Kampf → Kampf → Schatzkiste → Kampf → Kampf → Boss
 * Jede Station schaltet die nächste frei. Ein Boss-Sieg öffnet das Portal zur nächsten Welt.
 * Kämpfe nutzen das Schadens-System (jede Wiederholung trifft das Monster).
 * Sterne: Je mehr Zeit beim Sieg übrig ist, desto mehr Sterne (1–3).
 */
import { DUNGEONS, type Dungeon } from './dungeons';
import { EXERCISES, type ExerciseId } from './exercises';
import type { Profile } from './types';

export type Theme = 'forest' | 'ice' | 'fire' | 'shadow' | 'sky' | 'abyss' | 'olymp';
export type NodeKind = 'fight' | 'chest' | 'boss';

export interface PathNode {
  id: string;
  worldId: string;
  index: number;
  kind: NodeKind;
  name: string;
  /** Symbol des Monsters / der Station */
  icon: string;
  exercise?: ExerciseId;
  durationS?: number;
  /** Wiederholungen (bzw. Sekunden bei Plank), um das Monster zu besiegen */
  hp?: number;
  xp: number;
  gold: number;
  gems: number;
}

export interface World {
  id: string;
  index: number;
  name: string;
  theme: Theme;
  /** Farben: Himmel oben, Boden unten, Leuchten des Pfads */
  sky: string;
  ground: string;
  glow: string;
  tagline: string;
  dungeon: Dungeon;
  nodes: PathNode[];
}

const THEMES: Record<string, { theme: Theme; sky: string; ground: string; glow: string; tagline: string; monsters: [string, string][]; ex: ExerciseId[] }> = {
  neonwald: { theme: 'forest', sky: '#06281f', ground: '#0b1a12', glow: '#34d399', tagline: 'Leuchtende Bäume, flinke Kreaturen',
    monsters: [['Moosling', 'fire'], ['Rankenwolf', 'wind'], ['Glühpilz', 'target'], ['Dornhirsch', 'trident']], ex: ['squat', 'jumpingjack', 'squat', 'plank'] },
  kristall: { theme: 'ice', sky: '#082a44', ground: '#0a1626', glow: '#7dd3fc', tagline: 'Eisige Gänge voller Kristalle',
    monsters: [['Frostkobold', 'crystal'], ['Eisspinne', 'target'], ['Splitterwurm', 'wind'], ['Gletschergolem', 'shield']], ex: ['pushup', 'squat', 'pushup', 'mountainclimber'] },
  feuer: { theme: 'fire', sky: '#3a0d05', ground: '#170704', glow: '#fb923c', tagline: 'Glühender Boden, brennende Luft',
    monsters: [['Glutwicht', 'fire'], ['Aschehund', 'skull'], ['Magmakäfer', 'shield'], ['Schlackenriese', 'cog']], ex: ['burpee', 'jumpingjack', 'burpee', 'plank'] },
  schatten: { theme: 'shadow', sky: '#1a0b33', ground: '#0b0616', glow: '#c084fc', tagline: 'Alte Runen, flüsternde Schatten',
    monsters: [['Schattenfalter', 'moon'], ['Nachtmahr', 'ghost'], ['Runenwächter', 'shield'], ['Leerenpriester', 'skull']], ex: ['situp', 'pushup', 'situp', 'plank'] },
  himmel: { theme: 'sky', sky: '#1e3a8a', ground: '#172554', glow: '#fde047', tagline: 'Über den Wolken tobt der Sturm',
    monsters: [['Windgeist', 'wind'], ['Donnervogel', 'bolt'], ['Wolkenreiter', 'storm'], ['Sturmsphinx', 'crown']], ex: ['jumpingjack', 'burpee', 'jumpingjack', 'mountainclimber'] },
  abyss: { theme: 'abyss', sky: '#042f3a', ground: '#021318', glow: '#22d3ee', tagline: 'Lichtlose Tiefe, uralte Wesen',
    monsters: [['Tiefseeaal', 'wind'], ['Korallenkrabbe', 'shield'], ['Laternenfisch', 'sun'], ['Krakenbrut', 'trident']], ex: ['mountainclimber', 'situp', 'plank', 'burpee'] },
  olymp: { theme: 'olymp', sky: '#3b2a05', ground: '#1a1203', glow: '#fcd34d', tagline: 'Der letzte Aufstieg zum Thron',
    monsters: [['Goldener Hüter', 'shield'], ['Titanenwache', 'swords'], ['Sonnenläufer', 'sun'], ['Schatten des Champions', 'ghost']], ex: ['pushup', 'burpee', 'squat', 'plank'] },
};

const STAGE_DUR = [30, 40, 45, 60];

function buildWorld(d: Dungeon, w: number): World {
  const t = THEMES[d.id];
  const nodes: PathNode[] = [];
  let stage = 0;
  for (let i = 0; i < 6; i++) {
    const id = `${d.id}-${i}`;
    if (i === 2) {
      nodes.push({ id, worldId: d.id, index: i, kind: 'chest', name: 'Schatzkiste', icon: 'gem', xp: 30 + w * 15, gold: 40 + w * 30, gems: 3 + w * 2 });
      continue;
    }
    if (i === 5) {
      nodes.push({ id, worldId: d.id, index: i, kind: 'boss', name: d.boss, icon: 'skull', exercise: d.exercise, durationS: d.duration, hp: d.hp, xp: d.xp, gold: d.gold, gems: d.gems });
      continue;
    }
    const [name, icon] = t.monsters[stage];
    const ex = t.ex[stage];
    const dur = STAGE_DUR[stage];
    const diff = 0.5 + w * 0.07 + stage * 0.04;
    const hp = ex === 'plank'
      ? Math.round(dur * Math.min(0.85, 0.5 + w * 0.05))
      : Math.max(5, Math.round(((EXERCISES[ex].baseRpm * dur) / 60) * diff));
    nodes.push({ id, worldId: d.id, index: i, kind: 'fight', name, icon, exercise: ex, durationS: dur, hp, xp: 40 + w * 25 + stage * 10, gold: 15 + w * 10 + stage * 4, gems: 0 });
    stage++;
  }
  return { id: d.id, index: w, name: d.name, theme: t.theme, sky: t.sky, ground: t.ground, glow: t.glow, tagline: t.tagline, dungeon: d, nodes };
}

export const WORLDS: World[] = DUNGEONS.map(buildWorld);
export const ALL_NODES: PathNode[] = WORLDS.flatMap((w) => w.nodes);
export const nodeById = (id: string) => ALL_NODES.find((n) => n.id === id);
export const worldById = (id: string) => WORLDS.find((w) => w.id === id)!;

/** Sterne aus dem Zeitanteil, der beim Sieg noch übrig war. */
export const starsFor = (timeLeftRatio: number) => (timeLeftRatio >= 0.4 ? 3 : timeLeftRatio >= 0.15 ? 2 : 1);

/** Station abgeschlossen? (Alt-Profile: besiegter Dungeon-Boss zählt für die ganze Welt.) */
export function isCleared(p: Profile, n: PathNode) {
  return !!p.path?.[n.id] || p.dungeonsCleared.includes(n.worldId);
}

export function isUnlocked(p: Profile, n: PathNode) {
  const i = ALL_NODES.indexOf(n);
  return i === 0 || isCleared(p, ALL_NODES[i - 1]);
}

/** Erste noch nicht abgeschlossene, aber freigeschaltete Station. */
export function currentNode(p: Profile): PathNode | undefined {
  return ALL_NODES.find((n) => !isCleared(p, n) && isUnlocked(p, n));
}

export const starsOf = (p: Profile, n: PathNode) => p.path?.[n.id]?.stars ?? (p.dungeonsCleared.includes(n.worldId) ? 1 : 0);

export function worldStars(p: Profile, w: World) {
  const fights = w.nodes.filter((n) => n.kind !== 'chest');
  return { got: fights.reduce((a, n) => a + starsOf(p, n), 0), max: fights.length * 3 };
}

export const totalStars = (p: Profile) => WORLDS.reduce((a, w) => a + worldStars(p, w).got, 0);

/** Monster-Platz innerhalb der Welt (0–3) für Aussehen/Typ */
export const monsterIndex = (n: PathNode) => (n.index < 2 ? n.index : n.index - 1);
