import { useCallback, useEffect, useRef, useState } from 'react';
import { createCounter, type CounterFrame, type RepCounter, type Sensitivity } from './counters';
import { detectAll, loadPoseEngine, SKELETON } from './poseEngine';
import { assignSlots } from './duo';
import type { ExerciseId } from '../lib/exercises';
import type { CameraStatus } from './usePoseTracker';

interface Options {
  exercise: ExerciseId;
  sensitivity: Sensitivity;
  facing: 'user' | 'environment';
  mirror: boolean;
  showSkeleton: boolean;
  counting: boolean;
  paused?: boolean;
  /** Farben der Skelette für Platz 0 (links) und 1 (rechts) */
  colors: [string, string];
  onRep?: (slot: 0 | 1, reps: number) => void;
}

const EMPTY: CounterFrame = { reps: 0, tracking: false, depth: 0, hint: null, repped: false };

/** Kamera + Erkennung von zwei Personen gleichzeitig, je mit eigenem Zähler (links / rechts). */
export function useDuoTracker(opts: Options) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [frames, setFrames] = useState<[CounterFrame, CounterFrame]>([EMPTY, EMPTY]);
  const counters = useRef<[RepCounter, RepCounter]>([createCounter(opts.exercise, opts.sensitivity), createCounter(opts.exercise, opts.sensitivity)]);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    counters.current = [createCounter(opts.exercise, opts.sensitivity), createCounter(opts.exercise, opts.sensitivity)];
  }, [opts.exercise, opts.sensitivity]);

  const resetCount = useCallback(() => {
    counters.current.forEach((c) => c.reset());
    setFrames([EMPTY, EMPTY]);
  }, []);

  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    let lastUi = 0;
    let lastDetect = 0;
    let stream: MediaStream | null = null;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) return setStatus('unsupported');
      setStatus('loading');
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: opts.facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play().catch(() => undefined);
        const engine = await loadPoseEngine(2);
        if (cancelled) return;
        setStatus('ready');
        const loop = () => {
          if (cancelled) return;
          raf = requestAnimationFrame(loop);
          if (video.readyState < 2 || !video.videoWidth) return;
          const o = optsRef.current;
          if (o.paused) {
            canvasRef.current?.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            return;
          }
          const now = performance.now();
          if (now - lastDetect < 32) return;
          lastDetect = now;
          let poses: ReturnType<typeof detectAll> = [];
          try {
            poses = detectAll(engine, video);
          } catch {
            return;
          }
          const aspect = video.videoWidth / video.videoHeight;
          const slots = assignSlots(poses, o.mirror && o.facing === 'user');
          const fs = slots.map((lms, i) =>
            o.counting ? counters.current[i].update(lms, now, aspect) : { ...EMPTY, reps: counters.current[i].update(null, now).reps, tracking: !!lms },
          ) as [CounterFrame, CounterFrame];
          fs.forEach((f, i) => f.repped && o.onRep?.(i as 0 | 1, f.reps));
          draw(canvasRef.current, video, slots, o.showSkeleton, o.colors);
          if (fs.some((f) => f.repped) || now - lastUi > 120) {
            lastUi = now;
            setFrames(fs);
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
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [opts.facing]);

  return { videoRef, canvasRef, status, frames, resetCount };
}

function draw(canvas: HTMLCanvasElement | null, video: HTMLVideoElement, slots: (({ x: number; y: number; visibility?: number }[]) | null)[], show: boolean, colors: [string, string]) {
  if (!canvas) return;
  if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
  if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!show) return;
  const W = canvas.width, H = canvas.height;
  slots.forEach((lms, i) => {
    if (!lms) return;
    const color = colors[i];
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
    for (let k = 11; k < 33; k++) {
      const p = lms[k];
      if (!p || (p.visibility ?? 1) < 0.4) continue;
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, Math.max(4, W / 200), 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
