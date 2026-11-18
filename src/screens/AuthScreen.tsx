import { useState } from 'react';
import { useStore } from '../lib/store';
import { Icon } from '../components/Icon';
import { Art } from '../components/Art';

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>(() =>
    Object.keys(useStore.getState().profiles).length ? 'login' : 'register',
  );
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { login, register } = useStore();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(mode === 'login' ? await login(email, pw) : await register(email, pw, name));
    setBusy(false);
  }

  return (
    <div className="auth">
      <Art id="photo-welcome" className="auth-photo" fallback={null} />
      <div className="auth-inner">
        <div className="logo">
          <div className="welcome">Willkommen bei</div>
          <h1>VITALIS</h1>
          <div className="tag">Rise of Legends</div>
          <div className="slogan hand" style={{ fontSize: 24 }}>Die Kamera zählt. Du schwitzt.</div>
        </div>
        <form className="stack" onSubmit={submit}>
          {mode === 'register' && (
            <label className="field">
              <Icon name="user" size={22} />
              <input placeholder="Spielername" value={name} onChange={(e) => setName(e.target.value)} maxLength={18} autoComplete="nickname" />
            </label>
          )}
          <label className="field">
            <Icon name="mail" size={22} />
            <input type="email" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
          </label>
          <label className="field">
            <Icon name="lock" size={22} />
            <input type="password" placeholder="Passwort" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </label>
          {err && <div className="error">{err}</div>}
          <button className="btn btn-primary" disabled={busy}>{mode === 'login' ? 'Weiter geht’s' : 'Los, ich bin dabei'}</button>
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 17, fontWeight: 500 }}>
            {mode === 'login' ? 'Noch kein Konto? ' : 'Schon dabei? '}
            <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(null); }}>
              {mode === 'login' ? 'Registrieren' : 'Anmelden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
