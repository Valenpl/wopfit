// Estilo del mapa de Cerca tuyo: el "positron" de OpenFreeMap (datos de OpenStreetMap, gratis, sin key ni cuenta)
// repintado con la paleta de WopFit. Es una función pura: recibe el estilo y devuelve uno nuevo.
export const BASE_STYLE = 'https://tiles.openfreemap.org/styles/positron';

const C = {
  ground: '#EEF6F4', residential: '#E8F1F3', park: '#CFEBC0', wood: '#C3E4AF',
  water: '#B9E1FA', waterLine: '#9CCFF2', building: '#E2EAF1', building3d: '#E4EDF7',
  road: '#FFFFFF', roadCasing: '#D3E0EC', major: '#FFFFFF', majorCasing: '#BFD3E6', motorway: '#FFF3E8', motorwayCasing: '#F3C9AE',
  path: '#C8DCC0', rail: '#C9D5E1', boundary: '#C3CFDC',
  text: '#3A4B6E', textSoft: '#6F7F99', textWater: '#176AAE', halo: '#FFFFFF'
};

/** Color de relleno o de línea según la capa del positron. */
const PAINT = {
  background: { 'background-color': C.ground },
  park: { 'fill-color': C.park, 'fill-opacity': 0.9 },
  landuse_residential: { 'fill-color': C.residential },
  landcover_wood: { 'fill-color': C.wood, 'fill-opacity': 0.7 },
  water: { 'fill-color': C.water },
  waterway: { 'line-color': C.waterLine },
  building: { 'fill-color': C.building, 'fill-outline-color': C.roadCasing },
  highway_path: { 'line-color': C.path },
  highway_minor: { 'line-color': C.road },
  highway_major_casing: { 'line-color': C.majorCasing },
  highway_major_inner: { 'line-color': C.major },
  highway_major_subtle: { 'line-color': C.major },
  highway_motorway_casing: { 'line-color': C.motorwayCasing },
  highway_motorway_inner: { 'line-color': C.motorway },
  highway_motorway_subtle: { 'line-color': C.motorway },
  highway_motorway_bridge_casing: { 'line-color': C.motorwayCasing },
  highway_motorway_bridge_inner: { 'line-color': C.motorway },
  tunnel_motorway_casing: { 'line-color': C.roadCasing },
  tunnel_motorway_inner: { 'line-color': C.road }
};

const labelColor = id => (id.startsWith('water') ? C.textWater : id.startsWith('highway-name') ? C.textSoft : C.text);

/** Edificios en 3D, suaves, cuando ya se ve la cuadra. */
const BUILDINGS_3D = {
  id: 'wopfit-buildings-3d', type: 'fill-extrusion', source: 'openmaptiles', 'source-layer': 'building', minzoom: 14.5,
  paint: {
    'fill-extrusion-color': C.building3d,
    'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14.5, 0, 15.3, ['coalesce', ['get', 'render_height'], 8]],
    'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
    'fill-extrusion-opacity': 0.7
  }
};

export function wopfitStyle(base) {
  const layers = [];
  for (const l of base.layers) {
    const paint = { ...l.paint, ...PAINT[l.id] };
    if (l.id.startsWith('railway')) paint['line-color'] = C.rail;
    if (l.id.startsWith('boundary')) paint['line-color'] = C.boundary;
    if (l.type === 'symbol' && l.layout && l.layout['text-field']) {
      Object.assign(paint, { 'text-color': labelColor(l.id), 'text-halo-color': C.halo, 'text-halo-width': 1.4, 'text-halo-blur': 0.5 });
    }
    layers.push({ ...l, paint });
    // Los 3D van arriba de calles y edificios planos, y abajo de los nombres.
    if (l.id === 'highway_motorway_bridge_inner') layers.push(BUILDINGS_3D);
  }
  if (!layers.includes(BUILDINGS_3D)) layers.push(BUILDINGS_3D);
  // Luz suave y casi de frente: los costados de los edificios quedan celestes y no grises.
  return { ...base, layers, light: { anchor: 'viewport', color: '#FFFFFF', intensity: 0.18, position: [1.15, 200, 30] } };
}
