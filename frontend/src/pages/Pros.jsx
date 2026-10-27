import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { DAYF, DAYS, Icon, add, cap, dayNum, dow, isPremium, monthName, shortDate, today } from '../lib.jsx';
import { Btn, ErrorBox, Loading, Note, Screen, Sect, TopBar, useAction, useApp, useLoad } from '../ui.jsx';

const COLORS = ['#1E7FCB', '#6DBB3A', '#E9824F', '#8E6BD1', '#1EA7E0', '#D9577A'];
/** Círculo con las iniciales (sin "Lic." ni "Prof.") y un color fijo por nombre. */
export function Avatar({ n, size = 40 }) {
  const bg = COLORS[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
  const ini = n.replace(/^(Lic\.|Prof\.)\s*/, '').split(' ').map(x => x[0]).join('').slice(0, 2);
  return <span className="av" style={{ background: bg, width: size, height: size, fontSize: Math.round(size * 0.38) }}>{ini}</span>;
}

const rating = r => String(r).replace('.', ',');
const leftTxt = n => (n === 1 ? 'queda 1 consulta' : `quedan ${n} consultas`);
const nextTxt = p => (!p.nextDate ? 'Sin turnos esta semana' : `Próximo turno: ${p.nextDate === add(today(), 1) ? 'mañana' : shortDate(p.nextDate).toLowerCase()} ${p.nextTime}`);

// ---------- Ayuda profesional ----------
export function Pros() {
  const nav = useNavigate();
  const { refresh, toast } = useApp();
  const [params] = useSearchParams();
  const [kind, setKind] = useState(params.get('tipo') === 'entre' ? 'entre' : 'nutri');
  const { data, error, reload } = useLoad(sig => api.get('/pros', sig), []);
  const [busy, run] = useAction();
  if (error) return <Screen><TopBar /><ErrorBox error={error} onRetry={reload} /></Screen>;
  if (!data) return <Loading />;
  const cancel = c => {
    if (!window.confirm(`¿Cancelar la consulta con ${c.proName}?`)) return;
    run(async () => { await api.del(`/consultations/${c.id}`); await refresh(); toast('Consulta cancelada'); reload(); });
  };
  return <Screen>
    <TopBar right={data.premium ? <span className="tag gold">★ Premium</span> : null} />
    <h1>Ayuda profesional</h1><p className="sub">Nutricionistas y entrenadores matriculados.</p>
    {data.premium
      ? <div className="card row between"><div><b style={{ color: 'var(--navy)' }}>Te {leftTxt(data.left)} este mes</b><div className="tiny muted">Incluidas en tu plan Premium</div></div>
        <span className="dots2">{Array.from({ length: data.limit }, (_, i) => <i key={i} className={data.left > i ? '' : 'off'} />)}</span></div>
      : <button className="banner" style={{ background: '#FFF6DD', color: '#8A6300' }} onClick={() => nav('/planes')}><Icon n="star" /><span className="grow">2 consultas por mes incluidas en Premium</span><Icon n="chev" /></button>}
    {data.mine.length > 0 && <><Sect title="Mis consultas" />
      {data.mine.map(c => <div key={c.id} className="pro"><Avatar n={c.proName} size={44} />
        <div className="grow"><b style={{ color: 'var(--navy)' }}>{c.proName}</b><div className="tiny muted" style={{ fontWeight: 700 }}>{shortDate(c.date)} · {c.time} · {c.mode}</div>
          <button className="link small" disabled={busy} onClick={() => cancel(c)}>Cancelar</button></div><span className="tag">Confirmada</span></div>)}</>}
    <div className="seg" style={{ marginTop: 18 }}>
      <button className={kind === 'nutri' ? 'on' : ''} onClick={() => setKind('nutri')}>Nutricionistas</button>
      <button className={kind === 'entre' ? 'on' : ''} onClick={() => setKind('entre')}>Entrenadores</button></div>
    {data.pros.filter(p => p.kind === kind).map(p => <button key={p.id} className="pro" onClick={() => nav(`/profesionales/${p.id}`)}><Avatar n={p.name} size={48} />
      <div className="grow"><b style={{ color: 'var(--navy)' }}>{p.name}</b><div className="tiny muted">{p.specialty}</div>
        <div className="tiny" style={{ fontWeight: 700, color: 'var(--navy)' }}>⭐ {rating(p.rating)} · {p.license}</div>
        <div className="tiny" style={{ color: 'var(--green-d)', fontWeight: 700 }}>{nextTxt(p)}</div></div><Icon n="chev" className="chev" /></button>)}
    <p className="tiny muted center mt16">Profesionales de ejemplo para la demo.</p>
  </Screen>;
}

// ---------- Perfil profesional y reserva ----------
export function Pro() {
  const { id } = useParams();
  const nav = useNavigate();
  const { refresh } = useApp();
  const { data, error, reload } = useLoad(sig => api.get(`/pros/${id}`, sig), [id]);
  const [mode, setMode] = useState('Videollamada');
  const [day, setDay] = useState(null);
  const [time, setTime] = useState(null);
  const [busy, run] = useAction();
  // Por defecto, el primer turno libre.
  useEffect(() => {
    if (!data) return;
    const d = data.days.find(x => x.slots.some(s => s.free)) || data.days[0];
    setDay(d.date);
    setTime((d.slots.find(s => s.free) || {}).time || null);
  }, [data]);
  if (error) return <Screen><TopBar fallback="/profesionales" /><ErrorBox error={error} onRetry={reload} /></Screen>;
  if (!data || !day) return <Loading />;
  const p = data.pro, slots = data.days.find(d => d.date === day).slots;
  const can = data.premium && data.left > 0 && time;
  const pickDay = k => { setDay(k); const free = data.days.find(d => d.date === k).slots.find(s => s.free); setTime(free ? free.time : null); };
  const book = () => run(async () => {
    try {
      const r = await api.post(`/pros/${id}/book`, { date: day, time, mode });
      await refresh();
      nav('/profesionales/confirmada', { replace: true, state: r });
    } catch (ex) {
      if (ex.status === 409) reload();
      throw ex;
    }
  });
  const foot = can ? <Btn busy={busy} onClick={book}>Confirmar consulta</Btn>
    : data.premium ? <button className="btn" disabled>{data.left ? 'Elegí un horario' : 'Sin consultas este mes'}</button>
      : <button className="btn" onClick={() => nav('/planes')}>Mejorar plan para reservar</button>;
  return <Screen foot={foot}>
    <TopBar fallback="/profesionales" />
    <div className="center mt16" style={{ display: 'flex', justifyContent: 'center' }}><Avatar n={p.name} size={84} /></div>
    <h1 className="center">{p.name}</h1><p className="sub center" style={{ marginBottom: 8 }}>{p.specialty}</p>
    <div className="chips" style={{ justifyContent: 'center' }}><span className="tag blue">⭐ {rating(p.rating)}</span><span className="tag blue">{p.license}</span><span className="tag blue">{p.experience}</span></div>
    <div className="card mt16 small">{p.bio}</div>
    <h2>Modalidad</h2>
    <div className="grid2">{data.modes.map(m => <button key={m} className={`slot ${mode === m ? 'on' : ''}`} onClick={() => setMode(m)} aria-pressed={mode === m}>{m === 'Chat' ? '💬' : '🎥'} {m}</button>)}</div>
    <h2>Día</h2>
    <div className="grid2" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>{data.days.map(d => <button key={d.date} className={`slot ${day === d.date ? 'on' : ''}`} onClick={() => pickDay(d.date)} aria-pressed={day === d.date}>
      <small>{DAYS[dow(d.date)]}</small>{dayNum(d.date)}</button>)}</div>
    <h2>Horario</h2>
    <div className="grid3">{slots.map(s => <button key={s.time} className={`slot ${time === s.time ? 'on' : ''}`} disabled={!s.free} onClick={() => setTime(s.time)} aria-pressed={time === s.time}
      style={s.free ? undefined : { opacity: 0.45, textDecoration: 'line-through' }} aria-label={s.free ? s.time : `${s.time} ocupado`}>{s.time}</button>)}</div>
    {!slots.some(s => s.free) && <Note tone="blue" className="mt12">Ese día no quedan turnos. Probá con otro.</Note>}
    {!data.premium ? <Note tone="peach" icon="lock" className="mt16">Las consultas con profesionales están incluidas en Premium.</Note>
      : !data.left && <Note tone="peach" className="mt16">Ya usaste tus 2 consultas de este mes.</Note>}
  </Screen>;
}

/** Archivo .ics para sumar la consulta al calendario (45 minutos, hora de Buenos Aires = UTC-3). */
function calendarFile(c) {
  const [y, m, d] = c.date.split('-').map(Number), [h, mi] = c.time.split(':').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, h + 3, mi));
  const f = x => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//WopFit//Demo//ES', 'BEGIN:VEVENT', `UID:wopfit-consulta-${c.id}@wopfit`,
    `DTSTAMP:${f(new Date())}`, `DTSTART:${f(utc)}`, `DTEND:${f(new Date(utc.getTime() + 45 * 60000))}`,
    `SUMMARY:Consulta con ${c.proName}`, `DESCRIPTION:${c.mode} · ${c.specialty} (WopFit)`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = 'consulta-wopfit.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- ¡Consulta confirmada! ----------
