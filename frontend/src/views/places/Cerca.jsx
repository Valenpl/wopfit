import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchPlaces } from '../../redux/slices/placeSlice';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import useHere from '../../hooks/useHere';
import { PCATS, PCOL, PEMO } from '../../utils/constants';
import { distTxt, isPremium, meters } from '../../utils/format';
import LeafletMap from '../../components/places/LeafletMap.jsx';
import ErrorBox from '../../components/shared/ErrorBox.jsx';
import Icon from '../../components/shared/Icon.jsx';
import Note from '../../components/shared/Note.jsx';
import Screen from '../../components/shared/Screen.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

const FIRST = 12;
const walkMin = m => Math.max(1, Math.round(m / 80));
const directions = (here, p) => `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${here.lat}%2C${here.lng}%3B${p.lat}%2C${p.lng}`;

/** Cerca tuyo (Premium): mapa y lista de lugares, ordenados por distancia. */
export default function Cerca() {
  const nav = useNavigate();
  const { me } = useAuth();
  const pr = isPremium(me);
  const here = useHere();
  const [params] = useSearchParams();
  const [cat, setCat] = useState('todos');
  const [q, setQ] = useState('');
  const [f, setF] = useState({});
  const [sel, setSel] = useState(() => Number(params.get('lugar')) || null);
  const [more, setMore] = useState(false);
  const { data, error, retry } = useFetch(fetchPlaces, undefined, s => s.places.places, { skip: !pr });
  // Refs a cada fila de la lista, para llevar a la vista el lugar que se tocó en el mapa.
  const rows = useRef({});
  const pick = useCallback(id => setSel(id), []);

  const all = (pr && data ? data : []).map(p => ({ ...p, m: meters(here, p) }));
  const ql = q.trim().toLowerCase();
  const list = all.filter(p => (cat === 'todos' || p.category === cat) && (!f.open || p.openNow) && (!f.disc || p.discount)
    && (!ql || (p.name + ' ' + p.categoryName + ' ' + p.address + ' ' + p.barrio).toLowerCase().includes(ql)))
    .sort((a, b) => a.m - b.m);
  // Si el lugar elegido no está entre los primeros, se muestra la lista completa.
  const showAll = more || (sel && !list.slice(0, FIRST).some(p => p.id === sel));
  const shown = showAll ? list : list.slice(0, FIRST);
  const far = all.length > 0 && Math.min(...all.map(p => p.m)) > 5000;

  useEffect(() => {
    const row = sel && rows.current[sel];
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [sel, data]);

  return <Screen>
    <TopBar right={pr ? <span className="tag gold">★ Premium</span> : null} />
    <h1>Cerca tuyo</h1><p className="sub">Supermercados, dietéticas, gimnasios y parques.</p>
    <div className="search"><Icon n="search" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscá supermercados, gimnasios…" aria-label="Buscar lugares" disabled={!pr} /></div>
    <div className="chiprow mt12">{PCATS.map(([k, t, e]) => <button key={k} className={`chip ${cat === k ? 'on' : ''}`} onClick={() => setCat(k)}>{e} {t}</button>)}</div>
    <LeafletMap here={here} places={list} sel={sel} onSelect={pick}>
      {!pr && <div className="gate"><div><div className="bigicon" style={{ width: 60, height: 60, margin: '0 auto', background: '#FFF1C9', color: '#8A6300' }}><Icon n="lock" /></div>
        <h3 className="mt12">El buscador de lugares cercanos es parte de Premium</h3>
        <button className="btn sm" style={{ margin: '12px auto 0' }} onClick={() => nav('/planes')}>Mejorar plan</button></div></div>}
    </LeafletMap>
    {!pr && <div className="card mt12 small muted">Con el plan Gratuito tenés el buscador básico de precios en <button className="link" onClick={() => nav('/ofertas')}>Ofertas</button>.</div>}
    {pr && <>
      {!here.real && <Note tone="blue" className="mt12">Te mostramos los lugares cerca de UADE (Monserrat). Activá la ubicación para ver los tuyos.</Note>}
      {far && <Note tone="peach" className="mt12">Por ahora los aliados de la demo están en CABA y Vicente López.</Note>}
      <div className="chips mt12">
        <button className={`chip ${f.open ? 'on' : ''}`} onClick={() => setF({ ...f, open: !f.open })} aria-pressed={!!f.open}>Abierto ahora</button>
        <button className={`chip ${f.disc ? 'on' : ''}`} onClick={() => setF({ ...f, disc: !f.disc })} aria-pressed={!!f.disc}>Con descuento</button>
      </div>
      {error && !data && <ErrorBox error={error} onRetry={retry} />}
      {!data && !error && <p className="center muted">Cargando…</p>}
      <div className="mt12">{shown.map(p => <div key={p.id} ref={el => { rows.current[p.id] = el; }} className={`place ${sel === p.id ? 'sel' : ''}`}>
        <button className="em" style={{ background: PCOL[p.category] + '22' }} onClick={() => pick(p.id)} aria-label={'Ver ' + p.name + ' en el mapa'}>{PEMO[p.category]}</button>
        <div className="grow"><b style={{ color: 'var(--navy)' }}>{p.name}</b>
          <div className="tiny muted" style={{ fontWeight: 700 }}>{p.categoryName} · a {distTxt(p.m)} · {walkMin(p.m)} min caminando</div>
          <div className="tiny muted">{p.address}, {p.barrio}</div>
          <div className="tiny" style={{ color: p.openNow ? 'var(--green-d)' : 'var(--peach-d)', fontWeight: 700 }}>{p.status}</div>
          <div className="row mt8" style={{ gap: 8, flexWrap: 'wrap' }}>{p.discount && <span className="tag">Descuento WopFit</span>}
            <a className="btn sm outline" style={{ minHeight: 30, fontSize: 12, padding: '0 10px' }} href={directions(here, p)} target="_blank" rel="noreferrer"><Icon n="nav" /> Cómo llegar</a>
            {p.offers > 0 && <button className="link small" onClick={() => nav('/ofertas')}>Ver ofertas</button>}</div></div></div>)}
        {!showAll && list.length > shown.length && <div className="center mt12"><button className="more" onClick={() => setMore(true)}>Ver {list.length - shown.length} lugares más <Icon n="chev" /></button></div>}
        {data && list.length === 0 && <div className="card center muted">No encontramos lugares con esos filtros.</div>}
      </div>
      <p className="tiny muted center mt12">Comercios ficticios en direcciones reales de AMBA, para la demo. Los parques son reales.</p>
    </>}
  </Screen>;
}
