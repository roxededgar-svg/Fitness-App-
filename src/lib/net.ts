/**
 * Verbindungen für Online-Räume.
 *  - 'peer':  PeerJS (WebRTC, Gerät zu Gerät). Der öffentliche PeerJS-Dienst vermittelt nur den Verbindungsaufbau.
 *  - 'local': BroadcastChannel – verbindet Tabs im selben Browser (zum Testen ohne Internet).
 * Auswahl: ?net=local in der URL (sonst 'peer').
 */
import { create } from 'zustand';
import { GuestRoom, HostRoom, type Link, type Msg, type RoomSnapshot } from './room';
import type { ExerciseId } from './exercises';

const PREFIX = 'vitalis-room-';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const newRoomCode = () => Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

export const netMode = (): 'peer' | 'local' => (/[?&]net=local/.test(window.location.href) ? 'local' : 'peer');

/* ---------- BroadcastChannel ---------- */

function localHost(code: string, onLink: (l: Link) => void) {
  const ch = new BroadcastChannel(PREFIX + code);
  const links = new Map<string, { msgs: ((m: Msg) => void)[]; closes: (() => void)[]; open: boolean }>();
  ch.onmessage = (e) => {
    const { from, to, m, bye } = e.data as { from: string; to?: string; m?: Msg; bye?: boolean };
    if (to && to !== 'host') return;
    if (from === 'host') return;
    let L = links.get(from);
    if (!L) {
      if (bye) return;
      L = { msgs: [], closes: [], open: true };
      links.set(from, L);
      const entry = L;
      onLink({
        id: from,
        send: (msg) => entry.open && ch.postMessage({ from: 'host', to: from, m: msg }),
        onMessage: (cb) => void entry.msgs.push(cb),
        onClose: (cb) => void entry.closes.push(cb),
        close: () => { if (!entry.open) return; entry.open = false; ch.postMessage({ from: 'host', to: from, bye: true }); entry.closes.forEach((c) => c()); },
      });
    }
    if (bye) { if (L.open) { L.open = false; L.closes.forEach((c) => c()); } return; }
    if (m) L.msgs.forEach((cb) => cb(m));
  };
  return { close: () => { links.forEach((L) => L.open && ch.postMessage({ from: 'host', bye: true })); ch.close(); } };
}

function localGuest(code: string): Promise<Link> {
  const ch = new BroadcastChannel(PREFIX + code);
  const id = 'g' + Math.random().toString(36).slice(2, 8);
  const msgs: ((m: Msg) => void)[] = [];
  const closes: (() => void)[] = [];
  let open = true;
  ch.onmessage = (e) => {
    const { from, to, m, bye } = e.data as { from: string; to?: string; m?: Msg; bye?: boolean };
    if (from !== 'host' || (to && to !== id)) return;
    if (bye) { if (open) { open = false; closes.forEach((c) => c()); } return; }
    if (m) msgs.forEach((cb) => cb(m));
  };
  return Promise.resolve({
    id: 'host',
    send: (m) => open && ch.postMessage({ from: id, to: 'host', m }),
    onMessage: (cb) => void msgs.push(cb),
    onClose: (cb) => void closes.push(cb),
    close: () => { if (!open) return; open = false; ch.postMessage({ from: id, bye: true }); closes.forEach((c) => c()); ch.close(); },
  });
}

/* ---------- PeerJS ---------- */

type DataConn = import('peerjs').DataConnection;

function wrapConn(c: DataConn, remoteId: string): Link {
  const msgs: ((m: Msg) => void)[] = [];
  const closes: (() => void)[] = [];
  let closed = false;
  const fire = () => { if (!closed) { closed = true; closes.forEach((cb) => cb()); } };
  c.on('data', (d) => msgs.forEach((cb) => cb(d as Msg)));
  c.on('close', fire);
  c.on('error', fire);
  return {
    id: remoteId,
    send: (m) => { if (c.open) c.send(m); },
    onMessage: (cb) => void msgs.push(cb),
    onClose: (cb) => void closes.push(cb),
    close: () => { c.close(); fire(); },
  };
}

async function peerHost(code: string, onLink: (l: Link) => void) {
  const { default: Peer } = await import('peerjs');
  return new Promise<{ close(): void }>((resolve, reject) => {
    const peer = new Peer(PREFIX + code);
    const t = setTimeout(() => { peer.destroy(); reject(new Error('timeout')); }, 15000);
    peer.on('open', () => { clearTimeout(t); resolve({ close: () => peer.destroy() }); });
    peer.on('error', (e) => { clearTimeout(t); reject(e); });
    peer.on('connection', (c) => c.on('open', () => onLink(wrapConn(c, c.peer))));
  });
}

