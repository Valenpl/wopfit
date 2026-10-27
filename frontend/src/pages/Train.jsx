import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { DAYF, FEELS, Icon, IconInline, add, cap, dayNum, dow, goal, howto, longDay, monday, monthName, today } from '../lib.jsx';
import { Btn, ErrorBox, Loading, More, Note, Screen, Sect, Sheet, TopBar, useAction, useApp, useLoad } from '../ui.jsx';
import { ReportSheet, Strip, blocksDone, getChecks, setChecks } from './shared.jsx';

const isAlt = s => s && s.alternative && s.movedFrom;

// ================= Entreno (Hoy / Semana / Progreso) =================
export function Entreno() {
  const [tab, setTab] = useState(() => sessionStorage.getItem('wopfit-et') || 'hoy');
  useEffect(() => { sessionStorage.setItem('wopfit-et', tab); }, [tab]);
  const { me } = useApp();
  return <div className="screen"><div className="scroll">
    <div className="row between"><h1 style={{ margin: 0 }}>Entreno</h1><span className="tag">{me.plan.levelName}</span></div>
    <div className="seg three">{[['hoy', 'Hoy'], ['semana', 'Semana'], ['prog', 'Progreso']].map(([k, t]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t}</button>)}</div>
    {tab === 'hoy' && <TodayTab />}
    {tab === 'semana' && <WeekTab />}
    {tab === 'prog' && <ProgressTab />}
  </div></div>;
}

