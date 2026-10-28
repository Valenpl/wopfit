import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectDesk, setView } from '../../redux/slices/uiSlice';
import useAuth from '../../hooks/useAuth';
import { ACTS, AVOID, BUDGET, EQUIP, HEALTH, PRICES, goal } from '../../utils/constants';
import { daysText } from '../../utils/dates';
import { isPremium } from '../../utils/format';
import { isStandalone } from '../../pwa';
import Icon from '../../components/shared/Icon.jsx';
import ScrollArea from '../../components/shared/ScrollArea.jsx';
import Sect from '../../components/shared/Sect.jsx';


export default function Profile() {
  const nav = useNavigate();
  const dispatch = useDispatch();
  const { me, logout } = useAuth();
  const wide = useSelector(s => s.ui.wide);
  const desk = useSelector(selectDesk);
  const p = me.preferences;
  const pr = isPremium(me), P2 = pr ? PRICES[me.subscription.period] : null;
  const avoid = [...AVOID.filter(a => p.avoid.includes(a.k)).map(a => a.s), ...(p.otherAvoid ? ['Sin ' + p.otherAvoid.toLowerCase()] : [])].join(', ') || 'Sin restricciones';
  const health = HEALTH.filter(h => p.health.includes(h.k)).map(h => h.t).join(', ');
  const equip = EQUIP.filter(e => p.equipment.includes(e.k)).map(e => e.t.replace(' (solo mi cuerpo)', '')).join(', ');
  const acts = ACTS.filter(a => p.activities.includes(a.k)).map(a => a.t).join(', ') || 'Sin preferencia';
  const row = (i, t, d, go, extra) => <button className="listrow" onClick={typeof go === 'function' ? go : () => nav(go)}><div className="tile sm"><Icon n={i} /></div><div className="grow"><div className="t">{t}</div>{d && <div className="d">{d}</div>}</div>{extra}<Icon n="chev" className="chev" /></button>;
  const age = me.birthDate ? Math.floor((Date.now() - new Date(me.birthDate)) / 3.15576e10) : null;
  return <div className="screen"><ScrollArea>
    <div className="row" style={{ gap: 14, marginTop: 6 }}><div className={`avatar ${pr ? 'prem' : ''}`}>{(me.name || 'U')[0].toUpperCase()}</div>
      <div className="grow" style={{ minWidth: 0 }}><h1 style={{ margin: 0, fontSize: 24 }}>{me.name}</h1><div className="small muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{me.email}</div>
        <span className={`tag ${pr ? 'gold' : 'blue'} mt8`}>{pr ? '★ Premium ' + P2.t : 'Plan Gratuito'}</span></div></div>
    {p.pendingChanges.length > 0 && <div className="upd mt16"><Icon n="refresh" /><div className="grow small"><b>Cambiaste {p.pendingChanges.join(', ').toLowerCase()}.</b><br />Tu plan todavía no se actualizó.</div>
      <button className="btn sm" onClick={() => nav('/actualizando')}>Actualizar</button></div>}
    <Sect title="Mi plan" />
    <div className="card">
      {row('star', 'Suscripción', pr ? `Premium ${P2.t} · ${P2.s} ${P2.u}` : 'Gratuito · con anuncios', '/planes', pr ? null : <span className="tag blue">Mejorar</span>)}
      {row('steth', 'Ayuda profesional', pr ? `${me.subscription.consultsLeft} ${me.subscription.consultsLeft === 1 ? 'consulta disponible' : 'consultas disponibles'} este mes` : 'Incluida en Premium', '/profesionales')}
      {row('chat', 'Preguntale a Wopi', `${me.subscription.wopiLeft} ${me.subscription.wopiLeft === 1 ? 'consulta disponible' : 'consultas disponibles'} este mes`, '/wopi')}
    </div>
    <Sect title="Mis preferencias" />
    <div className="card">
      {row('move', 'Objetivos', p.goals.map(g => goal(g).t).join(', '), '/perfil/preferencias/1')}
      {row('cal', 'Días, tiempo y presupuesto', `${daysText(p.days)} · ${p.minutes} min · ${BUDGET[p.budget].t}`, '/perfil/preferencias/2')}
      {row('sliders', 'Gustos, salud, nivel y equipamiento', `${acts} · ${avoid}${health ? ' · ' + health : ''} · ${equip}`, '/perfil/preferencias/3')}
    </div>
    <Sect title="Mis datos" />
    <div className="card">
      {row('user', 'Datos básicos', [age != null && `${age} años`, me.heightCm && `${me.heightCm} cm`, me.weightKg && `${me.weightKg} kg`].filter(Boolean).join(' · ') || 'Nombre, edad, altura y peso', '/perfil/datos')}
      {row('lock', 'Cuenta', 'Email y contraseña', '/perfil/cuenta')}
    </div>
    <Sect title="Más" />
    <div className="card">
      {row('tag', 'Ofertas y cupones', '', '/ofertas')}
      {row('pin', 'Cerca tuyo', 'Súper, dietéticas, gimnasios y parques', '/cerca')}
      {!isStandalone() && row('phone', 'Instalar la app en tu celu', '', '/instalar')}
      {wide && !desk && row('grid', 'Ver versión compu', 'Pantalla ancha con barra lateral', () => dispatch(setView('auto')))}
    </div>
    <button className="btn mt20" onClick={() => nav('/actualizando')}><Icon n="refresh" /> Actualizar mi plan</button>
    <div className="center mt8"><button className="textbtn" onClick={() => { logout(); nav('/', { replace: true }); }}>Cerrar sesión</button></div>
  </ScrollArea></div>;
}
