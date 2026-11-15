import { useStore } from './store';

let ctx: AudioContext | null = null;
function ac() {
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Muss einmal in einer Nutzer-Geste aufgerufen werden (iOS). */
export const unlockAudio = () => ac();

function tone(freq: number, dur = 0.08, type: OscillatorType = 'sine', vol = 0.15, delay = 0) {
  if (!useStore.getState().settings.sound) return;
  const a = ac();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function buzz(ms: number | number[]) {
  if (useStore.getState().settings.haptics) navigator.vibrate?.(ms);
}

export const sfx = {
  rep() {
    tone(880, 0.07, 'triangle');
    tone(1320, 0.06, 'sine', 0.08, 0.04);
    buzz(25);
  },
  oppRep: () => tone(220, 0.05, 'square', 0.03),
  tick: () => tone(660, 0.1, 'sine', 0.12),
  go() {
    tone(990, 0.25, 'sawtooth', 0.12);
    buzz([60, 40, 60]);
  },
  lead: () => {
    tone(740, 0.08, 'triangle', 0.1);
    tone(988, 0.12, 'triangle', 0.1, 0.08);
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.13, i * 0.12));
    buzz([80, 50, 80, 50, 160]);
  },
  loss() {
    [392, 330, 262].forEach((f, i) => tone(f, 0.3, 'sine', 0.12, i * 0.18));
    buzz(200);
  },
};
