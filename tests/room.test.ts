import { describe, expect, it } from 'vitest';
import { GuestRoom, HostRoom, canStart, memoryPair, teamReps } from '../src/lib/room';

function setup(n: number) {
  const host = new HostRoom('ABCD', { name: 'Mia', trophies: 100 }, 'squat', 60);
  const guests = Array.from({ length: n }, (_, i) => {
    const [hostSide, guestSide] = memoryPair('host', `g${i}`);
    host.addLink(hostSide);
    return new GuestRoom(guestSide, { name: ['Alex', 'Lena', 'Tom', 'Zoe'][i], trophies: 50 });
  });
  return { host, guests };
}

describe('Online-Raum', () => {
  it('verteilt Spieler automatisch auf zwei Teams, max. 2 pro Team', () => {
    const { host, guests } = setup(3);
    const s = host.state;
    expect(s.players).toHaveLength(4);
    expect(s.players.filter((p) => p.team === 0)).toHaveLength(2);
    expect(s.players.filter((p) => p.team === 1)).toHaveLength(2);
    expect(guests[0].state?.players).toHaveLength(4); // Gäste sehen alle
  });
  it('lehnt einen fünften Spieler ab', () => {
    const { host } = setup(3);
    const [h, g] = memoryPair('host', 'g9');
    host.addLink(h);
    let full = false;
    new GuestRoom(g, { name: 'Zu viel', trophies: 0 }).subscribe((_, i) => (full = !!i.full));
    expect(full).toBe(true);
    expect(host.state.players).toHaveLength(4);
  });
  it('Start erst, wenn beide Teams besetzt und alle bereit', () => {
    const { host, guests } = setup(1);
    expect(canStart(host.state)).toBe(false); // Gast nicht bereit
    guests[0].setReady(true);
    expect(canStart(host.state)).toBe(true);
    guests[0].setTeam(0); // beide im selben Team → kein Gegner
    expect(canStart(host.state)).toBe(false);
    guests[0].setTeam(1);
    expect(host.start()).toBe(true);
    expect(guests[0].state?.phase).toBe('countdown');
  });
  it('Wiederholungen aller Geräte kommen bei allen an, Ergebnis nach Abschluss', () => {
    const { host, guests } = setup(3);
    guests.forEach((g) => g.setReady(true));
    host.start();
    host.goLive();
    host.myReps(10);
    guests[0].myReps(7);
    guests[1].myReps(12);
    guests[2].myReps(4);
    const s = guests[2].state!;
    const mine = s.players.find((p) => p.id === guests[2].selfId)!;
    expect(mine.reps).toBe(4);
    const t0 = teamReps(s, 0), t1 = teamReps(s, 1);
    expect(t0 + t1).toBe(33);
    host.myFinished(10);
    guests.forEach((g, i) => g.myFinished([7, 12, 4][i]));
    expect(guests[1].state?.phase).toBe('done');
  });
  it('Verbindungsabbruch im Kampf blockiert das Ende nicht', () => {
    const host = new HostRoom('ABCD', { name: 'Mia', trophies: 0 }, 'squat', 30);
    const [h, g] = memoryPair('host', 'gx');
    host.addLink(h);
    const guest = new GuestRoom(g, { name: 'Alex', trophies: 0 });
    guest.setReady(true);
    host.start(); host.goLive();
    guest.myReps(5);
    g.close();
    host.myFinished(8);
    expect(host.state.phase).toBe('done');
    expect(host.state.players.find((p) => p.id === 'gx')?.reps).toBe(5);
  });
});
