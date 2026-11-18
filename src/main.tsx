import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import { loadArt } from './lib/art';

loadArt();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Offline-Fähigkeit (nur im fertigen Build)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => undefined));
}
// Speicher als „dauerhaft“ anfragen, damit Safari/Chrome die Daten nicht automatisch löschen
navigator.storage?.persist?.().catch(() => undefined);
