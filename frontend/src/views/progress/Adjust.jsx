import { useNavigate } from 'react-router-dom';
import { dismissSuggestion, fetchProgress, growPlan, lightenPlan } from '../../redux/slices/progressSlice';
import useFetch from '../../hooks/useFetch';
import useRequest from '../../hooks/useRequest';
import { longDay } from '../../utils/dates';
import { cap } from '../../utils/format';
import Btn from '../../components/shared/Btn.jsx';
import ErrorBox from '../../components/shared/ErrorBox.jsx';
import Icon from '../../components/shared/Icon.jsx';
import Loading from '../../components/shared/Loading.jsx';
import Note from '../../components/shared/Note.jsx';
import Screen from '../../components/shared/Screen.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

const WHY = { tiempo: 'Lo que más se repite es la falta de tiempo.', cansada: 'Venís con poca energía.', dolor: 'Nos contaste que te dolía algo.', equipo: 'No siempre tenés el equipamiento a mano.', otro: 'Se te vienen cruzando cosas.' };

/** Propuesta de ajuste: hacer el plan más liviano o subirlo un escalón. El plan nuevo lo guarda authSlice (me.plan). */
export default function Adjust() {
  const nav = useNavigate();
  const { data: p, error, retry } = useFetch(fetchProgress, undefined, s => s.progress.summary);
  const toEntreno = { onSuccess: () => nav('/entreno', { replace: true }) };
  const lighten = useRequest(lightenPlan, toEntreno);
  const grow = useRequest(growPlan, toEntreno);
  const dismiss = useRequest(dismissSuggestion, { onSuccess: () => nav(-1) });
  if (error && !p) return <Screen><TopBar /><ErrorBox error={error} onRetry={retry} /></Screen>;
  if (!p) return <Loading />;
  const s = p.suggestion;
  if (!s) return <Screen narrow foot={<button className="btn" onClick={() => nav('/inicio', { replace: true })}>Volver al inicio</button>}><TopBar />
    <div className="bigicon pop"><Icon n="check" /></div><h1 className="center">Tu plan está al día</h1><p className="sub center">Por ahora no hay ajustes para proponerte. Seguí a tu ritmo.</p></Screen>;
  const up = s.type === 'GROW';
  const yes = up ? grow : lighten;
  const busy = yes.busy || dismiss.busy;
  const counts = {}; s.struggles.forEach(x => { counts[x.reason] = (counts[x.reason] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return <Screen narrow foot={<><Btn busy={yes.busy} disabled={busy} onClick={() => yes.run()}>{up ? 'Sí, ajustar mi plan' : 'Sí, hacerlo más liviano'}</Btn>
    <button className="btn ghost" disabled={busy} onClick={() => dismiss.run(s.type)}>{up ? 'Mantenerlo como está' : 'Lo dejo como está'}</button></>}>
    <TopBar />
    <div className={`bigicon pop ${up ? 'b' : ''}`}><Icon n={up ? 'trend' : 'heart'} /></div>
    <h1 className="center">{up ? 'Tu plan puede crecer' : 'Hagamos tu plan más liviano'}</h1>
    <p className="sub center">{up ? `Cumpliste todo durante ${p.weeksStreak} ${p.weeksStreak === 1 ? 'semana' : 'semanas seguidas'}. Vas muy bien.` : `Esta semana se te complicaron ${s.struggles.length} sesiones. ${top ? WHY[top[0]] || '' : ''}`}</p>
    {!up && <div className="card"><h3>Lo que nos contaste</h3><div className="mt8">{s.struggles.map(x => <div className="hist" key={x.date}><span className="circ" /><div className="grow"><div className="t">{cap(longDay(x.date))}</div><div className="d">{x.reasonLabel}</div></div></div>)}</div></div>}
    <div className="card"><h3>Lo que te proponemos</h3><div className="row between mt12"><span className="muted">{s.field === 'minutes' ? 'Duración' : 'Nivel'}</span><span className="arrowv"><s>{s.from}</s><Icon n="arrow" />{s.to}</span></div>
      <p className="small muted mt12" style={{ marginBottom: 0 }}>{up ? 'Mismos días, equipamiento y presupuesto.' : 'Cuando te acomodes, lo volvemos a subir.'}</p></div>
    <Note icon="shield" className="mt12">Tu racha y tu historial se mantienen.</Note>
  </Screen>;
}
