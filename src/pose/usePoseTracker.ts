import { useCallback, useEffect, useRef, useState } from 'react';
import { createCounter, type CounterFrame, type Sensitivity } from './counters';
import { detect, loadPoseEngine, SKELETON } from './poseEngine';
import type { ExerciseId } from '../lib/exercises';

export type CameraStatus = 'idle' | 'loading' | 'ready' | 'denied' | 'unsupported' | 'error';

interface Options {
  exercise: ExerciseId;
  sensitivity: Sensitivity;
  facing: 'user' | 'environment';
  mirror: boolean;
  showSkeleton: boolean;
  /** Nur wenn true werden Wiederholungen gezählt (z. B. nach dem Countdown). */
  counting: boolean;
  /** Erkennung komplett pausieren (z. B. im Tipp-Modus) */
  paused?: boolean;
  onRep?: (reps: number) => void;
}

/**
 * Verwaltet Kamera + Pose-Erkennung + Wiederholungszähler.
 * Liefert Refs für <video>/<canvas> und den aktuellen Zählerstand.
 */
export function usePoseTracker(opts: Options) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [frame, setFrame] = useState<CounterFrame>({ reps: 0, tracking: false, depth: 0, hint: null, repped: false });
  const counterRef = useRef(createCounter(opts.exercise, opts.sensitivity));
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    counterRef.current = createCounter(opts.exercise, opts.sensitivity);
  }, [opts.exercise, opts.sensitivity]);

  const resetCount = useCallback(() => {
    counterRef.current.reset();
    setFrame({ reps: 0, tracking: false, depth: 0, hint: null, repped: false });
  }, []);

  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    let lastUi = 0;
    let lastDetect = 0;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('unsupported');
        return;
      }
      setStatus('loading');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: opts.facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play().catch(() => undefined);
        const engine = await loadPoseEngine();
        if (cancelled) return;
        setStatus('ready');

        const loop = () => {
          if (cancelled) return;
          raf = requestAnimationFrame(loop);
          if (video.readyState < 2 || !video.videoWidth) return;
          if (optsRef.current.paused) {
            canvasRef.current?.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            return;
          }
          const now = performance.now();
          let lms = null;
          try {
            // ~30 Erkennungen pro Sekunde reichen zum Zählen und schonen Akku/Wärme
            if (now - lastDetect < 32) return;
            lastDetect = now;
            lms = detect(engine, video);
          } catch {
            return;
          }
          const aspect = video.videoWidth / video.videoHeight;
          const o = optsRef.current;
          const f = o.counting
            ? counterRef.current.update(lms, now, aspect)
            : { reps: counterRef.current.update(null, now).reps, tracking: !!lms, depth: 0, hint: null, repped: false };
          if (f.repped) o.onRep?.(f.reps);
          draw(canvasRef.current, video, lms, o.showSkeleton, f.tracking);
          if (f.repped || now - lastUi > 120) {
            lastUi = now;
            setFrame(f);
          }
        };
        loop();
      } catch (e) {
        const name = (e as Error)?.name;
        setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'error');
      }
    }
    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [opts.facing]);

  return { videoRef, canvasRef, status, frame, resetCount };
}

function draw(
  canvas: HTMLCanvasElement | null,
  video: HTMLVideoElement,
  lms: { x: number; y: number; visibility?: number }[] | null,
  show: boolean,
  tracking: boolean,
) {
  if (!canvas) return;
  if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
  if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!show || !lms) return;
  const W = canvas.width, H = canvas.height;
  const color = tracking ? '#4f86ff' : '#f59e0b';
  ctx.lineWidth = Math.max(3, W / 220);
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  for (const [a, b] of SKELETON) {
    const p = lms[a], q = lms[b];
    if (!p || !q || (p.visibility ?? 1) < 0.4 || (q.visibility ?? 1) < 0.4) continue;
    ctx.beginPath();
    ctx.moveTo(p.x * W, p.y * H);
    ctx.lineTo(q.x * W, q.y * H);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  for (let i = 11; i < 33; i++) {
    const p = lms[i];
    if (!p || (p.visibility ?? 1) < 0.4) continue;
    ctx.beginPath();
    ctx.arc(p.x * W, p.y * H, Math.max(4, W / 200), 0, Math.PI * 2);
    ctx.fill();
  }
}
