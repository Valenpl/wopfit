import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PCOL, PEMO } from '../../utils/constants';
import { BASE_STYLE, wopfitStyle } from '../../utils/mapStyle';
import Icon from '../shared/Icon.jsx';

const ZOOM = 15.4;
const PITCH = 45;
const STEP_MS = 900; // lo que tarda Wopi en llegar a cada ubicación nueva
// Mientras carga el estilo de OpenFreeMap se ve el fondo de la app, no un cuadro blanco.
const BLANK = { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#EEF6F4' } }] };

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pinHtml = (p, sel) => `<div class="lpin ${sel ? 'sel' : ''}" style="--c:${PCOL[p.category]}"><span><i>${PEMO[p.category]}</i></span>`
  + (p.discount ? '<em class="lpin-off">%</em>' : '') + (sel ? `<b class="lpin-name">${esc(p.name)}</b>` : '') + '</div>';
// Wopi marca dónde estás. `walking` lo hace caminar; `left` lo da vuelta hacia donde va.
const wopiClass = ({ walking, left, real }) => `lwopi ${walking ? 'walking' : ''} ${left ? 'left' : ''} ${real ? '' : 'approx'}`;

/**
 * Mapa con tu ubicación (Wopi) y los lugares (pines por categoría), con MapLibre y los datos de OpenFreeMap.
 * MapLibre no es de React: dibuja el mapa y los pines adentro de un div que le pasamos con un ref. Es la única
 * excepción a "no tocar el DOM", y queda encerrada en este componente: React solo le pasa datos (here, places, sel).
 * El mapa sigue a Wopi mientras te movés; si lo arrastrás deja de seguirlo hasta que tocás "Centrar en mí".
 */
const NONE = [];

export default function MapView({ here, places = NONE, sel, onSelect, children }) {
  // El callback y los lugares más nuevos se leen de refs: los pines se rearman solo si cambia cuáles son o el elegido.
  const pickRef = useRef(onSelect);
  pickRef.current = onSelect;
  const placesRef = useRef(places);
  placesRef.current = places;
  const box = useRef(null);
  const map = useRef(null);
  const pins = useRef([]);
  const wopi = useRef(null);
  const anim = useRef({ frame: 0, timer: 0 });
  const followRef = useRef(true);
  const [follow, setFollow] = useState(true);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false); // el estilo y las primeras teselas ya están
  const setFollowing = on => { followRef.current = on; setFollow(on); };

  useEffect(() => {
    let m;
    try {
      m = new maplibregl.Map({
        container: box.current, style: BLANK, center: [here.lng, here.lat], zoom: ZOOM, pitch: PITCH, maxPitch: 60,
        attributionControl: { compact: true }
      });
    } catch {
      setFailed(true); // sin WebGL no hay mapa; la lista de lugares sigue andando
      return undefined;
    }
    m.setStyle(BASE_STYLE, { transformStyle: (_, next) => wopfitStyle(next) });
    m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    m.on('dragstart', () => setFollowing(false));
    // Cuando termina de cargar, los créditos quedan plegados en el botón (i): en el celu tapaban medio mapa.
    // MapLibre los despliega al llegar los datos, así que se pliegan en el primer "idle" con el estilo de OpenFreeMap
    // (el anterior es el del fondo vacío de mientras carga).
    const onIdle = () => {
      if (!m.getSource('openmaptiles')) return;
      m.off('idle', onIdle);
      const attrib = box.current && box.current.querySelector('.maplibregl-ctrl-attrib');
      if (attrib) attrib.classList.remove('maplibregl-compact-show');
      setReady(true);
    };
    m.on('idle', onIdle);
    // MapLibre le pone sus clases al elemento del marcador: la animación cambia el de adentro (.lwopi).
    const el = document.createElement('div');
    el.innerHTML = `<div class="${wopiClass({ real: here.real })}"><span class="lwopi-ring"></span><span class="lwopi-shadow"></span>`
      + `<img src="/wopi.webp" alt="" draggable="false" /><b class="lwopi-tag">${here.real ? 'Vos' : 'UADE'}</b></div>`;
    wopi.current = new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [0, 10] }).setLngLat([here.lng, here.lat]).addTo(m);
    // Si el cuadro cambia de tamaño (celu o compu), el mapa se acomoda.
    const ro = new ResizeObserver(() => m.resize());
    ro.observe(box.current);
    map.current = m;
    const a = anim.current;
    return () => { cancelAnimationFrame(a.frame); clearTimeout(a.timer); ro.disconnect(); m.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wopi camina hasta la ubicación nueva (y el mapa lo sigue, si no lo moviste vos).
  useEffect(() => {
    const m = map.current, w = wopi.current, a = anim.current;
    if (!m) return;
    const el = w.getElement().firstChild;
    el.querySelector('.lwopi-tag').textContent = here.real ? 'Vos' : 'UADE';
    const from = w.getLngLat(), to = new maplibregl.LngLat(here.lng, here.lat);
    const left = to.lng < from.lng;
    cancelAnimationFrame(a.frame);
    clearTimeout(a.timer);
    if (from.distanceTo(to) < 1) { el.className = wopiClass({ real: here.real }); return; }
    el.className = wopiClass({ walking: true, left, real: here.real });
    if (followRef.current) m.easeTo({ center: to, duration: STEP_MS });
    const start = performance.now();
    const step = now => {
      const t = Math.min(1, (now - start) / STEP_MS), k = t * (2 - t); // frena al llegar
      w.setLngLat([from.lng + (to.lng - from.lng) * k, from.lat + (to.lat - from.lat) * k]);
      if (t < 1) a.frame = requestAnimationFrame(step);
      else a.timer = setTimeout(() => { el.className = wopiClass({ left, real: here.real }); }, 400);
    };
    a.frame = requestAnimationFrame(step);
  }, [here.lat, here.lng, here.real]);

  const ids = places.map(p => p.id).join(',');
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    pins.current.forEach(p => p.remove());
    pins.current = placesRef.current.map(p => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'lpin-wrap';
      el.title = p.name;
      el.setAttribute('aria-label', `${p.name}, ${p.address}`); // hay cadenas con varias sucursales
      el.innerHTML = pinHtml(p, p.id === sel);
      if (p.id === sel) el.style.zIndex = 5;
      el.addEventListener('click', e => { e.stopPropagation(); if (pickRef.current) pickRef.current(p.id); });
      return new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([p.lng, p.lat]).addTo(m);
    });
  }, [ids, sel]);

  useEffect(() => {
    const p = placesRef.current.find(x => x.id === sel);
    if (p && map.current) { setFollowing(false); map.current.easeTo({ center: [p.lng, p.lat], zoom: Math.max(map.current.getZoom(), ZOOM), duration: 700 }); }
  }, [sel]);

  const center = () => {
    setFollowing(true);
    map.current.flyTo({ center: [here.lng, here.lat], zoom: Math.max(map.current.getZoom(), ZOOM), pitch: PITCH, bearing: 0, duration: 800 });
  };

  return <div className="map lmap" aria-label="Mapa" data-ready={ready}>
    <div ref={box} style={{ position: 'absolute', inset: 0 }} />
    {failed && <div className="lmap-fail small muted">No pudimos mostrar el mapa en este navegador. La lista de lugares sigue abajo.</div>}
    {!follow && !failed && <button className="lmap-me" onClick={center}><Icon n="nav" /> Centrar en mí</button>}
    {children}
  </div>;
}
