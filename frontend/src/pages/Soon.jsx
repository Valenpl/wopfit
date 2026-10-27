import { useLocation } from 'react-router-dom';
import { Note, Screen, TopBar } from '../ui.jsx';

// Secciones de la v6 que todavía no están conectadas al backend. Cada una se reemplaza por su pantalla real.
const SOON = {
  '/comunidad': ['Comunidad', 'Gente como vos, con tus mismos objetivos.', true],
  '/instalar': ['Instalá WopFit', 'Queda en tu pantalla de inicio como una app.']
};

export default function Soon() {
  const { pathname } = useLocation();
  const [title, sub, tab] = SOON[pathname] || ['Muy pronto', ''];
  return <Screen>
    {!tab && <TopBar />}
    <h1 style={tab ? { marginTop: 4 } : undefined}>{title}</h1><p className="sub">{sub}</p>
    <div className="center mt16"><img src="/wopi.webp" alt="" className="wopi" style={{ width: 140 }} /></div>
    <Note tone="blue" className="mt16">Estamos armando esta sección. Muy pronto la vas a poder usar acá.</Note>
  </Screen>;
}
