import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMe, useSettings, useStore } from '../lib/store';
import { Icon } from '../components/Icon';
import { COUNTRY_NAMES, Flag, Switch, toast } from '../components/ui';
import type { Sensitivity } from '../pose/counters';

const COUNTRIES = ['DE', 'AT', 'CH', 'US', 'GB', 'FR', 'ES', 'IT', 'NL', 'PL', 'SE', 'TR', 'BR', 'JP'];

export function SettingsScreen() {
  const nav = useNavigate();
  const me = useMe()!;
  const s = useSettings();
  const { updateSettings, updateProfile, logout, resetProgress, exportBackup, importBackup } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [lastBackup, setLastBackup] = useState<number | null>(() => {
    try { return Number(localStorage.getItem('vitalis-last-backup')) || null; } catch { return null; }
  });

  async function backup() {
    const json = exportBackup();
    const name = `vitalis-sicherung-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([json], name, { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Vitalis-Sicherung' });
      else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file);
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }
      const now = Date.now();
      try { localStorage.setItem('vitalis-last-backup', String(now)); } catch { /* egal */ }
      setLastBackup(now);
      toast('Sicherung erstellt');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast('Sicherung fehlgeschlagen');
    }
  }

  return (
    <div className="page">
      <div className="row" style={{ marginBottom: 24 }}>
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="Zurück"><Icon name="back" size={22} /></button>
        <h1 className="display" style={{ margin: 0, fontSize: 30, letterSpacing: '.1em' }}>EINSTELLUNGEN</h1>
      </div>

      <div className="caps muted" style={{ fontSize: 12, margin: '0 0 8px' }}>Kamera & Erkennung</div>
      <div className="card">
        <div className="setting-row">
          <div><div className="t">Kamera</div><div className="d">Frontkamera für Selbstansicht, Rückkamera für bessere Qualität</div></div>
          <div className="seg">
            <button className={s.facing === 'user' ? 'on' : ''} onClick={() => updateSettings({ facing: 'user' })}>Front</button>
            <button className={s.facing === 'environment' ? 'on' : ''} onClick={() => updateSettings({ facing: 'environment' })}>Rück</button>
          </div>
        </div>
        <div className="setting-row">
          <div><div className="t">Zähl-Empfindlichkeit</div><div className="d">„Streng“ verlangt volle Bewegungsamplitude</div></div>
          <div className="seg">
            {(['easy', 'normal', 'strict'] as Sensitivity[]).map((v) => (
              <button key={v} className={s.sensitivity === v ? 'on' : ''} onClick={() => updateSettings({ sensitivity: v })}>
                {v === 'easy' ? 'Locker' : v === 'normal' ? 'Normal' : 'Streng'}
              </button>
            ))}
          </div>
        </div>
        <div className="setting-row"><div><div className="t">Skelett anzeigen</div></div><Switch on={s.showSkeleton} onChange={(v) => updateSettings({ showSkeleton: v })} /></div>
        <div className="setting-row"><div><div className="t">Bild spiegeln</div><div className="d">Nur Frontkamera</div></div><Switch on={s.mirror} onChange={(v) => updateSettings({ mirror: v })} /></div>
        <div className="setting-row">
          <div><div className="t">Tipp-Modus (Test)</div><div className="d">Wiederholungen per Bildschirm-Tipp zählen. Kämpfe sind dann ungewertet.</div></div>
          <Switch on={s.tapMode} onChange={(v) => updateSettings({ tapMode: v })} />
        </div>
      </div>

      <div className="caps muted" style={{ fontSize: 12, margin: '22px 0 8px' }}>Feedback</div>
      <div className="card">
        <div className="setting-row"><div className="t">Sound</div><Switch on={s.sound} onChange={(v) => updateSettings({ sound: v })} /></div>
        <div className="setting-row"><div><div className="t">Vibration</div><div className="d">Nicht auf allen Geräten verfügbar</div></div><Switch on={s.haptics} onChange={(v) => updateSettings({ haptics: v })} /></div>
      </div>

      <div className="caps muted" style={{ fontSize: 12, margin: '22px 0 8px' }}>Datensicherung</div>
      <div className="card">
        <div className="muted" style={{ fontSize: 13, lineHeight: 1.5, padding: '6px 0 10px' }}>
          Deine Daten liegen nur auf diesem Gerät. Erstelle regelmäßig eine Sicherung – damit kannst du deinen Fortschritt
          auf ein neues Gerät mitnehmen oder nach dem Löschen der Browserdaten wiederherstellen.
        </div>
        <div className="setting-row">
          <div><div className="t">Sicherung erstellen</div><div className="d">{lastBackup ? `Zuletzt: ${new Date(lastBackup).toLocaleDateString('de-DE')}` : 'Noch keine Sicherung'}</div></div>
          <button className="btn btn-primary solid btn-sm" onClick={backup}>Sichern</button>
        </div>
        <div className="setting-row">
          <div><div className="t">Sicherung einspielen</div><div className="d">Ersetzt den Fortschritt dieses Kontos</div></div>
          <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>Laden</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            if (!confirm('Fortschritt durch die Sicherung ersetzen?')) return;
            const err = importBackup(await f.text());
            toast(err ?? 'Sicherung eingespielt');
          }} />
        </div>
      </div>

      <div className="caps muted" style={{ fontSize: 12, margin: '22px 0 8px' }}>Konto</div>
      <div className="card">
        <div className="setting-row">
          <div><div className="t">Land</div><div className="d">Für die Länder-Rangliste</div></div>
          <label className="field" style={{ minHeight: 44, width: 200 }}>
            <Flag cc={me.country} size={16} />
            <select value={me.country} onChange={(e) => updateProfile({ country: e.target.value })}>
              {COUNTRIES.map((c) => <option key={c} value={c}>{COUNTRY_NAMES[c] ?? c}</option>)}
            </select>
          </label>
        </div>
        <div className="setting-row"><div><div className="t">Angemeldet als</div><div className="d">{me.email}</div></div>
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); nav('/', { replace: true }); }}>Abmelden</button>
        </div>
        <div className="setting-row"><div><div className="t">Fortschritt zurücksetzen</div><div className="d">Level, Trophäen, Verlauf – kann nicht rückgängig gemacht werden</div></div>
          <button className="btn btn-red btn-sm" onClick={() => { if (confirm('Wirklich alles zurücksetzen?')) { resetProgress(); toast('Fortschritt zurückgesetzt'); } }}>Reset</button>
        </div>
      </div>
      <div className="muted" style={{ textAlign: 'center', fontSize: 12, marginTop: 24 }}>
        Vitalis v1.0 · Die Kamerabilder werden ausschließlich lokal auf deinem Gerät verarbeitet.
      </div>
    </div>
  );
}
