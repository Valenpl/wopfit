import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { BUDGET, DAYF, Icon, MEAL_BG, MREASONS, add, cap, dayNum, dow, monday, monthName, today } from '../lib.jsx';
import { CouponCard, useHere } from './Places.jsx';
import { Btn, ErrorBox, Loading, More, Note, Screen, Sect, Sheet, TopBar, useAction, useApp, useLoad } from '../ui.jsx';

const eaten = m => m.status === 'EATEN' || m.status === 'ALTERNATIVE';
const money = n => '$' + Math.round(n).toLocaleString('es-AR');

function MealRow({ m, date, onEat }) {
  const nav = useNavigate();
  const isT = date === today();
  return <div className="mrow">
    <button className="row grow" style={{ textAlign: 'left', gap: 12, minWidth: 0 }} onClick={() => nav(`/comida/${date}/${m.slot}`)}>
      <span className="em" style={{ background: MEAL_BG[m.slot] }}>{m.emoji}</span>
      <span className="body"><span className="d">{m.slotName} · {m.time}{m.status === 'ALTERNATIVE' && <> · <span style={{ color: 'var(--blue)' }}>Alternativa</span></>}{m.status === 'SKIPPED' && <> · <span style={{ color: 'var(--peach-d)' }}>No pude</span></>}</span>
        <span className={`t ${eaten(m) ? 'done-t' : ''}`}>{m.name}</span><span className="d">{money(m.price)}</span></span>
    </button>
    {isT && <span className="mact"><button className={`okb ${eaten(m) ? 'on' : ''}`} onClick={() => onEat(m)} aria-label="La comí" disabled={eaten(m)}><Icon n="check" /></button></span>}
  </div>;
}

export function Comida() {
  const { me, toast } = useApp();
  const t = today();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(() => params.get('tab') || sessionStorage.getItem('wopfit-ct') || 'hoy');
  const [sel, setSel] = useState(t);
  const [wo, setWo] = useState(0);
  useEffect(() => { sessionStorage.setItem('wopfit-ct', tab); }, [tab]);
  const date = tab === 'semana' ? sel : t;
  const { data: day, error, reload, set } = useLoad(sig => (tab === 'super' ? Promise.resolve(null) : api.get(`/meals/${date}`, sig)), [date, tab === 'super']);
  const eat = async m => { try { set(await api.post(`/meals/${date}/${m.slot}/eaten`)); toast('¡Bien ahí! 🍽️'); } catch (ex) { toast(ex.message); } };
  const B = BUDGET[me.preferences.budget];
  const m = add(monday(t), wo * 7);
  const days = [0, 1, 2, 3, 4, 5, 6].map(i => add(m, i));

  let body;
  if (tab === 'super') body = <SuperTab />;
  else if (error) body = <ErrorBox error={error} onRetry={reload} />;
  else if (!day) body = <p className="center muted">Cargando…</p>;
  else if (tab === 'hoy') {
    const over = day.weekCost > day.budgetMax;
    body = <>
      <button className="card" style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => setTab('super')}><div className="row between" style={{ flexWrap: 'wrap', gap: 6 }}><span className="small" style={{ fontWeight: 800, color: 'var(--green-d)' }}>Presupuesto semanal</span><span className={`tag ${over ? 'peach' : ''}`}>{over ? 'Un poco arriba' : 'Dentro del presupuesto'}</span></div>
        <div className="row between mt8"><b style={{ fontFamily: 'var(--h)', fontSize: 22, color: 'var(--navy)' }}>{money(day.weekCost)}</b><span className="small muted" style={{ fontWeight: 700 }}>de {money(day.budgetMax)}</span></div>
        <div className="bar mt8"><i style={{ width: `${Math.min(100, day.weekCost / day.budgetMax * 100)}%` }} /></div></button>
      <Sect title="Comidas de hoy" right={<span className="tag blue">{day.meals.filter(eaten).length} de 3</span>} />
      <div className="card">{day.meals.map(x => <MealRow key={x.slot} m={x} date={date} onEat={eat} />)}</div>
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
          <small><span className="l">{['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'][dow(k)]}</span><span className="s">{'LMMJVSD'[dow(k)]}</span></small><b>{dayNum(k)}</b><i /></button>)}</div></div>
      <Sect title={`${cap(DAYF[dow(sel)])} ${dayNum(sel)}`} right={<span className="small muted" style={{ fontWeight: 700 }}>{money(day.meals.reduce((s, x) => s + x.price, 0))} el día</span>} />
      <div className="card">{day.meals.map(x => <MealRow key={x.slot} m={x} date={date} onEat={eat} />)}</div>
    </>;
  }
  return <div className="screen"><div className="scroll">
    <div className="row between"><h1 style={{ margin: 0 }}>Comida</h1><span className="tag">{B.t}</span></div>
    <div className="seg three"><button className={tab === 'hoy' ? 'on' : ''} onClick={() => setTab('hoy')}>Hoy</button><button className={tab === 'semana' ? 'on' : ''} onClick={() => { setTab('semana'); setSel(t); setWo(0); }}>Semana</button>
      <button className={tab === 'super' ? 'on' : ''} onClick={() => setTab('super')}>Súper</button></div>
    {body}
  </div></div>;
}

