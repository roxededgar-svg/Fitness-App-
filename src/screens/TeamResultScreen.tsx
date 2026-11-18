import { Navigate, useNavigate } from 'react-router-dom';
import { useTeam } from '../lib/team';
import { useMe } from '../lib/store';
import { buildConfig } from '../lib/teamSetup';
import { encodeTeam, teamUrl, type TeamMemberRun } from '../lib/duel';
import { EXERCISES } from '../lib/exercises';
import { shareOrCopy } from '../lib/share';
import { Icon } from '../components/Icon';
import { RaceChart } from '../components/ui';

export function TeamResultScreen() {
  const result = useTeam((s) => s.result);
  const start = useTeam((s) => s.start);
  const me = useMe()!;
  const nav = useNavigate();
  if (!result) return <Navigate to="/friends" replace />;
  const { config, left, right, rec } = result;
  const L = left.reduce((a, t) => a + t.length, 0);
  const R = right.reduce((a, t) => a + t.length, 0);
  const ex = EXERCISES[config.exercise];
  const win = L > R, draw = L === R;
  const title = config.mode === 'local1v1'
    ? (draw ? 'UNENTSCHIEDEN' : `${(win ? config.leftName : config.rightName).toUpperCase()} GEWINNT`)
    : draw ? 'UNENTSCHIEDEN' : win ? 'TEAM-SIEG' : 'NIEDERLAGE';
  const color = draw ? 'var(--gold)' : config.mode === 'local1v1' ? (win ? 'var(--blue)' : 'var(--red)') : win ? 'var(--green)' : 'var(--red)';

  // Team-Link: alle Läufe der linken Seite außer KI (live oder Freundes-Lauf)
  const teamRuns: TeamMemberRun[] = config.mode === 'local1v1' ? [] : config.left
    .map((m, i) => ({ m, tl: left[i] }))
    .filter(({ m }) => m.kind !== 'bot')
    .map(({ m, tl }) => ({ n: m.name, c: m.code ?? m.name.slice(0, 6).toUpperCase(), co: m.country ?? me.country, a: m.trophies ?? 0, timeline: tl }));
  const canShare = teamRuns.length > 0 && teamRuns.some((r) => r.timeline.length > 0);
  const duo = teamRuns.length === 2;

  function rematch() {
    const c = config.mode === 'local1v1' || config.right.some((m) => m.kind === 'ghost')
      ? config
      : buildConfig({ mode: config.mode, me, exercise: config.exercise, durationS: config.durationS, guest: config.left.find((m) => m.kind === 'live' && !m.me)?.name, teammate: config.mode === 'link2v2' ? teamRuns.find((r) => r.c !== me.code) : undefined });
    start(c);
    nav('/teambattle', { replace: true });
  }

  const Side = ({ names, lines, total, col, label }: { names: string[]; lines: number[][]; total: number; col: string; label: string }) => (
    <div className="card" style={{ borderColor: `${col}55` }}>
      <div className="row"><div className="display" style={{ color: col, fontSize: 18 }}>{label}</div><span className="spacer" /><div className="display" style={{ fontSize: 30, color: col }}>{total}</div></div>
      {names.map((n, i) => (
        <div key={i} className="history-row"><span style={{ flex: 1 }}>{n}</span><b>{lines[i].length} {ex.unit}</b></div>
      ))}
    </div>
  );

  return (
    <div className={`result ${draw ? '' : win || config.mode === 'local1v1' ? 'win' : 'lose'}`}>
      <h1 style={{ color, fontSize: 'clamp(36px, 8vw, 70px)' }}>{title}</h1>
      <div className="score">{L} <span style={{ color: 'var(--muted)' }}>·</span> {R}</div>
      <div className="muted" style={{ textAlign: 'center', marginBottom: 22 }}>{ex.name} · {config.durationS}s{!rec.ranked && ' · ungewertet'}</div>

      <div className="grid2">
        <Side names={config.left.map((m) => m.name)} lines={left} total={L} col="var(--blue)" label={config.leftName} />
        <Side names={config.right.map((m) => m.name)} lines={right} total={R} col="var(--red)" label={config.rightName} />
      </div>

      <div style={{ marginTop: 16 }}>
        <RaceChart mine={left.flat().sort((a, b) => a - b)} theirs={right.flat().sort((a, b) => a - b)} durationS={config.durationS} oppName={config.rightName} />
      </div>

      {rec.xp > 0 && <div className="muted" style={{ textAlign: 'center', marginTop: 12 }}>Du erhältst +{rec.xp} XP · +{rec.gold} Gold</div>}

      {canShare && (
        <div className="card" style={{ marginTop: 16, borderColor: '#5a4320' }}>
          <div className="display purple ico-inline" style={{ fontSize: 18 }}><Icon name="users" size={20} /> {duo ? 'Fordert ein anderes Duo heraus' : 'Hol einen Freund in dein Team'}</div>
          <div className="muted" style={{ margin: '6px 0 14px', fontSize: 14 }}>
            {duo
              ? `Der Link enthält eure beiden Läufe (${teamRuns.map((r) => r.n).join(' & ')}). Zwei Freunde treten als Duo gegen euch an – an einem Gerät oder mit KI-Partner.`
              : 'Dein Freund kämpft mit deinem aufgezeichneten Lauf im Team gegen zwei Gegner. Danach kann euer Duo andere herausfordern.'}
          </div>
          <button className="btn btn-purple" onClick={() => shareOrCopy(duo ? `${teamRuns.map((r) => r.n).join(' & ')} fordern euch zum 2 gegen 2 heraus! ${ex.name}, ${config.durationS}s – ${L} Wiederholungen. Schafft ihr mehr?` : `${me.name} will mit dir ein Team bilden! ${ex.name}, ${config.durationS}s – komm in mein Team.`, teamUrl(encodeTeam(config.exercise, config.durationS, teamRuns)))}>
            <Icon name="share" size={20} /> {duo ? 'Duo-Herausforderung teilen' : 'Team-Link teilen'}
          </button>
        </div>
      )}

      <div className="stack" style={{ marginTop: 22 }}>
        <button className="btn btn-purple" onClick={rematch}>Revanche</button>
        <div className="grid2">
          <button className="btn btn-ghost" onClick={() => nav('/friends', { replace: true })}>Anderer Modus</button>
          <button className="btn btn-ghost" onClick={() => nav('/', { replace: true })}>Hauptmenü</button>
        </div>
      </div>
    </div>
  );
}
