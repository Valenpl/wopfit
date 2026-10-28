import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eatMeal, fetchMealDay, reportMeal, swapMeal } from '../../redux/slices/mealSlice';
import { getEntry } from '../../redux/helpers';
import useFetch from '../../hooks/useFetch';
import useRequest from '../../hooks/useRequest';
import { MEAL_BG, MREASONS } from '../../utils/constants';
import { today } from '../../utils/dates';
import { cap, money } from '../../utils/format';
import { eaten } from '../../components/food/MealRow.jsx';
import Btn from '../../components/shared/Btn.jsx';
import ErrorBox from '../../components/shared/ErrorBox.jsx';
import Icon from '../../components/shared/Icon.jsx';
import Loading from '../../components/shared/Loading.jsx';
import Note from '../../components/shared/Note.jsx';
import Screen from '../../components/shared/Screen.jsx';
import Sheet from '../../components/shared/Sheet.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

/** Detalle de una comida: ingredientes, paso a paso, "la comí", "no pude" y cambiar opción. */
export default function MealDetail() {
  const { date, slot } = useParams();
  const nav = useNavigate();
  const { data: day, error, retry } = useFetch(fetchMealDay, date, s => getEntry(s.meals.days, date));
  const [acc, setAcc] = useState('ing');
  const [np, setNp] = useState(false);
  const [reason, setReason] = useState('tiempo');
  const eat = useRequest(eatMeal);
  const swap = useRequest(swapMeal);
  const report = useRequest(reportMeal, {
    onSuccess: (pr, arg) => { setNp(false); nav(`/comida/${date}/${slot}/propuesta`, { state: { proposal: pr, reason: arg.reason } }); }
  });
  const busy = eat.busy || swap.busy || report.busy;
  if (error && !day) return <Screen><TopBar fallback="/comida" /><ErrorBox error={error} onRetry={retry} /></Screen>;
  if (!day) return <Loading />;
  const m = day.meals[+slot];
  const canLog = date <= today();

  let foot = null;
  if (canLog) {
    if (eaten(m)) foot = <Note icon="check">¡La marcaste como comida!</Note>;
    else if (m.status === 'SKIPPED') foot = <Note tone="peach">Marcaste que no pudiste. No pasa nada, seguimos.</Note>;
    else foot = <><Btn busy={eat.busy} disabled={busy} onClick={() => eat.run({ date, slot })}><Icon n="check" /> La comí</Btn><button className="btn ghost" onClick={() => setNp(true)}>No pude</button></>;
  }
  return <Screen foot={foot}>
    <TopBar fallback="/comida" right={<span className="tag">{m.slotName} · {m.time}</span>} />
    <div className="hero-meal" style={{ background: MEAL_BG[m.slot] }}>{m.emoji}</div>
    <h1>{m.name}</h1>
    <div className="chips">{m.tags.map(x => <span key={x} className="tag">{x}</span>)}<span className="tag blue">{money(m.price)} / porción</span>{m.status === 'ALTERNATIVE' && <span className="tag blue">Alternativa</span>}</div>
    <div className={`card mt16 acc ${acc === 'ing' ? 'open' : ''}`}><button className="acc-h" onClick={() => setAcc(acc === 'ing' ? '' : 'ing')}><div className="tile sm g"><Icon n="basket" /></div><h3 className="grow">Ingredientes</h3><Icon n="chev" className="chev2" /></button>
      <div className="acc-b"><ul className="steps">{m.ingredients.split(',').map(x => <li key={x}>{cap(x.trim())}</li>)}</ul></div></div>
    <div className={`card acc ${acc === 'steps' ? 'open' : ''}`}><button className="acc-h" onClick={() => setAcc(acc === 'steps' ? '' : 'steps')}><div className="tile sm p"><Icon n="fork" /></div><h3 className="grow">Paso a paso</h3><Icon n="chev" className="chev2" /></button>
      <div className="acc-b"><ol className="steps">{m.steps.map(x => <li key={x}>{x}</li>)}</ol></div></div>
    {!eaten(m) && <div className="stack mt16"><button className="opt" disabled={busy} onClick={() => swap.run({ date, slot })}><div className="tile sm"><Icon n="refresh" /></div><span className="t grow">Cambiar opción</span><Icon n="chev" className="chev" /></button></div>}
    {np && <Sheet onClose={() => setNp(false)}>
      <h1 style={{ marginTop: 12 }}>¿Qué pasó con tu {m.slotName.toLowerCase()}?</h1><p className="sub">Está bien, pasa. Contanos y lo ajustamos.</p>
      <div className="stack">{MREASONS.map(([k, x]) => <button key={k} className={`opt ${reason === k ? 'on' : ''}`} onClick={() => setReason(k)}><span className="radio" /><span className="t">{x}</span></button>)}</div>
      <Btn className="mt16" busy={report.busy} onClick={() => report.run({ date, slot, reason })}>Seguir</Btn>
    </Sheet>}
  </Screen>;
}
