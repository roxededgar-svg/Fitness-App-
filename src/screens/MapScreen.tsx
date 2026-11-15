import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMe } from '../lib/store';
import { DUNGEONS, RARITY_COLOR } from '../lib/dungeons';
import { levelFromXp } from '../lib/progression';
import { EXERCISES } from '../lib/exercises';
import { useBattle } from '../lib/battle';
import { Icon } from '../components/Icon';

export function MapScreen() {
  const me = useMe()!;
  const nav = useNavigate();
  const start = useBattle((s) => s.start);
  const level = levelFromXp(me.xp).level;

  return (
    <div className="page">
      <div className="center-head">
        <h1>Weltkarte</h1>
        <div className="sub">· STORY MODE ·</div>
      </div>
      {DUNGEONS.map((d, i) => {
        const locked = level < d.minLevel;
        const cleared = me.dungeonsCleared.includes(d.id);
        const rc = RARITY_COLOR[d.rarity];
        return (
          <Fragment key={d.id}>
            {i > 0 && <div className="connector" />}
            <div className={`card dungeon ${locked ? 'locked' : ''}`}>
              {cleared && <div className="cleared-badge">👑 BESIEGT</div>}
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
                <span className="gold">+{d.gold}g</span>
                <span className="blue">+{d.gems}💎</span>
                {cleared && <span className="muted" style={{ fontSize: 13 }}>(Wiederholung: 40 %, keine 💎)</span>}
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
                {locked ? `Level ${d.minLevel} erforderlich` : cleared ? 'Erneut betreten' : 'Betreten'}
              </button>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
