import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { ACTS, AVOID, BUDGET, EQUIP, HEALTH, Icon, PRICES, daysText, goal, isPremium } from '../lib.jsx';
import { Btn, Field, PwField, Screen, Sect, TopBar, useApp, useBack } from '../ui.jsx';

const isStandalone = () => { try { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch { return false; } };

export default function Profile() {
  const nav = useNavigate();
  const { me, logout, wide, desk, setView } = useApp();
  const p = me.preferences;
  const pr = isPremium(me), P2 = pr ? PRICES[me.subscription.period] : null;
  const avoid = [...AVOID.filter(a => p.avoid.includes(a.k)).map(a => a.s), ...(p.otherAvoid ? ['Sin ' + p.otherAvoid.toLowerCase()] : [])].join(', ') || 'Sin restricciones';
  const health = HEALTH.filter(h => p.health.includes(h.k)).map(h => h.t).join(', ');
  const equip = EQUIP.filter(e => p.equipment.includes(e.k)).map(e => e.t.replace(' (solo mi cuerpo)', '')).join(', ');
  const acts = ACTS.filter(a => p.activities.includes(a.k)).map(a => a.t).join(', ') || 'Sin preferencia';
  const row = (i, t, d, go, extra) => <button className="listrow" onClick={typeof go === 'function' ? go : () => nav(go)}><div className="tile sm"><Icon n={i} /></div><div className="grow"><div className="t">{t}</div>{d && <div className="d">{d}</div>}</div>{extra}<Icon n="chev" className="chev" /></button>;
  const age = me.birthDate ? Math.floor((Date.now() - new Date(me.birthDate)) / 3.15576e10) : null;
  return <div className="screen"><div className="scroll">
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
      {wide && !desk && row('grid', 'Ver versión compu', 'Pantalla ancha con barra lateral', () => setView('auto'))}
    </div>
    <button className="btn mt20" onClick={() => nav('/actualizando')}><Icon n="refresh" /> Actualizar mi plan</button>
    <div className="center mt8"><button className="textbtn" onClick={() => { logout(); nav('/', { replace: true }); }}>Cerrar sesión</button></div>
  </div></div>;
}

// ---------- Cuenta: email y contraseña ----------
export function Cuenta() {
  const { me, toast } = useApp();
  const back = useBack('/perfil');
  const [f, setF] = useState({ current: '', password: '' });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const up = k => e => { setF({ ...f, [k]: e.target.value }); setErr({ ...err, [k]: undefined }); };
  const save = async () => {
    const e = {};
    if (!f.current) e.current = 'Escribí tu contraseña actual';
    if (f.password.length < 8 || !/\d/.test(f.password)) e.password = 'Mínimo 8 caracteres y un número';
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try { await api.put('/me/password', f); toast('Contraseña actualizada'); back(); }
    catch (ex) { if (Object.keys(ex.fields).length) setErr(ex.fields); else toast(ex.message); setBusy(false); }
  };
  return <Screen narrow foot={<Btn busy={busy} onClick={save}>Guardar</Btn>}>
    <TopBar fallback="/perfil" />
    <h1>Cuenta</h1><p className="sub">Tu email y tu contraseña.</p>
    <Field id="email" label="Email" value={me.email} disabled />
    <PwField id="current" label="Contraseña actual" autoComplete="current-password" value={f.current} onChange={up('current')} error={err.current} />
    <PwField id="password" label="Nueva contraseña" placeholder="Mínimo 8 caracteres y un número" autoComplete="new-password" value={f.password} onChange={up('password')} error={err.password} />
  </Screen>;
}
