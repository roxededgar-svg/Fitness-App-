import { WORLDS, monsterIndex } from '../lib/path';
import { Monster } from '../components/Monster';

/** Interne Übersicht aller Monster (#/monsters) – praktisch zum Prüfen und als Vorlage für Illustrator:innen */
export function MonsterGallery() {
  return (
    <div className="page">
      <h1 className="display" style={{ fontSize: 40, fontStyle: 'italic' }}>Monster</h1>
      {WORLDS.map((w) => (
        <div key={w.id} style={{ marginTop: 22 }}>
          <div className="caps" style={{ color: w.glow }}>{w.name}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 10, padding: 14, borderRadius: 14, background: `linear-gradient(180deg, ${w.sky}, ${w.ground})` }}>
            {w.nodes.filter((n) => n.kind !== 'chest').map((n) => (
              <div key={n.id} style={{ textAlign: 'center', width: n.kind === 'boss' ? 170 : 120 }}>
                <Monster id={n.id} theme={w.theme} index={monsterIndex(n)} boss={n.kind === 'boss'} size={n.kind === 'boss' ? 160 : 110} />
                <div className="hand" style={{ fontSize: 17 }}>{n.name}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
