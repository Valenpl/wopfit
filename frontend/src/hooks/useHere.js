import { useEffect, useState } from 'react';
import { DEFAULT_HERE } from '../utils/constants';
import { meters } from '../utils/format';

/** Menos que esto es ruido del GPS: no vale la pena reordenar la lista ni mover a Wopi. */
const MIN_MOVE = 5;

/**
 * Dónde está la persona: la ubicación del celu si la comparte, si no UADE. Nunca se manda al servidor.
 * Con `watch`, sigue la ubicación mientras te movés (en Cerca tuyo, para que Wopi camine con vos).
 */
export default function useHere({ watch = false } = {}) {
  const [here, setHere] = useState(DEFAULT_HERE);
  useEffect(() => {
    let live = true;
    const geo = navigator.geolocation;
    if (!geo) return undefined;
    const got = p => {
      if (!live) return;
      const next = { lat: p.coords.latitude, lng: p.coords.longitude, real: true };
      setHere(prev => (prev.real && meters(prev, next) < MIN_MOVE ? prev : next));
    };
    if (!watch) {
      geo.getCurrentPosition(got, () => {}, { timeout: 8000, maximumAge: 300000 });
      return () => { live = false; };
    }
    const id = geo.watchPosition(got, () => {}, { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 });
    return () => { live = false; geo.clearWatch(id); };
  }, [watch]);
  return here;
}
