import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMe } from '../lib/store';
import { DUNGEONS, RARITY_COLOR } from '../lib/dungeons';
import { levelFromXp } from '../lib/progression';
import { EXERCISES } from '../lib/exercises';
import { useBattle } from '../lib/battle';
import { Icon } from '../components/Icon';
import { Gems, Gold, PageHeader } from '../components/ui';

export function MapScreen() {
  const me = useMe()!;
  const nav = useNavigate();
  const start = useBattle((s) => s.start);
  const level = levelFromXp(me.xp).level;

  return (
    <div className="page">
      <PageHeader eyebrow="Story-Modus" title="Weltkarte" />
      <div className="map-progress">
        <span className="caps muted" style={{ fontSize: 12 }}>Bosse besiegt</span>
        <div className="progress"><span style={{ width: `${(me.dungeonsCleared.length / DUNGEONS.length) * 100}%` }} /></div>
        <span className="display gold">{me.dungeonsCleared.length} / {DUNGEONS.length}</span>
      </div>
      {DUNGEONS.map((d, i) => {
        const locked = level < d.minLevel;
        const cleared = me.dungeonsCleared.includes(d.id);
        const rc = RARITY_COLOR[d.rarity];
        return (
          <Fragment key={d.id}>
            {i > 0 && <div className="connector" />}
            {locked ? (
              <div className="card dungeon-compact dungeon" style={{ opacity: 0.75 }}>
                <div className="num" style={{ borderColor: rc, color: rc }}>{i + 1}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="display" style={{ fontSize: 18 }}>{d.name}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{d.boss} · {EXERCISES[d.exercise].name}</div>
                </div>
                <span className="chip" style={{ color: d.elementColor, borderColor: d.elementColor }}>{d.element}</span>
                <span className="pill" style={{ background: '#1d2236', color: '#c7cad8', whiteSpace: 'nowrap' }}><span className="ico-inline"><Icon name="lock" size={12} /> LVL {d.minLevel}</span></span>
              </div>
            ) : (
            <div className={`card dungeon`}>
              {cleared && <div className="cleared-badge ico-inline"><Icon name="crown" size={16} /> BESIEGT</div>}
              <div className="row">
                <div className="num" style={{ borderColor: locked && d.rarity === 'COMMON' ? '#4b4f63' : rc, color: rc }}>{i + 1}</div>
                <div>
                  <h3>{d.name}</h3>
                  <div className="meta" style={{ color: rc }}>{d.rarity} · LVL {d.minLevel}+</div>
                </div>
                <div className="spacer" />
                {locked && <Icon name="lock" size={26} color="#5b5f70" />}
              </div>
              <div className="boss">
                <Icon name="skull" size={22} color="var(--red)" />
                <span>{d.boss}</span>
                <span className="muted" style={{ fontSize: 14 }}>· {EXERCISES[d.exercise].name} · {d.hp * 100} HP · {d.duration}s</span>
                <div className="spacer" />
                <span className="chip" style={{ color: d.elementColor, borderColor: d.elementColor }}>{d.element}</span>
              </div>
              {!locked && <div className="muted" style={{ fontSize: 14, marginBottom: 12 }}>{d.lore}</div>}
              <div className="rewards">
                <span>+{d.xp} XP</span>
                <span className="gold ico-inline">+{d.gold} <Gold /></span>
                <span className="blue ico-inline">+{d.gems} <Gems /></span>
                {cleared && <span className="muted" style={{ fontSize: 13, marginLeft: 'auto' }}>Wiederholung: 40 % Belohnung, keine Edelsteine</span>}
              </div>
              <button
                className="btn btn-primary"
                disabled={locked}
                onClick={() => {
                  start({
                    mode: 'dungeon',
                    exercise: d.exercise,
                    durationS: d.duration,
                    dungeonId: d.id,
                    bossHp: d.hp,
                    ranked: true,
                    opponent: {
                      id: d.id, name: d.boss, country: '', elo: d.bossElo, arenaPoints: 0, level: d.minLevel + 2,
                      wins: 0, losses: 0, kind: 'boss', color: d.elementColor, tier: d.element,
                      timeline: [],
                    },
                  });
                  nav('/battle');
                }}
              >
                {cleared ? 'Erneut betreten' : 'Betreten'}
              </button>
            </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
