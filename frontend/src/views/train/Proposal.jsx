import { useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { acceptAlternative, restWorkout } from '../../redux/slices/workoutSlice';
import useRequest from '../../hooks/useRequest';
import { DAYF, dayNum, dow } from '../../utils/dates';
import Btn from '../../components/shared/Btn.jsx';
import Icon from '../../components/shared/Icon.jsx';
import Note from '../../components/shared/Note.jsx';
import Screen from '../../components/shared/Screen.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

/** "Te proponemos esto": la alternativa que armó el backend después de "¿Qué pasó?". Llega en el state de la navegación. */
export default function Proposal() {
  const { state } = useLocation();
  if (!state || !state.proposal) return <Navigate to="/entreno" replace />;
  return <ProposalBody proposal={state.proposal} reason={state.reason} />;
}

function ProposalBody({ proposal: pr, reason }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [pick, setPick] = useState(pr.kind);
  const accept = useRequest(acceptAlternative, { onSuccess: () => nav(`/entreno/${id}`, { replace: true }) });
  const rest = useRequest(restWorkout, { onSuccess: () => nav('/entreno', { replace: true }) });
  const busy = accept.busy || rest.busy;
  const a = pr.alternative;
  return <Screen narrow foot={<><Btn busy={accept.busy} disabled={busy} onClick={() => accept.run({ id, kind: pick })}>Dale, hago esto</Btn>
    <button className="btn ghost" disabled={busy} onClick={() => rest.run(id)}>Hoy descanso</button></>}>
    <TopBar fallback="/entreno" />
    <h1>Te proponemos esto</h1><p className="sub">{pr.text}</p>
    <button className={`card opt ${pick === pr.kind ? 'on' : ''}`} style={{ display: 'block', padding: 16 }} onClick={() => setPick(pr.kind)}>
      <div className="row between"><div className="tile g"><Icon n="clock" /></div><span className="tag">{a.minutes} min</span></div>
      <h3 style={{ fontSize: 19, marginTop: 12 }}>{a.title}</h3><div className="small muted" style={{ margin: '4px 0 10px' }}>{a.description}</div>
      <div className="chips">{a.chips.map(c => <span key={c} className="tag">{c}</span>)}</div></button>
    <Note icon="cal" className="mt12">La rutina completa pasa al {DAYF[dow(pr.nextDate)]} {dayNum(pr.nextDate)}, que tenías libre.</Note>
    {reason !== 'dolor' && pr.kind !== 'walk' && <button className={`opt mt12 ${pick === 'walk' ? 'on' : ''}`} onClick={() => setPick('walk')}><div className="tile sm"><Icon n="walk" /></div><span className="t grow">O una caminata de 15 min</span><span className="radio" /></button>}
    {reason === 'dolor' && <Note tone="peach" icon="heart" className="mt12">Si el dolor sigue, consultá con un profesional de la salud.</Note>}
  </Screen>;
}