async function peerGuest(code: string): Promise<{ link: Link; destroy(): void }> {
  const { default: Peer } = await import('peerjs');
  return new Promise((resolve, reject) => {
    const peer = new Peer();
    const t = setTimeout(() => { peer.destroy(); reject(new Error('timeout')); }, 15000);
    peer.on('error', (e) => { clearTimeout(t); reject(e); peer.destroy(); });
    peer.on('open', () => {
      const c = peer.connect(PREFIX + code, { reliable: true });
      c.on('open', () => { clearTimeout(t); resolve({ link: wrapConn(c, 'host'), destroy: () => peer.destroy() }); });
      c.on('error', (e) => { clearTimeout(t); reject(e); });
    });
  });
}

/* ---------- Store: aktuelle Verbindung ---------- */

export interface RoomInfo { selfId: string; full?: boolean; lost?: boolean }

interface NetState {
  role: 'none' | 'host' | 'guest';
  status: 'idle' | 'connecting' | 'open' | 'error';
  error?: string;
  room: RoomSnapshot | null;
  info: RoomInfo;
  host?: HostRoom;
  guest?: GuestRoom;
  closeNet?: () => void;
  create(me: { name: string; trophies: number }, exercise: ExerciseId, durationS: number): Promise<void>;
  join(code: string, me: { name: string; trophies: number }): Promise<void>;
  leave(): void;
}

const errText = (e: unknown) => {
  const t = String((e as { type?: string })?.type ?? (e as Error)?.message ?? e);
  if (t.includes('unavailable-id')) return 'Raum-Code ist schon vergeben – versuch es nochmal.';
  if (t.includes('peer-unavailable')) return 'Raum nicht gefunden. Stimmt der Code? Ist der Gastgeber noch in der Lobby?';
  if (t.includes('network') || t.includes('server-error') || t.includes('timeout') || t.includes('socket')) return 'Keine Verbindung zum Vermittlungsdienst. Prüfe dein Internet.';
  if (t.includes('browser-incompatible')) return 'Dein Browser unterstützt keine Direktverbindung.';
  return 'Verbindung fehlgeschlagen.';
};

export const useNet = create<NetState>((set, get) => ({
  role: 'none',
  status: 'idle',
  room: null,
  info: { selfId: '' },

  async create(me, exercise, durationS) {
    get().leave();
    set({ role: 'host', status: 'connecting', error: undefined });
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = newRoomCode();
      const host = new HostRoom(code, me, exercise, durationS);
      try {
        const net = netMode() === 'local' ? localHost(code, (l) => host.addLink(l)) : await peerHost(code, (l) => host.addLink(l));
        host.subscribe((room) => set({ room, info: { selfId: host.selfId } }));
        set({ host, status: 'open', closeNet: () => { host.close(); net.close(); } });
        return;
      } catch (e) {
        if (!String((e as { type?: string })?.type).includes('unavailable-id') || attempt === 2) { set({ status: 'error', error: errText(e), role: 'none' }); return; }
      }
    }
  },

  async join(code, me) {
    get().leave();
    set({ role: 'guest', status: 'connecting', error: undefined });
    try {
      const clean = code.trim().toUpperCase();
      let link: Link;
      let destroy = () => {};
      if (netMode() === 'local') link = await localGuest(clean);
      else ({ link, destroy } = await peerGuest(clean));
      const guest = new GuestRoom(link, me);
      guest.subscribe((room, info) => set({ room, info, status: info.lost ? 'error' : 'open', error: info.full ? 'Der Raum ist voll oder das Spiel läuft schon.' : info.lost ? 'Verbindung zum Gastgeber verloren.' : undefined }));
      set({ guest, closeNet: () => { guest.close(); destroy(); } });
      // Ohne Antwort des Gastgebers nach 8 s abbrechen
      setTimeout(() => { if (get().guest === guest && !get().room) set({ status: 'error', error: 'Raum nicht gefunden. Stimmt der Code?' }); }, 8000);
    } catch (e) {
      set({ status: 'error', error: errText(e), role: 'none' });
    }
  },

  leave() {
    get().closeNet?.();
    set({ role: 'none', status: 'idle', room: null, host: undefined, guest: undefined, closeNet: undefined, info: { selfId: '' }, error: undefined });
  },
}));

/** Einheitliche Aktionen für Gastgeber und Mitspieler */
export function roomActions() {
  const { host, guest, info } = useNet.getState();
  return {
    setTeam: (team: 0 | 1) => (host ? host.setTeam(host.selfId, team) : guest?.setTeam(team)),
    setReady: (r: boolean) => guest?.setReady(r),
    myReps: (n: number) => (host ? host.myReps(n) : guest?.myReps(n)),
    myFinished: (n: number) => (host ? host.myFinished(n) : guest?.myFinished(n)),
    selfId: info.selfId,
  };
}

export function inviteUrl(code: string) {
  const base = window.location.href.split('#')[0];
  return `${base}#/online?join=${code}${netMode() === 'local' ? '&net=local' : ''}`;
}
