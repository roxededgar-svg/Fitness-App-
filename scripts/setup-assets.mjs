// Copies the MediaPipe WASM runtime into /public and downloads the pose model once,
// so the app works offline / without third-party CDNs at runtime.
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const wasmSrc = join(root, 'node_modules/@mediapipe/tasks-vision/wasm');
const wasmDst = join(root, 'public/mediapipe/wasm');
const modelDst = join(root, 'public/models/pose_landmarker_lite.task');
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

if (existsSync(wasmSrc)) {
  // Nur die Variante kopieren, die FilesetResolver.forVisionTasks() lädt (spart ~14 MB)
  rmSync(wasmDst, { recursive: true, force: true });
  mkdirSync(wasmDst, { recursive: true });
  for (const f of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm']) copyFileSync(join(wasmSrc, f), join(wasmDst, f));
  console.log('[assets] MediaPipe WASM kopiert');
}

if (!existsSync(modelDst)) {
  try {
    mkdirSync(dirname(modelDst), { recursive: true });
    const res = await fetch(MODEL_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    writeFileSync(modelDst, Buffer.from(await res.arrayBuffer()));
    console.log('[assets] Pose-Modell heruntergeladen');
  } catch (e) {
    console.warn('[assets] Pose-Modell konnte nicht geladen werden – App lädt es zur Laufzeit online.', e.message);
  }
}
