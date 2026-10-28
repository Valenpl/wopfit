import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api.js';
import { DEFAULT_HERE, Icon, OCATS, PCATS, PCOL, PEMO, distTxt, isPremium, meters } from '../lib.jsx';
import { ErrorBox, Note, Screen, Sect, TopBar, useApp, useLoad } from '../ui.jsx';

/** Dónde está la persona: la ubicación del celu si la comparte, si no UADE. Nunca se manda al servidor. */
export function useHere() {
  const [here, setHere] = useState(DEFAULT_HERE);
  useEffect(() => {
    let live = true;
    if (!navigator.geolocation) return undefined;
    navigator.geolocation.getCurrentPosition(
      p => live && setHere({ lat: p.coords.latitude, lng: p.coords.longitude, real: true }),
      () => {}, { timeout: 8000, maximumAge: 300000 });
    return () => { live = false; };
  }, []);
  return here;
}

const pinIcon = (cat, sel) => L.divIcon({
  className: 'lpin-wrap', iconSize: [40, 40], iconAnchor: [20, 38],
  html: `<div class="lpin ${sel ? 'sel' : ''}"><span style="background:${PCOL[cat]}"><i>${PEMO[cat]}</i></span></div>`
});
const meIcon = L.divIcon({ className: 'lpin-wrap', iconSize: [18, 18], iconAnchor: [9, 9], html: '<span class="lme"></span>' });

const NONE = [];

/** Mapa de OpenStreetMap con tu ubicación y los lugares. Los pines se vuelven a dibujar solo si cambian los lugares o el elegido. */
function LeafletMap({ here, places = NONE, sel, onSelect, children }) {
  const pickRef = useRef(onSelect);
  pickRef.current = onSelect;
  const box = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const me = useRef(null);
  useEffect(() => {
    const m = L.map(box.current, { zoomControl: true, attributionControl: true }).setView([here.lat, here.lng], 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    me.current = L.marker([here.lat, here.lng], { icon: meIcon, interactive: false, keyboard: false }).addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!map.current) return;
    me.current.setLatLng([here.lat, here.lng]);
    map.current.setView([here.lat, here.lng], map.current.getZoom());
  }, [here.lat, here.lng]);
  useEffect(() => {
    if (!layer.current) return;
    layer.current.clearLayers();
    places.forEach(p => L.marker([p.lat, p.lng], { icon: pinIcon(p.category, p.id === sel), title: p.name, zIndexOffset: p.id === sel ? 1000 : 0 })
      .on('click', () => pickRef.current && pickRef.current(p.id)).addTo(layer.current));
  }, [places, sel]);
  useEffect(() => {
    const p = places.find(x => x.id === sel);
    if (p && map.current) map.current.panTo([p.lat, p.lng]);
  }, [sel, places]);
  return <div className="map lmap" aria-label="Mapa"><div ref={box} style={{ position: 'absolute', inset: 0 }} />{children}</div>;
}

const walkMin = m => Math.max(1, Math.round(m / 80));
const directions = (here, p) => `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${here.lat}%2C${here.lng}%3B${p.lat}%2C${p.lng}`;

