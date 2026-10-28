import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { acceptMeal, skipMeal } from '../../redux/slices/mealSlice';
import useRequest from '../../hooks/useRequest';
import { MEAL_BG } from '../../utils/constants';
import { money } from '../../utils/format';
import Btn from '../../components/shared/Btn.jsx';
import Note from '../../components/shared/Note.jsx';
import Screen from '../../components/shared/Screen.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

/** "Te proponemos esto" para una comida. La propuesta llega en el state de la navegación. */
export default function MealProposal() {
  const { date, slot } = useParams();
  const { state } = useLocation();
  const nav = useNavigate();
  const accept = useRequest(acceptMeal, { onSuccess: () => nav(`/comida/${date}/${slot}`, { replace: true }) });
  const skip = useRequest(skipMeal, { onSuccess: () => nav('/comida', { replace: true }) });
  if (!state || !state.proposal) return <Navigate to={`/comida/${date}/${slot}`} replace />;
  const busy = accept.busy || skip.busy;
  const { text, current, alternative: a } = state.proposal;
  const saving = current.price - a.price;
  return <Screen narrow foot={<><Btn busy={accept.busy} disabled={busy} onClick={() => accept.run({ date, slot, name: a.name })}>Dale, hago esto</Btn>
    <button className="btn ghost" disabled={busy} onClick={() => skip.run({ date, slot })}>Lo dejo así por hoy</button></>}>
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
