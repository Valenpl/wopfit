import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { setMe, updatePreferences } from '../../redux/slices/authSlice';
import { setupPlan } from '../../redux/slices/planSlice';
import { setPrefsDraft } from '../../redux/slices/uiSlice';
import useAuth from '../../hooks/useAuth';
import useBack from '../../hooks/useBack';
import useRequest from '../../hooks/useRequest';
import useToast from '../../hooks/useToast';
import { ACTS, AVOID, BUDGET, EQUIP, GOALS, HEALTH, LEVELS } from '../../utils/constants';
import { DAYF, DAYL } from '../../utils/dates';
import Btn from '../../components/shared/Btn.jsx';
import Icon from '../../components/shared/Icon.jsx';
import Note from '../../components/shared/Note.jsx';
import Screen from '../../components/shared/Screen.jsx';
import Sect from '../../components/shared/Sect.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

// Preferencias en 3 pasos. En el registro, el borrador queda en el store para no perderlo al ir y volver entre pasos.
const fromMe = p => (p ? { goals: p.goals, days: p.days, minutes: p.minutes, budget: p.budget, activities: p.activities, avoid: p.avoid, otherAvoid: p.otherAvoid || '', health: p.health, level: p.level, equipment: p.equipment }
  : { goals: [], days: [0, 2, 4], minutes: 30, budget: 'medio', activities: [], avoid: [], otherAvoid: '', health: [], level: 'principiante', equipment: ['nada'] });

