import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMe, useStore } from '../lib/store';
import { levelFromXp, rankFor, rankLabel } from '../lib/progression';
import { streak, totals, weekStats } from '../lib/stats';
import { dailyMissions } from '../lib/missions';
import { currentNode, totalStars, WORLDS } from '../lib/path';
import { Icon } from '../components/Icon';
import { RankEmblem } from '../components/RankEmblem';
import { Gems, Gold, LevelRing, PageHeader, Section, Sheet, WeekChart, toast } from '../components/ui';
import { seasonName } from '../lib/season';
import { DAYS, PLANS, daySets } from '../lib/plans';
import { Flux, Speech } from '../components/Flux';
import { fluxTip, weekDaysTrained } from '../lib/tips';
import { goalLabel } from '../lib/goals';

function greeting() {
  const h = new Date().getHours();
  return h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
}

export function HomeScreen() {
  const me = useMe()!;
  const nav = useNavigate();
  const claim = useStore((s) => s.claimMission);
  const applyStreakFreeze = useStore((s) => s.applyStreakFreeze);
  const checkSeason = useStore((s) => s.checkSeason);
  const [seasonEnd, setSeasonEnd] = useState<ReturnType<typeof checkSeason>>(null);
  useEffect(() => {
    setSeasonEnd(checkSeason());
    if (applyStreakFreeze()) toast('Streak-Schutz eingesetzt – deine Serie ist gerettet!');
  }, [applyStreakFreeze, checkSeason]);
  const lv = levelFromXp(me.xp);
  const rank = rankFor(me.arenaPoints);
  const t = totals(me);
  const st = streak(me.sessions, new Date(), me.frozenDays);
  const missions = dailyMissions(me);
  const claimed = missions.filter((m) => m.claimed).length;
  const activePlans = PLANS.filter((p) => me.plans?.[p.id] && me.plans[p.id].done < DAYS).map((plan) => ({ plan, st: me.plans![plan.id] }));
  const nextNode = currentNode(me);
  const tip = fluxTip(me);
  const weekDays = weekDaysTrained(me);
  const perWeek = me.perWeek ?? 3;
  const nextWorld = nextNode ? WORLDS.find((w) => w.id === nextNode.worldId) : undefined;

  return (
    <div className="page">
      <PageHeader
        eyebrow={greeting()}
        title={me.name}
        right={
          <>
            <button className="currency gold" onClick={() => nav('/shop')}><Gold /> {me.gold}</button>
            <button className="currency blue" onClick={() => nav('/shop')}><Gems /> {me.gems}</button>
            <button className="currency" onClick={() => nav('/shop')} style={{ color: 'var(--text)' }}><Icon name="gem" size={14} /> Shop</button>
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
          <button className="mini" style={{ textAlign: 'left' }} onClick={() => nav('/map')}>
            <div className="l">Pfad-Sterne</div>
            <div className="v gold">{totalStars(me)}</div>
            <div className="s">Trainingspfad</div>
          </button>
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

      {/* Flux mit Wochenziel und Tipp */}
      <div className="card" style={{ marginTop: 22 }}>
        <button className="flux-tip" style={{ width: '100%', textAlign: 'left' }} onClick={() => activePlans[0] && nav(`/workout?plan=${activePlans[0].plan.id}`)}>
          <Flux mood={tip.mood} size={74} />
          <Speech text={tip.text} />
        </button>
        <div className="row" style={{ marginTop: 14, fontSize: 13 }}>
          <span className="caps" style={{ fontSize: 11 }}>Wochenziel</span>
          {goalLabel(me.goal) && <span className="muted">· {goalLabel(me.goal)}</span>}
          <span className="spacer" />
          <b>{Math.min(weekDays, perWeek)} / {perWeek} Tage</b>
        </div>
        <div className="week-goal">{Array.from({ length: perWeek }, (_, i) => <span key={i} className={i < weekDays ? 'on' : ''} />)}</div>
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

      <Section title="Trainingsplan" action={<button className="section-link" onClick={() => nav('/plans')}>Alle Pläne ›</button>}>
        {activePlans.length === 0 ? (
          <button className="card plan-cta" onClick={() => nav('/plans')}>
            <Icon name="calendar" size={26} color="var(--blue)" />
            <div style={{ textAlign: 'left' }}>
              <div className="display" style={{ fontSize: 17 }}>Starte einen 6-Wochen-Plan</div>
              <div className="muted" style={{ fontSize: 13 }}>100 Liegestütze, 200 Kniebeugen, Core oder 3 Minuten Plank</div>
            </div>
          </button>
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            {activePlans.map(({ plan, st }) => (
              <button key={plan.id} className="card plan-cta" onClick={() => nav(`/workout?plan=${plan.id}`)}>
                <div className="t-ico" style={{ width: 48, height: 48, background: `${plan.color}22`, color: plan.color }}><Icon name={plan.icon} size={24} /></div>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div className="display" style={{ fontSize: 17 }}>{plan.name} · Einheit {st.done + 1}/{DAYS}</div>
                  <div className="muted" style={{ fontSize: 13 }}>Heute: {daySets(plan, st.startMax, st.done).join(' · ')}+</div>
                </div>
                <Icon name="play" size={20} color={plan.color} />
              </button>
            ))}
          </div>
        )}
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
      {seasonEnd && (
        <Sheet title="SAISON BEENDET" onClose={() => setSeasonEnd(null)}>
          <div style={{ textAlign: 'center', display: 'grid', gap: 12, justifyItems: 'center' }}>
            <div className="muted">Saison {seasonName(seasonEnd.season)}</div>
            <RankEmblem tier={rankFor(seasonEnd.peak).tier} size={110} />
            <div className="display" style={{ fontSize: 22 }}>Höchster Rang: {seasonEnd.tierName}</div>
            <div className="row" style={{ gap: 18, fontFamily: 'var(--display)', fontWeight: 900, fontSize: 20 }}>
              <span className="ico-inline gold"><Gold size={20} /> +{seasonEnd.gold}</span>
              <span className="ico-inline" style={{ color: '#60a5fa' }}><Gems size={20} /> +{seasonEnd.gems}</span>
            </div>
            <div className="muted" style={{ fontSize: 14 }}>Neue Saison: Deine Trophäen gehen von {seasonEnd.before} auf {seasonEnd.after}. Steig wieder auf!</div>
            <button className="btn btn-primary solid" onClick={() => setSeasonEnd(null)}>Los geht's</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
