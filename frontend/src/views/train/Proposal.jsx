import { Navigate, useLocation } from 'react-router-dom';
import ProposalBody from './ProposalBody.jsx';

/** "Te proponemos esto": la alternativa que armó el backend después de "¿Qué pasó?". Llega en el state de la navegación. */
export default function Proposal() {
  const { state } = useLocation();
  if (!state || !state.proposal) return <Navigate to="/entreno" replace />;
  return <ProposalBody proposal={state.proposal} reason={state.reason} />;
}
