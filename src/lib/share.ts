import { toast } from '../components/ui';

export async function shareOrCopy(text: string, url?: string) {
  const full = url ? `${text}\n${url}` : text;
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Vitalis – Rise of Legends', text, url });
      return;
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return;
  }
  try {
    await navigator.clipboard.writeText(full);
    toast('In die Zwischenablage kopiert');
  } catch {
    window.prompt('Kopiere den Text:', full);
  }
}
