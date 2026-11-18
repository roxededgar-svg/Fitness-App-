import { memo } from 'react';
import { hashStr, rng } from '../lib/rng';
import type { Theme } from '../lib/path';

/**
 * Animierte Monster im Comic-Stil. Jedes Monster wird aus Bauteilen gezeichnet
 * (Körper je Typ, Augen, Maul, Hörner, Flügel …) – deterministisch aus seiner ID,
 * damit es immer gleich aussieht. Zustände: idle (atmen, blinzeln, bewegen),
 * hit (zusammenzucken + aufblitzen), dead (umkippen und verblassen).
 */
export type MonsterKind = 'blob' | 'beast' | 'shroom' | 'imp' | 'spider' | 'worm' | 'golem' | 'bug' | 'flyer' | 'ghost' | 'fish' | 'squid';
export type MonsterState = 'idle' | 'hit' | 'dead';

const KINDS: Record<Theme, MonsterKind[]> = {
  forest: ['blob', 'beast', 'shroom', 'beast'],
  ice: ['imp', 'spider', 'worm', 'golem'],
  fire: ['imp', 'beast', 'bug', 'golem'],
  shadow: ['flyer', 'ghost', 'golem', 'ghost'],
  sky: ['ghost', 'flyer', 'flyer', 'beast'],
  abyss: ['worm', 'bug', 'fish', 'squid'],
  olymp: ['golem', 'golem', 'flyer', 'ghost'],
};
const BOSS: Record<Theme, MonsterKind> = { forest: 'beast', ice: 'ghost', fire: 'golem', shadow: 'ghost', sky: 'flyer', abyss: 'squid', olymp: 'golem' };

/** Farbpaletten je Welt: Körper hell/dunkel, Akzent, Augenfarbe */
const PAL: Record<Theme, { body: string[]; accent: string; eye: string }> = {
  forest: { body: ['#7ed957', '#3fa34d', '#9be15d', '#2f8f5b'], accent: '#c8f560', eye: '#fff7c2' },
  ice: { body: ['#a8e6ff', '#6cc7f0', '#d6f4ff', '#7fb3ff'], accent: '#ffffff', eye: '#1b3a6b' },
  fire: { body: ['#ff7a3d', '#e2471c', '#ffa13d', '#b8320f'], accent: '#ffe066', eye: '#fff3b0' },
  shadow: { body: ['#9d7bea', '#6a4bc4', '#b394ff', '#4b2f8f'], accent: '#e3d4ff', eye: '#d7ff3b' },
  sky: { body: ['#ffe27a', '#8fd3ff', '#ffffff', '#ffd23f'], accent: '#ffffff', eye: '#16324f' },
  abyss: { body: ['#3fd2c7', '#1f9fb0', '#62e6d8', '#13788c'], accent: '#c2fff8', eye: '#fff36b' },
  olymp: { body: ['#f5d27a', '#e0b44a', '#fff0b8', '#c9952b'], accent: '#ffffff', eye: '#3a2400' },
};

const INK = '#111';
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
    eyes: boss ? (eyesRoll < 0.5 ? 3 : 2) : eyesRoll < 0.18 ? 1 : eyesRoll > 0.88 ? 3 : 2,
    mouth: (['fangs', 'grin', 'teeth', 'o'] as const)[Math.floor(r() * 4)],
    horns: boss || r() < 0.35,
    spots: r() < 0.5,
    boss,
  };
}

/* ---------- Bauteile ---------- */