function TodayTab() {
  const nav = useNavigate();
  const { me } = useApp();
  const [report, setReport] = useState(null);
  const { data, error, loading, reload } = useLoad(sig => Promise.all([api.get('/workouts/today', sig), api.get('/workouts/week', sig), api.get('/progress', sig)]), []);
  if (loading && !data) return <p className="center muted">Cargando…</p>;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const [td, week, progress] = data;
  const s = td.session, t = today();
  const soft = me.preferences.health.some(h => h === 'embarazo' || h === 'lesion');
  const sug = progress.suggestion;

  let card;
  if (!s) {
    card = <div className="card"><div className="row"><div className="tile g"><Icon n="sun" /></div><div className="grow"><h3>Hoy es día de descanso</h3>
      <div className="small muted">{td.next[0] ? `Próxima sesión: ${longDay(td.next[0].date)}.` : 'Disfrutá el día.'}</div></div></div>
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
    <div className="card">{td.next.length ? td.next.map(x => <button key={x.id} className="listrow" onClick={() => nav(`/entreno/${x.id}`)}><div className="tile sm"><Icon n="dumb" /></div>
      <div className="grow"><div className="t">{x.title}</div><div className="d">{x.date === t ? 'Hoy' : cap(longDay(x.date))} · {x.minutes} min{x.movedFrom ? ' · Reprogramada' : ''}</div></div><Icon n="chev" className="chev" /></button>)
      : <div className="small muted">No hay sesiones programadas.</div>}</div>
    <Sect title="Esta semana" />
    <div className="card"><Strip days={week.days} /></div>
    {soft && <Note tone="blue" className="mt16">Por lo que nos contaste de tu salud, elegimos ejercicios de bajo impacto. Si algo duele, pará.</Note>}
    <Note icon="shield" className="mt16">¿No llegás hoy? Reprogramá la sesión con un toque, sin perder racha.</Note>
    {report && <ReportSheet session={report} onClose={() => setReport(null)} onDone={reload} />}
  </>;
}

function WeekTab() {
  const nav = useNavigate();
  const { toast } = useApp();
  const t = today();
  const [wo, setWo] = useState(0);
  const [sel, setSel] = useState(t);
  const m = add(monday(t), wo * 7);
  const { data: week, error, reload } = useLoad(sig => api.get(`/workouts/week?start=${m}`, sig), [m]);
  const day = week && week.days.find(d => d.date === sel);
  const sid = day && day.session && day.session.id;
  const { data: detail } = useLoad(sig => (sid ? api.get(`/workouts/${sid}`, sig) : Promise.resolve(null)), [sid, week]);
  const [busy, run] = useAction();
  useEffect(() => {
    if (!week) return;
    if (!week.days.some(d => d.date === sel)) setSel(wo === 0 ? t : (week.days.find(d => d.session) || week.days[0]).date);
  }, [week, sel, wo, t]);
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!week) return <p className="center muted">Cargando…</p>;

  const move = (s, path) => run(async () => { const r = await api.post(`/workouts/${s.id}/${path}`); toast(r.message); reload(); });
  const s = day && day.session;
  let card = null;
  if (day && !s) card = <div className="card mt12"><div className="row"><div className="tile g"><Icon n="sun" /></div><div className="grow"><h3>Día de descanso</h3><div className="small muted">Descansar también es parte del plan.</div></div></div></div>;
  else if (s) {
    const blocks = detail && detail.id === s.id && detail.content ? detail.content.blocks : [];
    card = <div className="card mt12"><div className="row between"><span className="kicker">{s.date === t ? 'Hoy · ' : ''}{longDay(s.date)}</span><span className="tag blue">{s.minutes} min</span></div>
      <h3 style={{ fontSize: 18, marginTop: 6 }}>{s.title}</h3>
      {s.status === 'MOVED' ? <Note tone="blue" className="mt12">Esta sesión pasó al {longDay(s.movedTo)}.</Note> : <>
        <div className="mt8">{blocks.map((b, i) => <div className="blk" key={i}><span className="num">{i + 1}</span><span className="grow" style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 14 }}>{b.summary}</span><span className="small muted">{b.minutes} min</span></div>)}</div>
        {s.status === 'DONE' ? <Note icon="check" className="mt12">¡Sesión completada!</Note>
          : s.status === 'MISSED' ? <><Note tone="peach" className="mt12">Esta sesión quedó sin hacer. No pasa nada.</Note><Btn className="ghost sm mt12" busy={busy} onClick={() => move(s, 'reschedule')}>Reprogramarla</Btn></>
            : <div className="row between mt12"><More onClick={() => nav(`/entreno/${s.id}`)}>{s.date === t ? 'Comenzar' : 'Ver rutina'}</More>
              {!isAlt(s) && <button className="textbtn" style={{ padding: 0 }} disabled={busy} onClick={() => move(s, 'rest')}>Reprogramar</button>}</div>}
      </>}</div>;
  }
  return <>
    <div className="card"><div className="row between">
      <button className="iconbtn" style={{ width: 32, height: 32 }} onClick={() => setWo(wo - 1)} aria-label="Semana anterior" disabled={week.weekNumber <= 1}><Icon n="back" /></button>
      <div className="center"><b style={{ fontFamily: 'var(--h)', color: 'var(--navy)', fontSize: 17 }}>{cap(monthName(m))}</b>
        <div className="tiny muted" style={{ fontWeight: 700 }}>Semana {week.weekNumber} · {week.total} {week.total === 1 ? 'sesión' : 'sesiones'}</div></div>
      <button className="iconbtn" style={{ width: 32, height: 32 }} onClick={() => setWo(wo + 1)} aria-label="Semana siguiente"><Icon n="chev" /></button></div>
      <div className="week">{week.days.map(d => {
        const st = d.session && d.session.status;
        const cls = st === 'DONE' ? 'done' : st === 'MISSED' ? 'miss' : d.session && st !== 'MOVED' ? 'dot' : '';
        return <button key={d.date} className={`wd ${sel === d.date ? 'sel' : ''} ${d.today ? 'today' : ''}`} onClick={() => setSel(d.date)}>
          <small><span className="l">{['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'][dow(d.date)]}</span><span className="s">{'LMMJVSD'[dow(d.date)]}</span></small>
          <b>{dayNum(d.date)}</b><i className={cls}>{d.session && st !== 'MOVED' ? '' : st === 'MOVED' ? 'Mov' : 'Desc'}</i></button>;
      })}</div></div>
    {card}
  </>;
}

