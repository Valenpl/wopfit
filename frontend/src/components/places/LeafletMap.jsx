import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PCOL, PEMO } from '../../utils/constants';

const pinIcon = (cat, sel) => L.divIcon({
  className: 'lpin-wrap', iconSize: [40, 40], iconAnchor: [20, 38],
  html: `<div class="lpin ${sel ? 'sel' : ''}"><span style="background:${PCOL[cat]}"><i>${PEMO[cat]}</i></span></div>`
});
const meIcon = L.divIcon({ className: 'lpin-wrap', iconSize: [18, 18], iconAnchor: [9, 9], html: '<span class="lme"></span>' });

/**
 * Mapa de OpenStreetMap con tu ubicación y los lugares (pines por categoría).
 * Leaflet no es de React: dibuja el mapa adentro de un div que le pasamos con un ref. Es la única excepción a
 * "no tocar el DOM", y queda encerrada en este componente: React solo le pasa datos (here, places, sel).
 */
export default function LeafletMap({ here, places = [], sel, onSelect, children }) {
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
      .on('click', () => onSelect && onSelect(p.id)).addTo(layer.current));
  }, [places, sel, onSelect]);
  useEffect(() => {
    const p = places.find(x => x.id === sel);
    if (p && map.current) map.current.panTo([p.lat, p.lng]);
  }, [sel, places]);
  return <div className="map lmap" aria-label="Mapa"><div ref={box} style={{ position: 'absolute', inset: 0 }} />{children}</div>;
}
