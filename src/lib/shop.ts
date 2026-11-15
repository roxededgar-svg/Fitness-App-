/** Shop: Avatar-Rahmen, Titel und Streak-Schutz. Viele Artikel werden über das Level freigeschaltet. */
export type ShopKind = 'frame' | 'title' | 'freeze';

export interface ShopItem {
  id: string;
  kind: ShopKind;
  name: string;
  desc: string;
  price: number;
  currency: 'gold' | 'gems';
  /** Ab diesem Level kaufbar */
  minLevel: number;
  /** Rahmen: CSS-Hintergrund des Rings */
  ring?: string;
  animated?: boolean;
}

export const SHOP: ShopItem[] = [
  { id: 'frame-ember', kind: 'frame', name: 'Glutring', desc: 'Lodernder Rahmen in Orange und Rot', price: 300, currency: 'gold', minLevel: 2, ring: 'conic-gradient(from 0deg, #ff3d00, #ffb020, #ff3d00, #7c1d06, #ff3d00)' },
  { id: 'frame-frost', kind: 'frame', name: 'Frostkranz', desc: 'Eisig glitzernder Rahmen', price: 300, currency: 'gold', minLevel: 3, ring: 'conic-gradient(from 0deg, #e0f2fe, #38bdf8, #ffffff, #0c4a6e, #e0f2fe)' },
  { id: 'frame-toxic', kind: 'frame', name: 'Giftgrün', desc: 'Neon-Rahmen aus dem Neonwald', price: 450, currency: 'gold', minLevel: 5, ring: 'conic-gradient(from 0deg, #a3e635, #16a34a, #052e16, #34d399, #a3e635)' },
  { id: 'frame-shadow', kind: 'frame', name: 'Schattenschleier', desc: 'Dunkles Violett mit Glanz', price: 25, currency: 'gems', minLevel: 8, ring: 'conic-gradient(from 0deg, #1e0b3d, #a855f7, #0b0616, #c084fc, #1e0b3d)' },
  { id: 'frame-royal', kind: 'frame', name: 'Königlich', desc: 'Gold und Purpur für Champions', price: 40, currency: 'gems', minLevel: 12, ring: 'conic-gradient(from 0deg, #fff3b0, #f5c242, #7c3aed, #f5c242, #fff3b0)' },
  { id: 'frame-aurora', kind: 'frame', name: 'Polarlicht', desc: 'Wandernde Farben, animiert', price: 75, currency: 'gems', minLevel: 18, ring: 'conic-gradient(from 0deg, #22d3ee, #a855f7, #f472b6, #facc15, #34d399, #22d3ee)', animated: true },
  { id: 'title-rookie', kind: 'title', name: 'Frischling', desc: 'Titel unter deinem Namen', price: 100, currency: 'gold', minLevel: 1 },
  { id: 'title-machine', kind: 'title', name: 'Wiederholungsmaschine', desc: 'Titel unter deinem Namen', price: 400, currency: 'gold', minLevel: 4 },
  { id: 'title-hunter', kind: 'title', name: 'Monsterjäger', desc: 'Titel unter deinem Namen', price: 600, currency: 'gold', minLevel: 7 },
  { id: 'title-iron', kind: 'title', name: 'Eiserner Wille', desc: 'Titel unter deinem Namen', price: 30, currency: 'gems', minLevel: 10 },
  { id: 'title-legend', kind: 'title', name: 'Lebende Legende', desc: 'Titel unter deinem Namen', price: 90, currency: 'gems', minLevel: 20 },
  { id: 'freeze', kind: 'freeze', name: 'Streak-Schutz', desc: 'Rettet deine Serie, wenn du einen Tag verpasst. Wird automatisch eingesetzt.', price: 15, currency: 'gems', minLevel: 2 },
];

export const itemById = (id?: string) => SHOP.find((i) => i.id === id);

/** Artikel, die genau mit diesem Level freigeschaltet werden */
export const unlockedAtLevel = (level: number) => SHOP.filter((i) => i.minLevel === level);
