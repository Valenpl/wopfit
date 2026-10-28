import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchMe, selectReady, selectStage } from './redux/slices/authSlice';
import { selectDesk, setView } from './redux/slices/uiSlice';
import useKeyboard from './hooks/useKeyboard';
import useWideScreen from './hooks/useWideScreen';
import { isPremium } from './utils/format';
import AppRoutes from './routes/AppRoutes.jsx';
import TabBar, { TABS } from './components/layout/TabBar.jsx';
import Loading from './components/shared/Loading.jsx';
import Toaster from './components/shared/Toaster.jsx';

export default function App() {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const me = useSelector(s => s.auth.me);
  const ready = useSelector(selectReady);
  const stage = useSelector(selectStage);
  const desk = useSelector(selectDesk);
  const kb = useKeyboard();
  useWideScreen();
  // Con token guardado, se pide el usuario una vez (fetchMe tiene `condition`: sin token o ya cargado no sale).
  useEffect(() => { dispatch(fetchMe()); }, [dispatch]);

  const showTabs = stage === 'app' && pathname !== '/plan-listo' && pathname !== '/actualizando';
  const isTab = TABS.some(([to]) => pathname === to);
  // La vista compu y el teclado abierto se marcan con clases en #app; el tamaño visible con style.
  const cls = [desk && 'desk', kb.open && 'kb'].filter(Boolean).join(' ');

  return <div id="app" className={cls} style={kb.style}>
    <div className="phone">
      <div className="stage">{ready ? <AppRoutes stage={stage} /> : <Loading />}</div>
      {showTabs && <TabBar path={pathname} sub={!isTab} premium={isPremium(me)} onGo={to => nav(to)} onCelu={() => dispatch(setView('celu'))} />}
      <Toaster />
    </div>
  </div>;
}
