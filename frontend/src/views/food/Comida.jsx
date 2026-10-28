import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { eatMeal, fetchMealDay } from '../../redux/slices/mealSlice';
import { getEntry } from '../../redux/helpers';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import useTab from '../../hooks/useTab';
import { BUDGET } from '../../utils/constants';
import { DAYF, DAYL, DAYU, add, dayNum, dow, monday, monthName, today } from '../../utils/dates';
import { cap, money } from '../../utils/format';
import MealRow, { eaten } from '../../components/food/MealRow.jsx';
import ErrorBox from '../../components/shared/ErrorBox.jsx';
import Icon from '../../components/shared/Icon.jsx';
import Note from '../../components/shared/Note.jsx';
import ScrollArea from '../../components/shared/ScrollArea.jsx';
import Sect from '../../components/shared/Sect.jsx';
import ListOffer from './ListOffer.jsx';
import SuperTab from './SuperTab.jsx';

/** Comida, con tres pestañas: hoy, la semana y la lista del súper. */
export default function Comida() {
  const nav = useNavigate();
  const dispatch = useDispatch();
  const { me } = useAuth();
  const t = today();
  const [tab, setTab] = useTab('comida', ['hoy', 'semana', 'super'], 'hoy');
  const [sel, setSel] = useState(t);
  const [wo, setWo] = useState(0);
  const date = tab === 'semana' ? sel : t;
  const day = useFetch(fetchMealDay, date, s => getEntry(s.meals.days, date), { skip: tab === 'super' });
  const open = m => nav(`/comida/${date}/${m.slot}`);
  const eat = m => dispatch(eatMeal({ date, slot: m.slot }));
  const B = BUDGET[me.preferences.budget];
  const m = add(monday(t), wo * 7);
  const days = [0, 1, 2, 3, 4, 5, 6].map(i => add(m, i));
  const d = day.data;

  let body;
  if (tab === 'super') body = <SuperTab />;
  else if (day.error && !d) body = <ErrorBox error={day.error} onRetry={day.retry} />;
  else if (!d) body = <p className="center muted">Cargando…</p>;
  else if (tab === 'hoy') {
    const over = d.weekCost > d.budgetMax;
    body = <>
      <button className="card" style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => setTab('super')}><div className="row between" style={{ flexWrap: 'wrap', gap: 6 }}><span className="small" style={{ fontWeight: 800, color: 'var(--green-d)' }}>Presupuesto semanal</span><span className={`tag ${over ? 'peach' : ''}`}>{over ? 'Un poco arriba' : 'Dentro del presupuesto'}</span></div>
        <div className="row between mt8"><b style={{ fontFamily: 'var(--h)', fontSize: 22, color: 'var(--navy)' }}>{money(d.weekCost)}</b><span className="small muted" style={{ fontWeight: 700 }}>de {money(d.budgetMax)}</span></div>
        <div className="bar mt8"><i style={{ width: `${Math.min(100, d.weekCost / d.budgetMax * 100)}%` }} /></div></button>
      <Sect title="Comidas de hoy" right={<span className="tag blue">{d.meals.filter(eaten).length} de 3</span>} />
      <div className="card">{d.meals.map(x => <MealRow key={x.slot} m={x} onOpen={open} onEat={eat} />)}</div>
      <Note icon="heart" className="mt16">¿No pudiste con alguna? Tocala y contanos: te proponemos una alternativa.</Note>
      <ListOffer />
    </>;
  } else {
    body = <>
      <div className="card"><div className="row between">
        <button className="iconbtn" style={{ width: 32, height: 32 }} onClick={() => { setWo(wo - 1); setSel(add(m, -7)); }} aria-label="Semana anterior" disabled={add(m, -7) < monday(me.plan.startDate)}><Icon n="back" /></button>
        <div className="center"><b style={{ fontFamily: 'var(--h)', color: 'var(--navy)', fontSize: 17 }}>{cap(monthName(m))}</b><div className="tiny muted" style={{ fontWeight: 700 }}>7 días</div></div>
        <button className="iconbtn" style={{ width: 32, height: 32 }} onClick={() => { setWo(wo + 1); setSel(add(m, 7)); }} aria-label="Semana siguiente"><Icon n="chev" /></button></div>
        <div className="week">{days.map(k => <button key={k} className={`wd ${sel === k ? 'sel' : ''} ${k === t ? 'today' : ''}`} onClick={() => setSel(k)}>
          <small><span className="l">{DAYU[dow(k)]}</span><span className="s">{DAYL[dow(k)]}</span></small><b>{dayNum(k)}</b><i /></button>)}</div></div>
      <Sect title={`${cap(DAYF[dow(sel)])} ${dayNum(sel)}`} right={<span className="small muted" style={{ fontWeight: 700 }}>{money(d.meals.reduce((s, x) => s + x.price, 0))} el día</span>} />
      <div className="card">{d.meals.map(x => <MealRow key={x.slot} m={x} onOpen={open} onEat={date === t ? eat : null} />)}</div>
    </>;
  }
  return <div className="screen"><ScrollArea>
    <div className="row between"><h1 style={{ margin: 0 }}>Comida</h1><span className="tag">{B.t}</span></div>
    <div className="seg three"><button className={tab === 'hoy' ? 'on' : ''} onClick={() => setTab('hoy')}>Hoy</button><button className={tab === 'semana' ? 'on' : ''} onClick={() => { setTab('semana'); setSel(t); setWo(0); }}>Semana</button>
      <button className={tab === 'super' ? 'on' : ''} onClick={() => setTab('super')}>Súper</button></div>
    {body}
  </ScrollArea></div>;
}
