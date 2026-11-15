import { useNavigate } from 'react-router-dom';
import { useMe, useStore } from '../lib/store';
import { levelFromXp, rankFor, rankLabel } from '../lib/progression';
import { streak, totals, weekStats } from '../lib/stats';
import { dailyMissions } from '../lib/missions';
import { currentNode, WORLDS } from '../lib/path';
import { Icon } from '../components/Icon';
import { RankEmblem } from '../components/RankEmblem';
import { Gems, Gold, LevelRing, PageHeader, Section, WeekChart, toast } from '../components/ui';

function greeting() {
  const h = new Date().getHours();
  return h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
}

export function HomeScreen() {
  const me = useMe()!;
  const nav = useNavigate();
  const claim = useStore((s) => s.claimMission);
  const lv = levelFromXp(me.xp);
  const rank = rankFor(me.arenaPoints);
  const t = totals(me);
  const st = streak(me.sessions);
  const missions = dailyMissions(me);
  const claimed = missions.filter((m) => m.claimed).length;
  const nextNode = currentNode(me);
  const nextWorld = nextNode ? WORLDS.find((w) => w.id === nextNode.worldId) : undefined;

  return (
    <div className="page">
      <PageHeader
        eyebrow={greeting()}
        title={me.name}
        right={
          <>
            <span className="currency gold"><Gold /> {me.gold}</span>
            <span className="currency blue"><Gems /> {me.gems}</span>
          </>
        }
      />

      {/* Fortschritt auf einen Blick */}
      <div className="hero">
        <LevelRing level={lv.level} xp={lv.xpInLevel} need={lv.xpNeeded} />
        <div className="stat-grid">
          <button className="mini" style={{ textAlign: 'left' }} onClick={() => nav('/career')}>
            <div className="l">Rang</div>
            <div className="v" style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <RankEmblem tier={rank.tier} division={rank.division} size={30} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{rankLabel(me.arenaPoints)}</span>
            </div>
            <div className="s ico-inline"><Icon name="trophy" size={12} /> {me.arenaPoints} Trophäen</div>
          </button>
          <div className="mini">
            <div className="l">ELO</div>
            <div className="v blue">{me.elo}</div>
            <div className="s">Matchmaking-Wertung</div>
          </div>
          <div className="mini">
            <div className="l">Streak</div>
            <div className="v purple ico-inline">{st} {st > 0 && <Icon name="fire" size={24} color="#f97316" />}</div>
            <div className="s">{st === 1 ? 'Tag' : 'Tage'} in Folge</div>
          </div>
          <div className="mini">
            <div className="l">Siege / Niederlagen</div>
            <div className="v"><span className="green">{me.wins}</span> <span className="muted">/</span> <span className="red">{me.losses}</span></div>
            <div className="s">Arena</div>
          </div>
        </div>
      </div>

      <Section title="Spielen">
        <div className="tiles">
          <button className="tile primary" onClick={() => nav('/matchmaking?q=ranked')}>
            <div className="t-ico"><Icon name="shield" size={24} /></div>
            <div>
              <div className="t-title">Ranked</div>
              <div className="t-sub">Um Trophäen kämpfen</div>
            </div>
          </button>
          <button className="tile" onClick={() => nav('/matchmaking?q=casual')}>
            <div className="t-ico" style={{ background: '#221d3a', color: 'var(--purple)' }}><Icon name="bolt" size={24} /></div>
            <div>
              <div className="t-title">Schnellkampf</div>
              <div className="t-sub">1 vs 1 ohne Trophäen</div>
            </div>
          </button>
          <button className="tile" onClick={() => nav('/training')}>
            <div className="t-ico" style={{ background: '#2a2108', color: 'var(--gold)' }}><Icon name="dumbbell" size={24} /></div>
            <div>
              <div className="t-title">Training</div>
              <div className="t-sub">Frei üben, mit Test-Bot</div>
            </div>
          </button>
          <button className="tile" onClick={() => nav('/map')}>
            <div className="t-ico" style={{ background: '#2a1215', color: 'var(--red)' }}><Icon name="skull" size={24} /></div>
            <div>
              <div className="t-title">Trainingspfad</div>
              <div className="t-sub">{nextNode && nextWorld ? `${nextWorld.name}: ${nextNode.name}` : 'Alle Welten geschafft'}</div>
            </div>
          </button>
        </div>
      </Section>

      <Section title="Tägliche Missionen" action={<span className="display purple" style={{ fontSize: 16 }}>{claimed}/3</span>}>
        <div className="stack" style={{ gap: 10 }}>
          {missions.map((m) => (
            <div key={m.id} className={`card mission ${m.done ? 'done' : ''}`}>
              <div className="flag"><Icon name={m.claimed ? 'star' : 'flag'} size={24} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row" style={{ gap: 10 }}>
                  <div className="title">{m.title}</div>
                  <div className="spacer" />
                  <div className="muted" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{m.current} / {m.target}</div>
                </div>
                <div className="progress"><span style={{ width: `${(m.current / m.target) * 100}%` }} /></div>
                <div className="reward">+{m.xp} XP · +{m.gold}g</div>
              </div>
              <button
                className="btn btn-primary solid btn-sm"
                disabled={!m.done || m.claimed}
                onClick={() => { claim(m.id); toast(`+${m.xp} XP · +${m.gold} Gold eingefordert!`); }}
              >
                {m.claimed ? <Icon name="check" size={18} /> : 'Einfordern'}
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Aktivität">
        <WeekChart data={weekStats(me.sessions)} />
      </Section>

      <Section title="Statistik">
        <div className="stat-grid four">
          <div className="mini"><div className="l"><Icon name="repeat" size={14} color="var(--blue)" />Gesamt Wdh.</div><div className="v blue">{t.reps}</div></div>
          <div className="mini"><div className="l"><Icon name="trophy" size={14} color="var(--purple)" />Bester Satz</div><div className="v purple">{t.best}</div></div>
          <div className="mini"><div className="l"><Icon name="dumbbell" size={14} color="var(--blue)" />Trainings</div><div className="v blue">{t.trainings}</div></div>
          <div className="mini"><div className="l"><Icon name="bolt" size={14} color="var(--purple)" />Kämpfe</div><div className="v purple">{t.pvp}</div></div>
        </div>
      </Section>
    </div>
  );
}