export function ProConf() {
  const nav = useNavigate();
  const { state } = useLocation();
  const { toast } = useApp();
  if (!state || !state.consult) return <Navigate to="/profesionales" replace />;
  const c = state.consult;
  return <Screen narrow scrollStyle={{ paddingTop: 'calc(var(--sat) + 40px)' }}
    foot={<><button className="btn" onClick={() => { calendarFile(c); toast('Agregado a tu calendario 📅'); }}><Icon n="cal" /> Agregar al calendario</button>
      <button className="btn ghost" onClick={() => nav('/inicio', { replace: true })}>Volver al inicio</button></>}>
    <div className="bigicon g pop"><Icon n="check" /></div>
    <h1 className="center">¡Consulta confirmada!</h1><p className="sub center">Te avisamos 1 hora antes.</p>
    <div className="card"><div className="row"><Avatar n={c.proName} size={48} /><div className="grow"><b style={{ color: 'var(--navy)' }}>{c.proName}</b><div className="tiny muted">{c.specialty}</div></div></div>
      <div className="diff mt8"><span className="tiny muted" style={{ fontWeight: 800 }}>Cuándo</span><b>{cap(DAYF[dow(c.date)])} {dayNum(c.date)} de {monthName(c.date)} · {c.time}</b></div>
      <div className="diff"><span className="tiny muted" style={{ fontWeight: 800 }}>Modalidad</span><b>{c.mode}</b></div></div>
    <Note icon="star" className="mt12">Te {leftTxt(state.left)} este mes.</Note>
  </Screen>;
}
