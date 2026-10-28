import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { setTab } from '../redux/slices/uiSlice';

/**
 * Pestaña elegida en una pantalla con pestañas. Va en la URL (?tab=...), así aguanta una recarga y el botón Atrás,
 * y en el store (ui.tabs), así se recuerda al ir y volver desde la barra. Sin localStorage ni sessionStorage (REGLAS 3.5).
 */
export default function useTab(screen, tabs, fallback) {
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();
  const saved = useSelector(s => s.ui.tabs[screen]);
  const fromUrl = params.get('tab');
  const tab = tabs.includes(fromUrl) ? fromUrl : saved || fallback;
  const pick = k => {
    setParams(p => { p.set('tab', k); return p; }, { replace: true });
    dispatch(setTab({ screen, tab: k }));
  };
  return [tab, pick];
}
