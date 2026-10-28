import { useEffect, useMemo } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import useToast from '../../hooks/useToast';
import { consultIcs } from '../../utils/calendar';
import { DAYF, dayNum, dow, monthName } from '../../utils/dates';
import { cap } from '../../utils/format';
import Avatar from '../../components/pros/Avatar.jsx';
import Icon from '../../components/shared/Icon.jsx';
import Note from '../../components/shared/Note.jsx';
import Screen from '../../components/shared/Screen.jsx';
import { leftTxt } from './prosText';

/** ¡Consulta confirmada! La reserva llega en el state de la navegación. */
export default function ProConf() {
  const { state } = useLocation();
  if (!state || !state.consult) return <Navigate to="/profesionales" replace />;
  return <Confirmed c={state.consult} left={state.left} />;
}

function Confirmed({ c, left }) {
  const nav = useNavigate();
  const toast = useToast();
  // El .ics se descarga con un <a download> que dibuja React; la URL del archivo se libera al salir.
  const ics = useMemo(() => URL.createObjectURL(new Blob([consultIcs(c)], { type: 'text/calendar' })), [c]);
  useEffect(() => () => URL.revokeObjectURL(ics), [ics]);
  return <Screen narrow scrollStyle={{ paddingTop: 'calc(var(--sat) + 40px)' }}
    foot={<><a className="btn" href={ics} download="consulta-wopfit.ics" onClick={() => toast('Agregado a tu calendario 📅')}><Icon n="cal" /> Agregar al calendario</a>
      <button className="btn ghost" onClick={() => nav('/inicio', { replace: true })}>Volver al inicio</button></>}>
    <div className="bigicon g pop"><Icon n="check" /></div>
    <h1 className="center">¡Consulta confirmada!</h1><p className="sub center">Te avisamos 1 hora antes.</p>
    <div className="card"><div className="row"><Avatar n={c.proName} size={48} /><div className="grow"><b style={{ color: 'var(--navy)' }}>{c.proName}</b><div className="tiny muted">{c.specialty}</div></div></div>
      <div className="diff mt8"><span className="tiny muted" style={{ fontWeight: 800 }}>Cuándo</span><b>{cap(DAYF[dow(c.date)])} {dayNum(c.date)} de {monthName(c.date)} · {c.time}</b></div>
      <div className="diff"><span className="tiny muted" style={{ fontWeight: 800 }}>Modalidad</span><b>{c.mode}</b></div></div>
    <Note icon="star" className="mt12">Te {leftTxt(left)} este mes.</Note>
  </Screen>;
}
