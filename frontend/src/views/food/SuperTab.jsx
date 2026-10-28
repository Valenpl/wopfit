import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { checkShoppingItem, fetchShopping } from '../../redux/slices/mealSlice';
import { fetchOffers } from '../../redux/slices/placeSlice';
import { getEntry } from '../../redux/helpers';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import { BUDGET } from '../../utils/constants';
import { today } from '../../utils/dates';
import { cap, money } from '../../utils/format';
import ErrorBox from '../../components/shared/ErrorBox.jsx';
import Icon from '../../components/shared/Icon.jsx';
import More from '../../components/shared/More.jsx';
import Sect from '../../components/shared/Sect.jsx';

/** Lista del súper de esta semana: ingredientes del menú, de los que más se usan a los que menos. */
export default function SuperTab() {
  const nav = useNavigate();
  const dispatch = useDispatch();
  const { me } = useAuth();
  const t = today();
  const { data, error, retry } = useFetch(fetchShopping, t, s => getEntry(s.meals.shopping, t));
  const offers = useFetch(fetchOffers, undefined, s => s.places.offers);
  const forList = offers.data ? offers.data.offers.filter(o => o.forList).length : 0;
  if (error && !data) return <ErrorBox error={error} onRetry={retry} />;
  if (!data) return <p className="center muted">Cargando…</p>;
  const B = BUDGET[me.preferences.budget];
  const done = data.items.filter(x => x.checked).length;
  const flip = x => dispatch(checkShoppingItem({ date: t, name: x.name, checked: !x.checked }));
  return <>
    <div className="card"><div className="row between"><div><b style={{ fontFamily: 'var(--h)', fontSize: 20, color: 'var(--navy)' }}>{money(data.weekCost)}</b>
      <div className="tiny muted" style={{ fontWeight: 700 }}>estimado de la semana · presupuesto {B.t.toLowerCase()}</div></div><span className="tag blue">{done}/{data.items.length}</span></div></div>
    {forList > 0 && <button className="banner green mt12" onClick={() => nav('/ofertas')}><Icon n="tag" /><span className="grow">{forList} {forList === 1 ? 'oferta' : 'ofertas'} para ingredientes de tu lista</span><Icon n="chev" /></button>}
    <Sect title="Tu lista del súper" />
    <div className="card">{data.items.map(x => <button key={x.name} className="listrow" onClick={() => flip(x)} aria-pressed={x.checked}>
      <span className={`ck box ${x.checked ? 'on' : ''}`}><Icon n="check" /></span><span className={`t grow ${x.checked ? 'done-t' : ''}`}>{cap(x.name)}</span>
      {x.offer ? <span className="tag">Oferta</span> : <span className="tiny muted" style={{ fontWeight: 700 }}>{x.count} {x.count > 1 ? 'comidas' : 'comida'}</span>}</button>)}</div>
    <div className="center mt12"><More onClick={() => nav('/cerca')}>Ver súper y verdulerías cerca</More></div>
  </>;
}
