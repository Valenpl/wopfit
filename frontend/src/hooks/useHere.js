import { useEffect, useState } from 'react';
import { DEFAULT_HERE } from '../utils/constants';

/**
 * Dónde está la persona: la ubicación del celu si la comparte, si no UADE.
 * Al servidor solo viaja redondeada a unos 100 m, para buscar lugares de Google (ver fetchNearby). No se guarda.
 */
export default function useHere() {
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
