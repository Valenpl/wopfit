import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOffers } from '../../redux/slices/placeSlice';
import useFetch from '../../hooks/useFetch';
import useHere from '../../hooks/useHere';
import { OCATS } from '../../utils/constants';
import CouponCard from '../../components/places/CouponCard.jsx';
import ErrorBox from '../../components/shared/ErrorBox.jsx';
import Icon from '../../components/shared/Icon.jsx';
import Note from '../../components/shared/Note.jsx';
import Screen from '../../components/shared/Screen.jsx';
import Sect from '../../components/shared/Sect.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

export default function Ofertas() {
  const nav = useNavigate();
  const here = useHere();
  const [cat, setCat] = useState('todas');
  const [q, setQ] = useState('');
  const { data, error, retry } = useFetch(fetchOffers, undefined, s => s.places.offers);
  const ql = q.trim().toLowerCase();
  const offers = data ? data.offers : [];
  const list = offers.filter(o => (cat === 'todas' || o.category === cat)
    && (!ql || (o.store + ' ' + o.description + ' ' + o.ingredients.join(' ')).toLowerCase().includes(ql)));
  const mine = offers.filter(o => o.forList);
  return <Screen>
    <TopBar />
    <h1>Encontrar ofertas</h1><p className="sub">Ahorrá en lo que te hace bien.</p>
    <div className="search"><Icon n="search" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscá lentejas, gimnasio, zapatillas…" aria-label="Buscar ofertas" /></div>
    <div className="chiprow mt12">{OCATS.map(([k, t, e]) => <button key={k} className={`chip ${cat === k ? 'on' : ''}`} onClick={() => setCat(k)}>{e} {t}</button>)}</div>
    {error && !data && <ErrorBox error={error} onRetry={retry} />}
    {!data && !error && <p className="center muted">Cargando…</p>}
    {data && <>
      {data.alerts
        ? <Note icon="bell" className="mt12">Alertas de ofertas activadas: {mine.length ? `hay ${mine.length} para ingredientes de tu lista de esta semana.` : 'te avisamos cuando baja algo de tu lista.'}</Note>
        : <button className="banner mt12" style={{ background: '#FFF6DD', color: '#8A6300' }} onClick={() => nav('/planes')}><Icon n="bell" /><span className="grow">Activá alertas de ofertas con Premium</span><Icon n="chev" /></button>}
      {cat === 'todas' && !ql && mine.length > 0 && <><Sect title="Para tu lista de esta semana" />{mine.slice(0, 3).map(o => <CouponCard key={o.id} o={o} here={here} />)}</>}
      <Sect title={cat === 'todas' ? 'Todas las ofertas' : OCATS.find(c => c[0] === cat)[1]} />
      {list.map(o => <CouponCard key={o.id} o={o} here={here} />)}
      {list.length === 0 && <div className="card center muted">No encontramos ofertas con esa búsqueda.</div>}
      <p className="tiny muted center mt16">Comercios de ejemplo para la demo.</p>
    </>}
  </Screen>;
}
