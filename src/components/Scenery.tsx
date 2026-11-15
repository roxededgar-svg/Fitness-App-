import type { ReactElement } from 'react';
import type { Theme } from '../lib/path';

/** Landschafts-Requisiten je Welt – kleine SVG-Szenen am Rand des Pfads. */

type P = { glow: string; s: number };

function Tree({ glow, s }: P) {
  return (
    <svg width={s} height={s * 1.3} viewBox="0 0 60 78">
      <rect x="27" y="52" width="6" height="22" rx="2" fill="#2b1a10" />
      <path d="M30 4 52 34H8z" fill={glow} opacity=".35" />
      <path d="M30 14 48 40H12z" fill={glow} opacity=".6" />
      <path d="M30 26 54 58H6z" fill={glow} opacity=".85" />
      <path d="M30 26 42 42" stroke="#fff" strokeOpacity=".5" strokeWidth="1.5" />
      {[[18, 50], [40, 46], [28, 36]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2" fill="#fff" opacity=".8" />)}
    </svg>
  );
}
function Mushroom({ glow, s }: P) {
  return (
    <svg width={s} height={s} viewBox="0 0 50 50">
      <rect x="21" y="26" width="8" height="20" rx="3" fill="#e8f5e9" opacity=".85" />
      <path d="M4 28a21 18 0 0 1 42 0z" fill={glow} />
      {[[14, 20], [26, 14], [36, 22]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#fff" opacity=".7" />)}
    </svg>
  );
}
function Crystals({ glow, s }: P) {
  return (
    <svg width={s} height={s * 1.2} viewBox="0 0 60 72">
      <path d="M10 70 16 30 24 70z" fill={glow} opacity=".55" />
      <path d="M22 70 30 6 40 70z" fill={glow} />
      <path d="M30 6 34 70H30z" fill="#fff" opacity=".45" />
      <path d="M38 70 46 26 54 70z" fill={glow} opacity=".75" />
      <ellipse cx="30" cy="70" rx="28" ry="3" fill="#fff" opacity=".15" />
    </svg>
  );
}
function Volcano({ glow, s }: P) {
  return (
    <svg width={s * 1.3} height={s} viewBox="0 0 78 60">
      <path d="M4 58 30 14h18l26 44z" fill="#2a120a" stroke="#000" strokeOpacity=".4" />
      <path d="M30 14h18l-4 8-5-4-5 6z" fill={glow} />
      <path d="M38 22c-2 8 3 14 0 22M44 22c2 10-3 16 1 26" stroke={glow} strokeWidth="2.5" fill="none" opacity=".85" />
      <circle cx="36" cy="8" r="4" fill="#555" opacity=".5" /><circle cx="44" cy="3" r="3" fill="#555" opacity=".35" />
    </svg>
  );
}
function LavaRock({ glow, s }: P) {
  return (
    <svg width={s} height={s * 0.7} viewBox="0 0 50 35">
      <path d="M3 33 9 14l14-10 16 6 8 23z" fill="#241008" />
      <path d="M12 26l8-8 5 6 8-10M20 18l-2-8" stroke={glow} strokeWidth="2" fill="none" />
    </svg>
  );
}
function Obelisk({ glow, s }: P) {
  return (
    <svg width={s * 0.6} height={s * 1.4} viewBox="0 0 36 84">
      <path d="M18 2 28 14 26 80H10L8 14z" fill="#1c1430" stroke="#000" strokeOpacity=".5" />
      <path d="M18 24v8M14 40l8 6M22 40l-8 6M18 56v10" stroke={glow} strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="18" cy="82" rx="16" ry="2" fill={glow} opacity=".3" />
    </svg>
  );
}
function Orb({ glow, s }: P) {
  return (
    <svg width={s * 0.6} height={s * 0.6} viewBox="0 0 30 30">
      <circle cx="15" cy="15" r="12" fill={glow} opacity=".2" />
      <circle cx="15" cy="15" r="6" fill={glow} />
      <circle cx="13" cy="13" r="2" fill="#fff" />
    </svg>
  );
}
function Cloud({ glow, s }: P) {
  return (
    <svg width={s * 1.5} height={s * 0.7} viewBox="0 0 90 42">
      <path d="M12 38a12 12 0 0 1 2-23 16 16 0 0 1 30-6 14 14 0 0 1 26 6 11 11 0 0 1 8 23z" fill="#fff" opacity=".85" />
      <path d="M12 38h66" stroke={glow} strokeWidth="2" opacity=".6" />
    </svg>
  );
}
function Island({ glow, s }: P) {
  return (
    <svg width={s * 1.2} height={s} viewBox="0 0 72 60">
      <path d="M6 22h60l-12 14-10 20-10-8-10 4-8-14z" fill="#3b2a52" />
      <path d="M6 22h60" stroke="#86efac" strokeWidth="5" strokeLinecap="round" />
      <path d="M30 22 36 4l6 18z" fill={glow} opacity=".9" />
    </svg>
  );
}
function Coral({ glow, s }: P) {
  return (
    <svg width={s} height={s * 1.2} viewBox="0 0 50 60">
      <path d="M25 58V34M25 40 14 26M14 26V14M14 26 6 20M25 34l12-12M37 22V10M37 22l8-4" stroke={glow} strokeWidth="5" strokeLinecap="round" fill="none" />
      <circle cx="14" cy="13" r="3" fill="#fff" opacity=".6" />
    </svg>
  );
}
function Bubbles({ glow, s }: P) {
  return (
    <svg width={s * 0.6} height={s * 1.2} viewBox="0 0 30 60">
      {[[15, 52, 5], [9, 36, 3.5], [19, 24, 4], [12, 10, 2.5]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="none" stroke={glow} strokeWidth="1.5" opacity=".75" />
      ))}
    </svg>
  );
}
function Column({ glow, s }: P) {
  return (
    <svg width={s * 0.6} height={s * 1.4} viewBox="0 0 36 84">
      <rect x="4" y="4" width="28" height="7" rx="1" fill="#e9d8a6" />
      <rect x="8" y="11" width="20" height="62" fill="#d6c38a" />
      {[12, 17, 22].map((x) => <line key={x} x1={x} y1="12" x2={x} y2="72" stroke="#a68b3c" strokeWidth="1.5" />)}
      <rect x="2" y="73" width="32" height="8" rx="1" fill="#e9d8a6" />
      <circle cx="18" cy="2" r="3" fill={glow} />
    </svg>
  );
}

const SETS: Record<Theme, ((p: P) => ReactElement)[]> = {
  forest: [Tree, Mushroom, Tree],
  ice: [Crystals, Crystals, Orb],
  fire: [Volcano, LavaRock, LavaRock],
  shadow: [Obelisk, Orb, Obelisk],
  sky: [Cloud, Island, Cloud],
  abyss: [Coral, Bubbles, Coral],
  olymp: [Column, Orb, Column],
};

/** Deterministische Verteilung von Requisiten an den Rändern einer Welt */
export function Scenery({ theme, glow, height, seed }: { theme: Theme; glow: string; height: number; seed: number }) {
  const set = SETS[theme];
  const items = [];
  let r = seed * 9301 + 49297;
  const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  for (let y = 190; y < height - 60; y += 95) {
    const left = rand() < 0.5;
    const Comp = set[Math.floor(rand() * set.length)];
    const s = 38 + rand() * 34;
    items.push(
      <div key={y} className="prop" style={{ top: y, [left ? 'left' : 'right']: `${2 + rand() * 8}%`, opacity: 0.55 + rand() * 0.35 }}>
        <Comp glow={glow} s={s} />
      </div>,
    );
  }
  return <>{items}</>;
}