// ---------- Cerca tuyo (Premium) ----------
export function Cerca() {
  const nav = useNavigate();
  const { me } = useApp();
  const pr = isPremium(me);
  const here = useHere();
  const [params] = useSearchParams();
  const [cat, setCat] = useState('todos');
  const [q, setQ] = useState('');
  const [f, setF] = useState({});
  const [sel, setSel] = useState(() => Number(params.get('lugar')) || null);
  const [more, setMore] = useState(false);
  const { data, error, reload } = useLoad(sig => (pr ? api.get('/places', sig) : Promise.resolve([])), [pr]);

  const all = useMemo(() => (data || []).map(p => ({ ...p, m: meters(here, p) })), [data, here]);
  const ql = q.trim().toLowerCase();
  const list = useMemo(() => all.filter(p => (cat === 'todos' || p.category === cat) && (!f.open || p.openNow) && (!f.disc || p.discount)
    && (!ql || (p.name + ' ' + p.categoryName + ' ' + p.address + ' ' + p.barrio).toLowerCase().includes(ql)))
    .sort((a, b) => a.m - b.m), [all, cat, f, ql]);
  const shown = more ? list : list.slice(0, 12);
  const far = all.length > 0 && Math.min(...all.map(p => p.m)) > 5000;
  const pick = id => { setSel(id); setTimeout(() => document.getElementById('pl-' + id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50); };
  useEffect(() => { if (sel && data && !shown.some(p => p.id === sel)) setMore(true); }, [sel, data]); // eslint-disable-line react-hooks/exhaustive-deps

  return <Screen>
    <TopBar right={pr ? <span className="tag gold">★ Premium</span> : null} />
    <h1>Cerca tuyo</h1><p className="sub">Supermercados, dietéticas, gimnasios y parques.</p>
    <div className="search"><Icon n="search" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscá supermercados, gimnasios…" aria-label="Buscar lugares" disabled={!pr} /></div>
    <div className="chiprow mt12">{PCATS.map(([k, t, e]) => <button key={k} className={`chip ${cat === k ? 'on' : ''}`} onClick={() => setCat(k)}>{e} {t}</button>)}</div>
    <LeafletMap here={here} places={pr ? list : NONE} sel={sel} onSelect={pick}>
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
      {error && <ErrorBox error={error} onRetry={reload} />}
      {!data && !error && <p className="center muted">Cargando…</p>}
      <div className="mt12">{shown.map(p => <div key={p.id} id={'pl-' + p.id} className={`place ${sel === p.id ? 'sel' : ''}`}>
        <button className="em" style={{ background: PCOL[p.category] + '22' }} onClick={() => pick(p.id)} aria-label={'Ver ' + p.name + ' en el mapa'}>{PEMO[p.category]}</button>
        <div className="grow"><b style={{ color: 'var(--navy)' }}>{p.name}</b>
          <div className="tiny muted" style={{ fontWeight: 700 }}>{p.categoryName} · a {distTxt(p.m)} · {walkMin(p.m)} min caminando</div>
          <div className="tiny muted">{p.address}, {p.barrio}</div>
          <div className="tiny" style={{ color: p.openNow ? 'var(--green-d)' : 'var(--peach-d)', fontWeight: 700 }}>{p.status}</div>
          <div className="row mt8" style={{ gap: 8, flexWrap: 'wrap' }}>{p.discount && <span className="tag">Descuento WopFit</span>}
            <a className="btn sm outline" style={{ minHeight: 30, fontSize: 12, padding: '0 10px' }} href={directions(here, p)} target="_blank" rel="noreferrer"><Icon n="nav" /> Cómo llegar</a>
            {p.offers > 0 && <button className="link small" onClick={() => nav('/ofertas')}>Ver ofertas</button>}</div></div></div>)}
        {!more && list.length > shown.length && <div className="center mt12"><button className="more" onClick={() => setMore(true)}>Ver {list.length - shown.length} lugares más <Icon n="chev" /></button></div>}
        {data && list.length === 0 && <div className="card center muted">No encontramos lugares con esos filtros.</div>}
      </div>
      <p className="tiny muted center mt12">Comercios ficticios en direcciones reales de AMBA, para la demo. Los parques son reales.</p>
    </>}
  </Screen>;
}

// ---------- Ofertas ----------
/** Cupón de un aliado; la distancia es a la sucursal más cercana. */
export function CouponCard({ o, here }) {
  const nav = useNavigate();
  const { toast } = useApp();
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

export function Ofertas() {
  const nav = useNavigate();
  const here = useHere();
  const [cat, setCat] = useState('todas');
  const [q, setQ] = useState('');
  const { data, error, reload } = useLoad(sig => api.get('/offers', sig), []);
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
    {error && <ErrorBox error={error} onRetry={reload} />}
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
