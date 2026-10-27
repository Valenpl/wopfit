import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { DAYS, FEELS, GOALS, HABITS, Icon, IconInline, META_OPTS, add, cap, dayNum, dow, goal, longDay, monthName, shortDate } from '../lib.jsx';
import { Btn, ErrorBox, Loading, Note, Screen, Sect, TopBar, useAction, useApp, useLoad } from '../ui.jsx';
import { Strip } from './shared.jsx';

export function Progress() {
  const nav = useNavigate();
  const { data: p, error, reload } = useLoad(sig => api.get('/progress', sig), []);
  if (error) return <Screen><TopBar /><ErrorBox error={error} onRetry={reload} /></Screen>;
  if (!p) return <Loading />;
  const msg = p.sessionsDone ? (p.sessionsDone >= p.sessionsTotal ? '¡Semana completa! Sos imparable.' : `Vas ${p.sessionsDone} de ${p.sessionsTotal}. Cada sesión suma.`) : 'Tu primera sesión de la semana te espera.';
  const sug = p.suggestion;
  return <div className="screen"><div className="scroll">
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
  </div></div>;
}

const WHY = { tiempo: 'Lo que más se repite es la falta de tiempo.', cansada: 'Venís con poca energía.', dolor: 'Nos contaste que te dolía algo.', equipo: 'No siempre tenés el equipamiento a mano.', otro: 'Se te vienen cruzando cosas.' };

export function Adjust() {
  const nav = useNavigate();
  const { refresh, toast } = useApp();
  const { data: p, error, reload } = useLoad(sig => api.get('/progress', sig), []);
  const [busy, run] = useAction();
  if (error) return <Screen><TopBar /><ErrorBox error={error} onRetry={reload} /></Screen>;
  if (!p) return <Loading />;
  const s = p.suggestion;
  if (!s) return <Screen narrow foot={<button className="btn" onClick={() => nav('/inicio', { replace: true })}>Volver al inicio</button>}><TopBar />
    <div className="bigicon pop"><Icon n="check" /></div><h1 className="center">Tu plan está al día</h1><p className="sub center">Por ahora no hay ajustes para proponerte. Seguí a tu ritmo.</p></Screen>;
  const grow = s.type === 'GROW';
  const yes = () => run(async () => { await api.post(grow ? '/adjust/grow' : '/adjust/lighten'); await refresh(); toast(grow ? '¡Listo! Tu plan subió un escalón' : 'Listo, tu plan ahora es más liviano'); nav('/entreno', { replace: true }); });
  const no = () => run(async () => { await api.post('/adjust/dismiss', { type: s.type }); toast('Lo dejamos como está'); nav(-1); });
  const counts = {}; s.struggles.forEach(x => { counts[x.reason] = (counts[x.reason] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return <Screen narrow foot={<><Btn busy={busy} onClick={yes}>{grow ? 'Sí, ajustar mi plan' : 'Sí, hacerlo más liviano'}</Btn><button className="btn ghost" disabled={busy} onClick={no}>{grow ? 'Mantenerlo como está' : 'Lo dejo como está'}</button></>}>
    <TopBar />
    <div className={`bigicon pop ${grow ? 'b' : ''}`}><Icon n={grow ? 'trend' : 'heart'} /></div>
    <h1 className="center">{grow ? 'Tu plan puede crecer' : 'Hagamos tu plan más liviano'}</h1>
    <p className="sub center">{grow ? `Cumpliste todo durante ${p.weeksStreak} ${p.weeksStreak === 1 ? 'semana' : 'semanas seguidas'}. Vas muy bien.` : `Esta semana se te complicaron ${s.struggles.length} sesiones. ${top ? WHY[top[0]] || '' : ''}`}</p>
    {!grow && <div className="card"><h3>Lo que nos contaste</h3><div className="mt8">{s.struggles.map(x => <div className="hist" key={x.date}><span className="circ" /><div className="grow"><div className="t">{cap(longDay(x.date))}</div><div className="d">{x.reasonLabel}</div></div></div>)}</div></div>}
    <div className="card"><h3>Lo que te proponemos</h3><div className="row between mt12"><span className="muted">{s.field === 'minutes' ? 'Duración' : 'Nivel'}</span><span className="arrowv"><s>{s.from}</s><Icon n="arrow" />{s.to}</span></div>
      <p className="small muted mt12" style={{ marginBottom: 0 }}>{grow ? 'Mismos días, equipamiento y presupuesto.' : 'Cuando te acomodes, lo volvemos a subir.'}</p></div>
    <Note icon="shield" className="mt12">Tu racha y tu historial se mantienen.</Note>
  </Screen>;
}

export function Goals() {
  const nav = useNavigate();
  const { toast } = useApp();
  const { data: goals, error, reload, set } = useLoad(sig => api.get('/goals', sig), []);
  const [busy, run] = useAction();
  if (error) return <Screen><TopBar fallback="/progreso" /><ErrorBox error={error} onRetry={reload} /></Screen>;
  if (!goals) return <Loading />;
  const act = goals.filter(g => !g.done), done = goals.filter(g => g.done);
  const check = g => run(async () => {
    const n = await api.post(`/goals/${g.id}/check`);
    set(goals.map(x => (x.id === g.id ? n : x)));
    toast(n.done ? '¡Meta cumplida! 🎉' : n.checkedToday ? '¡Sumaste uno!' : 'Desmarcado');
  });
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
      <button className="btn outline sm mt12" style={{ width: '100%' }} disabled={busy || full} onClick={() => check(g)}>{full ? '¡Meta de la semana cumplida!' : g.checkedToday ? 'Hecho hoy ✓ (tocá para desmarcar)' : 'Marcar como cumplido hoy'}</button></div>; })
      : <div className="card center muted">No tenés metas en curso. ¡Sumá una!</div>}
    {done.length > 0 && <><Sect title="Cumplidas" right={<span className="tag">{done.length}</span>} />
      {done.map(g => <div className="card" style={{ background: 'var(--green-bg)' }} key={g.id}><div className="row"><span className="circ ok"><Icon n="check" /></span><div className="grow"><b style={{ color: 'var(--navy)' }}>{g.what}</b>
        <div className="tiny" style={{ color: 'var(--green-d)', fontWeight: 700 }}>Cumplida el {dayNum(g.doneAt)} de {monthName(g.doneAt)}</div></div></div></div>)}</>}
  </Screen>;
}

