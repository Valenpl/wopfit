import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGoal } from '../../redux/slices/goalSlice';
import useAuth from '../../hooks/useAuth';
import useRequest from '../../hooks/useRequest';
import { GOALS, META_OPTS, goal } from '../../utils/constants';
import Btn from '../../components/shared/Btn.jsx';
import Icon from '../../components/shared/Icon.jsx';
import Screen from '../../components/shared/Screen.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

export default function NewGoal() {
  const nav = useNavigate();
  const { me } = useAuth();
  const objs = me.preferences.goals.length ? GOALS.filter(g => me.preferences.goals.includes(g.k)).map(g => g.k) : ['mover'];
  const [obj, setObj] = useState(objs[0]);
  const [what, setWhat] = useState(META_OPTS[objs[0]][0]);
  const [times, setTimes] = useState(3);
  const [weeks, setWeeks] = useState(4);
  const save = useRequest(createGoal, { onSuccess: () => nav('/metas', { replace: true }) });
  const pickObj = k => { setObj(k); setWhat(META_OPTS[k][0]); };
  return <Screen narrow foot={<Btn busy={save.busy} onClick={() => save.run({ objective: obj, what, timesPerWeek: times, weeks })}>Guardar meta</Btn>}>
    <TopBar fallback="/metas" />
    <h1>Poné una meta concreta</h1><p className="sub">Una meta chiquita y clara es más fácil de sostener.</p>
    <h2>¿Para qué objetivo?</h2><div className="chips">{objs.map(k => { const g = goal(k); return <button key={k} className={`chip ${obj === k ? 'on' : ''}`} onClick={() => pickObj(k)}><Icon n={g.i} />{g.t}</button>; })}</div>
    <h2>¿Qué vas a hacer?</h2><div className="stack">{META_OPTS[obj].map(w => <button key={w} className={`opt ${what === w ? 'on' : ''}`} onClick={() => setWhat(w)}><span className="radio" /><span className="t">{w}</span></button>)}</div>
    <h2>¿Cuántas veces por semana?</h2>
    <div className="stepper"><button onClick={() => setTimes(Math.max(1, times - 1))} aria-label="Menos"><Icon n="minus" /></button><div><b>{times}</b><div className="small muted center">{times === 1 ? 'vez' : 'veces'} por semana</div></div><button onClick={() => setTimes(Math.min(7, times + 1))} aria-label="Más"><Icon n="plus" /></button></div>
    <h2>¿Durante cuánto tiempo?</h2><div className="grid3">{[2, 4, 8].map(w => <button key={w} className={`slot ${weeks === w ? 'on' : ''}`} onClick={() => setWeeks(w)}>{w}<small>semanas</small></button>)}</div>
    <div className="note blue mt20"><span><b>TU META:</b> {what}, {times} {times === 1 ? 'vez' : 'veces'} por semana, durante {weeks} semanas.</span></div>
  </Screen>;
}
