/**
 * Bestiarium: echte Monster-Bilder (public/art/bestiary/NN.webp) für jede Station.
 * 25 Figuren, einige als Farbvariante in mehreren Welten wiederverwendet.
 */
const TINT = {
  ice: 'hue-rotate(175deg) saturate(.75) brightness(1.18)',
  teal: 'hue-rotate(135deg) saturate(1.15) brightness(1.05)',
  gold: 'sepia(.55) saturate(1.7) hue-rotate(-6deg) brightness(1.12)',
  storm: 'hue-rotate(205deg) saturate(.85) brightness(1.12)',
  dark: 'brightness(.78) contrast(1.15) saturate(.9)',
  fire: 'sepia(.45) saturate(2.3) hue-rotate(-18deg) brightness(1.1)',
};

export interface BeastArt {
  img: number;
  name: string;
  filter?: string;
}

const B = (img: number, name: string, filter?: string): BeastArt => ({ img, name, filter });

/** Station-ID → Bild. Reihenfolge je Welt: Kampf 0, 1, 3, 4 und Boss 5 */
export const BESTIARY: Record<string, BeastArt> = {
  'neonwald-0': B(17, 'Waldgoblin'), 'neonwald-1': B(12, 'Dornenschrecke'), 'neonwald-3': B(13, 'Morastungeheuer'), 'neonwald-4': B(11, 'Schlangenkönig'), 'neonwald-5': B(4, 'Waldent'),
  'kristall-0': B(6, 'Höhlenspinne', TINT.ice), 'kristall-1': B(7, 'Höhlenkriecher'), 'kristall-3': B(18, 'Gesteinsgolem'), 'kristall-4': B(25, 'Eisstachler', TINT.ice), 'kristall-5': B(24, 'Eiswächter'),
  'feuer-0': B(8, 'Hornbestie'), 'feuer-1': B(16, 'Schlachtpanzer'), 'feuer-3': B(1, 'Schattenork'), 'feuer-4': B(23, 'Dämonenbrut'), 'feuer-5': B(19, 'Lavagolem Ignax'),
  'schatten-0': B(22, 'Rattenkönig'), 'schatten-1': B(10, 'Schattenbestie'), 'schatten-3': B(2, 'Nebelwächter'), 'schatten-4': B(14, 'Geisterfürst'), 'schatten-5': B(21, 'Knochenfürst Zoraq'),
  'himmel-0': B(15, 'Sturmharpyie'), 'himmel-1': B(3, 'Felsentroll'), 'himmel-3': B(23, 'Sturmdämon', TINT.storm), 'himmel-4': B(10, 'Gewitterbestie', TINT.storm), 'himmel-5': B(9, 'Sturmwyrm Aeolos'),
  'abyss-0': B(11, 'Seeschlange', TINT.teal), 'abyss-1': B(6, 'Tiefseespinne', TINT.teal), 'abyss-3': B(13, 'Schlammkoloss', TINT.teal), 'abyss-4': B(25, 'Panzerkriecher', TINT.teal), 'abyss-5': B(20, 'Wurm der Tiefe'),
  'olymp-0': B(1, 'Arenaork', TINT.gold), 'olymp-1': B(18, 'Goldgolem', TINT.gold), 'olymp-3': B(8, 'Minotaurus', TINT.gold), 'olymp-4': B(16, 'Kriegsbestie', TINT.gold), 'olymp-5': B(5, 'Der Blutritter'),
  'drachenhort-0': B(17, 'Höhlengoblin', TINT.dark), 'drachenhort-1': B(3, 'Bergtroll', TINT.dark), 'drachenhort-3': B(2, 'Schattenreiter', TINT.dark), 'drachenhort-4': B(23, 'Flammendämon', TINT.fire), 'drachenhort-5': B(9, 'Aschendrache Vyrmax', TINT.fire),
};

export const beastUrl = (img: number) => `${import.meta.env.BASE_URL}art/bestiary/${String(img).padStart(2, '0')}.webp`;
