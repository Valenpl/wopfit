import { useNavigate } from 'react-router-dom';
import useToast from '../../hooks/useToast';
import { distTxt, meters } from '../../utils/format';
import Icon from '../shared/Icon.jsx';

/** Cupón de un aliado; la distancia es a la sucursal más cercana. */
export default function CouponCard({ o, here }) {
  const nav = useNavigate();
  const toast = useToast();
  const near = o.branches.map(b => ({ ...b, m: meters(here, b) })).sort((a, b) => a.m - b.m)[0];
  const cls = o.category === 'gym' ? '' : o.category === 'ropa' || o.category === 'supl' ? 'p' : 'g';
  const copy = async () => { try { await navigator.clipboard.writeText(o.code); toast('Código copiado: ' + o.code); } catch { toast('Tu código: ' + o.code); } };
  return <div className={`coupon ${cls}`}>
    <div className="l"><b>{o.off}</b><small style={{ fontSize: 11 }}>{o.unit}</small></div>
    <div className="r"><div className="tiny muted" style={{ fontWeight: 800 }}>{o.store}{near ? ` · a ${distTxt(near.m)}` : ' · Online'}</div>
      <div className="t">{o.description}</div><div className="d">Vence en {o.daysLeft} {o.daysLeft === 1 ? 'día' : 'días'}</div>
      <div className="cact"><button className="btn sm outline" onClick={copy}><Icon n="copy" /> {o.code}</button>
        {near && <button className="btn sm outline" onClick={() => nav('/cerca?lugar=' + near.id)}><Icon n="pin" /> Ver en el mapa</button>}</div></div>
  </div>;
}
