import { useNavigate } from 'react-router-dom';
import { fetchProgress } from '../../redux/slices/progressSlice';
import useFetch from '../../hooks/useFetch';
import { goal } from '../../utils/constants';
import Strip from '../../components/train/Strip.jsx';
import ErrorBox from '../../components/shared/ErrorBox.jsx';
import Icon from '../../components/shared/Icon.jsx';
import Loading from '../../components/shared/Loading.jsx';
import Note from '../../components/shared/Note.jsx';
import Screen from '../../components/shared/Screen.jsx';
import ScrollArea from '../../components/shared/ScrollArea.jsx';
import Sect from '../../components/shared/Sect.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

export default function Progress() {
  const nav = useNavigate();
  const { data: p, error, retry } = useFetch(fetchProgress, undefined, s => s.progress.summary);
  if (error && !p) return <Screen><TopBar /><ErrorBox error={error} onRetry={retry} /></Screen>;
  if (!p) return <Loading />;
  const msg = p.sessionsDone ? (p.sessionsDone >= p.sessionsTotal ? '¡Semana completa! Sos imparable.' : `Vas ${p.sessionsDone} de ${p.sessionsTotal}. Cada sesión suma.`) : 'Tu primera sesión de la semana te espera.';
  const sug = p.suggestion;
  return <div className="screen"><ScrollArea>
    <TopBar />
    <h1>Tu progreso</h1><p className="sub">Vos vs. vos: así viene tu semana {p.weekNumber}.</p>
    {sug && <button className={`banner ${sug.type === 'GROW' ? 'green' : ''}`} onClick={() => nav('/ajuste')}><Icon n={sug.type === 'GROW' ? 'trend' : 'heart'} />
      <span className="grow"><b style={{ display: 'block', color: 'var(--navy)' }}>{sug.type === 'GROW' ? 'Tu plan puede crecer' : 'Hagamos tu plan más liviano'}</b><span className="small" style={{ fontWeight: 600 }}>{sug.text}</span></span><Icon n="chev" /></button>}
    <div className="stats"><div className="stat"><b>{p.sessionsDone}/{p.sessionsTotal}</b><span>Entrenamientos</span></div><div className="stat"><b>{p.habitsToday}/3</b><span>Hábitos hoy</span></div><div className="stat"><b>{p.weeksStreak}</b><span>Semanas completas</span></div></div>
    <div className="card mt12"><div className="row between"><h3>Tu semana</h3><span className="tag blue">Semana {p.weekNumber}</span></div>
      <div className="mt12"><Strip days={p.week} /></div>
      <Note icon="check" className="mt12">{msg}</Note></div>
    <Sect title="Tus objetivos" />
    {p.objectives.map(o => { const g = goal(o.code); return <div className="card" key={o.code}><div className="row"><div className={`tile sm ${g.p ? 'p' : ''}`}><Icon n={g.i} /></div>
      <div className="grow"><div className="row between"><b style={{ color: 'var(--navy)' }}>{g.t}</b><b style={{ color: 'var(--navy)' }}>{o.percent}%</b></div><div className="tiny muted">{o.detail}</div></div></div>
      <div className="bar mt12"><i style={{ width: `${o.percent}%` }} /></div></div>; })}
    <div className="grid2 mt16"><button className="btn ghost sm" style={{ width: '100%' }} onClick={() => nav('/metas')}><Icon n="flag" /> Mis metas</button><button className="btn ghost sm" style={{ width: '100%' }} onClick={() => nav('/historial')}><Icon n="history" /> Historial</button></div>
  </ScrollArea></div>;
}
