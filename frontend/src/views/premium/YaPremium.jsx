import { Navigate, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { PRICES } from '../../utils/constants';
import { dayNum, monthName } from '../../utils/dates';
import { isPremium } from '../../utils/format';
import Icon from '../../components/shared/Icon.jsx';
import Screen from '../../components/shared/Screen.jsx';
import Sect from '../../components/shared/Sect.jsx';

/** ¡Ya sos Premium! */
export default function YaPremium() {
  const nav = useNavigate();
  const { me } = useAuth();
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