export function NewGoal() {
  const nav = useNavigate();
  const { me, toast } = useApp();
  const objs = me.preferences.goals.length ? GOALS.filter(g => me.preferences.goals.includes(g.k)).map(g => g.k) : ['mover'];
  const [obj, setObj] = useState(objs[0]);
  const [what, setWhat] = useState(META_OPTS[objs[0]][0]);
  const [times, setTimes] = useState(3);
  const [weeks, setWeeks] = useState(4);
  const [busy, run] = useAction();
  const pickObj = k => { setObj(k); setWhat(META_OPTS[k][0]); };
  const save = () => run(async () => { await api.post('/goals', { objective: obj, what, timesPerWeek: times, weeks }); toast('¡Meta guardada!'); nav('/metas', { replace: true }); });
  return <Screen narrow foot={<Btn busy={busy} onClick={save}>Guardar meta</Btn>}>
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

export function History() {
  const nav = useNavigate();
  const [tab, setTab] = useState('train');
  const [all, setAll] = useState(false);
  const { data: h, error, reload } = useLoad(sig => api.get('/history', sig), []);
  if (error) return <Screen><TopBar fallback="/progreso" /><ErrorBox error={error} onRetry={reload} /></Screen>;
  if (!h) return <Loading />;
  const [cur, prev] = [h.weeks[0], h.weeks[1]];
  const diff = cur.done - (prev ? prev.done : 0);
  const msg = !prev ? 'Tu primera semana: todo lo que hagas suma.' : diff > 0 ? `${diff === 1 ? 'Una sesión' : diff + ' sesiones'} más que la semana pasada.` : diff === 0 ? 'Igual que la semana pasada. ¡Constancia!' : `Te ${cur.total - cur.done === 1 ? 'queda 1 sesión' : 'quedan ' + (cur.total - cur.done) + ' sesiones'} esta semana.`;
  const shown = all ? h.weeks : h.weeks.slice(0, 2);
  const wlabel = w => `Semana ${w.weekNumber} · ${dayNum(w.monday)} al ${dayNum(add(w.monday, 6))} ${monthName(add(w.monday, 6)).slice(0, 3)}`;

  let list;
  if (tab === 'train') list = shown.map(w => <div key={w.monday}><h2 style={{ fontSize: 16 }}>{wlabel(w)}</h2>
    {w.sessions.filter(s => s.status !== 'PENDING').length ? w.sessions.filter(s => s.status !== 'PENDING').map(s => {
      const alt = s.alternative && s.movedFrom;
      const d = s.status === 'MOVED' ? `Pasó al ${DAYS[dow(s.movedTo)].toLowerCase()} ${dayNum(s.movedTo)}${s.reasonLabel ? ' · ' + s.reasonLabel : ''}`
        : s.status === 'DONE' ? `${s.minutes} min${s.feel != null ? ' · ' + FEELS[s.feel][0] : ''}` : 'Sin registrar';
      return <div className="hist" key={s.id}><span className={`circ ${s.status === 'DONE' ? (alt ? 'alt' : 'ok') : ''}`}>{s.status === 'DONE' && <Icon n={alt ? 'walk' : 'check'} />}</span>
        <div className="grow"><div className="t">{s.title} {alt && <span className="tag blue">Alternativa</span>}</div><div className="d">{DAYS[dow(s.date)]} {dayNum(s.date)} · {d}</div></div></div>;
    }) : <div className="hist"><div className="d">Todavía no hay sesiones registradas.</div></div>}</div>);
  else if (tab === 'hab') list = shown.map(w => <div key={w.monday}><h2 style={{ fontSize: 16 }}>{wlabel(w)}</h2>
    {w.habits.length ? [...w.habits].reverse().map(x => { const n = [x.water, x.walk, x.sleep].filter(Boolean).length; return <div className="hist" key={x.date}>
      <span className={`circ ${n === 3 ? 'ok' : ''}`}>{n === 3 && <Icon n="check" />}</span><div className="grow"><div className="t">{cap(longDay(x.date))}</div>
        <div className="d">{HABITS.filter(hb => x[hb.k]).map(hb => hb.s).join(' · ') || 'Sin hábitos marcados'}</div></div><b className="small" style={{ color: 'var(--navy)' }}>{n}/3</b></div>; })
      : <div className="hist"><div className="d">No marcaste hábitos esta semana.</div></div>}</div>);
  else list = h.difficulties.length ? <>
    {h.mostCommon && <div className="card" style={{ background: 'var(--peach)' }}><h3>Lo que más se repite</h3><p className="small" style={{ margin: '6px 0 0', color: 'var(--peach-ink)', fontWeight: 700 }}>{h.mostCommon} · {h.mostCommonCount} {h.mostCommonCount === 1 ? 'vez' : 'veces'}</p>
      {h.mostCommonCount >= 2 && <button className="btn sm mt12" onClick={() => nav('/ajuste')}>Ver ajustes de mi plan</button>}</div>}
    <div className="mt12">{h.difficulties.slice(0, all ? 999 : 8).map((x, i) => <div className="hist" key={i}><span className="circ" /><div className="grow"><div className="t">{x.label}</div>
      <div className="d">{shortDate(x.date)} · {x.kind === 'WORKOUT' ? 'Entrenamiento' : x.note}{x.kind === 'WORKOUT' && x.note ? ` · «${x.note}»` : ''}</div></div></div>)}</div></>
    : <div className="card center muted">Todavía no nos contaste ninguna dificultad. Cuando algo no salga, tocá «No puedo hoy».</div>;

  return <Screen>
    <TopBar fallback="/progreso" />
    <h1>Tu historial</h1><p className="sub">Mirá cómo venís semana a semana.</p>
    <div className="seg three">{[['train', 'Entrenos'], ['hab', 'Hábitos'], ['dif', 'Dificultades']].map(([k, t]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t}</button>)}</div>
    <div className="card" style={{ background: 'var(--green-bg)' }}><h3>Esta semana vs. la anterior</h3>
      <div className="cmp"><div><span className="tiny muted">Esta semana</span><b>{cur.done} de {cur.total}</b></div><div><span className="tiny muted">Semana anterior</span><b>{prev ? `${prev.done} de ${prev.total}` : '—'}</b></div></div>
      <div className="small mt12" style={{ color: 'var(--green-d)', fontWeight: 700 }}><IconInline n="trend" /> {msg}</div></div>
    {list}
    {((tab !== 'dif' && h.weeks.length > 2) || (tab === 'dif' && h.difficulties.length > 8)) && !all && <div className="center mt12"><button className="link" onClick={() => setAll(true)}>Ver más</button></div>}
  </Screen>;
}
