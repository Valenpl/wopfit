import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchToday, fetchWeek } from '../../redux/slices/workoutSlice';
import { fetchProgress } from '../../redux/slices/progressSlice';
import { getEntry } from '../../redux/helpers';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import { FEELS } from '../../utils/constants';
import { longDay, today } from '../../utils/dates';
import { cap } from '../../utils/format';
import { blocksDone, isAlt } from '../../utils/workoutChecks';
import ReportSheet from '../../components/train/ReportSheet.jsx';
import Strip from '../../components/train/Strip.jsx';
import ErrorBox from '../../components/shared/ErrorBox.jsx';
import Icon from '../../components/shared/Icon.jsx';
import More from '../../components/shared/More.jsx';
import Note from '../../components/shared/Note.jsx';
import Sect from '../../components/shared/Sect.jsx';

export default function TodayTab() {
  const nav = useNavigate();
  const { me } = useAuth();
  const [report, setReport] = useState(null);
  const td = useFetch(fetchToday, undefined, st => st.workouts.today);
  const week = useFetch(fetchWeek, undefined, st => getEntry(st.workouts.weeks, ''));
  const progress = useFetch(fetchProgress, undefined, st => st.progress.summary);
  const all = [td, week, progress];
  const failed = all.find(x => x.error && !x.data);
  if (failed) return <ErrorBox error={failed.error} onRetry={() => all.forEach(x => x.retry())} />;
  if (all.some(x => !x.data)) return <p className="center muted">Cargando…</p>;

  const s = td.data.session, next = td.data.next, t = today();
  const soft = me.preferences.health.some(h => h === 'embarazo' || h === 'lesion');
  const sug = progress.data.suggestion;

  let card;
  if (!s) {
    card = <div className="card"><div className="row"><div className="tile g"><Icon n="sun" /></div><div className="grow"><h3>Hoy es día de descanso</h3>
      <div className="small muted">{next[0] ? `Próxima sesión: ${longDay(next[0].date)}.` : 'Disfrutá el día.'}</div></div></div>
      <button className="btn ghost mt16" onClick={() => nav('/entreno/caminata')}><Icon n="walk" /> Caminata opcional de 15 min</button></div>;
  } else if (s.status === 'MOVED') {
    card = <div className="card"><div className="row"><div className="tile g"><Icon n="cal" /></div><div className="grow"><h3>Tu sesión pasó al {longDay(s.movedTo)}</h3><div className="small muted">Hoy descansá, sin culpa. Tu racha sigue.</div></div></div></div>;
  } else if (s.status === 'DONE') {
    card = <div className="card"><div className="row"><div className="num ok"><Icon n="check" /></div><div className="grow"><h3>{s.title}</h3>
      <div className="small muted">¡Hecho! {s.feel != null ? `Te sentiste: ${FEELS[s.feel][1].toLowerCase()} ${FEELS[s.feel][0]}` : ''}</div></div></div>
      <div className="mt12"><More onClick={() => nav(`/entreno/${s.id}`)}>Ver rutina</More></div></div>;
  } else {
    const n = s.content.blocks.length, bd = blocksDone(s), pct = Math.round(bd / n * 100);
    card = <div className="card"><div className="row between"><span className="kicker">{isAlt(s) ? 'Alternativa · ' : ''}Hoy</span><span className="tag blue"><Icon n="clock" style={{ width: 13, height: 13 }} /> {s.minutes} min</span></div>
      <h3 style={{ fontSize: 20, marginTop: 6 }}>{s.title}</h3>
      <div className="chips mt8">{s.content.chips.map(c => <span key={c} className="tag blue">{c}</span>)}</div>
      {isAlt(s) && <div className="small muted mt8">La rutina completa pasó al {longDay(s.movedTo)}.</div>}
      <div className="row between small mt12"><b style={{ color: 'var(--navy)' }}>{bd} de {n} bloques</b><b className="muted">{pct}%</b></div><div className="bar mt8"><i style={{ width: `${pct}%` }} /></div>
      <button className="btn mt16" onClick={() => nav(`/entreno/${s.id}`)}>{bd ? 'Seguir rutina' : 'Comenzar rutina'} <Icon n="arrow" /></button></div>;
  }

  return <>
    {card}
    {s && s.status === 'PENDING' && !isAlt(s) && <div className="grid2 mt12"><button className="btn ghost sm" style={{ width: '100%' }} onClick={() => setReport(s)}>No puedo hoy</button>
      <button className="btn ghost sm" style={{ width: '100%' }} onClick={() => nav(`/entreno/${s.id}`)}><Icon n="info" /> Ver detalle</button></div>}
    {sug && sug.type === 'LIGHTEN' && <button className="banner mt16" onClick={() => nav('/ajuste')}><Icon n="heart" /><span className="grow">Se te complicaron {sug.struggles.length} sesiones esta semana. ¿Lo hacemos más liviano?</span><Icon n="chev" /></button>}
    {sug && sug.type === 'GROW' && <button className="banner green mt16" onClick={() => nav('/ajuste')}><Icon n="trend" /><span className="grow">Tu plan puede crecer. ¿Lo ajustamos?</span><Icon n="chev" /></button>}
    <Sect title="Próximos entrenamientos" />
    <div className="card">{next.length ? next.map(x => <button key={x.id} className="listrow" onClick={() => nav(`/entreno/${x.id}`)}><div className="tile sm"><Icon n="dumb" /></div>
      <div className="grow"><div className="t">{x.title}</div><div className="d">{x.date === t ? 'Hoy' : cap(longDay(x.date))} · {x.minutes} min{x.movedFrom ? ' · Reprogramada' : ''}</div></div><Icon n="chev" className="chev" /></button>)
      : <div className="small muted">No hay sesiones programadas.</div>}</div>
    <Sect title="Esta semana" />
    <div className="card"><Strip days={week.data.days} /></div>
    {soft && <Note tone="blue" className="mt16">Por lo que nos contaste de tu salud, elegimos ejercicios de bajo impacto. Si algo duele, pará.</Note>}
    <Note icon="shield" className="mt16">¿No llegás hoy? Reprogramá la sesión con un toque, sin perder racha.</Note>
    {report && <ReportSheet session={report} onClose={() => setReport(null)} />}
  </>;
}
