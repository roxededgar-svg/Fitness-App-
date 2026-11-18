import { useEffect, useState } from 'react';
import { useArt } from '../lib/art';

/**
 * Flux – der Begleiter. Ein schwebender Energiegeist mit Gesichtsausdrücken.
 * mood: happy | excited | think | wink | proud
 */
export type Mood = 'happy' | 'excited' | 'think' | 'wink' | 'proud';

export function Flux({ mood = 'happy', size = 140 }: { mood?: Mood; size?: number }) {
  const moodArt = useArt(`flux-${mood}`);
  const baseArt = useArt('flux');
  const art = moodArt ?? baseArt;
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        loop();
      }, 2200 + Math.random() * 2600);
    };
    loop();
    return () => clearTimeout(t);
  }, []);

  const eyeY = 54;
  const eye = (x: number, right: boolean) => {
    if (blink || (mood === 'wink' && right)) return <path d={`M${x - 6} ${eyeY} q6 4 12 0`} stroke="#0b1430" strokeWidth="3.5" fill="none" strokeLinecap="round" />;
    if (mood === 'excited' || mood === 'proud') return <path d={`M${x - 6} ${eyeY + 2} q6 -9 12 0`} stroke="#0b1430" strokeWidth="3.5" fill="none" strokeLinecap="round" />;
    return (
      <g>
        <ellipse cx={x} cy={eyeY} rx="6" ry={mood === 'think' ? 6 : 7.5} fill="#0b1430" />
        <circle cx={x + 2} cy={eyeY - 3} r="2.2" fill="#fff" />
      </g>
    );
  };
  const mouth = {
    happy: 'M50 68 q10 9 20 0',
    excited: 'M48 66 q12 16 24 0 z',
    think: 'M53 70 h14',
    wink: 'M50 68 q10 8 20 -2',
    proud: 'M48 67 q12 12 24 0',
  }[mood];

  if (art) return <div className={`flux flux-${mood}`} style={{ width: size, height: size }}><img src={art} alt="Flux" className="art-img" style={{ width: size, height: size }} /></div>;
  return (
    <div className={`flux flux-${mood}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="flux-body" cx="40%" cy="35%" r="70%">
            <stop offset="0" stopColor="#FAFFD6" />
            <stop offset=".35" stopColor="#E8FF7A" />
            <stop offset=".75" stopColor="#C6F02A" />
            <stop offset="1" stopColor="#8DB800" />
          </radialGradient>
        </defs>
        
        {/* Flammen-Schopf */}
        <path className="flux-tuft" d="M44 24c-2-10 6-16 8-22 2 8 6 10 8 16 2-8 8-10 10-16 2 8 2 16-2 22z" fill="#FF8A3D" stroke="#111" strokeWidth="3" strokeLinejoin="round" />
        {/* Körper */}
        <path d="M60 18c24 0 40 18 40 42 0 20-14 36-32 40l-8 12-8-12C34 96 20 80 20 60c0-24 16-42 40-42z" fill="url(#flux-body)" stroke="#111" strokeWidth="3.5" strokeLinejoin="round" />
        <ellipse cx="44" cy="36" rx="12" ry="7" fill="#fff" opacity=".45" transform="rotate(-25 44 36)" />
        {/* Arme */}
        <path className="flux-arm-l" d="M22 66c-8 2-12-2-14-8" stroke="#111" strokeWidth="10" fill="none" strokeLinecap="round" /><path className="flux-arm-l" d="M22 66c-8 2-12-2-14-8" stroke="#D7FF3B" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path className="flux-arm-r" d="M98 66c8 2 12-2 14-8" stroke="#111" strokeWidth="10" fill="none" strokeLinecap="round" /><path className="flux-arm-r" d="M98 66c8 2 12-2 14-8" stroke="#D7FF3B" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* Wangen */}
        <ellipse cx="38" cy="66" rx="6" ry="3.5" fill="#f472b6" opacity=".55" />
        <ellipse cx="82" cy="66" rx="6" ry="3.5" fill="#f472b6" opacity=".55" />
        {eye(46, false)}
        {eye(74, true)}
        <path d={mouth} stroke="#0b1430" strokeWidth="3.5" fill={mood === 'excited' ? '#0b1430' : 'none'} strokeLinecap="round" strokeLinejoin="round" />
        {mood === 'think' && <circle cx="100" cy="26" r="5" fill="#fff" opacity=".7" />}
        {(mood === 'excited' || mood === 'proud') && (
          <g fill="#fde047">
            <path d="M14 26l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
            <path d="M104 92l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" />
          </g>
        )}
      </svg>
    </div>
  );
}

/** Sprechblase mit Schreibmaschinen-Effekt */
export function Speech({ text, onDone }: { text: string; onDone?: () => void }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setN(text.length);
      onDone?.();
      return;
    }
    const id = setInterval(() => {
      setN((v) => {
        if (v >= text.length) {
          clearInterval(id);
          onDone?.();
          return v;
        }
        return v + 3;
      });
    }, 22);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return (
    <div className="speech" onClick={() => setN(text.length)}>
      {text.slice(0, n)}
      {n < text.length && <span className="caret" />}
    </div>
  );
}
