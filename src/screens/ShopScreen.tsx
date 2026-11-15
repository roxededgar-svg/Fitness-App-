import { useNavigate } from 'react-router-dom';
import { useMe, useStore } from '../lib/store';
import { SHOP, type ShopItem } from '../lib/shop';
import { levelFromXp } from '../lib/progression';
import { Icon } from '../components/Icon';
import { Avatar, Gems, Gold, PageHeader, Section, toast } from '../components/ui';

function Price({ item }: { item: ShopItem }) {
  return (
    <span className="ico-inline display" style={{ color: '#1a1003' }}>
      {item.currency === 'gold' ? <Icon name="coin" size={15} color="#1a1003" /> : <Icon name="gem" size={15} color="#1a1003" />} {item.price}
    </span>
  );
}

export function ShopScreen() {
  const me = useMe()!;
  const nav = useNavigate();
  const { buy, equip } = useStore();
  const level = levelFromXp(me.xp).level;
  const owned = new Set(me.owned ?? []);

  function onBuy(item: ShopItem) {
    const err = buy(item.id);
    toast(err ?? (item.kind === 'freeze' ? 'Streak-Schutz gekauft' : `${item.name} gekauft und ausgerüstet`));
  }

  const card = (item: ShopItem) => {
    const locked = level < item.minLevel;
    const has = owned.has(item.id);
    const on = me.equipped?.frame === item.id || me.equipped?.title === item.id;
    return (
      <div key={item.id} className={`shop-item ${locked ? 'locked' : ''} ${on ? 'on' : ''}`}>
        <div className="shop-preview">
          {item.kind === 'frame' && (
            <div className={`av-ring framed ${item.animated ? 'frame-anim' : ''}`} style={{ background: item.ring, padding: 5 }}>
              <Avatar src={me.avatar} name={me.name} size={64} />
            </div>
          )}
          {item.kind === 'title' && <div className="shop-title">„{item.name}“</div>}
          {item.kind === 'freeze' && <div className="t-ico" style={{ width: 70, height: 70, borderRadius: 20, background: '#0c2a3a', color: '#7dd3fc' }}><Icon name="shield" size={40} /></div>}
        </div>
        <div className="display" style={{ fontSize: 16 }}>{item.name}</div>
        <div className="muted" style={{ fontSize: 12, minHeight: 32 }}>{item.desc}</div>
        {locked ? (
          <div className="pill ico-inline" style={{ background: '#1d2236', color: '#9aa0b8', justifyContent: 'center' }}><Icon name="lock" size={12} /> Ab Level {item.minLevel}</div>
        ) : has ? (
          <button className={`btn btn-sm ${on ? 'btn-ghost' : 'btn-primary solid'}`} onClick={() => equip(item.kind as 'frame' | 'title', on ? undefined : item.id)}>
            {on ? 'Ablegen' : 'Ausrüsten'}
          </button>
        ) : (
          <button className="btn btn-gold btn-sm" onClick={() => onBuy(item)}><Price item={item} /></button>
        )}
      </div>
    );
  };

  return (
    <div className="page">
      <div className="row" style={{ marginBottom: 6 }}>
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="Zurück"><Icon name="back" size={22} /></button>
      </div>
      <PageHeader eyebrow={`Level ${level}`} title="Shop" right={<><span className="currency gold"><Gold /> {me.gold}</span><span className="currency blue"><Gems /> {me.gems}</span></>} />
      <div className="muted" style={{ fontSize: 14, marginTop: -8 }}>
        Gold verdienst du in jedem Training und Kampf, Edelsteine in Bosskämpfen, Schatzkisten und zum Saisonende. Mit steigendem Level werden neue Artikel freigeschaltet.
      </div>

      <Section title="Streak-Schutz" action={<span className="muted" style={{ fontSize: 13 }}>Vorrat: <b style={{ color: 'var(--text)' }}>{me.streakFreezes ?? 0}</b></span>}>
        <div className="shop-grid">{SHOP.filter((i) => i.kind === 'freeze').map(card)}</div>
      </Section>
      <Section title="Avatar-Rahmen">
        <div className="shop-grid">{SHOP.filter((i) => i.kind === 'frame').map(card)}</div>
      </Section>
      <Section title="Titel">
        <div className="shop-grid">{SHOP.filter((i) => i.kind === 'title').map(card)}</div>
      </Section>
    </div>
  );
}
