import Icon from '../shared/Icon.jsx';

export const TABS = [['/inicio', 'Inicio', 'home'], ['/entreno', 'Entreno', 'dumb'], ['/comida', 'Comida', 'fork'], ['/comunidad', 'Comunidad', 'users'], ['/perfil', 'Perfil', 'user']];

/** Barra de pestañas (abajo en el celu, a la izquierda en la compu). `sub`: estás en una pantalla interna. */
export default function TabBar({ path, sub, premium, onGo, onCelu }) {
  return <nav className={`tabbar ${sub ? 'sub' : ''}`} aria-label="Secciones">
    <div className="sbrand"><img src="/logo.webp" alt="" /><b>Wop<i>Fit</i></b></div>
    {TABS.map(([to, t, i]) => {
      const on = path === to || path.startsWith(to + '/');
      return <button key={to} className={on ? 'on' : ''} aria-current={on ? 'page' : undefined} onClick={() => onGo(to)}><Icon n={i} /><span>{t}</span></button>;
    })}
    <div className="sfoot">
      <button className="swopi" onClick={() => onGo('/wopi')}><span className="wopiav" style={{ width: 34, height: 34 }}><img src="/wopi.webp" alt="" /></span><span>Preguntale a Wopi</span></button>
      {premium ? <div className="sprem">★ Premium</div> : <button className="sprem up" onClick={() => onGo('/planes')}><Icon n="star" /><span>Pasate a Premium</span></button>}
      <button className="sview" onClick={onCelu}><Icon n="phone" /><span>Ver versión celu</span></button>
    </div>
  </nav>;
}