/** Lista del súper de esta semana: ingredientes del menú, de los que más se usan a los que menos. */
/** "Ofertas para tu lista": el primer cupón que sirve para la lista de esta semana. */
function ListOffer() {
  const nav = useNavigate();
  const here = useHere();
  const { data } = useLoad(sig => api.get('/offers', sig), []);
  if (!data || !data.offers.length) return null;
  const o = data.offers.find(x => x.forList) || data.offers[0];
  return <><Sect title="Ofertas para tu lista" right={<More onClick={() => nav('/ofertas')}>Ver todas</More>} /><CouponCard o={o} here={here} /></>;
}

function SuperTab() {
  const nav = useNavigate();
  const { me, toast } = useApp();
  const t = today();
  const { data, error, reload, set } = useLoad(sig => api.get(`/shopping/${t}`, sig), [t]);
  const { data: offers } = useLoad(sig => api.get('/offers', sig), []);
  const forList = offers ? offers.offers.filter(o => o.forList).length : 0;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!data) return <p className="center muted">Cargando…</p>;
  const B = BUDGET[me.preferences.budget];
  const done = data.items.filter(x => x.checked).length;
  const flip = async x => {
    const prev = data;
    set({ ...data, items: data.items.map(i => (i.name === x.name ? { ...i, checked: !i.checked } : i)) });
    try { set(await api.put(`/shopping/${t}`, { name: x.name, checked: !x.checked })); } catch (ex) { set(prev); toast(ex.message); }
  };
  return <>
    <div className="card"><div className="row between"><div><b style={{ fontFamily: 'var(--h)', fontSize: 20, color: 'var(--navy)' }}>{money(data.weekCost)}</b>
      <div className="tiny muted" style={{ fontWeight: 700 }}>estimado de la semana · presupuesto {B.t.toLowerCase()}</div></div><span className="tag blue">{done}/{data.items.length}</span></div></div>
    {forList > 0 && <button className="banner green mt12" onClick={() => nav('/ofertas')}><Icon n="tag" /><span className="grow">{forList} {forList === 1 ? 'oferta' : 'ofertas'} para ingredientes de tu lista</span><Icon n="chev" /></button>}
    <Sect title="Tu lista del súper" />
    <div className="card">{data.items.map(x => <button key={x.name} className="listrow" onClick={() => flip(x)} aria-pressed={x.checked}>
      <span className={`ck box ${x.checked ? 'on' : ''}`}><Icon n="check" /></span><span className={`t grow ${x.checked ? 'done-t' : ''}`}>{cap(x.name)}</span>
      {x.offer ? <span className="tag">Oferta</span> : <span className="tiny muted" style={{ fontWeight: 700 }}>{x.count} {x.count > 1 ? 'comidas' : 'comida'}</span>}</button>)}</div>
    <div className="center mt12"><More onClick={() => nav('/cerca')}>Ver súper y verdulerías cerca</More></div>
  </>;
}

