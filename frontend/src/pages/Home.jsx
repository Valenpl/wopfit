import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { DAYF, Icon, add, cap, dayNum, dow, firstName, isPremium, shortDate, today } from '../lib.jsx';
import { ErrorBox, Loading, More, Sect, useApp, useLoad } from '../ui.jsx';
import { Habits, ReportSheet, Strip, blocksDone } from './shared.jsx';

/** Candado de "parte de Premium" para el plan Gratuito. */
const LockTag = () => <span className="lk"><Icon n="lock" /></span>;

export default function Home() {
  const nav = useNavigate();
  const { me, toast } = useApp();
  const t = today();
  const [report, setReport] = useState(null);
  const { data, error, loading, reload, set } = useLoad(async sig => {
    const y = add(t, -1);
    const [td, week, meals, habits, progress, yweek] = await Promise.all([
      api.get('/workouts/today', sig), api.get('/workouts/week', sig), api.get(`/meals/${t}`, sig), api.get(`/habits/${t}`, sig), api.get('/progress', sig),
      dow(t) === 0 ? api.get(`/workouts/week?start=${y}`, sig) : Promise.resolve(null)
    ]);
    const ydays = (yweek || week).days;
    const yday = ydays.find(d => d.date === y);
    return { td, week, meals, habits, progress, missed: yday && yday.session && yday.session.status === 'MISSED' ? yday.session : null };
  }, []);

  if (loading && !data) return <Loading />;
  if (error) return <div className="screen"><div className="scroll"><ErrorBox error={error} onRetry={reload} /></div></div>;
  const { td, week, meals, habits, progress, missed } = data;

  const s = td.session;
  let ent;
  if (!s) ent = { t: 'Día de descanso', m: td.next[0] ? `Próxima: ${DAYF[dow(td.next[0].date)]} ${dayNum(td.next[0].date)}` : 'Sumá una caminata si querés', v: 0, lab: '☀️' };
  else if (s.status === 'DONE') ent = { t: s.title, m: '¡Hecho! 💪', v: 100, lab: '3/3' };
  else if (s.status === 'MOVED') ent = { t: `Pasó al ${DAYF[dow(s.movedTo)]} ${dayNum(s.movedTo)}`, m: 'Hoy descansá', v: 0, lab: '—' };
  else { const n = s.content ? s.content.blocks.length : 3, bd = blocksDone(s); ent = { t: s.title, m: `${s.minutes} min · ${bd} de ${n} bloques`, v: Math.round(bd / n * 100), lab: `${bd}/${n}` }; }

  const eatenN = meals.meals.filter(m => m.status === 'EATEN' || m.status === 'ALTERNATIVE').length;
  const nextMeal = meals.meals.find(m => m.status === 'PENDING');
  const hb = [habits.water, habits.walk, habits.sleep].filter(Boolean).length;
  const sug = progress.suggestion;
  const pending = me.preferences.pendingChanges.length > 0;
  const prem = isPremium(me);

  return <div className="screen"><div className="scroll">
    <div className="row between"><div><div className="small muted" style={{ fontWeight: 700 }}>{shortDate(t)}</div><h1 style={{ margin: '2px 0 0' }}>Hola, {firstName(me)}</h1></div>
      <button className="iconbtn" onClick={() => nav('/perfil')} aria-label="Perfil"><Icon n="user" /></button></div>
    <div className="mt16" />
    {missed && <button className="banner" onClick={() => setReport(missed)}><Icon n="info" /><span className="grow">Ayer no hiciste tu entrenamiento. Contanos qué pasó</span><Icon n="chev" /></button>}
    {sug && sug.type === 'LIGHTEN' && <button className="banner" onClick={() => nav('/ajuste')}><Icon n="heart" /><span className="grow">Esta semana se te complicaron {sug.struggles.length} sesiones. ¿Lo hacemos más liviano?</span><Icon n="chev" /></button>}
    {sug && sug.type === 'GROW' && <button className="banner green" onClick={() => nav('/ajuste')}><Icon n="trend" /><span className="grow">Tu plan puede crecer. ¿Lo ajustamos?</span><Icon n="chev" /></button>}
    {pending && <button className="banner" style={{ background: 'var(--blue-bg)', color: 'var(--blue-d)' }} onClick={() => nav('/actualizando')}><Icon n="refresh" /><span className="grow">Cambiaste tus preferencias. Tocá para actualizar tu plan.</span><Icon n="chev" /></button>}

    <Sect title="Tu día" />
    <div className="daycards">
      <button className="dc" onClick={() => nav(s && s.status !== 'MOVED' ? `/entreno/${s.id}` : '/entreno')}><div className="row between"><span className="k">Entreno</span><span className="ring" style={{ '--v': ent.v }} data-t={ent.lab} /></div><b>{ent.t}</b><span className="m">{ent.m}</span></button>
      <button className="dc" onClick={() => nav(nextMeal ? `/comida/${t}/${nextMeal.slot}` : '/comida')}><div className="row between"><span className="k">Comida</span><span className="ring" style={{ '--v': Math.round(eatenN / 3 * 100) }} data-t={`${eatenN}/3`} /></div>
        <b>{nextMeal ? nextMeal.name : '¡Todas las comidas hechas!'}</b><span className="m">{nextMeal ? cap('próxima: ' + nextMeal.slotName.toLowerCase()) : 'Comidas'}</span></button>
    </div>

    <Sect title="Tus hábitos" right={<span className="tag blue">{hb} de 3</span>} />
    <Habits date={t} value={habits} onChange={h => set({ ...data, habits: h })} />

    <Sect title="Tu semana" right={<More onClick={() => nav('/progreso')}>Ver progreso</More>} />
    <div className="card"><Strip days={week.days} />
      <div className="small mt12" style={{ fontWeight: 700, color: 'var(--green-d)' }}>{week.total ? `Vas ${week.done} de ${week.total} entrenamientos esta semana` : 'Tu semana arranca pronto'}</div></div>

    <Sect title="Accesos rápidos" />
    <div className="qa">
      <button onClick={() => nav('/wopi')}><div className="wopiav" style={{ width: 34, height: 34 }}><img src="/wopi.webp" alt="" /></div>Preguntale a Wopi</button>
      <button onClick={() => nav('/ofertas')}><div className="tile sm g"><Icon n="tag" /></div>Ofertas</button>
      <button onClick={() => nav('/cerca')}><div className="tile sm"><Icon n="pin" /></div>Cerca tuyo{!prem && <LockTag />}</button>
      <button onClick={() => nav('/profesionales')}><div className="tile sm p"><Icon n="steth" /></div>Ayuda profesional{!prem && <LockTag />}</button>
    </div>
    {!prem && <div className="ad"><div className="tile sm"><Icon n="star" /></div><div className="grow small"><b style={{ color: 'var(--navy)' }}>Anuncio de aliado · 20% en zapatillas</b>
      <div className="muted">Deportes Andes. <button className="link" onClick={() => nav('/planes')}>Quitá los anuncios</button></div></div></div>}
    <div className="center mt12"><button className="textbtn" onClick={() => (s && s.status === 'PENDING' ? setReport(s) : toast(s ? 'Hoy ya no tenés entrenamiento pendiente' : 'Hoy es día de descanso: no hay nada que mover'))}>Hoy no puedo con todo</button></div>
    {report && <ReportSheet session={report} onClose={() => setReport(null)} onDone={reload} />}
  </div></div>;
}
