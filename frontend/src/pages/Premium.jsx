import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { FREE_F, Icon, PREM_F, PRICES, dayNum, isPremium, monthName } from '../lib.jsx';
import { Btn, Note, Screen, Sect, TopBar, useAction, useApp, useBack } from '../ui.jsx';

// ---------- Elegí tu plan ----------
export function Planes() {
  const nav = useNavigate();
  const back = useBack('/perfil');
  const { me, setMe, toast } = useApp();
  const sub = me.subscription, pr = isPremium(me);
  const [per, setPer] = useState(sub.period || 'anual');
  const [all, setAll] = useState(false);
  const [busy, run] = useAction();
  const activate = () => run(async () => { setMe(await api.post('/subscription', { period: per })); nav('/premium', { replace: true }); });
  const cancel = () => run(async () => { setMe(await api.del('/subscription')); toast('Volviste al plan Gratuito'); nav('/perfil', { replace: true }); });

  const foot = <>
    {pr && sub.period === per
      ? <Btn busy={busy} className="ghost" onClick={cancel}>Volver al plan Gratuito</Btn>
      : <Btn busy={busy} onClick={activate}>{pr ? 'Cambiar a ' + PRICES[per].t : 'Pasarme a Premium'} <Icon n="arrow" /></Btn>}
    {!pr && <div className="center"><button className="link small" onClick={back}>Seguir con el plan Gratuito</button></div>}
  </>;
  return <Screen narrow foot={foot}>
    <TopBar fallback="/perfil" />
    <h1>Elegí tu plan</h1><p className="sub">Empezá gratis y mejorá cuando quieras. Podés cancelar en cualquier momento.</p>
    <div className="card plan"><div className="row between"><h3>Gratuito</h3>{!pr && <span className="tag blue">Tu plan actual</span>}</div><div className="price">Gratis</div>
      <ul>{FREE_F.map(f => <li key={f}><Icon n="check" />{f}</li>)}</ul></div>
    <div className="card plan rec"><div className="row between"><h3>Premium</h3><span className="tag">{pr ? 'Tu plan actual' : 'Recomendado'}</span></div>
      <ul>{(all ? PREM_F : PREM_F.slice(0, 4)).map(f => <li key={f}><Icon n="check" />{f}</li>)}</ul>
      {!all && <button className="more mt8" onClick={() => setAll(true)}>Ver todos los beneficios <Icon n="chev" /></button>}</div>
    <h2>¿Cada cuánto querés pagar?</h2>
    <div className="stack">{Object.entries(PRICES).map(([k, p]) => <button key={k} className={`per ${per === k ? 'on' : ''}`} onClick={() => setPer(k)} aria-pressed={per === k}>
      <span className="radio" /><div className="grow"><b>{p.t}</b> {p.save && <span className="tag">{p.save}</span>}{p.eq && <div className="tiny muted">{p.eq}</div>}</div>
      <div style={{ textAlign: 'right' }}><b>{p.s}</b><div className="tiny muted">{p.u}</div></div></button>)}</div>
    <Note tone="blue" className="mt16">Demo: Premium se activa sin pagar. No se cobra nada ni se piden datos de pago.</Note>
  </Screen>;
}

// ---------- ¡Ya sos Premium! ----------
export function YaPremium() {
  const nav = useNavigate();
  const { me } = useApp();
  if (!isPremium(me)) return <Navigate to="/planes" replace />;
  const s = me.subscription, p = PRICES[s.period];
  return <Screen narrow scrollStyle={{ paddingTop: 'calc(var(--sat) + 36px)' }} foot={<button className="btn" onClick={() => nav('/perfil', { replace: true })}>Ver mi perfil</button>}>
    <div className="bigicon b pop"><Icon n="star" /></div>
    <h1 className="center">¡Ya sos Premium!</h1>
    <p className="sub center">Tu plan {p.t} está activo hasta el {dayNum(s.until)} de {monthName(s.until)} de {s.until.slice(0, 4)}.</p>
    <Sect title="Ahora tenés" />
    <div className="qa">
      <button onClick={() => nav('/wopi')}><div className="tile sm"><Icon n="chat" /></div>Wopi IA con 20 consultas</button>
      <button onClick={() => nav('/cerca')}><div className="tile sm"><Icon n="pin" /></div>Lugares cerca tuyo</button>
      <button onClick={() => nav('/profesionales')}><div className="tile sm p"><Icon n="steth" /></div>2 consultas con profesionales</button>
      <button onClick={() => nav('/ofertas')}><div className="tile sm g"><Icon n="tag" /></div>Alertas de ofertas</button>
    </div>
    <div className="card mt12"><div className="row"><div className="tile sm"><Icon n="star" /></div><div className="grow"><b style={{ color: 'var(--navy)' }}>Premium de demostración</b>
      <div className="tiny muted">{p.s} {p.u} · sin cobro real · sin anuncios</div></div></div></div>
  </Screen>;
}
