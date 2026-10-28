// Íconos SVG de la app: <Icon n="check" />.
const C = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const P = {
  back: 'M15 18l-6-6 6-6', arrow: 'M5 12h14M13 6l6 6-6 6', chev: 'M9 6l6 6-6 6', check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6L6 18', plus: 'M12 5v14M5 12h14', minus: 'M5 12h14',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z' + C(12, 12, 3), eyeoff: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM3 3l18 18',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6', lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3', cal: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  clock: C(12, 12, 9) + 'M12 7v5l3 2', user: C(12, 8, 4) + 'M4 21c0-4 3.6-6 8-6s8 2 8 6',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6', move: 'M5 19L19 5M13 5h6v6M5 13v6h6', leaf: 'M5 19C5 11 11 5 20 5c0 9-6 15-14 15M5 19l7-7',
  scale: 'M4 4h16v16H4zM8 10a4 4 0 0 1 8 0M12 10l1.5-2', dumb: 'M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12', moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  wind: 'M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7', drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  walk: C(13, 4.5, 1.6) + 'M9 21l2.2-6.5L14 17v4M8 12.5l2.5-4.5 3.5 1 2 3.5M11.2 14.5L12.5 9', run: C(15, 4.5, 1.6) + 'M5 12l3-3 4 1 2 3 3 1M10 10l-2 5-4 2M12 13l-1 4 3 4',
  yoga: C(12, 4.5, 1.6) + 'M12 7v6M6 10l6 2 6-2M5 19c2-2 4-3 7-3s5 1 7 3', bike: C(6, 16, 3.5) + C(18, 16, 3.5) + 'M6 16l4-7h5l3 7M10 9l2 7h-1M14 5h2',
  music: 'M9 18V5l11-2v13' + C(6.5, 18, 2.5) + C(17.5, 16, 2.5), flag: 'M5 21V4M5 4h11l-2 4 2 4H5', star: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
  fork: 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 2-3 5v4h3M17 3v18', cash: 'M3 7h18v10H3z' + C(12, 12, 2.5), sliders: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4', spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  history: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 8v4l3 2', info: C(12, 12, 9) + 'M12 11v5M12 8v.01',
  sun: C(12, 12, 4) + 'M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
  heart: 'M12 20s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.5-8 11-8 11z', home: 'M3 11l9-7 9 7v9H3zM9 20v-6h6v6',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5', basket: 'M3 9h18l-2 11H5zM8 9l4-6 4 6', logout: 'M14 4h6v16h-6M10 8l-4 4 4 4M6 12h10',
  users: C(9, 8, 3.5) + 'M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2.5.6 4 2.3 4 5.5', chat: 'M4 5h16v11H9l-5 4z',
  steth: 'M6 3v6a4 4 0 0 0 8 0V3M10 13v3a5 5 0 0 0 10 0v-2', pin: 'M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z',
  tag: 'M3 12V4h8l10 10-8 8zM7.5 8.5v.01', phone: 'M8 3h8v18H8zM11 18h2', grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  search: C(11, 11, 7) + 'M20 20l-4-4', copy: 'M8 8h12v12H8zM4 16V4h12', nav: 'M3 11l18-8-8 18-2-8z', bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4',
  send: 'M4 12l16-8-6 16-3-7z', bookmark: 'M6 3h12v18l-6-4-6 4z', share: 'M12 3v12M7 8l5-5 5 5M5 13v8h14v-8', down: 'M12 4v14M6 12l6 6 6-6', img: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6'
};
export default function Icon({ n, className = '', style }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[n]} /></svg>;
}
