const P: Record<string, string> = {
  home: 'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  map: 'M3 6.5 8.5 4l7 2.5L21 4v13.5L15.5 20l-7-2.5L3 20zM8.5 4v13.5M15.5 6.5V20',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  user: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm-8 9c0-4.4 3.6-7 8-7s8 2.6 8 7z',
  gear: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm8.4-2.1-1.8-1 .1-.4-.1-.4 1.8-1-.9-2.8-2 .3-.6-.6.3-2-2.8-.9-1 1.8h-1l-1-1.8-2.8.9.3 2-.6.6-2-.3-.9 2.8 1.8 1v.8l-1.8 1 .9 2.8 2-.3.6.6-.3 2 2.8.9 1-1.8h1l1 1.8 2.8-.9-.3-2 .6-.6 2 .3z',
  dumbbell: 'M2 10h2V8h2v8H4v-2H2zm4-3h2v10H6zm10 0h2v10h-2zm2 1h2v2h2v4h-2v2h-2zM8 11h8v2H8z',
  flag: 'M5 21V4h11l-1.5 4L16 12H7v9z',
  trophy: 'M7 4h10v3a5 5 0 0 1-10 0zm0 1H4v2a3 3 0 0 0 3 3m10-5h3v2a3 3 0 0 1-3 3m-5 2v4m-4 4h8l-1-3H9z',
  repeat: 'M4 9a4 4 0 0 1 4-4h11l-3-3m3 3-3 3M20 15a4 4 0 0 1-4 4H5l3 3m-3-3 3-3',
  lock: 'M6 10V8a6 6 0 0 1 12 0v2h1v11H5V10zm2 0h8V8a4 4 0 0 0-8 0z',
  skull: 'M12 2a9 9 0 0 0-9 9c0 3 1.5 5 3 6v3h3v-2h2v2h2v-2h2v2h3v-3c1.5-1 3-3 3-6a9 9 0 0 0-9-9zM8.5 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm7 0a3 3 0 1 0 0-6M2 21c0-4 3-6 7-6s7 2 7 6zm15-6c3 0 5 2 5 5',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 0c3 3 3 17 0 20m0-20c-3 3-3 17 0 20M2 12h20',
  copy: 'M8 8h12v13H8zM4 3h12v3H6v11H4z',
  close: 'M5 5l14 14M19 5 5 19',
  camera: 'M4 7h3l2-3h6l2 3h3v13H4zm8 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  share: 'M18 8a3 3 0 1 0-3-3l-7 4a3 3 0 1 0 0 6l7 4a3 3 0 1 0 1-2l-7-4v-2l7-4a3 3 0 0 0 2 1z',
  edit: 'M4 20h4L20 8l-4-4L4 16zM14 6l4 4',
  back: 'M15 5l-7 7 7 7',
  shield: 'M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5z',
  star: 'M12 2l3 7h7l-5.5 4.5 2 7.5L12 17l-6.5 4 2-7.5L2 9h7z',
  mail: 'M3 5h18v14H3zm0 0 9 8 9-8',
  qr: 'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h3v3h-3zm4 4h3v3h-3zm-4 3h3m4-7h-3',
  link: 'M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1m2 5a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
  play: 'M7 4l13 8-13 8z',
  crown: 'M3 7l4 4 5-7 5 7 4-4-2 12H5z',
  fire: 'M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4 1-6 1-9z',
  coin: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z',
  gem: 'M6 4h12l4 5-10 11L2 9zM2 9h20M8 9l4 11 4-11M9 4L8 9M15 4l1 5',
  medal: 'M8 2l4 6 4-6M12 9a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 3.2l1.1 2.2 2.4.4-1.7 1.7.4 2.4-2.2-1.1-2.2 1.1.4-2.4-1.7-1.7 2.4-.4z',
  swords: 'M4 4l10.5 10.5M20 4L9.5 14.5M4 4v3.5M4 4h3.5M20 4v3.5M20 4h-3.5M6.5 13l4.5 4.5M17.5 13L13 17.5M4 20l3.8-3.8M20 20l-3.8-3.8',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  crystal: 'M12 2l7 7-7 13L5 9zM5 9h14M9 9l3 13 3-13M9 9l3-7 3 7',
  storm: 'M7 15a4 4 0 0 1-.5-7.97A5 5 0 0 1 16.3 6 4 4 0 0 1 17 14M12.5 12l-2.5 4.5h4L11.5 21',
  trident: 'M12 22V7M6 3v5a6 6 0 0 0 12 0V3M12 2v5M9 18h6',
  wind: 'M3 8h10a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7',
  stopwatch: 'M12 8a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM12 11.5v3l2 1.5M10 2h4M12 2v3.5M17.5 7l1.5-1.5',
  rocket: 'M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 15l-3-3c1-4 4.5-8 12-9-1 7.5-5 11-9 12zM15 7.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z',
  rivals: 'M9 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM15 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  heart: 'M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z',
  robot: 'M5 9h14v10H5zM12 9V5.5M12 3.5v.01M9 13.5v.01M15 13.5v.01M9.5 16.5h5M3 13v3M21 13v3',
  ghost: 'M6 20V10a6 6 0 0 1 12 0v10l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5zM10 10.5v.01M14 10.5v.01',
  dice: 'M4 4h16v16H4zM8.5 8.5v.01M15.5 15.5v.01M12 12v.01M15.5 8.5v.01M8.5 15.5v.01',
  check: 'M5 12.5l4.5 4.5L19 7',
  up: 'M12 19V5M5.5 11.5L12 5l6.5 6.5',
  down: 'M12 5v14M5.5 12.5L12 19l6.5-6.5',
  record: 'M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  sun: 'M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8',
  moon: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z',
  cog: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1',
};


const FILLED = new Set(['home', 'bolt', 'user', 'gear', 'flag', 'lock', 'skull', 'users', 'camera', 'share', 'play', 'crown', 'shield', 'star', 'fire', 'dumbbell', 'map', 'copy', 'heart', 'record']);

/** Roh-Pfad eines Symbols, um es in andere SVGs einzubetten (ohne foreignObject). */
export const iconPath = (name: string) => P[name] ?? '';
export const iconFilled = (name: string) => FILLED.has(name);

export function Icon({ name, size = 24, color, style }: { name: keyof typeof P | string; size?: number; color?: string; style?: React.CSSProperties }) {
  const fill = FILLED.has(name);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ color, ...style }} aria-hidden="true"
      fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={P[name] ?? ''} fillRule="evenodd" />
    </svg>
  );
}