export function Meal() {
  const { date, slot } = useParams();
  const nav = useNavigate();
  const { toast } = useApp();
  const { data: day, error, reload, set } = useLoad(sig => api.get(`/meals/${date}`, sig), [date]);
  const [acc, setAcc] = useState('ing');
  const [np, setNp] = useState(false);
  const [reason, setReason] = useState('tiempo');
  const [busy, run] = useAction();
  if (error) return <Screen><TopBar fallback="/comida" /><ErrorBox error={error} onRetry={reload} /></Screen>;
  if (!day) return <Loading />;
  const m = day.meals[+slot];
  const t = today();
  const canLog = date <= t;
  const act = path => run(async () => { set(await api.post(`/meals/${date}/${slot}/${path}`)); toast(path === 'swap' ? 'Te dejamos otra opción' : '¡Bien ahí! 🍽️'); });
  const report = () => run(async () => {
    const pr = await api.post(`/meals/${date}/${slot}/report`, { reason });
    setNp(false);
    nav(`/comida/${date}/${slot}/propuesta`, { state: { proposal: pr, reason } });
  });

  let foot = null;
  if (canLog) {
    if (eaten(m)) foot = <Note icon="check">¡La marcaste como comida!</Note>;
    else if (m.status === 'SKIPPED') foot = <Note tone="peach">Marcaste que no pudiste. No pasa nada, seguimos.</Note>;
    else foot = <><Btn busy={busy} onClick={() => act('eaten')}><Icon n="check" /> La comí</Btn><button className="btn ghost" onClick={() => setNp(true)}>No pude</button></>;
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
    {!eaten(m) && <div className="stack mt16"><button className="opt" disabled={busy} onClick={() => act('swap')}><div className="tile sm"><Icon n="refresh" /></div><span className="t grow">Cambiar opción</span><Icon n="chev" className="chev" /></button></div>}
    {np && <Sheet onClose={() => setNp(false)}>
      <h1 style={{ marginTop: 12 }}>¿Qué pasó con tu {m.slotName.toLowerCase()}?</h1><p className="sub">Está bien, pasa. Contanos y lo ajustamos.</p>
      <div className="stack">{MREASONS.map(([k, x]) => <button key={k} className={`opt ${reason === k ? 'on' : ''}`} onClick={() => setReason(k)}><span className="radio" /><span className="t">{x}</span></button>)}</div>
      <Btn className="mt16" busy={busy} onClick={report}>Seguir</Btn>
    </Sheet>}
  </Screen>;
}

export function MealProposal() {
  const { date, slot } = useParams();
  const { state } = useLocation();
  const nav = useNavigate();
  const { toast } = useApp();
  const [busy, run] = useAction();
  useEffect(() => { if (!state?.proposal) nav(`/comida/${date}/${slot}`, { replace: true }); }, [state, nav, date, slot]);
  if (!state?.proposal) return null;
  const { text, current, alternative: a } = state.proposal;
  const saving = current.price - a.price;
  const accept = () => run(async () => { await api.post(`/meals/${date}/${slot}/accept`, { name: a.name }); toast('Listo, cambiamos tu comida'); nav(`/comida/${date}/${slot}`, { replace: true }); });
  const skip = () => run(async () => { await api.post(`/meals/${date}/${slot}/skip`); toast('Anotado. Mañana seguimos'); nav('/comida', { replace: true }); });
  return <Screen narrow foot={<><Btn busy={busy} onClick={accept}>Dale, hago esto</Btn><button className="btn ghost" disabled={busy} onClick={skip}>Lo dejo así por hoy</button></>}>
    <TopBar fallback="/comida" />
    <h1>Te proponemos esto</h1><p className="sub">{text}</p>
    <div className="card"><div className="row"><span style={{ width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', fontSize: 30, flex: 'none', background: MEAL_BG[a.slot] }}>{a.emoji}</span>
      <div className="grow"><h3>{a.name}</h3><div className="small muted">{a.ingredients}</div></div></div>
      <div className="chips mt12"><span className="tag">{money(a.price)}</span>{state.reason === 'tiempo' && <><span className="tag">5 min</span><span className="tag">Sin cocinar</span></>}
        {state.reason === 'caro' && saving > 0 && <span className="tag">{money(saving)} menos</span>}{a.tags.map(x => <span key={x} className="tag blue">{x}</span>)}</div></div>
    {state.reason === 'afuera' && <Note tone="blue" className="mt12">Tip para comer afuera: elegí platos con verduras y una proteína, y tomá agua.</Note>}
    <Note icon="heart" className="mt12">Tu plan de comidas se reacomoda, sin culpa.</Note>
  </Screen>;
}
