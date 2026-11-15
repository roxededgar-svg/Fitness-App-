/**
 * Dungeon-Bosskampf: Jede Wiederholung fügt dem Boss Schaden zu.
 * Schnelle, gleichmäßige Wiederholungen bauen eine Combo auf (mehr Schaden,
 * jede 10. Combo-Wiederholung ist kritisch). Wer zu lange pausiert,
 * lässt den Boss regenerieren. Ziel: Boss vor Ablauf der Zeit besiegen.
 */
export const DMG_PER_REP = 100;
export const REGEN_AFTER_MS = 3500;
export const REGEN_PER_S = 0.015; // Anteil der max. HP pro Sekunde

export interface BossState {
  maxHp: number;
  hp: number;
  combo: number;
  lastRepAt: number;
  dealt: number;
}

export interface Hit {
  dmg: number;
  crit: boolean;
  combo: number;
}

export function createBoss(repsNeeded: number, t = 0): BossState {
  const maxHp = repsNeeded * DMG_PER_REP;
  return { maxHp, hp: maxHp, combo: 0, lastRepAt: t, dealt: 0 };
}

/** Zeitfenster für die Combo: etwas länger als ein ruhiges Wiederholungstempo. */
export const comboWindowMs = (baseRpm: number) => Math.max(1200, (60000 / baseRpm) * 1.8);

export function applyRep(s: BossState, t: number, windowMs: number): { state: BossState; hit: Hit } {
  const combo = s.combo > 0 && t - s.lastRepAt <= windowMs ? s.combo + 1 : 1;
  const crit = combo % 10 === 0;
  const mult = (1 + Math.min(combo - 1, 10) * 0.03) * (crit ? 2 : 1);
  const dmg = Math.round(DMG_PER_REP * mult);
  const hp = Math.max(0, s.hp - dmg);
  return { state: { ...s, hp, combo, lastRepAt: t, dealt: s.dealt + (s.hp - hp) }, hit: { dmg, crit, combo } };
}

/** Regeneration, wenn länger keine Wiederholung kam. Gibt geheilte HP zurück. */
export function applyRegen(s: BossState, t: number, dtMs: number): { state: BossState; healed: number } {
  if (s.hp <= 0 || t - s.lastRepAt < REGEN_AFTER_MS) return { state: s, healed: 0 };
  const heal = Math.min(s.maxHp - s.hp, (s.maxHp * REGEN_PER_S * dtMs) / 1000);
  if (heal <= 0) return { state: s, healed: 0 };
  return { state: { ...s, hp: s.hp + heal, combo: 0 }, healed: heal };
}
