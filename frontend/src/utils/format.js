export const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
export const money = n => '$' + Math.round(n).toLocaleString('es-AR');
export const isPremium = me => !!(me && me.subscription && me.subscription.premium);
export const firstName = me => ((me && me.name) || 'vos').split(' ')[0];

/** Distancia en metros entre dos puntos {lat, lng}. */
export function meters(a, b) {
  const R = 6371000, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}
export const distTxt = m => (m < 1000 ? m + ' m' : (m / 1000).toFixed(1).replace('.', ',') + ' km');
