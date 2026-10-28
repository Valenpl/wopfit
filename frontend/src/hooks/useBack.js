import { useNavigate } from 'react-router-dom';

/** Vuelve a la pantalla anterior; si se entró directo a esta, va a `fallback`. */
export default function useBack(fallback = '/') {
  const nav = useNavigate();
  return () => (window.history.state && window.history.state.idx > 0 ? nav(-1) : nav(fallback, { replace: true }));
}
