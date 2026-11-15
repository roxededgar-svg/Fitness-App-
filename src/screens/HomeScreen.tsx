import { useNavigate } from 'react-router-dom';
import { useMe, useStore } from '../lib/store';
import { levelFromXp, rankLabel } from '../lib/progression';
import { streak, totals, weekStats } from '../lib/stats';
import { dailyMissions } from '../lib/missions';
import { Icon } from '../components/Icon';
import { LevelRing, WeekChart, toast } from '../components/ui';

function greeting() {
  const h = new Date().getHours();
  return h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
}

export function HomeScreen() {
  const me = useMe()!;
  const nav = useNavigate();
  const claim = useStore((s) => s.claimMission);
  const lv = levelFromXp(me.xp);
  const t = totals(me);
  const missions = dailyMissions(me);
  const done = missions.filter((m) => m.claimed).length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow caps">{greeting()}</div>
          <h1>{me.name}</h1>
        </div>
        <div className="row" style={{ gap: 18, marginRight: 70, fontFamily: 'var(--display)', fontWeight: 800 }}>
          <span className="gold">🪙 {me.gold}</span>
          <span className="blue">💎 {me.gems}</span>
        </div>
      </div>

      <div className="hero">
        <LevelRing level={lv.level} xp={lv.xpInLevel} need={lv.xpNeeded} />
        <div className="stack">
          <div className="card stat-card">
            <div className="label caps">ELO · {rankLabel(me.arenaPoints)}</div>
            <div className="value blue">{me.elo}</div>
          </div>
          <div className="card stat-card">
            <div className="label caps">Streak</div>
            <div className="value purple">{streak(me.sessions)} {streak(me.sessions) > 0 && <span style={{ fontSize: 24 }}>🔥</span>}</div>
          </div>
          <div className="card stat-card">
            <div className="label caps">W / L</div>
            <div className="value">{me.wins} / {me.losses}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 28 }}><WeekChart data={weekStats(me.sessions)} /></div>

      <div className="grid2" style={{ marginTop: 22 }}>
        <button className="action-card blue" onClick={() => nav('/matchmaking')}>
          <div className="ico"><Icon name="bolt" size={34} /></div>
          <h3>Schnellkampf</h3>
          <p>Match · 60s</p>
        </button>
        <button className="action-card dark" onClick={() => nav('/training')}>
          <div className="ico"><Icon name="dumbbell" size={34} /></div>
          <h3>Freies Training</h3>
          <p>Freie Übungen</p>
        </button>
      </div>

      <div className="grid2" style={{ marginTop: 22 }}>
        <div className="card stat-card"><div className="label caps"><Icon name="repeat" size={18} color="var(--blue)" />Gesamt Wdh.</div><div className="value blue">{t.reps}</div></div>
        <div className="card stat-card"><div className="label caps"><Icon name="trophy" size={18} color="var(--purple)" />Bester Satz</div><div className="value purple">{t.best}</div></div>
        <div className="card stat-card"><div className="label caps"><Icon name="dumbbell" size={18} color="var(--blue)" />Trainings</div><div className="value blue">{t.trainings}</div></div>
        <div className="card stat-card"><div className="label caps"><Icon name="bolt" size={18} color="var(--purple)" />PvP-Kämpfe</div><div className="value purple">{t.pvp}</div></div>
      </div>

      <div className="section-title">
        <div className="caps">Tägliche Missionen</div>
        <div className="display purple" style={{ fontSize: 18 }}>{done}/3</div>
      </div>
      <div className="stack">
        {missions.map((m) => (
          <div key={m.id} className={`card mission ${m.done ? 'done' : ''}`}>
            <div className="flag"><Icon name={m.claimed ? 'star' : 'flag'} size={26} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="title">{m.title}</div>
              <div className="reward">+{m.xp} XP · +{m.gold}g</div>
              <div className="progress"><span style={{ width: `${(m.current / m.target) * 100}%` }} /></div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{m.current} / {m.target}</div>
            </div>
            <button
              className="btn btn-primary solid btn-sm"
              disabled={!m.done || m.claimed}
              onClick={() => { claim(m.id); toast(`+${m.xp} XP · +${m.gold} Gold eingefordert!`); }}
            >
              {m.claimed ? 'Erledigt' : 'Einfordern'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