function ProgressTab() {
  const nav = useNavigate();
  const { data: p, error, reload } = useLoad(sig => api.get('/progress', sig), []);
  if (error) return <ErrorBox error={error} onRetry={reload} />;
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

// ================= Rutina =================
export function Workout() {
  const { id } = useParams();
  const nav = useNavigate();
  const { toast } = useApp();
  const walk = id === 'caminata';
  const { data: s, error, reload } = useLoad(async sig => {
    if (!walk) return api.get(`/workouts/${id}`, sig);
    const td = await api.get('/workouts/today', sig);
    return { id: 'caminata', date: today(), status: 'PENDING', title: td.alternativeToday?.title, minutes: 15, content: td.alternativeToday, extra: true };
  }, [id]);
  const altKey = s && isAlt(s) ? s.alternative : null;
  const [w, setW] = useState([]);
  const [open, setOpen] = useState(null);
  const [how, setHow] = useState(null);
  const [report, setReport] = useState(null);
  const [busy, run] = useAction();
  useEffect(() => {
    if (!s || !s.content) return;
    const c = getChecks(s.id, altKey);
    setW(c);
    setOpen(Math.max(0, s.content.blocks.findIndex((b, bi) => !b.items.every((_, ii) => c.includes(bi + '-' + ii)))));
  }, [s, altKey]);

  if (error) return <Screen><TopBar fallback="/entreno" /><ErrorBox error={error} onRetry={reload} /></Screen>;
  if (!s) return <Loading />;
  if (!s.content) return <Screen><TopBar fallback="/entreno" /><h1>{s.title}</h1><Note tone="blue">Esta sesión pasó al {longDay(s.movedTo)}.</Note></Screen>;
  const c = s.content, t = today();
  const total = c.blocks.reduce((n, b) => n + b.items.length, 0);
  const tick = key => { const n = w.includes(key) ? w.filter(x => x !== key) : [...w, key]; setW(n); setChecks(s.id, altKey, n); };
  const future = s.date > t;
  const finish = () => {
    if (walk) return run(async () => { const h = await api.get(`/habits/${t}`); await api.put(`/habits/${t}`, { ...h, walk: true }); toast('¡Bien ahí! Sumamos la caminata a tus hábitos'); nav('/entreno', { replace: true }); });
    return nav(`/entreno/${s.id}/hecho`);
  };

  let foot;
  if (s.status === 'DONE') foot = <Note icon="check">¡Rutina completada!</Note>;
  else if (s.status === 'MISSED') foot = <Note tone="peach">Esta sesión quedó sin hacer. Podés reprogramarla desde la semana.</Note>;
  else if (future) foot = <Note tone="blue" icon="cal">Esta rutina es para el {longDay(s.date)}.</Note>;
  else foot = <><Btn busy={busy} onClick={finish}><Icon n="check" /> Marcar como hecho</Btn>
    {!walk && !isAlt(s) && <button className="btn ghost" onClick={() => setReport(s)}>No puedo hacerlo hoy</button>}</>;

  return <Screen foot={foot} scrollStyle={{ paddingBottom: 40 }}>
    <TopBar fallback="/entreno" right={<span className="tag blue">{w.length} de {total}</span>} />
    <div className="row between mt16"><span className="kicker">{s.date === t ? 'Hoy · ' : ''}{longDay(s.date)}</span><span className="tag blue">{c.minutes} min</span></div>
    <h1 style={{ marginTop: 6 }}>{c.title}</h1><p className="sub" style={{ marginBottom: 12 }}>{c.description}</p>
    <div className="chips">{c.chips.map(x => <span key={x} className="tag blue">{x}</span>)}</div>
    {s.alternative === 'suave' && <Note tone="peach" className="mt12">Si el dolor sigue o es fuerte, consultá con un profesional de la salud antes de volver a entrenar.</Note>}
    {c.blocks.map((b, bi) => {
      const n = b.items.filter((_, ii) => w.includes(bi + '-' + ii)).length, ok = n === b.items.length;
      return <div key={bi} className={`card mt12 acc ${open === bi ? 'open' : ''}`}>
        <button className="acc-h" onClick={() => setOpen(open === bi ? -1 : bi)} aria-expanded={open === bi}><span className={`num ${ok ? 'ok' : ''}`}>{ok ? <Icon n="check" /> : bi + 1}</span>
          <span className="grow"><h3>{b.name}</h3><span className="tiny muted" style={{ fontWeight: 700 }}>{b.minutes} min · {n} de {b.items.length}</span></span><Icon n="chev" className="chev2" /></button>
        <div className="acc-b mt8">{b.items.map((e, ii) => { const on = w.includes(bi + '-' + ii); return <div key={ii} className={`ex ${on ? 'on' : ''}`} style={{ padding: '4px 0' }}>
          <button className="row grow" style={{ textAlign: 'left', padding: '5px 0' }} onClick={() => tick(bi + '-' + ii)} disabled={s.status === 'DONE'}><span className={`ck box ${on ? 'on' : ''}`}><Icon n="check" /></span><span className="t grow">{e.name}</span><span className="small muted" style={{ fontWeight: 700 }}>{e.amount}</span></button>
          <button className="infob" onClick={() => setHow(e.name)} aria-label="Cómo se hace"><Icon n="info" /></button></div>; })}</div>
      </div>;
    })}
    <p className="center small muted mt16"><IconInline n="clock" /> Descanso entre series: {c.rest}</p>
    {how && <Sheet onClose={() => setHow(null)}><h1 style={{ marginTop: 12 }}>{how}</h1><div className="card" style={{ background: '#F6FAFD' }}>{howto(how)}</div>
      <Note tone="blue" className="mt12">Si sentís dolor, frená y probá la versión más suave.</Note><button className="btn mt16" onClick={() => setHow(null)}>Entendido</button></Sheet>}
    {report && <ReportSheet session={report} onClose={() => setReport(null)} onDone={reload} />}
  </Screen>;
}

// ================= ¡Completado! =================
export function Done() {
  const { id } = useParams();
  const nav = useNavigate();
  const { toast } = useApp();
  const { data } = useLoad(sig => Promise.all([api.get(`/workouts/${id}`, sig), api.get('/workouts/week', sig)]), [id]);
  const [feel, setFeel] = useState(null);
  const [note, setNote] = useState('');
  const [busy, run] = useAction();
  if (!data) return <Loading />;
  const [s, week] = data;
  const save = () => run(async () => {
    await api.post(`/workouts/${id}/done`, { feel, note: note.trim() || null });
    toast('¡Guardado! Seguí así 💪');
    nav('/entreno', { replace: true });
  });
  const n = s.content ? s.content.blocks.length : 0;
  return <Screen narrow scrollStyle={{ paddingTop: 'calc(var(--sat) + 36px)' }} foot={<Btn busy={busy} onClick={save}>Guardar</Btn>}>
    <div className="bigicon g pop"><Icon n="check" /></div>
    <h1 className="center">¡Entrenamiento completado!</h1><p className="sub center">{s.title} · {s.minutes} min · {n} de {n} bloques</p>
    <h2>¿Cómo te sentiste?</h2>
    <div className="feels">{FEELS.map(([e, t], i) => <button key={t} className={`feel ${feel === i ? 'on' : ''}`} onClick={() => setFeel(i)}><span>{e}</span>{t}</button>)}</div>
    <label className="f" htmlFor="fnote" style={{ marginTop: 20 }}>¿Algo para contarnos? <span className="opt-l">Opcional</span></label>
    <textarea className="ta" id="fnote" maxLength={300} placeholder="Ej: la sentadilla me costó un poco" value={note} onChange={e => setNote(e.target.value)} />
    <Note icon="trend" className="mt16">{isAlt(s) ? '¡Bien ahí! Moverte un poco también suma.' : `Con esta, llevás ${week.done + 1} de ${week.total} entrenamientos esta semana.`}</Note>
  </Screen>;
}

// ================= Te proponemos esto =================
export function Proposal() {
  const { id } = useParams();
  const { state } = useLocation();
  const nav = useNavigate();
  const { toast } = useApp();
  const [pick, setPick] = useState(state?.proposal?.kind);
  const [busy, run] = useAction();
  useEffect(() => { if (!state?.proposal) nav('/entreno', { replace: true }); }, [state, nav]);
  if (!state?.proposal) return null;
  const pr = state.proposal, a = pr.alternative;
  const accept = () => run(async () => {
    const r = await api.post(`/workouts/${id}/accept-alternative`, { kind: pick });
    toast(r.message);
    nav(`/entreno/${id}`, { replace: true });
  });
  const rest = () => run(async () => { const r = await api.post(`/workouts/${id}/rest`); toast(r.message); nav('/entreno', { replace: true }); });
  return <Screen narrow foot={<><Btn busy={busy} onClick={accept}>Dale, hago esto</Btn><button className="btn ghost" disabled={busy} onClick={rest}>Hoy descanso</button></>}>
    <TopBar fallback="/entreno" />
    <h1>Te proponemos esto</h1><p className="sub">{pr.text}</p>
    <button className={`card opt ${pick === pr.kind ? 'on' : ''}`} style={{ display: 'block', padding: 16 }} onClick={() => setPick(pr.kind)}>
      <div className="row between"><div className="tile g"><Icon n="clock" /></div><span className="tag">{a.minutes} min</span></div>
      <h3 style={{ fontSize: 19, marginTop: 12 }}>{a.title}</h3><div className="small muted" style={{ margin: '4px 0 10px' }}>{a.description}</div>
      <div className="chips">{a.chips.map(c => <span key={c} className="tag">{c}</span>)}</div></button>
    <Note icon="cal" className="mt12">La rutina completa pasa al {DAYF[dow(pr.nextDate)]} {dayNum(pr.nextDate)}, que tenías libre.</Note>
    {state.reason !== 'dolor' && pr.kind !== 'walk' && <button className={`opt mt12 ${pick === 'walk' ? 'on' : ''}`} onClick={() => setPick('walk')}><div className="tile sm"><Icon n="walk" /></div><span className="t grow">O una caminata de 15 min</span><span className="radio" /></button>}
    {state.reason === 'dolor' && <Note tone="peach" icon="heart" className="mt12">Si el dolor sigue, consultá con un profesional de la salud.</Note>}
  </Screen>;
}
