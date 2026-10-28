import { useNavigate } from 'react-router-dom';
import { fetchProgress } from '../../redux/slices/progressSlice';
import useFetch from '../../hooks/useFetch';
import { goal } from '../../utils/constants';
import ErrorBox from '../../components/shared/ErrorBox.jsx';
import Icon from '../../components/shared/Icon.jsx';

export default function ProgressTab() {
  const nav = useNavigate();
  const { data: p, error, retry } = useFetch(fetchProgress, undefined, s => s.progress.summary);
  if (error && !p) return <ErrorBox error={error} onRetry={retry} />;
  if (!p) return <p className="center muted">Cargando…</p>;
  return <>
    <div className="stats"><div className="stat"><b>{p.sessionsDone}/{p.sessionsTotal}</b><span>Entrenamientos</span></div><div className="stat"><b>{p.habitsToday}/3</b><span>Hábitos hoy</span></div><div className="stat"><b>{p.weeksStreak}</b><span>Semanas completas</span></div></div>
    <div className="card mt12">{p.objectives.map(o => <div className="mt8" key={o.code}><div className="row between small"><b style={{ color: 'var(--navy)' }}>{goal(o.code).t}</b><b style={{ color: 'var(--navy)' }}>{o.percent}%</b></div><div className="bar mt8"><i style={{ width: `${o.percent}%` }} /></div></div>)}</div>
    <div className="stack mt16">
      <button className="opt" onClick={() => nav('/progreso')}><div className="tile sm"><Icon n="trend" /></div><span className="t grow">Ver mi progreso completo</span><Icon n="chev" className="chev" /></button>
      <button className="opt" onClick={() => nav('/metas')}><div className="tile sm g"><Icon n="flag" /></div><span className="t grow">Mis metas</span><Icon n="chev" className="chev" /></button>
      <button className="opt" onClick={() => nav('/historial')}><div className="tile sm"><Icon n="history" /></div><span className="t grow">Historial</span><Icon n="chev" className="chev" /></button>
    </div>
  </>;
}
