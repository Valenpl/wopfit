import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSession, fetchWeek, rescheduleWorkout, restWorkout } from '../../redux/slices/workoutSlice';
import { getEntry } from '../../redux/helpers';
import useFetch from '../../hooks/useFetch';
import useRequest from '../../hooks/useRequest';
import { DAYL, DAYU, add, dayNum, dow, longDay, monday, monthName, today } from '../../utils/dates';
import { cap } from '../../utils/format';
import { isAlt } from '../../utils/workoutChecks';
import Btn from '../../components/shared/Btn.jsx';
import ErrorBox from '../../components/shared/ErrorBox.jsx';
import Icon from '../../components/shared/Icon.jsx';
import More from '../../components/shared/More.jsx';
import Note from '../../components/shared/Note.jsx';

export default function WeekTab() {
  const nav = useNavigate();
  const t = today();
  const [wo, setWo] = useState(0);
  const [sel, setSel] = useState(t);
  const m = add(monday(t), wo * 7);
  // La semana actual se guarda con la clave '' (la misma que usan Inicio y Hoy), así no se pide dos veces.
  const start = wo === 0 ? undefined : m;
  const week = useFetch(fetchWeek, start, s => getEntry(s.workouts.weeks, start || ''));
  const days = week.data ? week.data.days : [];
  // Si el día elegido no está en la semana que se ve, se muestra hoy (semana actual) o el primer día con sesión.
  const day = days.find(d => d.date === sel) || (wo === 0 ? days.find(d => d.date === t) : days.find(d => d.session) || days[0]);
  const s = day && day.session;
  const detail = useFetch(fetchSession, s ? String(s.id) : undefined, st => (s ? getEntry(st.workouts.sessions, String(s.id)) : null), { skip: !s });
  const rest = useRequest(restWorkout);
  const reschedule = useRequest(rescheduleWorkout);
  const busy = rest.busy || reschedule.busy;

  if (week.error && !week.data) return <ErrorBox error={week.error} onRetry={week.retry} />;
  if (!week.data) return <p className="center muted">Cargando…</p>;
  const w = week.data;

  let card = null;
  if (day && !s) card = <div className="card mt12"><div className="row"><div className="tile g"><Icon n="sun" /></div><div className="grow"><h3>Día de descanso</h3><div className="small muted">Descansar también es parte del plan.</div></div></div></div>;
  else if (s) {
    const blocks = detail.data && detail.data.content ? detail.data.content.blocks : [];
    card = <div className="card mt12"><div className="row between"><span className="kicker">{s.date === t ? 'Hoy · ' : ''}{longDay(s.date)}</span><span className="tag blue">{s.minutes} min</span></div>
      <h3 style={{ fontSize: 18, marginTop: 6 }}>{s.title}</h3>
      {s.status === 'MOVED' ? <Note tone="blue" className="mt12">Esta sesión pasó al {longDay(s.movedTo)}.</Note> : <>
        <div className="mt8">{blocks.map((b, i) => <div className="blk" key={b.name}><span className="num">{i + 1}</span><span className="grow" style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 14 }}>{b.summary}</span><span className="small muted">{b.minutes} min</span></div>)}</div>
        {s.status === 'DONE' ? <Note icon="check" className="mt12">¡Sesión completada!</Note>
          : s.status === 'MISSED' ? <><Note tone="peach" className="mt12">Esta sesión quedó sin hacer. No pasa nada.</Note><Btn className="ghost sm mt12" busy={reschedule.busy} disabled={busy} onClick={() => reschedule.run(s.id)}>Reprogramarla</Btn></>
            : <div className="row between mt12"><More onClick={() => nav(`/entreno/${s.id}`)}>{s.date === t ? 'Comenzar' : 'Ver rutina'}</More>
              {!isAlt(s) && <button className="textbtn" style={{ padding: 0 }} disabled={busy} onClick={() => rest.run(s.id)}>Reprogramar</button>}</div>}
      </>}</div>;
  }
  return <>
    <div className="card"><div className="row between">
      <button className="iconbtn" style={{ width: 32, height: 32 }} onClick={() => setWo(wo - 1)} aria-label="Semana anterior" disabled={w.weekNumber <= 1}><Icon n="back" /></button>
      <div className="center"><b style={{ fontFamily: 'var(--h)', color: 'var(--navy)', fontSize: 17 }}>{cap(monthName(m))}</b>
        <div className="tiny muted" style={{ fontWeight: 700 }}>Semana {w.weekNumber} · {w.total} {w.total === 1 ? 'sesión' : 'sesiones'}</div></div>
      <button className="iconbtn" style={{ width: 32, height: 32 }} onClick={() => setWo(wo + 1)} aria-label="Semana siguiente"><Icon n="chev" /></button></div>
      <div className="week">{w.days.map(d => {
        const st = d.session && d.session.status;
        const cls = st === 'DONE' ? 'done' : st === 'MISSED' ? 'miss' : d.session && st !== 'MOVED' ? 'dot' : '';
        return <button key={d.date} className={`wd ${day && day.date === d.date ? 'sel' : ''} ${d.today ? 'today' : ''}`} onClick={() => setSel(d.date)}>
          <small><span className="l">{DAYU[dow(d.date)]}</span><span className="s">{DAYL[dow(d.date)]}</span></small>
          <b>{dayNum(d.date)}</b><i className={cls}>{d.session && st !== 'MOVED' ? '' : st === 'MOVED' ? 'Mov' : 'Desc'}</i></button>;
      })}</div></div>
    {card}
  </>;
}
