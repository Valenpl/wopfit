import { Navigate, Route, Routes } from 'react-router-dom';
import Login from '../views/auth/Login.jsx';
import Signup from '../views/auth/Signup.jsx';
import Verify from '../views/auth/Verify.jsx';
import Welcome from '../views/auth/Welcome.jsx';
import About from '../views/setup/About.jsx';
import Prefs from '../views/setup/Prefs.jsx';
import Ready from '../views/setup/Ready.jsx';
import Updating from '../views/setup/Updating.jsx';
import Home from '../views/home/Home.jsx';
import Entreno from '../views/train/Entreno.jsx';
import Workout from '../views/train/Workout.jsx';
import Done from '../views/train/Done.jsx';
import Proposal from '../views/train/Proposal.jsx';
import Comida from '../views/food/Comida.jsx';
import MealDetail from '../views/food/MealDetail.jsx';
import MealProposal from '../views/food/MealProposal.jsx';
import Progress from '../views/progress/Progress.jsx';
import Adjust from '../views/progress/Adjust.jsx';
import Goals from '../views/progress/Goals.jsx';
import NewGoal from '../views/progress/NewGoal.jsx';
import History from '../views/progress/History.jsx';
import Profile from '../views/profile/Profile.jsx';
import Cuenta from '../views/profile/Cuenta.jsx';
import Planes from '../views/premium/Planes.jsx';
import YaPremium from '../views/premium/YaPremium.jsx';
import Cerca from '../views/places/Cerca.jsx';
import Ofertas from '../views/places/Ofertas.jsx';
import Pros from '../views/pros/Pros.jsx';
import Pro from '../views/pros/Pro.jsx';
import ProConf from '../views/pros/ProConf.jsx';
import Wopi from '../views/wopi/Wopi.jsx';
import Comunidad from '../views/community/Comunidad.jsx';
import Publicacion from '../views/community/Publicacion.jsx';
import Compartir from '../views/community/Compartir.jsx';
import Soon from '../views/install/Soon.jsx';

/** A dónde va cada etapa de la cuenta (authSlice.selectStage). */
export const HOME_OF = { out: '/', about: '/sobre-vos', prefs: '/preferencias/1', ready: '/plan-listo', app: '/inicio' };

/** Todas las rutas. Cada una dice en qué etapas se puede entrar; si no, redirige a la pantalla de la etapa actual. */
export default function AppRoutes({ stage }) {
  const only = (allowed, el) => (allowed.includes(stage) ? el : <Navigate to={HOME_OF[stage]} replace />);
  const app = el => only(['app'], el);
  return <Routes>
    <Route path="/" element={only(['out'], <Welcome />)} />
    <Route path="/registro" element={only(['out'], <Signup />)} />
    <Route path="/verificar" element={only(['out'], <Verify />)} />
    <Route path="/ingresar" element={only(['out'], <Login />)} />
    <Route path="/sobre-vos" element={only(['about'], <About />)} />
    <Route path="/preferencias/:step" element={only(['prefs'], <Prefs />)} />
    <Route path="/plan-listo" element={only(['ready', 'app'], <Ready />)} />
    <Route path="/inicio" element={app(<Home />)} />
    <Route path="/entreno" element={app(<Entreno />)} />
    <Route path="/entreno/:id" element={app(<Workout />)} />
    <Route path="/entreno/:id/hecho" element={app(<Done />)} />
    <Route path="/entreno/:id/propuesta" element={app(<Proposal />)} />
    <Route path="/comida" element={app(<Comida />)} />
    <Route path="/comida/:date/:slot" element={app(<MealDetail />)} />
    <Route path="/comida/:date/:slot/propuesta" element={app(<MealProposal />)} />
    <Route path="/progreso" element={app(<Progress />)} />
    <Route path="/ajuste" element={app(<Adjust />)} />
    <Route path="/metas" element={app(<Goals />)} />
    <Route path="/metas/nueva" element={app(<NewGoal />)} />
    <Route path="/historial" element={app(<History />)} />
    <Route path="/perfil" element={app(<Profile />)} />
    <Route path="/perfil/datos" element={app(<About edit />)} />
    <Route path="/perfil/cuenta" element={app(<Cuenta />)} />
    <Route path="/perfil/preferencias/:step" element={app(<Prefs edit />)} />
    <Route path="/planes" element={app(<Planes />)} />
    <Route path="/premium" element={app(<YaPremium />)} />
    <Route path="/ofertas" element={app(<Ofertas />)} />
    <Route path="/cerca" element={app(<Cerca />)} />
    <Route path="/wopi" element={app(<Wopi />)} />
    <Route path="/comunidad" element={app(<Comunidad />)} />
    <Route path="/comunidad/compartir" element={app(<Compartir />)} />
    <Route path="/comunidad/:id" element={app(<Publicacion />)} />
    <Route path="/profesionales" element={app(<Pros />)} />
    <Route path="/profesionales/confirmada" element={app(<ProConf />)} />
    <Route path="/profesionales/:id" element={app(<Pro />)} />
    <Route path="/actualizando" element={app(<Updating />)} />
    <Route path="/instalar" element={app(<Soon />)} />
    <Route path="*" element={<Navigate to={HOME_OF[stage]} replace />} />
  </Routes>;
}
