const COLORS = ['#1E7FCB', '#6DBB3A', '#E9824F', '#8E6BD1', '#1EA7E0', '#D9577A'];

/** Círculo con las iniciales (sin "Lic." ni "Prof.") y un color fijo por nombre. */
export default function Avatar({ n, size = 40 }) {
  const bg = COLORS[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
  const ini = n.replace(/^(Lic\.|Prof\.)\s*/, '').split(' ').map(x => x[0]).join('').slice(0, 2);
  return <span className="av" style={{ background: bg, width: size, height: size, fontSize: Math.round(size * 0.38) }}>{ini}</span>;
}
