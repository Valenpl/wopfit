/** Texto de un archivo .ics para sumar la consulta al calendario (45 minutos, hora de Buenos Aires = UTC-3). */
export function consultIcs(c) {
  const [y, m, d] = c.date.split('-').map(Number), [h, mi] = c.time.split(':').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, h + 3, mi));
  const f = x => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//WopFit//Demo//ES', 'BEGIN:VEVENT', `UID:wopfit-consulta-${c.id}@wopfit`,
    `DTSTAMP:${f(new Date())}`, `DTSTART:${f(utc)}`, `DTEND:${f(new Date(utc.getTime() + 45 * 60000))}`,
    `SUMMARY:Consulta con ${c.proName}`, `DESCRIPTION:${c.mode} · ${c.specialty} (WopFit)`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
