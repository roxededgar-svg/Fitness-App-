import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Drehbare 3D-Medaille (reines CSS-3D):
 * - Vorder- und Rückseite, dazwischen gestapelte Schichten als Rand → echte Dicke
 * - Mit dem Finger drehen, beim Loslassen dreht sie mit Schwung weiter
 *   und rastet dann sanft auf Vorder- oder Rückseite ein
 * - spinIn: dreht sich beim Erscheinen schwungvoll ein (für neue Abzeichen)
 */
export type MedalShape = 'hex' | 'circle' | 'shield';

const CLIP: Record<MedalShape, string> = {
  hex: 'polygon(50% 0, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)',
  circle: 'circle(50% at 50% 50%)',
  shield: 'polygon(50% 0, 92% 12%, 92% 52%, 50% 100%, 8% 52%, 8% 12%)',
};

interface Props {
  front: ReactNode;
  back: ReactNode;
  size?: number;
  shape?: MedalShape;
  /** Farbe des Randes */
  edge?: string;
  /** Dicke in px */
  depth?: number;
  spinIn?: boolean;
  /** Dreht sich im Leerlauf langsam hin und her */
  idle?: boolean;
  /** Drehen per Finger erlaubt */
  interactive?: boolean;
}

export function Spin3D({ front, back, size = 240, shape = 'hex', edge = '#64748b', depth, spinIn = false, idle = false, interactive = true }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  // spinIn: Start so wählen, dass der Schwung genau auf der Vorderseite ausläuft (Summe ≈ v0 / (1 - Reibung))
  const st = useRef({ ry: spinIn ? -22 / (1 - 0.955) : 0, rx: 0, vy: spinIn ? 22 : 0, vx: 0, dragging: false, lx: 0, ly: 0, lt: 0, t0: performance.now(), last: performance.now() });
  const thick = depth ?? Math.max(6, Math.round(size / 22));
  const layers = Math.max(6, Math.round(thick / 1.2));

  useEffect(() => {
    let raf = 0;
    const s = st.current;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      // zeitbasiert: k = Anzahl „60-fps-Frames“ seit dem letzten Bild
      const k = Math.min(4, (now - s.last) / 16.67);
      s.last = now;
      if (!s.dragging) {
        if (Math.abs(s.vy) > 0.15) {
          s.ry += s.vy * k;
          s.vy *= Math.pow(0.955, k);
        } else {
          // auf nächste Seite (0° / 180°) einrasten
          const target = Math.round(s.ry / 180) * 180;
          s.ry += (target - s.ry) * (1 - Math.pow(0.92, k));
          s.vy = 0;
          if (idle) s.ry += Math.sin((now - s.t0) / 900) * 0.35 * k;
        }
        s.rx += (0 - s.rx) * (1 - Math.pow(0.92, k));
      }
      const el = bodyRef.current;
      if (el) el.style.transform = `rotateX(${s.rx}deg) rotateY(${s.ry}deg)`;
      const sh = shineRef.current;
      if (sh) {
        const a = ((s.ry % 360) + 360) % 360;
        sh.style.backgroundPosition = `${50 + Math.sin((a * Math.PI) / 180) * 60}% 50%`;
      }
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [idle]);

  function down(e: React.PointerEvent) {
    if (!interactive) return;
    const s = st.current;
    s.dragging = true;
    s.lx = e.clientX;
    s.ly = e.clientY;
    s.lt = performance.now();
    s.vy = 0;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    const s = st.current;
    if (!s.dragging) return;
    const dx = e.clientX - s.lx, dy = e.clientY - s.ly;
    const now = performance.now();
    const dt = Math.max(1, now - s.lt);
    s.ry += dx * 0.6;
    s.rx = Math.max(-35, Math.min(35, s.rx - dy * 0.3));
    s.vy = ((dx * 0.6) / dt) * 16; // Grad pro Frame
    s.lx = e.clientX;
    s.ly = e.clientY;
    s.lt = now;
  }
  function up() {
    const s = st.current;
    s.dragging = false;
    s.vy = Math.max(-40, Math.min(40, s.vy));
  }

  const face: React.CSSProperties = { position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', clipPath: CLIP[shape], WebkitClipPath: CLIP[shape] };

  return (
    <div
      ref={rootRef}
      className="spin3d"
      style={{ width: size, height: size, perspective: size * 4, touchAction: interactive ? 'none' : undefined, cursor: interactive ? 'grab' : undefined }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <div ref={bodyRef} style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', WebkitTransformStyle: 'preserve-3d' } as React.CSSProperties}>
        {/* Rand: gestapelte Schichten */}
        {Array.from({ length: layers }, (_, i) => {
          const z = -thick / 2 + (thick * (i + 0.5)) / layers;
          const shade = 0.55 + 0.35 * Math.abs(Math.sin((i / layers) * Math.PI));
          return (
            <div key={i} style={{ position: 'absolute', inset: 1, clipPath: CLIP[shape], WebkitClipPath: CLIP[shape], transform: `translateZ(${z}px)`, background: edge, filter: `brightness(${shade})` }} />
          );
        })}
        <div style={{ ...face, transform: `translateZ(${thick / 2}px)` }}>
          {front}
          <div ref={shineRef} className="spin3d-shine" />
        </div>
        <div style={{ ...face, transform: `rotateY(180deg) translateZ(${thick / 2}px)` }}>{back}</div>
      </div>
    </div>
  );
}
