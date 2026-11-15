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
};

const FILLED = new Set(['home', 'bolt', 'user', 'gear', 'flag', 'lock', 'skull', 'users', 'camera', 'share', 'play', 'crown', 'shield', 'star', 'fire', 'dumbbell', 'map', 'copy']);

export function Icon({ name, size = 24, color, style }: { name: keyof typeof P | string; size?: number; color?: string; style?: React.CSSProperties }) {
  const fill = FILLED.has(name);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ color, ...style }} aria-hidden="true"
      fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={P[name] ?? ''} fillRule="evenodd" />
    </svg>
  );
}
