import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from './lib.jsx';
import { Loading, useApp } from './ui.jsx';
import { Login, Signup, Verify, Welcome } from './pages/Auth.jsx';
import { About, Prefs, Ready, Updating } from './pages/Setup.jsx';
import Home from './pages/Home.jsx';
import { Done, Entreno, Proposal, Workout } from './pages/Train.jsx';
import { Comida, Meal, MealProposal } from './pages/Food.jsx';
import { Adjust, Goals, History, NewGoal, Progress } from './pages/Progress.jsx';
import Profile, { Cuenta } from './pages/Profile.jsx';
import Soon from './pages/Soon.jsx';

const TABS = [['/inicio', 'Inicio', 'home'], ['/entreno', 'Entreno', 'dumb'], ['/comida', 'Comida', 'fork'], ['/comunidad', 'Comunidad', 'users'], ['/perfil', 'Perfil', 'user']];

/** En qué etapa está la cuenta: sin sesión, completando datos, o usando la app. */
function stage(me) {
  if (!me) return 'out';
  if (!me.name) return 'about';
  if (!me.preferences) return 'prefs';
  if (!me.plan) return 'ready';
  return 'app';
}

/** Con el teclado abierto en el celu, la app ocupa solo lo visible y esconde la barra de abajo. */
function useKeyboard() {
  const [kb, setKb] = useState(false);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const app = document.getElementById('app');
    const fit = () => {
      if (!app) return;
      const open = vv.height < window.innerHeight - 120;
      setKb(open);
      app.style.height = vv.height + 'px';
      app.style.transform = `translateY(${vv.offsetTop}px)`;
      if (open) {
        const el = document.activeElement;
        if (el && el.scrollIntoView && /INPUT|TEXTAREA/.test(el.tagName)) setTimeout(() => el.scrollIntoView({ block: 'center' }), 50);
      }
    };
    vv.addEventListener('resize', fit);
    vv.addEventListener('scroll', fit);
    fit();
    return () => { vv.removeEventListener('resize', fit); vv.removeEventListener('scroll', fit); };
  }, []);
  return kb;
}

function TabBar({ path, sub }) {
  const nav = useNavigate();
  const { setView } = useApp();
  return <nav className={`tabbar ${sub ? 'sub' : ''}`} aria-label="Secciones">
    <div className="sbrand"><img src="/logo.webp" alt="" /><b>Wop<i>Fit</i></b></div>
    {TABS.map(([to, t, i]) => {
      const on = path === to || path.startsWith(to + '/');
      return <button key={to} className={on ? 'on' : ''} aria-current={on ? 'page' : undefined} onClick={() => nav(to)}><Icon n={i} /><span>{t}</span></button>;
    })}
    <div className="sfoot">
      <button className="swopi" onClick={() => nav('/wopi')}><span className="wopiav" style={{ width: 34, height: 34 }}><img src="/wopi.webp" alt="" /></span><span>Preguntale a Wopi</span></button>
      <button className="sprem up" onClick={() => nav('/planes')}><Icon n="star" /><span>Pasate a Premium</span></button>
      <button className="sview" onClick={() => setView('celu')}><Icon n="phone" /><span>Ver versión celu</span></button>
    </div>
  </nav>;
}

export default function App() {
  const { me, ready, toastMsg } = useApp();
  const loc = useLocation();
  const kb = useKeyboard();
  useEffect(() => { document.querySelector('.scroll')?.scrollTo(0, 0); }, [loc.pathname]);

  const st = stage(me);
  const showTabs = st === 'app' && loc.pathname !== '/plan-listo' && loc.pathname !== '/actualizando';
  const isTab = TABS.some(([to]) => loc.pathname === to);
  const home = { out: '/', about: '/sobre-vos', prefs: '/preferencias/1', ready: '/plan-listo', app: '/inicio' }[st];
  const only = (allowed, el) => (allowed.includes(st) ? el : <Navigate to={home} replace />);

  let content;
  if (!ready) content = <Loading />;
  else content = <Routes>
    <Route path="/" element={only(['out'], <Welcome />)} />
    <Route path="/registro" element={only(['out'], <Signup />)} />
    <Route path="/verificar" element={only(['out'], <Verify />)} />
    <Route path="/ingresar" element={only(['out'], <Login />)} />
    <Route path="/sobre-vos" element={only(['about'], <About />)} />
    <Route path="/preferencias/:step" element={only(['prefs'], <Prefs />)} />
    <Route path="/plan-listo" element={only(['ready', 'app'], <Ready />)} />
    <Route path="/inicio" element={only(['app'], <Home />)} />
    <Route path="/entreno" element={only(['app'], <Entreno />)} />
    <Route path="/entreno/:id" element={only(['app'], <Workout />)} />
    <Route path="/entreno/:id/hecho" element={only(['app'], <Done />)} />
    <Route path="/entreno/:id/propuesta" element={only(['app'], <Proposal />)} />
    <Route path="/comida" element={only(['app'], <Comida />)} />
    <Route path="/comida/:date/:slot" element={only(['app'], <Meal />)} />
    <Route path="/comida/:date/:slot/propuesta" element={only(['app'], <MealProposal />)} />
    <Route path="/progreso" element={only(['app'], <Progress />)} />
    <Route path="/ajuste" element={only(['app'], <Adjust />)} />
    <Route path="/metas" element={only(['app'], <Goals />)} />
    <Route path="/metas/nueva" element={only(['app'], <NewGoal />)} />
    <Route path="/historial" element={only(['app'], <History />)} />
    <Route path="/perfil" element={only(['app'], <Profile />)} />
    <Route path="/perfil/datos" element={only(['app'], <About edit />)} />
    <Route path="/perfil/cuenta" element={only(['app'], <Cuenta />)} />
    <Route path="/perfil/preferencias/:step" element={only(['app'], <Prefs edit />)} />
    <Route path="/actualizando" element={only(['app'], <Updating />)} />
    {['/comunidad', '/wopi', '/ofertas', '/cerca', '/profesionales', '/planes', '/instalar'].map(p => <Route key={p} path={p} element={only(['app'], <Soon />)} />)}
    <Route path="*" element={<Navigate to={home} replace />} />
  </Routes>;

  return <div id="app" className={kb ? 'kb' : ''}>
    <div className="phone">
      <div className="stage">{content}</div>
      {showTabs && <TabBar path={loc.pathname} sub={!isTab} />}
      {toastMsg && <div className="toast" key={toastMsg.id} role="status">{toastMsg.msg}</div>}
    </div>
  </div>;
}
