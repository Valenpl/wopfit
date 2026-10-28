import { useNavigate } from 'react-router-dom';
import Icon from '../../components/shared/Icon.jsx';

export default function Welcome() {
  const nav = useNavigate();
  return <div className="screen"><div className="fit">
    <div className="hero-title">Hábitos que se adaptan<br /><span className="sp">✦</span> <span>a tu vida real</span> <span className="sp">✦</span></div>
    <p className="hero-sub">Tu bienestar también es progreso. Entrenamiento y alimentación adaptados a vos, sin presiones ni culpas.</p>
    <img className="wopi" src="/wopi.webp" alt="Wopi, la mascota de WopFit, saltando feliz" />
    <div className="feat2">
      <div className="feat"><div className="tile sm g"><Icon n="clock" /></div><div><b>A tu ritmo</b><span>Rutinas de 15, 30 o 45 minutos.</span></div></div>
      <div className="feat"><div className="tile sm"><Icon n="heart" /></div><div><b>Cero frustración</b><span>Planes flexibles que no te castigan.</span></div></div>
    </div>
    <button className="btn" onClick={() => nav('/registro')}>Crear cuenta <Icon n="arrow" /></button>
    <div className="footnote" style={{ marginTop: 10 }}>¿Ya tenés una cuenta? <button className="link" onClick={() => nav('/ingresar')}>Ya tengo cuenta</button></div>
  </div></div>;
}
