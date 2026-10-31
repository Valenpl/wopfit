import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPlan } from '../../redux/slices/planSlice';
import useAuth from '../../hooks/useAuth';
import { BUDGET } from '../../utils/constants';
import Icon from '../../components/shared/Icon.jsx';
import Loading from '../../components/shared/Loading.jsx';
import ExpertTips from '../../components/shared/ExpertTips.jsx';
import Note from '../../components/shared/Note.jsx';
import Screen from '../../components/shared/Screen.jsx';

/** "¡Tu plan está listo!" (registro) o "¡Tu plan se actualizó!" (con state.upd). */
export default function Ready() {
  const { me } = useAuth();
  const dispatch = useDispatch();
  const { state } = useLocation();
  const nav = useNavigate();
  const upd = state && state.upd;
  const plan = me.plan;
  const p = me.preferences;
  // Preferencias guardadas pero sin plan (por ejemplo, se recargó la página a mitad de camino): se crea una sola vez.
  // createPlan tiene `condition`, así que el doble efecto de StrictMode no manda dos POST.
  useEffect(() => { if (!plan) dispatch(createPlan()); }, [plan, dispatch]);
  if (!plan) return <Loading text="Armando tu plan…" />;
  return <Screen narrow scrollStyle={{ paddingTop: 'calc(var(--sat) + 40px)' }}
    foot={<button className="btn" onClick={() => nav(upd ? '/entreno' : '/inicio', { replace: true })}>{upd ? 'Ver mi plan' : 'Empezar mi plan'}</button>}>
    <div className="bigicon g pop"><Icon n="check" /></div>
    <h1 className="center">{upd ? '¡Tu plan se actualizó!' : '¡Tu plan está listo!'}</h1>
    <p className="sub center">{upd ? 'Lo reacomodamos con tus cambios. Tu progreso se mantiene.' : 'Lo armamos con lo que nos contaste. Lo podés ajustar cuando quieras.'}</p>
    {upd && (state.changes && state.changes.length
      ? <div className="card"><h3>Qué cambió</h3><div className="mt8">{state.changes.map(c => <div className="diff" key={c.label}><span className="tiny muted" style={{ fontWeight: 800 }}>{c.label}</span><s>{c.before}</s><b>{c.after}</b></div>)}</div></div>
      : <Note tone="blue">No había cambios pendientes: tu plan ya estaba al día.</Note>)}
    <div className="chips mt12" style={{ justifyContent: 'center' }}>
      <span className="pill"><Icon n="cal" />{plan.days.length} días / sem</span><span className="pill"><Icon n="clock" />{plan.minutes} min</span>
      <span className="pill"><Icon n="cash" />Presupuesto {BUDGET[p.budget].t.toLowerCase()}</span>
    </div>
    <div className="card mt16"><div className="row"><div className="tile"><Icon n="dumb" /></div><div className="grow"><h3>Tu entrenamiento</h3><div className="small muted">{plan.trainingSummary}</div></div></div></div>
    <div className="card"><div className="row"><div className="tile p"><Icon n="fork" /></div><div className="grow"><h3>Tu alimentación</h3><div className="small muted">{plan.foodSummary}</div></div></div></div>
    {plan.healthNotes.length > 0 && <div className="card"><div className="row"><div className="tile"><Icon n="shield" /></div><div className="grow"><h3>Tu salud</h3><div className="small muted">{plan.healthNotes.join(' ')}</div></div></div></div>}
    <ExpertTips tips={plan.tips} />
    {!upd && <Note icon="heart" className="mt16">Si algún día no podés, avisanos y lo reacomodamos.</Note>}
  </Screen>;
}
