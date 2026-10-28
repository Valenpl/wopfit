import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activatePremium, cancelPremium } from '../../redux/slices/authSlice';
import useAuth from '../../hooks/useAuth';
import useBack from '../../hooks/useBack';
import useRequest from '../../hooks/useRequest';
import { FREE_F, PREM_F, PRICES } from '../../utils/constants';
import { isPremium } from '../../utils/format';
import Btn from '../../components/shared/Btn.jsx';
import Icon from '../../components/shared/Icon.jsx';
import Note from '../../components/shared/Note.jsx';
import Screen from '../../components/shared/Screen.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

/** Elegí tu plan. Premium es de demostración: se activa sin pagar. */
export default function Planes() {
  const nav = useNavigate();
  const back = useBack('/perfil');
  const { me } = useAuth();
  const sub = me.subscription, pr = isPremium(me);
  const [per, setPer] = useState(sub.period || 'anual');
  const [all, setAll] = useState(false);
  const activate = useRequest(activatePremium, { onSuccess: () => nav('/premium', { replace: true }) });
  const cancel = useRequest(cancelPremium, { onSuccess: () => nav('/perfil', { replace: true }) });

  const foot = <>
    {pr && sub.period === per
      ? <Btn busy={cancel.busy} className="ghost" onClick={() => cancel.run()}>Volver al plan Gratuito</Btn>
      : <Btn busy={activate.busy} onClick={() => activate.run(per)}>{pr ? 'Cambiar a ' + PRICES[per].t : 'Pasarme a Premium'} <Icon n="arrow" /></Btn>}
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