export default function Prefs({ edit }) {
  const { me } = useAuth();
  const nav = useNavigate();
  const dispatch = useDispatch();
  const back = useBack('/perfil');
  const toast = useToast();
  const step = Math.min(3, Math.max(1, +useParams().step || 1));
  const draft = useSelector(s => s.ui.prefsDraft);
  const [d, setD] = useState(() => {
    if (!edit && draft) return draft;
    return fromMe(me.preferences);
  });
  useEffect(() => { if (!edit) dispatch(setPrefsDraft(d)); }, [d, edit, dispatch]);

  const save = useRequest(updatePreferences, {
    onSuccess: m => { toast(m.preferences.pendingChanges.length ? 'Guardado. Actualizá tu plan para ver los cambios.' : 'Guardado'); back(); }
  });
  const setup = useRequest(setupPlan, {
    // Navegar y guardar el usuario juntos: si el usuario con plan llegara antes, esta ruta (solo para 'prefs') redirigiría al inicio.
    onSuccess: r => {
      dispatch(setPrefsDraft(null));
      nav('/plan-listo', { replace: true, state: { fresh: true, changes: r.changes } });
      dispatch(setMe(r.me));
    }
  });
  const busy = save.busy || setup.busy || setup.status === 'succeeded';

  const tgl = (k, v) => setD(x => ({ ...x, [k]: x[k].includes(v) ? x[k].filter(y => y !== v) : [...x[k], v] }));
  const tglEquip = v => setD(x => {
    if (v === 'nada') return { ...x, equipment: ['nada'] };
    const e = x.equipment.filter(y => y !== 'nada');
    const n = e.includes(v) ? e.filter(y => y !== v) : [...e, v];
    return { ...x, equipment: n.length ? n : ['nada'] };
  });
  const canNext = step === 1 ? d.goals.length > 0 : step === 2 ? d.days.length > 0 : true;

  const next = () => {
    if (!canNext || busy) return;
    if (edit) save.run(d);
    else if (step < 3) nav(`/preferencias/${step + 1}`);
    else setup.run(d);
  };

  const head = edit ? <TopBar fallback="/perfil" />
    : <>{step > 1 ? <TopBar fallback={`/preferencias/${step - 1}`} right={<span className="steplabel">Paso {step} de 3</span>} />
      : <div className="top"><span /><span className="steplabel">Paso 1 de 3</span></div>}<div className="progress"><i style={{ width: `${step * 33.4}%` }} /></div></>;
  const label = edit ? 'Guardar' : step < 3 ? <>Siguiente <Icon n="arrow" /></> : <>Generar mi plan <Icon n="spark" /></>;
  const pc = (d.minutes - 10) / 80 * 100;

  return <Screen narrow foot={<Btn onClick={next} busy={busy} disabled={!canNext}>{label}</Btn>}>
    {head}
    {step === 1 && <>
      <h1>¿Qué querés lograr?</h1><p className="sub">Elegí uno o más objetivos para armar tu plan a medida.</p>
      <div className="stack">{GOALS.map(g => <button key={g.k} className={`opt ${d.goals.includes(g.k) ? 'on' : ''}`} onClick={() => tgl('goals', g.k)} aria-pressed={d.goals.includes(g.k)}>
        <div className={`tile ${g.p ? 'p' : ''}`}><Icon n={g.i} /></div><div className="grow"><div className="t">{g.t}</div><div className="d">{g.d}</div></div><span className="ck"><Icon n="check" /></span></button>)}</div>
      <Note icon="spark" className="mt16">Podés cambiar o sumar nuevos objetivos cuando quieras desde tu perfil.</Note>
    </>}
    {step === 2 && <>
      <h1>Tiempo y presupuesto</h1><p className="sub">Adaptamos el entrenamiento y la nutrición a tu rutina real.</p>
      <div className="card"><h3>¿Cuánto tiempo tenés?</h3><p className="small muted" style={{ margin: '4px 0 14px' }}>Elegí qué días querés entrenar y la duración por sesión.</p>
        <div className="lbl">Días disponibles</div>
        <div className="days">{DAYL.map((l, i) => <button key={i} className={`day ${d.days.includes(i) ? 'on' : ''}`} onClick={() => tgl('days', i)} aria-label={DAYF[i]} aria-pressed={d.days.includes(i)}>{l}</button>)}</div>
        <div className="row between small" style={{ flexWrap: 'wrap' }}><span className="tag">Con 2 días ya suma</span><b className="muted">{d.days.length} {d.days.length === 1 ? 'día seleccionado' : 'días seleccionados'}</b></div>
        <div className="row between mt20"><div className="lbl">Duración</div><span className="pill">{d.minutes} min / día</span></div>
        <input type="range" min="10" max="90" step="5" value={d.minutes} style={{ '--p': `${pc}%` }} aria-label="Duración en minutos" onChange={e => setD({ ...d, minutes: +e.target.value })} />
        <div className="scale"><span>10 min</span><span>45 min</span><span>90 min</span></div>
      </div>
      <div className="card"><h3>¿Cuánto podés gastar por semana en comida?</h3><p className="small muted" style={{ margin: '4px 0 12px' }}>Armamos tu menú ajustado a tus posibilidades.</p>
        <div className="stack">{Object.entries(BUDGET).map(([k, b]) => <button key={k} className={`opt ${d.budget === k ? 'on' : ''}`} onClick={() => setD({ ...d, budget: k })}>
          <span className="radio" /><div className="grow"><div className="row between"><span className="t">{b.t}</span>{b.tag && <span className={`tag ${k === 'alto' ? 'blue' : ''}`}>{b.tag}</span>}</div>
            <div className="small" style={{ color: 'var(--navy)', fontWeight: 700 }}>{b.r}/semana</div></div></button>)}</div>
      </div>
    </>}
    {step === 3 && <>
      <h1>Afinemos tus preferencias</h1><p className="sub">Con esto armamos tu rutina para que entrenar sea un hábito que disfrutes.</p>
      <Sect title="Actividades que te gustan" right={<span className="tag blue">Elegí varias</span>} />
      <div className="chips">{ACTS.map(a => <button key={a.k} className={`chip ${d.activities.includes(a.k) ? 'on' : ''}`} onClick={() => tgl('activities', a.k)}><Icon n={a.i} />{a.t}</button>)}</div>
      <Sect title="Alimentos que evitás" right={<span className="tag peach">Nutrición</span>} />
      <div className="chips">{AVOID.map(a => <button key={a.k} className={`chip ${d.avoid.includes(a.k) ? 'on' : ''}`} onClick={() => tgl('avoid', a.k)}>{a.t}</button>)}</div>
      <div className="inp mt12"><input placeholder="Otro: ej. frutos secos" maxLength={80} value={d.otherAvoid} onChange={e => setD({ ...d, otherAvoid: e.target.value })} aria-label="Otro alimento que evitás" /></div>
      {d.avoid.includes('tacc') && <Note tone="blue" className="mt12">Sacamos el trigo, la avena, la cebada y el centeno de tu plan. Igual revisá que los productos tengan el logo <b>Sin TACC</b>.</Note>}
      <Sect title="¿Tenés alguna condición de salud?" right={<span className="tag">Opcional</span>} />
      <div className="chips">{HEALTH.map(h => <button key={h.k} className={`chip ${d.health.includes(h.k) ? 'on' : ''}`} onClick={() => tgl('health', h.k)}>{h.t}</button>)}</div>
      <Note icon="shield" className="mt12">WopFit no reemplaza a un profesional de la salud. Si tenés una condición, consultá antes de empezar.</Note>
      <Sect title="Tu nivel" right={<span className="tag blue">Una opción</span>} />
      <div className="stack">{LEVELS.map(l => <button key={l.k} className={`opt ${d.level === l.k ? 'on' : ''}`} onClick={() => setD({ ...d, level: l.k })}><span className="radio" /><div className="grow"><div className="t">{l.t}</div><div className="d">{l.d}</div></div></button>)}</div>
      <Sect title="¿Qué equipamiento tenés?" right={<span className="tag">En casa o gym</span>} />
      <div className="stack">{EQUIP.map(e => <button key={e.k} className={`opt ${d.equipment.includes(e.k) ? 'on' : ''}`} onClick={() => tglEquip(e.k)}><span className="ck box"><Icon n="check" /></span><div className="t grow">{e.t}</div></button>)}</div>
    </>}
  </Screen>;
}
