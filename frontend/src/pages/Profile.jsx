import { useNavigate } from 'react-router-dom';
import { ACTS, AVOID, BUDGET, EQUIP, HEALTH, Icon, daysText, goal } from '../lib.jsx';
import { Sect, useApp } from '../ui.jsx';

export default function Profile() {
  const nav = useNavigate();
  const { me, logout } = useApp();
  const p = me.preferences, plan = me.plan;
  const avoid = [...AVOID.filter(a => p.avoid.includes(a.k)).map(a => a.s), ...(p.otherAvoid ? ['Sin ' + p.otherAvoid.toLowerCase()] : [])].join(', ') || 'Sin restricciones';
  const health = HEALTH.filter(h => p.health.includes(h.k)).map(h => h.t).join(', ');
  const equip = EQUIP.filter(e => p.equipment.includes(e.k)).map(e => e.t.replace(' (solo mi cuerpo)', '')).join(', ');
  const acts = ACTS.filter(a => p.activities.includes(a.k)).map(a => a.t).join(', ') || 'Sin preferencia';
  const row = (i, t, d, to) => <button className="listrow" onClick={() => nav(to)}><div className="tile sm"><Icon n={i} /></div><div className="grow"><div className="t">{t}</div>{d && <div className="d">{d}</div>}</div><Icon n="chev" className="chev" /></button>;
  const age = me.birthDate ? Math.floor((Date.now() - new Date(me.birthDate)) / 3.15576e10) : null;
  return <div className="screen"><div className="scroll">
    <div className="row" style={{ gap: 14, marginTop: 6 }}><div className="avatar">{(me.name || 'U')[0].toUpperCase()}</div>
      <div className="grow" style={{ minWidth: 0 }}><h1 style={{ margin: 0, fontSize: 24 }}>{me.name}</h1><div className="small muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{me.email}</div>
        <span className="tag blue mt8">{plan.levelName} · {plan.minutes} min</span></div></div>
    {p.pendingChanges.length > 0 && <div className="upd mt16"><Icon n="refresh" /><div className="grow small"><b>Cambiaste {p.pendingChanges.join(', ').toLowerCase()}.</b><br />Tu plan todavía no se actualizó.</div>
      <button className="btn sm" onClick={() => nav('/actualizando')}>Actualizar</button></div>}
    <Sect title="Mis preferencias" />
    <div className="card">
      {row('move', 'Objetivos', p.goals.map(g => goal(g).t).join(', '), '/perfil/preferencias/1')}
      {row('cal', 'Días, tiempo y presupuesto', `${daysText(p.days)} · ${p.minutes} min · ${BUDGET[p.budget].t}`, '/perfil/preferencias/2')}
      {row('sliders', 'Gustos, salud, nivel y equipamiento', `${acts} · ${avoid}${health ? ' · ' + health : ''} · ${equip}`, '/perfil/preferencias/3')}
    </div>
    <Sect title="Mis datos" />
    <div className="card">{row('user', 'Datos básicos', [age != null && `${age} años`, me.heightCm && `${me.heightCm} cm`, me.weightKg && `${me.weightKg} kg`].filter(Boolean).join(' · ') || 'Nombre, edad, altura y peso', '/perfil/datos')}</div>
    <Sect title="Mi plan" />
    <div className="card">
      {row('dumb', 'Tu entrenamiento', plan.trainingSummary, '/entreno')}
      {row('fork', 'Tu alimentación', plan.foodSummary, '/comida')}
      {row('flag', 'Mis metas', 'Metas chiquitas para tu semana', '/metas')}
      {row('history', 'Historial', 'Entrenos, hábitos y dificultades', '/historial')}
    </div>
    {plan.healthNotes.length > 0 && <div className="note mt12"><Icon n="shield" /><span>{plan.healthNotes.join(' ')}</span></div>}
    <button className="btn mt20" onClick={() => nav('/actualizando')}><Icon n="refresh" /> Actualizar mi plan</button>
    <div className="center mt8"><button className="textbtn" onClick={() => { logout(); nav('/', { replace: true }); }}>Cerrar sesión</button></div>
  </div></div>;
}
