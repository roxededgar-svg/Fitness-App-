import { memo } from 'react';
import { hashStr, rng } from '../lib/rng';
import type { Theme } from '../lib/path';
import { BESTIARY, beastUrl } from '../lib/bestiary';

/**
 * Animierte Monster im Comic-Stil. Jedes Monster wird aus Bauteilen gezeichnet
 * (Körper je Typ, Augen, Maul, Hörner, Flügel …) – deterministisch aus seiner ID,
 * damit es immer gleich aussieht. Zustände: idle (atmen, blinzeln, bewegen),
 * hit (zusammenzucken + aufblitzen), dead (umkippen und verblassen).
 */
export type MonsterKind = 'blob' | 'beast' | 'shroom' | 'imp' | 'spider' | 'worm' | 'golem' | 'bug' | 'flyer' | 'ghost' | 'fish' | 'squid' | 'goblin' | 'troll' | 'wraith' | 'demon' | 'dragon';
export type MonsterState = 'idle' | 'hit' | 'dead' | 'attack';

const KINDS: Record<Theme, MonsterKind[]> = {
  forest: ['blob', 'beast', 'shroom', 'beast'],
  ice: ['imp', 'spider', 'worm', 'golem'],
  fire: ['imp', 'beast', 'bug', 'golem'],
  shadow: ['flyer', 'ghost', 'golem', 'ghost'],
  sky: ['ghost', 'flyer', 'flyer', 'beast'],
  abyss: ['worm', 'bug', 'fish', 'squid'],
  olymp: ['golem', 'golem', 'flyer', 'ghost'],
  dragon: ['goblin', 'troll', 'wraith', 'demon'],
};
const BOSS: Record<Theme, MonsterKind> = { forest: 'beast', ice: 'ghost', fire: 'golem', shadow: 'ghost', sky: 'flyer', abyss: 'squid', olymp: 'golem', dragon: 'dragon' };

/** Farbpaletten je Welt: Körper hell/dunkel, Akzent, Augenfarbe */
const PAL: Record<Theme, { body: string[]; accent: string; eye: string }> = {
  forest: { body: ['#4d6b3a', '#3a5530', '#5a6e3c', '#2f4a32'], accent: '#a3b86a', eye: '#d4ff4a' },
  ice: { body: ['#6f8fa3', '#56778c', '#8aa3b3', '#4a6680'], accent: '#cfe6f2', eye: '#7fe3ff' },
  fire: { body: ['#a2502c', '#8c3e22', '#b05e30', '#7e3418'], accent: '#ff9a3d', eye: '#ffd23f' },
  shadow: { body: ['#3e3352', '#2f2742', '#4a3c5e', '#261f36'], accent: '#a08ac8', eye: '#c6ff3a' },
  sky: { body: ['#6b7a8c', '#56657a', '#7d8a99', '#4a5668'], accent: '#d8dee6', eye: '#ffe04a' },
  abyss: { body: ['#245a5e', '#1a4548', '#2e6b6b', '#143a40'], accent: '#7fc8c0', eye: '#ff5a3d' },
  olymp: { body: ['#8a7240', '#735e34', '#9a8250', '#5e4a26'], accent: '#e0cc90', eye: '#ffcf3a' },
  dragon: { body: ['#55604a', '#5f625c', '#4a5440', '#5a5c58'], accent: '#ff8a3d', eye: '#ffd23f' },
};

const INK = '#0b0807';
const shade = (hex: string, f: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
};

interface Look {
  kind: MonsterKind;
  body: string;
  dark: string;
  accent: string;
  eye: string;
  eyes: 1 | 2 | 3;
  mouth: 'fangs' | 'grin' | 'teeth' | 'o';
  horns: boolean;
  spots: boolean;
  boss: boolean;
}

export function monsterLook(id: string, theme: Theme, index: number, boss: boolean): Look {
  const r = rng(hashStr(id));
  const pal = PAL[theme];
  const body = pal.body[Math.floor(r() * pal.body.length)];
  const kind = boss ? BOSS[theme] : KINDS[theme][index % 4];
  const eyesRoll = r();
  return {
    kind, body, dark: shade(body, 0.62), accent: pal.accent, eye: pal.eye,
    eyes: boss ? (eyesRoll < 0.35 ? 3 : 2) : eyesRoll < 0.1 ? 1 : eyesRoll > 0.92 ? 3 : 2,
    mouth: (['fangs', 'grin', 'teeth', 'grin'] as const)[Math.floor(r() * 4)],
    horns: boss || r() < 0.35,
    spots: r() < 0.5,
    boss,
  };
}

/* ---------- Bauteile ---------- */

