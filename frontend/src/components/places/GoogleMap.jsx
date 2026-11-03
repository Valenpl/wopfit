import { useEffect } from 'react';
import { AdvancedMarker, APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { PCOL, PEMO } from '../../utils/constants';

/**
 * Mapa de Google con tu ubicación y los lugares (pines por categoría).
 * Usa @vis.gl/react-google-maps: el mapa y los pines son componentes de React, así que no tocamos el DOM.
 *
 * La key se lee de VITE_GOOGLE_MAPS_KEY. Vite la mete en el JavaScript que baja el navegador, así que es pública:
 * la protege la restricción por dominio que tiene en Google Cloud (solo anda desde localhost y nuestro dominio).
 * Los pines propios necesitan un Map ID; DEMO_MAP_ID es el de prueba que da Google.
 */
const KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID';
const NONE = [];

/** Mueve la cámara cuando cambia tu ubicación o el lugar elegido. Usa la API del mapa, no el DOM. */
function Camera({ here, target }) {
  const map = useMap();
  useEffect(() => { if (map) map.panTo({ lat: here.lat, lng: here.lng }); }, [map, here.lat, here.lng]);
  useEffect(() => { if (map && target) map.panTo({ lat: target.lat, lng: target.lng }); }, [map, target]);
  return null;
}

export default function GoogleMap({ here, places = NONE, sel, onSelect, children }) {
  const target = places.find(p => p.id === sel);
  return <div className="map gmap" aria-label="Mapa">
    {KEY ? <APIProvider apiKey={KEY} language="es" region="AR">
      <Map mapId={MAP_ID} defaultCenter={{ lat: here.lat, lng: here.lng }} defaultZoom={15} gestureHandling="greedy"
        clickableIcons={false} disableDefaultUI zoomControl style={{ position: 'absolute', inset: 0 }}>
        <Camera here={here} target={target} />
        <AdvancedMarker position={{ lat: here.lat, lng: here.lng }} anchorLeft="-50%" anchorTop="-50%" clickable={false} title="Vos">
          <span className="lme" />
        </AdvancedMarker>
        {places.map(p => <AdvancedMarker key={p.id} position={{ lat: p.lat, lng: p.lng }} title={p.name} zIndex={p.id === sel ? 1000 : 0}
          onClick={() => onSelect && onSelect(p.id)}>
          <div className={`lpin ${p.id === sel ? 'sel' : ''}`}><span style={{ background: PCOL[p.category] }}><i>{PEMO[p.category]}</i></span></div>
        </AdvancedMarker>)}
      </Map>
    </APIProvider>
      : <div className="nokey small muted">Falta la key de Google Maps (<code>VITE_GOOGLE_MAPS_KEY</code>). La lista de lugares funciona igual.</div>}
    {children}
  </div>;
}
