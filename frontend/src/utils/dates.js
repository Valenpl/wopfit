// Fechas siempre como 'AAAA-MM-DD', en hora local.
export const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const DAYL = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
export const DAYF = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
export const DAYU = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const MON = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const pad = n => String(n).padStart(2, '0');

export const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const add = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return dkey(d); };
export const dow = k => (parse(k).getDay() + 6) % 7;
export const monday = k => add(k, -dow(k));
export const today = () => dkey(new Date());
export const dayNum = k => parse(k).getDate();
export const monthName = k => MON[parse(k).getMonth()];
export const shortDate = k => `${DAYS[dow(k)]} ${dayNum(k)} ${monthName(k).slice(0, 3)}`;
export const longDay = k => `${DAYF[dow(k)]} ${dayNum(k)}`;
export const daysText = ds => { const n = [...ds].sort().map(i => DAYS[i]); return n.length > 1 ? n.slice(0, -1).join(', ') + ' y ' + n[n.length - 1] : n[0] || '—'; };

/** "recién", "hace 5 min", "hace 2 h", "ayer", "hace 3 días". */
export function ago(iso) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return 'recién';
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
}