function Eyes({ n, y, spread, size, color }: { n: 1 | 2 | 3; y: number; spread: number; size: number; color: string }) {
  const xs = n === 1 ? [100] : n === 2 ? [100 - spread, 100 + spread] : [100 - spread * 1.25, 100, 100 + spread * 1.25];
  return (
    <g className="m-eyes" style={{ filter: `drop-shadow(0 0 4px ${color})` }}>
      {xs.map((x, i) => {
        const s = (n === 3 && i === 1 ? size * 1.1 : size) * 1.05;
        const yy = n === 3 && i === 1 ? y - 6 : y;
        // innen tiefer → wütender Blick; Spiegelung für die rechte Seite
        const dir = n === 1 || (n === 3 && i === 1) ? 0 : x < 100 ? 1 : -1;
        const tilt = dir * s * 0.35;
        return (
          <g key={i} className="m-eye" style={{ transformOrigin: `${x}px ${yy}px` }}>
            <path d={`M${x - s} ${yy - tilt * 0.4} C${x - s * 0.4} ${yy - s * 0.75 - tilt * 0.2} ${x + s * 0.4} ${yy - s * 0.6 + tilt * 0.6} ${x + s} ${yy + tilt * 0.4} C${x + s * 0.4} ${yy + s * 0.45} ${x - s * 0.4} ${yy + s * 0.45} ${x - s} ${yy - tilt * 0.4}Z`}
              fill={color} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
            <ellipse className="m-pupil" cx={x} cy={yy - s * 0.05} rx={s * 0.16} ry={s * 0.5} fill={INK} />
            <path d={`M${x - s * 1.25} ${yy - s * 0.95 - tilt} L${x + s * 1.2} ${yy - s * 0.55 + tilt}`} stroke={INK} strokeWidth={s * 0.45} strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
}

function Mouth({ type, y, w }: { type: Look['mouth']; y: number; w: number }) {
  switch (type) {
    case 'fangs':
      return (
        <g className="m-mouth">
          <path d={`M${100 - w} ${y} Q100 ${y + w * 0.9} ${100 + w} ${y}Z`} fill="#3a0b0b" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d={`M${100 - w * 0.55} ${y + 1}l5 10 5-9M${100 + w * 0.55 - 10} ${y + 1}l5 10 5-9`} fill="#fff" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        </g>
      );
    case 'teeth':
      return (
        <g className="m-mouth">
          <rect x={100 - w} y={y - 6} width={w * 2} height={14} rx={6} fill="#3a0b0b" stroke={INK} strokeWidth="3" />
          {Array.from({ length: 5 }, (_, i) => <rect key={i} x={100 - w + 3 + i * ((w * 2 - 6) / 5)} y={y - 5} width={(w * 2 - 6) / 5 - 1} height={6} fill="#fff" />)}
        </g>
      );
    default: {
      // gezacktes Maul mit unregelmäßigen Zähnen
      const n = 7;
      const top = Array.from({ length: n }, (_, i) => { const x = 100 - w + ((i + 0.5) * 2 * w) / n; return `L${x - w / n * 0.6} ${y - 2} L${x} ${y + 5 + (i % 3) * 2} L${x + w / n * 0.6} ${y - 2}`; }).join(' ');
      return (
        <g className="m-mouth">
          <path d={`M${100 - w} ${y - 3} Q100 ${y + w * 0.75} ${100 + w} ${y - 3} Q100 ${y + 3} ${100 - w} ${y - 3}Z`} fill="#1a0505" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <path d={`M${100 - w} ${y - 2} ${top} L${100 + w} ${y - 2}Z`} fill="#d9cdb0" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
        </g>
      );
    }
  }
}

function Horns({ y, color, big }: { y: number; color: string; big?: boolean }) {
  const h = big ? 34 : 22;
  return (
    <g className="m-horns">
      <path d={`M70 ${y} C58 ${y - h * 0.6} 56 ${y - h} 62 ${y - h - 6} C70 ${y - h * 0.7} 76 ${y - h * 0.4} 82 ${y - 4}Z`} fill={color} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d={`M130 ${y} C142 ${y - h * 0.6} 144 ${y - h} 138 ${y - h - 6} C130 ${y - h * 0.7} 124 ${y - h * 0.4} 118 ${y - 4}Z`} fill={color} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    </g>
  );
}

function Crown({ y }: { y: number }) {
  return (
    <g className="m-crown">
      <path d={`M72 ${y} L76 ${y - 26} L88 ${y - 12} L100 ${y - 32} L112 ${y - 12} L124 ${y - 26} L128 ${y}Z`} fill="#2e2a26" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d={`M74 ${y - 4} H126`} stroke="#5a524a" strokeWidth="2" />
      <circle cx="100" cy={y - 12} r="3.5" fill="#c4161c" style={{ filter: 'drop-shadow(0 0 3px #ff3a2a)' }} />
    </g>
  );
}

function Spots({ color }: { color: string }) {
  return <g opacity=".45">{[[78, 122, 7], [124, 132, 5], [110, 108, 4], [86, 146, 4]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={color} />)}</g>;
}

/* ---------- Körper je Typ ---------- */

function Body({ l }: { l: Look }) {
  const B = l.body, D = l.dark, A = l.accent;
  const face = (y: number, spread = 18, size = 10, mouthY = y + 26, mw = 18) => (
    <>
      <Eyes n={l.eyes} y={y} spread={spread} size={size} color={l.eye} />
      <Mouth type={l.mouth} y={mouthY} w={mw} />
    </>
  );
  switch (l.kind) {
    case 'blob':
      return (
        <g className="m-body m-squish">
          <path d="M40 160 C30 110 60 60 100 60 C140 60 170 110 160 160 C140 172 60 172 40 160Z" fill={B} stroke={INK} strokeWidth="3" />
          <path d="M100 60 C96 48 104 40 110 36" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="76" cy="88" rx="14" ry="8" fill="#fff" opacity=".45" transform="rotate(-30 76 88)" />
          {l.spots && <Spots color={D} />}
          {face(108)}
        </g>
      );
    case 'shroom':
      return (
        <g className="m-body m-squish">
          <path d="M70 168 L74 112 H126 L130 168Z" fill="#fff4dc" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M28 116 C28 60 64 36 100 36 C136 36 172 60 172 116Z" fill={B} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          {[[62, 74, 10], [100, 56, 9], [138, 76, 11], [84, 98, 6], [122, 100, 6]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={A} stroke={INK} strokeWidth="2.5" />)}
          {face(132, 14, 8, 154, 12)}
        </g>
      );
    case 'beast':
      return (
        <g className="m-body m-bob">
          <path className="m-leg-l" d="M62 150 v22 h18 v-18" fill={D} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path className="m-leg-r" d="M120 150 v22 h18 v-18" fill={D} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M44 82 L30 50 L62 64Z M156 82 L170 50 L138 64Z" fill={D} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M40 120 C40 74 66 56 100 56 C134 56 160 74 160 120 C160 150 134 162 100 162 C66 162 40 150 40 120Z" fill={B} stroke={INK} strokeWidth="3" />
          <path d="M72 132 C80 152 120 152 128 132 C120 140 80 140 72 132Z" fill={A} opacity=".6" />
          {l.horns && <Horns y={66} color="#f4e7c8" big={l.boss} />}
          {l.spots && <Spots color={D} />}
          {face(100, 22, 11, 128, 22)}
        </g>
      );
    case 'imp':
      return (
        <g className="m-body m-hop">
          <path className="m-tail" d="M140 150 C170 150 176 120 164 108 l10 -6 -2 14" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
          <path className="m-tail" d="M140 150 C170 150 176 120 164 108" fill="none" stroke={D} strokeWidth="3" strokeLinecap="round" />
          <path d="M56 118 C56 82 76 64 100 64 C124 64 144 82 144 118 C144 150 126 164 100 164 C74 164 56 150 56 118Z" fill={B} stroke={INK} strokeWidth="3" />
          <path d="M60 86 L40 70 L58 104Z M140 86 L160 70 L142 104Z" fill={B} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <Horns y={74} color={D} />
          {face(108, 16, 10, 134, 14)}
        </g>
      );
    case 'spider':
      return (
        <g className="m-body m-bob">
          {[0, 1, 2, 3].map((i) => (
            <g key={i} className={i % 2 ? 'm-leg-l' : 'm-leg-r'}>
              <path d={`M80 ${118 + i * 8} L${46 - i * 4} ${100 + i * 14} L${34 - i * 2} ${150 + i * 6}`} fill="none" stroke={INK} strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
              <path d={`M120 ${118 + i * 8} L${154 + i * 4} ${100 + i * 14} L${166 + i * 2} ${150 + i * 6}`} fill="none" stroke={INK} strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          ))}
          <circle cx="100" cy="116" r="44" fill={B} stroke={INK} strokeWidth="3" />
          <path d="M84 84 L100 70 L116 84" fill="none" stroke={A} strokeWidth="4" strokeLinecap="round" />
          <Eyes n={3} y={110} spread={16} size={8} color={l.eye} />
          <Mouth type="fangs" y={134} w={14} />
        </g>
      );
    case 'worm':
      return (
        <g className="m-body m-wiggle">
          {[0, 1, 2].map((i) => <ellipse key={i} cx={60 + i * 14} cy={156 - i * 6} rx="22" ry="16" fill={i % 2 ? D : B} stroke={INK} strokeWidth="3" />)}
          <path d="M80 140 C70 100 84 60 112 56 C142 52 160 80 152 112 C146 136 120 148 100 146Z" fill={B} stroke={INK} strokeWidth="3" />
          {[90, 104, 118].map((y) => <path key={y} d={`M${88} ${y} q24 6 50 0`} fill="none" stroke={D} strokeWidth="3" />)}
          <Eyes n={l.eyes === 3 ? 2 : l.eyes} y={86} spread={14} size={9} color={l.eye} />
          <Mouth type={l.mouth} y={108} w={14} />
        </g>
      );
    case 'golem':
      return (
        <g className="m-body m-stomp">
          <path className="m-arm-l" d="M40 92 L22 116 L30 150 L50 146 L46 120 L58 104Z" fill={D} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path className="m-arm-r" d="M160 92 L178 116 L170 150 L150 146 L154 120 L142 104Z" fill={D} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M52 166 L46 96 L64 60 L100 50 L136 60 L154 96 L148 166Z" fill={B} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M70 120 L84 132 L78 150 M124 112 L114 128 L126 144" fill="none" stroke={A} strokeWidth="3.5" strokeLinecap="round" className="m-glow" />
          <rect x="66" y="84" width="68" height="26" rx="4" fill={D} stroke={INK} strokeWidth="3" />
          {l.horns && <Horns y={64} color={D} big={l.boss} />}
          <Eyes n={l.eyes === 1 ? 1 : 2} y={97} spread={18} size={8} color={A} />
          <Mouth type="teeth" y={136} w={22} />
        </g>
      );
    case 'bug':
      return (
        <g className="m-body m-bob">
          {[0, 1, 2].map((i) => (
            <g key={i} className={i % 2 ? 'm-leg-l' : 'm-leg-r'}>
              <path d={`M64 ${128 + i * 12} l-22 ${8 + i * 4}`} stroke={INK} strokeWidth="6" strokeLinecap="round" />
              <path d={`M136 ${128 + i * 12} l22 ${8 + i * 4}`} stroke={INK} strokeWidth="6" strokeLinecap="round" />
            </g>
          ))}
          <ellipse cx="100" cy="132" rx="46" ry="38" fill={D} stroke={INK} strokeWidth="3" />
          <path d="M100 96 V170" stroke={INK} strokeWidth="3" />
          <path d="M58 128 C64 104 84 96 100 96 C116 96 136 104 142 128" fill={B} stroke={INK} strokeWidth="3" />
          <circle cx="100" cy="84" r="28" fill={B} stroke={INK} strokeWidth="3" />
          <path className="m-antenna" d="M88 60 Q80 36 66 34 M112 60 Q120 36 134 34" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <circle cx="66" cy="34" r="5" fill={A} stroke={INK} strokeWidth="2" /><circle cx="134" cy="34" r="5" fill={A} stroke={INK} strokeWidth="2" />
          {face(80, 11, 7, 96, 9)}
        </g>
      );
    case 'flyer':
      return (
        <g className="m-body m-hover">
          <path className="m-wing-l" d="M70 100 C40 70 14 76 8 96 C26 96 30 110 22 124 C42 116 52 126 50 140 C64 130 70 116 74 112Z" fill={D} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path className="m-wing-r" d="M130 100 C160 70 186 76 192 96 C174 96 170 110 178 124 C158 116 148 126 150 140 C136 130 130 116 126 112Z" fill={D} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <ellipse cx="100" cy="112" rx="36" ry="40" fill={B} stroke={INK} strokeWidth="3" />
          <path d="M88 152 l4 14 6-12 6 12 4-14" fill={A} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M94 128 L100 140 L106 128Z" fill="#ffb020" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          {l.horns && <Horns y={80} color={D} big={l.boss} />}
          <Eyes n={l.eyes} y={106} spread={14} size={9} color={l.eye} />
        </g>
      );
    case 'ghost':
      return (
        <g className="m-body m-float">
          <path d="M48 168 L48 100 C48 64 72 44 100 44 C128 44 152 64 152 100 L152 168 L138 156 L126 170 L112 156 L100 170 L88 156 L74 170 L62 156Z" fill={B} stroke={INK} strokeWidth="3" strokeLinejoin="round" opacity=".95" />
          <path className="m-arm-l" d="M52 112 C34 116 28 130 34 140" fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" />
          <path className="m-arm-l" d="M52 112 C34 116 28 130 34 140" fill="none" stroke={B} strokeWidth="4" strokeLinecap="round" />
          <path className="m-arm-r" d="M148 112 C166 116 172 130 166 140" fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" />
          <path className="m-arm-r" d="M148 112 C166 116 172 130 166 140" fill="none" stroke={B} strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="80" cy="70" rx="14" ry="8" fill="#fff" opacity=".4" transform="rotate(-30 80 70)" />
          {face(96, 18, 11, 126, 16)}
        </g>
      );
    case 'fish':
      return (
        <g className="m-body m-swim">
          <path className="m-tail" d="M40 112 L14 86 L18 112 L14 140Z" fill={D} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M40 112 C52 70 110 60 150 86 C170 98 172 126 150 138 C110 164 52 154 40 112Z" fill={B} stroke={INK} strokeWidth="3" />
          <path d="M92 76 L104 52 L118 78" fill={D} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
          <path className="m-lure" d="M140 82 Q150 40 128 32" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          <circle className="m-glow" cx="128" cy="30" r="8" fill={l.eye} stroke={INK} strokeWidth="2.5" />
          <Eyes n={1} y={102} spread={0} size={12} color="#fff" />
          <g transform="translate(36 0)"><Mouth type="fangs" y={126} w={16} /></g>
        </g>
      );
    case 'goblin':
      return (
        <g className="m-body m-sneak">
          <path className="m-leg-l" d="M82 150 l-6 26 h14 l2 -22" fill="#4b5a35" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path className="m-leg-r" d="M112 150 l4 26 h14 l-4 -26" fill="#4b5a35" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M70 156 C66 128 78 110 100 110 C122 110 134 128 130 156 L120 150 L112 160 L100 150 L88 160 L80 150Z" fill="#6b4a2e" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path className="m-dagger" d="M128 132 l30 -26 l6 4 l-28 30Z M126 136 l6 6" fill="#cfd6e0" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="130" cy="138" r="7" fill="#7a8a5a" stroke={INK} strokeWidth="3" />
          <path className="m-ear-l" d="M66 84 L18 66 L60 104Z" fill="#7a8a5a" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path className="m-ear-r" d="M134 84 L182 66 L140 104Z" fill="#7a8a5a" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M58 92 C58 62 78 48 100 48 C122 48 142 62 142 92 C142 118 124 130 100 130 C76 130 58 118 58 92Z" fill="#8a9a66" stroke={INK} strokeWidth="3" />
          <path d="M74 76 l18 6 M126 76 l-18 6" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="84" cy="90" rx="9" ry="10" fill="#ffd23f" stroke={INK} strokeWidth="3" className="m-eye" style={{ transformOrigin: '84px 90px' }} />
          <ellipse cx="116" cy="90" rx="9" ry="10" fill="#ffd23f" stroke={INK} strokeWidth="3" className="m-eye" style={{ transformOrigin: '116px 90px' }} />
          <rect x="82" y="86" width="4" height="9" rx="2" fill={INK} /><rect x="114" y="86" width="4" height="9" rx="2" fill={INK} />
          <path className="m-mouth" d="M82 112 Q100 122 120 108" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <path d="M90 113 l3 6 3 -5 M108 113 l3 5 3 -6" fill="#fff4dc" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        </g>
      );
    case 'troll':
      return (
        <g className="m-body m-stomp">
          <path className="m-leg-l" d="M62 160 v20 h26 v-18" fill="#5f6458" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path className="m-leg-r" d="M112 160 v20 h26 v-18" fill="#5f6458" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M34 150 C24 104 50 70 100 68 C150 70 176 104 166 150 C150 172 50 172 34 150Z" fill="#8a8f86" stroke={INK} strokeWidth="3" />
          <path d="M60 130 C70 150 130 150 140 130" fill="none" stroke="#5f6458" strokeWidth="3" />
          <circle cx="62" cy="104" r="6" fill="#6e8a4a" opacity=".7" /><circle cx="136" cy="118" r="8" fill="#6e8a4a" opacity=".7" />
          <path d="M34 120 C18 124 14 150 26 158" fill="none" stroke={INK} strokeWidth="16" strokeLinecap="round" />
          <path d="M34 120 C18 124 14 150 26 158" fill="none" stroke="#8a8f86" strokeWidth="10" strokeLinecap="round" />
          <g className="m-club">
            <path d="M160 118 L186 40" stroke={INK} strokeWidth="14" strokeLinecap="round" />
            <path d="M160 118 L186 40" stroke="#7a5230" strokeWidth="8" strokeLinecap="round" />
            <path d="M172 50 C168 28 186 10 200 18 C214 26 206 54 190 60Z" fill="#7a5230" stroke={INK} strokeWidth="3" />
            <path d="M184 22 l-4 -8 M200 32 l8 -4 M196 50 l8 4" stroke={INK} strokeWidth="3" strokeLinecap="round" />
            <circle cx="160" cy="120" r="12" fill="#8a8f86" stroke={INK} strokeWidth="3" />
          </g>
          <path d="M76 74 C76 52 88 42 100 42 C112 42 124 52 124 74 C124 92 112 100 100 100 C88 100 76 92 76 74Z" fill="#9aa094" stroke={INK} strokeWidth="3" />
          <path d="M80 62 l14 4 M120 62 l-14 4" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <circle cx="90" cy="72" r="5" fill="#ffd23f" stroke={INK} strokeWidth="2.5" /><circle cx="110" cy="72" r="5" fill="#ffd23f" stroke={INK} strokeWidth="2.5" />
          <path d="M100 74 l-6 10 h12Z" fill="#7d7f7a" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <path className="m-mouth" d="M84 90 Q100 98 116 90" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <path d="M86 90 l2 -12 4 11 M114 90 l-2 -12 -4 11" fill="#fff4dc" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        </g>
      );
    case 'wraith':
      return (
        <g className="m-body m-float">
          <path className="m-wisp" d="M60 170 C40 160 36 140 50 128" fill="none" stroke="#6b5c9a" strokeWidth="4" strokeLinecap="round" opacity=".6" />
          <path className="m-wisp" d="M142 172 C162 160 166 140 152 126" fill="none" stroke="#6b5c9a" strokeWidth="4" strokeLinecap="round" opacity=".6" />
          <path className="m-hem" d="M100 26 C68 28 58 60 56 92 L46 178 L62 166 L72 182 L86 168 L98 184 L110 168 L124 182 L136 166 L152 178 L144 92 C142 60 132 28 100 26Z" fill="#1d1828" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M72 100 C80 120 76 150 70 170 M128 100 C120 120 124 150 130 170" fill="none" stroke="#2e2840" strokeWidth="3" />
          <g className="m-sword">
            <path d="M138 118 L186 22" stroke={INK} strokeWidth="11" strokeLinecap="round" />
            <path d="M138 118 L186 22" stroke="#cfd6e0" strokeWidth="5" strokeLinecap="round" />
            <path d="M128 112 L152 124" stroke={INK} strokeWidth="7" strokeLinecap="round" />
            <path d="M136 120 C140 130 132 140 126 136" fill="#cdbfa4" stroke={INK} strokeWidth="3" />
          </g>
          <path d="M100 46 C80 46 74 66 76 86 C82 100 118 100 124 86 C126 66 120 46 100 46Z" fill="#050407" stroke={INK} strokeWidth="3" />
          <g className="m-glow">
            <ellipse cx="90" cy="76" rx="5" ry="3" fill="#9be7ff" /><ellipse cx="110" cy="76" rx="5" ry="3" fill="#9be7ff" />
            <circle cx="90" cy="76" r="10" fill="#9be7ff" opacity=".25" /><circle cx="110" cy="76" r="10" fill="#9be7ff" opacity=".25" />
          </g>
          <path d="M82 40 L86 26 L92 38 L100 22 L108 38 L114 26 L118 40" fill="none" stroke="#5a5470" strokeWidth="4" strokeLinejoin="round" />
        </g>
      );
    case 'demon':
      return (
        <g className="m-body m-stomp">
          <path className="m-wing-l" d="M70 92 C36 50 6 56 0 82 C20 82 22 98 12 112 C34 104 44 116 40 132 C56 122 64 110 72 104Z" fill="#2a0f0c" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path className="m-wing-r" d="M130 92 C164 50 194 56 200 82 C180 82 178 98 188 112 C166 104 156 116 160 132 C144 122 136 110 128 104Z" fill="#2a0f0c" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <g className="m-flame">
            <path d="M58 70 C50 40 70 30 66 8 C82 22 84 36 88 46 C90 26 102 18 100 0 C116 18 116 36 112 46 C118 34 130 30 134 14 C146 36 142 56 142 70Z" fill="#ff6a2b" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
            <path d="M74 66 C70 48 82 40 82 26 C92 40 96 50 100 56 C104 44 112 38 114 28 C122 44 124 56 126 66Z" fill="#ffd23f" />
          </g>
          <path d="M50 168 C40 120 56 74 100 70 C144 74 160 120 150 168Z" fill="#3a1410" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path className="m-glow" d="M74 100 L86 118 L78 136 M120 96 L112 116 L124 132 M98 140 L104 160" fill="none" stroke="#ff8a3d" strokeWidth="4" strokeLinecap="round" />
          <path d="M70 62 C50 50 46 30 56 14 C60 32 70 40 80 46Z M130 62 C150 50 154 30 144 14 C140 32 130 40 120 46Z" fill="#1a0a08" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M72 86 C72 60 84 50 100 50 C116 50 128 60 128 86 C128 104 116 112 100 112 C84 112 72 104 72 86Z" fill="#4a1a14" stroke={INK} strokeWidth="3" />
          <path d="M80 76 l14 6 M120 76 l-14 6" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="88" cy="86" rx="7" ry="5" fill="#ffd23f" className="m-glow" /><ellipse cx="112" cy="86" rx="7" ry="5" fill="#ffd23f" className="m-glow" />
          <path className="m-mouth" d="M84 100 Q100 112 116 100Z" fill="#ff6a2b" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <g className="m-whip">
            <path d="M150 140 C176 150 188 176 168 192 C150 204 124 196 112 186" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />
            <path d="M150 140 C176 150 188 176 168 192 C150 204 124 196 112 186" fill="none" stroke="#ff8a3d" strokeWidth="3" strokeLinecap="round" />
          </g>
          {[0, 1, 2, 3].map((i) => <circle key={i} className={`m-ember m-e${i}`} cx={70 + i * 20} cy="40" r="3" fill="#ffd23f" />)}
        </g>
      );
    case 'dragon':
      return (
        <g className="m-body">
          <path className="m-wing-l" d="M100 96 L50 14 L58 54 L30 46 L46 78 L16 80 L74 116Z" fill="#4a2a1e" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path className="m-wing-r" d="M128 94 L178 10 L170 52 L198 44 L182 78 L204 86 L148 116Z" fill="#4a2a1e" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M100 96 L58 54 M100 96 L46 78 M128 94 L170 52 M128 94 L182 78" stroke="#2a150e" strokeWidth="3" />
          <path className="m-tail" d="M160 158 C196 162 208 132 196 108 l12 -6 -2 16" fill="none" stroke={INK} strokeWidth="14" strokeLinecap="round" />
          <path className="m-tail" d="M160 158 C196 162 208 132 196 108" fill="none" stroke="#8a3a1e" strokeWidth="8" strokeLinecap="round" />
          <ellipse cx="126" cy="142" rx="50" ry="34" fill="#8a3a1e" stroke={INK} strokeWidth="3" />
          <path d="M98 160 C110 170 140 172 156 160" fill="none" stroke="#e8b46a" strokeWidth="9" strokeLinecap="round" />
          <path d="M104 162 v6 M118 166 v6 M132 167 v6 M146 164 v6" stroke="#8a3a1e" strokeWidth="2" />
          <path d="M96 168 v14 l-6 6 M104 170 v14 l2 6 M146 170 v14 l6 6" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${108 + i * 12} ${110 - (i % 2) * 2} l6 -12 6 12`} fill="#e8b46a" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />)}
          <g className="m-neck">
            <path d="M112 134 C92 124 82 108 76 96 L60 106 C68 122 82 136 102 148Z" fill="#8a3a1e" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
            <g className="m-head">
              <path d="M30 80 C34 60 60 56 80 68 L86 92 C72 100 52 102 40 98 L20 100 C18 92 24 84 30 80Z" fill="#a4471f" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
              <path className="m-jaw" d="M22 100 L40 98 C52 100 66 100 82 94 L78 104 C62 114 40 114 24 108Z" fill="#8a3a1e" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
              <path d="M28 100 l4 6 4 -5 4 6 4 -6" fill="#fff4dc" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
              <path d="M62 64 L70 34 L76 66Z M74 68 L94 42 L86 74Z" fill="#e8b46a" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
              <ellipse cx="58" cy="76" rx="8" ry="6" fill="#ffd23f" stroke={INK} strokeWidth="3" className="m-glow" />
              <rect x="56" y="70" width="3" height="12" rx="1.5" fill={INK} />
              <circle cx="28" cy="86" r="3" fill={INK} />
              <circle className="m-smoke m-s0" cx="22" cy="80" r="6" fill="#6b6460" opacity=".5" />
              <circle className="m-smoke m-s1" cx="18" cy="74" r="5" fill="#6b6460" opacity=".4" />
              <g className="m-fire">
                <path d="M20 102 C0 88 -40 92 -90 74 C-60 100 -76 110 -100 128 C-60 116 -30 118 20 108Z" fill="#ff4d1f" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
                <path d="M18 103 C0 96 -26 98 -60 90 C-40 106 -50 110 -66 118 C-40 112 -16 112 18 107Z" fill="#ffb020" />
                <path d="M16 104 C2 101 -10 102 -30 100 C-18 106 -22 108 -30 112 C-12 110 0 108 16 106Z" fill="#fff3b0" />
              </g>
            </g>
          </g>
        </g>
      );
    default: // squid
      return (
        <g className="m-body m-float">
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} className={`m-tentacle m-t${i}`} d={`M${66 + i * 17} 132 C${60 + i * 17} 156 ${76 + i * 17} 166 ${64 + i * 17} 184`} fill="none" stroke={INK} strokeWidth="11" strokeLinecap="round" />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={`c${i}`} className={`m-tentacle m-t${i}`} d={`M${66 + i * 17} 132 C${60 + i * 17} 156 ${76 + i * 17} 166 ${64 + i * 17} 184`} fill="none" stroke={D} strokeWidth="6" strokeLinecap="round" />
          ))}
          <path d="M52 132 C44 80 66 36 100 36 C134 36 156 80 148 132Z" fill={B} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          {l.spots && <Spots color={D} />}
          {face(96, 18, 11, 120, 14)}
        </g>
      );
  }
}

function MonsterSvg({ id, theme, index = 0, boss = false, size = 120, state = 'idle' }: { id: string; theme: Theme; index?: number; boss?: boolean; size?: number; state?: MonsterState }) {
  const beast = BESTIARY[id];
  if (beast) {
    const cls = state === 'hit' ? 'mi-idle mi-hit' : state === 'attack' ? 'mi-idle mi-attack' : `mi-${state}`;
    return (
      <div className={`monster-img ${cls} ${boss ? 'mi-boss' : ''}`} style={{ width: size, height: size, ['--md' as string]: `${-(hashStr(id) % 3000) / 1000}s` }}>
        {boss && <div className="mi-aura" />}
        <div className="mi-shadow" />
        <div className="mi-rig">
          <img src={beastUrl(beast.img)} alt={beast.name} draggable={false} style={{ filter: beast.filter }} />
        </div>
        {state === 'dead' && <div className="mi-dust" />}
      </div>
    );
  }
  const l = monsterLook(id, theme, index, boss);
  const delay = `${-(hashStr(id) % 2000) / 1000}s`;
  const fid = `${id}-${size}`.replace(/[^a-z0-9-]/gi, '');
  return (
    <div className={`monster m-${l.kind} ${state === 'hit' ? 'm-idle m-hit' : state === 'attack' ? 'm-idle m-attack' : `m-${state}`} ${boss ? 'm-boss' : ''}`} style={{ width: size, height: size, ['--md' as string]: delay }}>
      <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: 'visible' }}>
        <ellipse className="m-shadow" cx="100" cy="182" rx="56" ry="9" fill="#000" opacity=".35" />
        <defs>
          <filter id={`mf-${fid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="7" result="b" />
            <feDiffuseLighting in="b" surfaceScale="7" diffuseConstant="1.15" lightingColor="#fff4e0" result="l">
              <feDistantLight azimuth="235" elevation="38" />
            </feDiffuseLighting>
            <feComposite in="l" in2="SourceAlpha" operator="in" result="lc" />
            <feBlend in="SourceGraphic" in2="lc" mode="multiply" result="lit" />
            <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed={hashStr(id) % 97} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .22 0" result="g" />
            <feComposite in="g" in2="SourceAlpha" operator="in" result="gm" />
            <feComposite in="gm" in2="lit" operator="over" />
          </filter>
          <radialGradient id={`ma-${fid}`}>
            <stop offset="0" stopColor="#c4161c" stopOpacity=".55" />
            <stop offset=".6" stopColor="#5a0a08" stopOpacity=".25" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>
        {boss && <circle className="m-aura" cx="100" cy="112" r="96" fill={`url(#ma-${fid})`} />}
        <g className="m-rig" filter={size >= 96 ? `url(#mf-${fid})` : undefined}>
          <Body l={l} />
          {boss && (l.kind === 'ghost' || l.kind === 'squid' || l.kind === 'flyer') && <Crown y={l.kind === 'flyer' ? 76 : 46} />}
          {boss && l.kind === 'golem' && <Crown y={56} />}
        </g>
      </svg>
    </div>
  );
}

export const Monster = memo(MonsterSvg);

/** Monster-Typ (für typabhängige Effekte im Kampf) */
export const monsterKind = (id: string, theme: Theme, index: number, boss: boolean) => monsterLook(id, theme, index, boss).kind;