function Eyes({ n, y, spread, size, color }: { n: 1 | 2 | 3; y: number; spread: number; size: number; color: string }) {
  const xs = n === 1 ? [100] : n === 2 ? [100 - spread, 100 + spread] : [100 - spread * 1.25, 100, 100 + spread * 1.25];
  return (
    <g className="m-eyes">
      {xs.map((x, i) => {
        const s = n === 3 && i === 1 ? size * 1.15 : size;
        const yy = n === 3 && i === 1 ? y - 6 : y;
        return (
          <g key={i} className="m-eye" style={{ transformOrigin: `${x}px ${yy}px` }}>
            <ellipse cx={x} cy={yy} rx={s} ry={s * 1.1} fill={color} stroke={INK} strokeWidth="3" />
            <circle cx={x + s * 0.15} cy={yy + s * 0.15} r={s * 0.5} fill={INK} className="m-pupil" />
            <circle cx={x + s * 0.35} cy={yy - s * 0.15} r={s * 0.18} fill="#fff" />
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
    case 'o':
      return <ellipse className="m-mouth" cx={100} cy={y + 2} rx={w * 0.38} ry={w * 0.45} fill="#3a0b0b" stroke={INK} strokeWidth="3" />;
    default:
      return <path className="m-mouth" d={`M${100 - w} ${y - 2} Q100 ${y + w * 0.7} ${100 + w} ${y - 2}`} fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />;
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
      <path d={`M72 ${y} L76 ${y - 26} L88 ${y - 12} L100 ${y - 32} L112 ${y - 12} L124 ${y - 26} L128 ${y}Z`} fill="#ffd23f" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="100" cy={y - 12} r="4" fill="#ff4d3d" stroke={INK} strokeWidth="2" />
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
          <path d="M40 160 C30 110 60 60 100 60 C140 60 170 110 160 160 C140 172 60 172 40 160Z" fill={B} stroke={INK} strokeWidth="4" />
          <path d="M100 60 C96 48 104 40 110 36" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="76" cy="88" rx="14" ry="8" fill="#fff" opacity=".45" transform="rotate(-30 76 88)" />
          {l.spots && <Spots color={D} />}
          {face(108)}
        </g>
      );
    case 'shroom':
      return (
        <g className="m-body m-squish">
          <path d="M70 168 L74 112 H126 L130 168Z" fill="#fff4dc" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path d="M28 116 C28 60 64 36 100 36 C136 36 172 60 172 116Z" fill={B} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          {[[62, 74, 10], [100, 56, 9], [138, 76, 11], [84, 98, 6], [122, 100, 6]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={A} stroke={INK} strokeWidth="2.5" />)}
          {face(132, 14, 8, 154, 12)}
        </g>
      );
    case 'beast':
      return (
        <g className="m-body m-bob">
          <path className="m-leg-l" d="M62 150 v22 h18 v-18" fill={D} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path className="m-leg-r" d="M120 150 v22 h18 v-18" fill={D} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path d="M44 82 L30 50 L62 64Z M156 82 L170 50 L138 64Z" fill={D} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path d="M40 120 C40 74 66 56 100 56 C134 56 160 74 160 120 C160 150 134 162 100 162 C66 162 40 150 40 120Z" fill={B} stroke={INK} strokeWidth="4" />
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
          <path d="M56 118 C56 82 76 64 100 64 C124 64 144 82 144 118 C144 150 126 164 100 164 C74 164 56 150 56 118Z" fill={B} stroke={INK} strokeWidth="4" />
          <path d="M60 86 L40 70 L58 104Z M140 86 L160 70 L142 104Z" fill={B} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
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
          <circle cx="100" cy="116" r="44" fill={B} stroke={INK} strokeWidth="4" />
          <path d="M84 84 L100 70 L116 84" fill="none" stroke={A} strokeWidth="4" strokeLinecap="round" />
          <Eyes n={3} y={110} spread={16} size={8} color={l.eye} />
          <Mouth type="fangs" y={134} w={14} />
        </g>
      );
    case 'worm':
      return (
        <g className="m-body m-wiggle">
          {[0, 1, 2].map((i) => <ellipse key={i} cx={60 + i * 14} cy={156 - i * 6} rx="22" ry="16" fill={i % 2 ? D : B} stroke={INK} strokeWidth="4" />)}
          <path d="M80 140 C70 100 84 60 112 56 C142 52 160 80 152 112 C146 136 120 148 100 146Z" fill={B} stroke={INK} strokeWidth="4" />
          {[90, 104, 118].map((y) => <path key={y} d={`M${88} ${y} q24 6 50 0`} fill="none" stroke={D} strokeWidth="3" />)}
          <Eyes n={l.eyes === 3 ? 2 : l.eyes} y={86} spread={14} size={9} color={l.eye} />
          <Mouth type={l.mouth} y={108} w={14} />
        </g>
      );
    case 'golem':
      return (
        <g className="m-body m-stomp">
          <path className="m-arm-l" d="M40 92 L22 116 L30 150 L50 146 L46 120 L58 104Z" fill={D} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path className="m-arm-r" d="M160 92 L178 116 L170 150 L150 146 L154 120 L142 104Z" fill={D} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path d="M52 166 L46 96 L64 60 L100 50 L136 60 L154 96 L148 166Z" fill={B} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
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
          <ellipse cx="100" cy="132" rx="46" ry="38" fill={D} stroke={INK} strokeWidth="4" />
          <path d="M100 96 V170" stroke={INK} strokeWidth="3" />
          <path d="M58 128 C64 104 84 96 100 96 C116 96 136 104 142 128" fill={B} stroke={INK} strokeWidth="4" />
          <circle cx="100" cy="84" r="28" fill={B} stroke={INK} strokeWidth="4" />
          <path className="m-antenna" d="M88 60 Q80 36 66 34 M112 60 Q120 36 134 34" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
          <circle cx="66" cy="34" r="5" fill={A} stroke={INK} strokeWidth="2" /><circle cx="134" cy="34" r="5" fill={A} stroke={INK} strokeWidth="2" />
          {face(80, 11, 7, 96, 9)}
        </g>
      );
    case 'flyer':
      return (
        <g className="m-body m-hover">
          <path className="m-wing-l" d="M70 100 C40 70 14 76 8 96 C26 96 30 110 22 124 C42 116 52 126 50 140 C64 130 70 116 74 112Z" fill={D} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path className="m-wing-r" d="M130 100 C160 70 186 76 192 96 C174 96 170 110 178 124 C158 116 148 126 150 140 C136 130 130 116 126 112Z" fill={D} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <ellipse cx="100" cy="112" rx="36" ry="40" fill={B} stroke={INK} strokeWidth="4" />
          <path d="M88 152 l4 14 6-12 6 12 4-14" fill={A} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M94 128 L100 140 L106 128Z" fill="#ffb020" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          {l.horns && <Horns y={80} color={D} big={l.boss} />}
          <Eyes n={l.eyes} y={106} spread={14} size={9} color={l.eye} />
        </g>
      );
    case 'ghost':
      return (
        <g className="m-body m-float">
          <path d="M48 168 L48 100 C48 64 72 44 100 44 C128 44 152 64 152 100 L152 168 L138 156 L126 170 L112 156 L100 170 L88 156 L74 170 L62 156Z" fill={B} stroke={INK} strokeWidth="4" strokeLinejoin="round" opacity=".95" />
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
          <path className="m-tail" d="M40 112 L14 86 L18 112 L14 140Z" fill={D} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path d="M40 112 C52 70 110 60 150 86 C170 98 172 126 150 138 C110 164 52 154 40 112Z" fill={B} stroke={INK} strokeWidth="4" />
          <path d="M92 76 L104 52 L118 78" fill={D} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
          <path className="m-lure" d="M140 82 Q150 40 128 32" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          <circle className="m-glow" cx="128" cy="30" r="8" fill={l.eye} stroke={INK} strokeWidth="2.5" />
          <Eyes n={1} y={102} spread={0} size={12} color="#fff" />
          <g transform="translate(36 0)"><Mouth type="fangs" y={126} w={16} /></g>
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
          <path d="M52 132 C44 80 66 36 100 36 C134 36 156 80 148 132Z" fill={B} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          {l.spots && <Spots color={D} />}
          {face(96, 18, 11, 120, 14)}
        </g>
      );
  }
}

function MonsterSvg({ id, theme, index = 0, boss = false, size = 120, state = 'idle' }: { id: string; theme: Theme; index?: number; boss?: boolean; size?: number; state?: MonsterState }) {
  const l = monsterLook(id, theme, index, boss);
  const delay = `${-(hashStr(id) % 2000) / 1000}s`;
  return (
    <div className={`monster m-${l.kind} ${state === 'hit' ? 'm-idle m-hit' : `m-${state}`} ${boss ? 'm-boss' : ''}`} style={{ width: size, height: size, ['--md' as string]: delay }}>
      <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: 'visible' }}>
        <ellipse className="m-shadow" cx="100" cy="182" rx="56" ry="9" fill="#000" opacity=".35" />
        {boss && <circle className="m-aura" cx="100" cy="110" r="88" fill="none" stroke="#ff4d3d" strokeWidth="5" strokeDasharray="10 12" opacity=".7" />}
        <g className="m-rig">
          <Body l={l} />
          {boss && (l.kind === 'ghost' || l.kind === 'squid' || l.kind === 'flyer') && <Crown y={l.kind === 'flyer' ? 76 : 46} />}
          {boss && l.kind === 'golem' && <Crown y={56} />}
        </g>
      </svg>
    </div>
  );
}

export const Monster = memo(MonsterSvg);
