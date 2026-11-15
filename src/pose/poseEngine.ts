import type { PoseLandmarker } from '@mediapipe/tasks-vision';
import type { Lm } from './counters';

const BASE = import.meta.env.BASE_URL;
const LOCAL_WASM = `${BASE}mediapipe/wasm`;
const LOCAL_MODEL = `${BASE}models/pose_landmarker_lite.task`;
const REMOTE_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm';
const REMOTE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

const engines = new Map<number, Promise<PoseLandmarker>>();

async function urlExists(url: string) {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    return r.ok;
  } catch {
    return false;
  }
}

async function create(delegate: 'GPU' | 'CPU', numPoses = 1): Promise<PoseLandmarker> {
  const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');
  const wasmBase = (await urlExists(`${LOCAL_WASM}/vision_wasm_internal.js`)) ? LOCAL_WASM : REMOTE_WASM;
  const model = (await urlExists(LOCAL_MODEL)) ? LOCAL_MODEL : REMOTE_MODEL;
  const files = await FilesetResolver.forVisionTasks(wasmBase);
  return PoseLandmarker.createFromOptions(files, {
    baseOptions: { modelAssetPath: model, delegate },
    runningMode: 'VIDEO',
    numPoses,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}

/** Lädt das Pose-Modell einmalig pro Personenzahl (GPU, Fallback CPU). */
export function loadPoseEngine(numPoses = 1): Promise<PoseLandmarker> {
  let p = engines.get(numPoses);
  if (!p) {
    p = create('GPU', numPoses).catch(() => create('CPU', numPoses));
    p.catch(() => engines.delete(numPoses));
    engines.set(numPoses, p);
  }
  return p;
}

let lastTs = 0;
export function detect(engine: PoseLandmarker, video: HTMLVideoElement): Lm[] | null {
  // MediaPipe verlangt streng steigende Zeitstempel
  const ts = Math.max(performance.now(), lastTs + 1);
  lastTs = ts;
  const res = engine.detectForVideo(video, ts);
  return (res.landmarks?.[0] as Lm[] | undefined) ?? null;
}

/** Alle erkannten Personen (für Zwei-Spieler-Modi) */
export function detectAll(engine: PoseLandmarker, video: HTMLVideoElement): Lm[][] {
  const ts = Math.max(performance.now(), lastTs + 1);
  lastTs = ts;
  const res = engine.detectForVideo(video, ts);
  return (res.landmarks as Lm[][] | undefined) ?? [];
}

export const SKELETON: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28],
  [27, 31], [28, 32], [27, 29], [28, 30],
];
