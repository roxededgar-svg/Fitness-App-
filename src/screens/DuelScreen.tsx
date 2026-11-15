import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { decodeDuel } from '../lib/duel';
import { useMe, useStore } from '../lib/store';
import { useBattle } from '../lib/battle';
import { EXERCISES } from '../lib/exercises';
import { rankLabel } from '../lib/progression';
import { Avatar, Flag, MyAvatar } from '../components/ui';

export function DuelScreen() {
  const [params] = useSearchParams();
  const code = params.get('c') ?? '';
  const duel = useMemo(() => decodeDuel(code), [code]);
  const me = useMe()!;
  const addFriend = useStore((s) => s.addFriend);
  const start = useBattle((s) => s.start);
  const nav = useNavigate();

  if (!duel) {
    return (
      <div className="mm">
        <div className="display red" style={{ fontSize: 26 }}>Ungültiger Duell-Link</div>
        <button className="btn btn-ghost btn-sm" onClick={() => nav('/', { replace: true })}>Zum Hauptmenü</button>
      </div>
    );
  }
  const own = duel.c === me.code;
  const ex = EXERCISES[duel.x];

  return (
    <div className="mm">
      <div className="caps purple">Freundes-Duell</div>
      <div className="vs-intro">
        <div className="side">
          <MyAvatar size={110} />
          <div className="display blue" style={{ fontSize: 20 }}>{me.name}</div>
        </div>
        <div className="big-vs">VS</div>
        <div className="side r">
          <Avatar name={duel.n} size={110} color="#a855f7" ring="var(--red)" />
          <div className="display red" style={{ fontSize: 20 }}><Flag cc={duel.co} /> {duel.n}</div>
          <div className="muted" style={{ fontSize: 13 }}>{rankLabel(duel.a)} · {duel.a} Trophäen</div>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 560 }}>
        <div className="display" style={{ fontSize: 22 }}>{ex.name} · {duel.d} Sekunden</div>
        <div className="muted" style={{ marginTop: 8 }}>
          {duel.n} hat <b style={{ color: 'var(--text)' }}>{duel.timeline.length} {ex.unit}</b> geschafft. Du trittst live gegen den aufgezeichneten Lauf an –
          jede Wiederholung bewegt den Balken.
        </div>
      </div>
      <div className="stack" style={{ width: '100%', maxWidth: 560 }}>
        {own ? (
          <div className="muted">Das ist dein eigener Duell-Link – teile ihn mit Freunden!</div>
        ) : (
          <button
            className="btn btn-purple"
            onClick={() => {
              addFriend({ code: duel.c, name: duel.n, country: duel.co, elo: duel.e, arenaPoints: duel.a, level: duel.l, wins: 0, losses: 0, duel: code });
              start({
                mode: 'ghost',
                exercise: duel.x,
                durationS: duel.d,
                ranked: true,
                duelCode: code,
                opponent: { id: duel.c, name: duel.n, country: duel.co, elo: duel.e, arenaPoints: duel.a, level: duel.l, wins: 0, losses: 0, kind: 'ghost', color: '#a855f7', timeline: duel.timeline },
              });
              nav('/battle', { replace: true });
            }}
          >
            Duell annehmen
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => nav('/', { replace: true })}>Später</button>
      </div>
    </div>
  );
}
