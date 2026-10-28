import { useNavigate } from 'react-router-dom';
import { checkGoal, fetchGoals } from '../../redux/slices/goalSlice';
import useFetch from '../../hooks/useFetch';
import useRequest from '../../hooks/useRequest';
import { dayNum, monthName } from '../../utils/dates';
import ErrorBox from '../../components/shared/ErrorBox.jsx';
import Icon from '../../components/shared/Icon.jsx';
import Loading from '../../components/shared/Loading.jsx';
import Screen from '../../components/shared/Screen.jsx';
import Sect from '../../components/shared/Sect.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

export default function Goals() {
  const nav = useNavigate();
  const { data: goals, error, retry } = useFetch(fetchGoals, undefined, s => s.goals.list);
  const check = useRequest(checkGoal);
  if (error && !goals) return <Screen><TopBar fallback="/progreso" /><ErrorBox error={error} onRetry={retry} /></Screen>;
  if (!goals) return <Loading />;
  const act = goals.filter(g => !g.done), done = goals.filter(g => g.done);
  return <Screen foot={<button className="btn" onClick={() => nav('/metas/nueva')}><Icon n="plus" /> Nueva meta</button>}>
    <TopBar fallback="/progreso" />
    <h1>Tus metas</h1><p className="sub">Metas chiquitas y claras para orientar tu semana.</p>
    <Sect title="En curso" right={<span className="tag blue">{act.length}</span>} />
    {act.length ? act.map(g => { const full = g.doneThisWeek >= g.timesPerWeek && !g.checkedToday; return <div className="card" key={g.id}>
      <div className="row between"><div className="tile sm"><Icon n="flag" /></div><span className="tag">{g.objectiveName}</span></div>
      <h3 className="mt12">{g.what}, {g.timesPerWeek} {g.timesPerWeek === 1 ? 'vez' : 'veces'} por semana</h3>
      <div className="tiny muted">Semana {g.currentWeek} de {g.weeks} · Total: {g.objectivePercent}%</div>
      <div className="row between tiny mt12"><span className="muted" style={{ fontWeight: 700 }}>Progreso</span><b style={{ color: 'var(--navy)' }}>{g.doneThisWeek} de {g.timesPerWeek} esta semana</b></div>
      <div className="bar mt8"><i style={{ width: `${Math.min(100, g.doneThisWeek / g.timesPerWeek * 100)}%` }} /></div>
      <button className="btn outline sm mt12" style={{ width: '100%' }} disabled={check.busy || full} onClick={() => check.run(g.id)}>{full ? '¡Meta de la semana cumplida!' : g.checkedToday ? 'Hecho hoy ✓ (tocá para desmarcar)' : 'Marcar como cumplido hoy'}</button></div>; })
      : <div className="card center muted">No tenés metas en curso. ¡Sumá una!</div>}
    {done.length > 0 && <><Sect title="Cumplidas" right={<span className="tag">{done.length}</span>} />
      {done.map(g => <div className="card" style={{ background: 'var(--green-bg)' }} key={g.id}><div className="row"><span className="circ ok"><Icon n="check" /></span><div className="grow"><b style={{ color: 'var(--navy)' }}>{g.what}</b>
        <div className="tiny" style={{ color: 'var(--green-d)', fontWeight: 700 }}>Cumplida el {dayNum(g.doneAt)} de {monthName(g.doneAt)}</div></div></div></div>)}</>}
  </Screen>;
}
