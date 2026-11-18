/**
 * Echte Illustrationen & Fotos: Liegt eine Datei in public/art/ und steht sie in
 * public/art/manifest.json, ersetzt sie automatisch die gezeichnete Grafik.
 * Dateiname = Bild-ID + Endung, z. B. „flux-happy.png“, „boss-neonwald.webp“.
 */
import { create } from 'zustand';
import { nodeById } from './path';

const BASE = import.meta.env.BASE_URL;

interface ArtState {
  files: Record<string, string>;
}
export const useArtStore = create<ArtState>(() => ({ files: {} }));

export async function loadArt() {
  try {
    const r = await fetch(`${BASE}art/manifest.json`, { cache: 'no-cache' });
    if (!r.ok) return;
    const j = (await r.json()) as { files?: string[] };
    const files: Record<string, string> = {};
    for (const f of j.files ?? []) {
      const m = f.match(/^([a-z0-9-]+)\.(png|webp|jpe?g|svg|avif)$/i);
      if (m) files[m[1].toLowerCase()] = `${BASE}art/${f}`;
    }
    useArtStore.setState({ files });
  } catch {
    /* ohne Manifest bleiben die gezeichneten Grafiken */
  }
}

/** URL des Bildes oder null */
export const useArt = (id: string | undefined) => useArtStore((s) => (id ? s.files[id] ?? null : null));

/** Bild-ID für eine Station des Trainingspfads: Monster „monster-<welt>-<nr>“, Boss „boss-<welt>“ */
export function artIdForNode(nodeId?: string) {
  const n = nodeId ? nodeById(nodeId) : undefined;
  if (!n) return undefined;
  return n.kind === 'boss' ? `boss-${n.worldId}` : n.kind === 'fight' ? `monster-${n.id}` : undefined;
}
