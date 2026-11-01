import { Navigate, useLocation } from 'react-router-dom';
import Confirmed from './Confirmed.jsx';

/** ¡Consulta confirmada! La reserva llega en el state de la navegación. */
export default function ProConf() {
  const { state } = useLocation();
  if (!state || !state.consult) return <Navigate to="/profesionales" replace />;
  return <Confirmed c={state.consult} left={state.left} />;
}
