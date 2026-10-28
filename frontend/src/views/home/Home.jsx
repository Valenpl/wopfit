import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchToday, fetchWeek } from '../../redux/slices/workoutSlice';
import { fetchMealDay } from '../../redux/slices/mealSlice';
import { fetchHabits, saveHabits } from '../../redux/slices/habitSlice';
import { fetchProgress } from '../../redux/slices/progressSlice';
import { getEntry } from '../../redux/helpers';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import useToast from '../../hooks/useToast';
import { DAYF, add, dayNum, dow, monday, shortDate, today } from '../../utils/dates';
import { cap, firstName, isPremium } from '../../utils/format';
import { blocksDone } from '../../utils/workoutChecks';
import Habits from '../../components/home/Habits.jsx';
import ReportSheet from '../../components/train/ReportSheet.jsx';
import Strip from '../../components/train/Strip.jsx';
import ErrorBox from '../../components/shared/ErrorBox.jsx';
import Icon from '../../components/shared/Icon.jsx';
import Loading from '../../components/shared/Loading.jsx';
import More from '../../components/shared/More.jsx';
import ScrollArea from '../../components/shared/ScrollArea.jsx';
import Sect from '../../components/shared/Sect.jsx';

/** Candado de "parte de Premium" para el plan Gratuito. */
const LockTag = () => <span className="lk"><Icon n="lock" /></span>;

export default function Home() {
  const nav = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const { me } = useAuth();
  const [report, setReport] = useState(null);
  const t = today();
  const y = add(t, -1);
  // Los lunes, "ayer" está en la semana anterior.
  const lastWeek = dow(t) === 0 ? add(monday(t), -7) : null;

  const td = useFetch(fetchToday, undefined, s => s.workouts.today);
  const week = useFetch(fetchWeek, undefined, s => getEntry(s.workouts.weeks, ''));
  const prevWeek = useFetch(fetchWeek, lastWeek, s => getEntry(s.workouts.weeks, lastWeek || ''), { skip: !lastWeek });
  const meals = useFetch(fetchMealDay, t, s => getEntry(s.meals.days, t));
  const habits = useFetch(fetchHabits, t, s => getEntry(s.habits.days, t));
  const progress = useFetch(fetchProgress, undefined, s => s.progress.summary);

  const all = [td, week, meals, habits, progress, ...(lastWeek ? [prevWeek] : [])];
  const failed = all.find(x => x.error && !x.data);
  if (failed) return <div className="screen"><ScrollArea><ErrorBox error={failed.error} onRetry={() => all.forEach(x => x.retry())} /></ScrollArea></div>;
  if (all.some(x => !x.data)) return <Loading />;

  const ydays = (lastWeek ? prevWeek.data : week.data).days;
  const yday = ydays.find(d => d.date === y);
  const missed = yday && yday.session && yday.session.status === 'MISSED' ? yday.session : null;

  const s = td.data.session;
  const next = td.data.next;
  let ent;
  if (!s) ent = { t: 'Día de descanso', m: next[0] ? `Próxima: ${DAYF[dow(next[0].date)]} ${dayNum(next[0].date)}` : 'Sumá una caminata si querés', v: 0, lab: '☀️' };
  else if (s.status === 'DONE') ent = { t: s.title, m: '¡Hecho! 💪', v: 100, lab: '3/3' };
  else if (s.status === 'MOVED') ent = { t: `Pasó al ${DAYF[dow(s.movedTo)]} ${dayNum(s.movedTo)}`, m: 'Hoy descansá', v: 0, lab: '—' };
  else { const n = s.content ? s.content.blocks.length : 3, bd = blocksDone(s); ent = { t: s.title, m: `${s.minutes} min · ${bd} de ${n} bloques`, v: Math.round(bd / n * 100), lab: `${bd}/${n}` }; }

  const dayMeals = meals.data.meals;
  const eatenN = dayMeals.filter(m => m.status === 'EATEN' || m.status === 'ALTERNATIVE').length;
  const nextMeal = dayMeals.find(m => m.status === 'PENDING');
  const h = habits.data;
  const hb = [h.water, h.walk, h.sleep].filter(Boolean).length;
  const toggle = k => dispatch(saveHabits({ date: t, water: h.water, walk: h.walk, sleep: h.sleep, [k]: !h[k] }));
  const sug = progress.data.suggestion;
  const pending = me.preferences.pendingChanges.length > 0;
  const prem = isPremium(me);
  const w = week.data;

  return <div className="screen"><ScrollArea>
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
    <Habits value={h} onToggle={toggle} />

    <Sect title="Tu semana" right={<More onClick={() => nav('/progreso')}>Ver progreso</More>} />
    <div className="card"><Strip days={w.days} />
      <div className="small mt12" style={{ fontWeight: 700, color: 'var(--green-d)' }}>{w.total ? `Vas ${w.done} de ${w.total} entrenamientos esta semana` : 'Tu semana arranca pronto'}</div></div>

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
    {report && <ReportSheet session={report} onClose={() => setReport(null)} />}
  </ScrollArea></div>;
}
