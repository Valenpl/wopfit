// Íconos, catálogos y utilidades de fecha compartidas por todas las pantallas.
const C = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const P = {
  back: 'M15 18l-6-6 6-6', arrow: 'M5 12h14M13 6l6 6-6 6', chev: 'M9 6l6 6-6 6', check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6L6 18', plus: 'M12 5v14M5 12h14', minus: 'M5 12h14',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z' + C(12, 12, 3), eyeoff: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM3 3l18 18',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6', lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3', cal: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  clock: C(12, 12, 9) + 'M12 7v5l3 2', user: C(12, 8, 4) + 'M4 21c0-4 3.6-6 8-6s8 2 8 6',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6', move: 'M5 19L19 5M13 5h6v6M5 13v6h6', leaf: 'M5 19C5 11 11 5 20 5c0 9-6 15-14 15M5 19l7-7',
  scale: 'M4 4h16v16H4zM8 10a4 4 0 0 1 8 0M12 10l1.5-2', dumb: 'M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12', moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  wind: 'M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7', drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  walk: C(13, 4.5, 1.6) + 'M9 21l2.2-6.5L14 17v4M8 12.5l2.5-4.5 3.5 1 2 3.5M11.2 14.5L12.5 9', run: C(15, 4.5, 1.6) + 'M5 12l3-3 4 1 2 3 3 1M10 10l-2 5-4 2M12 13l-1 4 3 4',
  yoga: C(12, 4.5, 1.6) + 'M12 7v6M6 10l6 2 6-2M5 19c2-2 4-3 7-3s5 1 7 3', bike: C(6, 16, 3.5) + C(18, 16, 3.5) + 'M6 16l4-7h5l3 7M10 9l2 7h-1M14 5h2',
  music: 'M9 18V5l11-2v13' + C(6.5, 18, 2.5) + C(17.5, 16, 2.5), flag: 'M5 21V4M5 4h11l-2 4 2 4H5', star: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
  fork: 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 2-3 5v4h3M17 3v18', cash: 'M3 7h18v10H3z' + C(12, 12, 2.5), sliders: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4', spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  history: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 8v4l3 2', info: C(12, 12, 9) + 'M12 11v5M12 8v.01',
  sun: C(12, 12, 4) + 'M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
  heart: 'M12 20s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.5-8 11-8 11z', home: 'M3 11l9-7 9 7v9H3zM9 20v-6h6v6',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5', basket: 'M3 9h18l-2 11H5zM8 9l4-6 4 6', logout: 'M14 4h6v16h-6M10 8l-4 4 4 4M6 12h10',
  users: C(9, 8, 3.5) + 'M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2.5.6 4 2.3 4 5.5', chat: 'M4 5h16v11H9l-5 4z',
  steth: 'M6 3v6a4 4 0 0 0 8 0V3M10 13v3a5 5 0 0 0 10 0v-2', pin: 'M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z',
  tag: 'M3 12V4h8l10 10-8 8zM7.5 8.5v.01', phone: 'M8 3h8v18H8zM11 18h2', grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  search: C(11, 11, 7) + 'M20 20l-4-4', copy: 'M8 8h12v12H8zM4 16V4h12', nav: 'M3 11l18-8-8 18-2-8z', bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4',
  send: 'M4 12l16-8-6 16-3-7z', bookmark: 'M6 3h12v18l-6-4-6 4z', share: 'M12 3v12M7 8l5-5 5 5M5 13v8h14v-8', down: 'M12 4v14M6 12l6 6 6-6', img: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6'
};
export function Icon({ n, className = '', style }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[n]} /></svg>;
}
export const IconInline = ({ n }) => <Icon n={n} style={{ width: 15, height: 15, verticalAlign: -3 }} />;

export const GOALS = [
  { k: 'mover', t: 'Moverme más', d: 'Romper el sedentarismo diario', i: 'move' },
  { k: 'comer', t: 'Comer mejor', d: 'Hábitos simples de nutrición', i: 'leaf', p: 1 },
  { k: 'peso', t: 'Bajar de peso', d: 'A tu ritmo, sin dietas extremas', i: 'scale' },
  { k: 'fuerza', t: 'Ganar fuerza', d: 'Construir masa muscular', i: 'dumb' },
  { k: 'dormir', t: 'Dormir mejor', d: 'Descanso nocturno profundo', i: 'moon' },
  { k: 'estres', t: 'Reducir estrés', d: 'Respiración y recuperación', i: 'wind', p: 1 }
];
export const goal = k => GOALS.find(g => g.k === k) || GOALS[0];
export const BUDGET = {
  bajo: { t: 'Bajo', r: '$15.000 a $25.000', tag: 'Económico' },
  medio: { t: 'Medio', r: '$25.000 a $45.000' },
  alto: { t: 'Alto', r: 'Más de $45.000', tag: 'Variado' }
};

// Premium (demostración: se activa sin pagar)
export const PRICES = {
  mensual: { t: 'Mensual', s: 'US$ 9,99', u: 'por mes' },
  semestral: { t: 'Semestral', s: 'US$ 53,99', u: 'cada 6 meses', save: 'Ahorrás 10%', eq: 'Equivale a US$ 9 por mes' },
  anual: { t: 'Anual', s: 'US$ 95,99', u: 'por año', save: 'Ahorrás 20%', eq: 'Equivale a US$ 8 por mes' }
};
export const FREE_F = ['Plan básico de alimentación y entrenamiento', 'Asistente IA (consultas limitadas)', 'Comunidad', 'Buscador básico de precios', 'Con anuncios de aliados'];
export const PREM_F = ['Todo lo del Gratuito', 'Asistente IA con más consultas', 'Seguimiento de hábitos y progreso', 'Buscador de lugares cercanos', '2 consultas por mes con nutricionistas o entrenadores', 'Alertas de ofertas', 'Promociones de aliados', 'Sin anuncios'];
export const isPremium = me => !!(me && me.subscription && me.subscription.premium);

// Lugares y ofertas de demostración
export const PCATS = [['todos', 'Todos', '📍'], ['super', 'Supermercados', '🛒'], ['diet', 'Dietéticas', '🌾'], ['verdu', 'Verdulerías', '🥬'], ['gym', 'Gimnasios', '🏋️'], ['parque', 'Parques', '🌳']];
export const PCOL = { super: '#1E7FCB', diet: '#C08A2B', verdu: '#6DBB3A', gym: '#8E6BD1', parque: '#2E9E6A' };
export const PEMO = { super: '🛒', diet: '🌾', verdu: '🥬', gym: '🏋️', parque: '🌳' };
export const OCATS = [['todas', 'Todas', '🏷️'], ['super', 'Supermercados', '🛒'], ['diet', 'Dietéticas', '🌾'], ['gym', 'Gimnasios', '🏋️'], ['ropa', 'Ropa deportiva', '👟'], ['supl', 'Suplementos', '💊']];
/** Si no hay ubicación, la demo se centra en UADE (Lima 775, Monserrat). */
export const DEFAULT_HERE = { lat: -34.6170, lng: -58.3818, real: false };
/** Distancia en metros entre dos puntos {lat, lng}. */
export function meters(a, b) {
  const R = 6371000, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}
export const distTxt = m => (m < 1000 ? m + ' m' : (m / 1000).toFixed(1).replace('.', ',') + ' km');
export const ACTS = [{ k: 'caminar', t: 'Caminar', i: 'walk' }, { k: 'correr', t: 'Correr', i: 'run' }, { k: 'yoga', t: 'Yoga', i: 'yoga' }, { k: 'pesas', t: 'Pesas', i: 'dumb' }, { k: 'bici', t: 'Bici', i: 'bike' }, { k: 'baile', t: 'Baile', i: 'music' }];
export const AVOID = [{ k: 'lacteos', t: 'Lácteos', s: 'Sin lácteos' }, { k: 'gluten', t: 'Gluten', s: 'Sin gluten' }, { k: 'tacc', t: 'Soy celíaca/o (sin TACC)', s: 'Sin TACC' }, { k: 'carne', t: 'Carne', s: 'Sin carne' }];
export const HEALTH = [{ k: 'diabetes', t: 'Diabetes' }, { k: 'presion', t: 'Presión alta' }, { k: 'embarazo', t: 'Embarazo' }, { k: 'lesion', t: 'Lesión o dolor crónico' }];
export const LEVELS = [
  { k: 'principiante', t: 'Principiante', d: 'Arrancás desde cero o hace mucho que no entrenás' },
  { k: 'intermedio', t: 'Intermedio', d: 'Entrenás 2 o 3 veces por semana con constancia' },
  { k: 'avanzado', t: 'Avanzado', d: 'Ritmo exigente, dominio técnico y alta frecuencia' }
];
export const EQUIP = [{ k: 'nada', t: 'Nada (solo mi cuerpo)' }, { k: 'mancuernas', t: 'Mancuernas' }, { k: 'banda', t: 'Banda elástica' }, { k: 'colchoneta', t: 'Colchoneta' }, { k: 'gym', t: 'Gimnasio completo' }];
export const HABITS = [{ k: 'water', t: 'Tomar 2 L de agua', s: 'Agua', i: 'drop' }, { k: 'walk', t: 'Caminar 20 min', s: 'Caminar', i: 'walk' }, { k: 'sleep', t: 'Dormir 7 h', s: 'Dormir', i: 'moon' }];
export const FEELS = [['😣', 'Muy pesado'], ['😕', 'Pesado'], ['🙂', 'Bien'], ['😊', 'Muy bien'], ['🤩', 'Genial']];
export const REASONS = [['tiempo', 'No tuve tiempo'], ['cansada', 'Estaba cansada/o'], ['dolor', 'Me dolía algo'], ['equipo', 'No tenía el equipamiento'], ['otro', 'Otro motivo']];
export const MREASONS = [['tiempo', 'No tuve tiempo de cocinar'], ['ingred', 'No tenía los ingredientes'], ['afuera', 'Comí afuera'], ['caro', 'Era caro para mi presupuesto'], ['hambre', 'No tenía hambre'], ['otro', 'Otro motivo']];
export const META_OPTS = {
  mover: ['Caminar 20 min', 'Entrenar 30 min', 'Estirar 10 min'],
  comer: ['Cocinar en casa', 'Comer 2 frutas', 'Tomar 2 L de agua'],
  peso: ['Caminar 30 min', 'Cocinar en casa', 'Evitar ultraprocesados'],
  fuerza: ['Entrenar fuerza 30 min', 'Sumar proteína en cada comida', 'Estirar 10 min'],
  dormir: ['Dormir 7 h', 'Sin pantallas 30 min antes de dormir', 'Cenar liviano'],
  estres: ['Respirar 5 min', 'Caminar 20 min', 'Pausa activa 10 min']
};
export const MEAL_BG = ['#FFF1C9', '#E5F4DA', '#E3F1FC'];
const HOWTO = {
  'Sentadilla': 'Pies al ancho de hombros, bajá como si te sentaras en una silla, con la espalda recta y las rodillas en línea con los pies. Subí empujando con los talones.',
  'Press': 'De pie, con los codos a la altura de los hombros, empujá hacia arriba sin arquear la espalda. Bajá lento.',
  'Remo': 'Inclinate hacia adelante con la espalda recta y llevá el peso hacia la cadera, juntando los omóplatos.',
  'Flexiones': 'Manos al ancho de hombros, cuerpo en línea recta. Bajá el pecho controlado y empujá para subir.',
  'Plancha': 'Antebrazos en el piso, cuerpo en línea recta de cabeza a talones. Apretá el abdomen y respirá.',
  'Puente': 'Boca arriba con las rodillas flexionadas, elevá la cadera apretando los glúteos y bajá lento.',
  'Gato-vaca': 'En cuatro apoyos, alterná redondear la espalda (gato) y arquearla suave (vaca), siguiendo la respiración.',
  'Estocadas': 'Da un paso largo y bajá hasta que ambas rodillas formen 90°. Volvé y cambiá de pierna.',
  'Caminata': 'Mantené un ritmo en el que puedas hablar pero no cantar. Brazos sueltos y postura erguida.',
  'Bicho muerto': 'Boca arriba, brazos y piernas arriba. Bajá brazo y pierna opuestos sin despegar la zona lumbar del piso.'
};
export const howto = n => { const k = Object.keys(HOWTO).find(x => n.includes(x)); return k ? HOWTO[k] : 'Hacelo a un ritmo cómodo, con buena postura y respirando de forma pareja. Si algo duele, pará.'; };

// ---- fechas (siempre 'AAAA-MM-DD', hora local) ----
export const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const DAYL = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
export const DAYF = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const MON = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const pad = n => String(n).padStart(2, '0');
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const add = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return dkey(d); };
export const dow = k => (parse(k).getDay() + 6) % 7;
export const monday = k => add(k, -dow(k));
export const today = () => dkey(new Date());
export const dayNum = k => parse(k).getDate();
export const monthName = k => MON[parse(k).getMonth()];
export const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
export const shortDate = k => `${DAYS[dow(k)]} ${dayNum(k)} ${monthName(k).slice(0, 3)}`;
export const longDay = k => `${DAYF[dow(k)]} ${dayNum(k)}`;
export const money = n => '$' + Math.round(n).toLocaleString('es-AR');
export const daysText = ds => { const n = [...ds].sort().map(i => DAYS[i]); return n.length > 1 ? n.slice(0, -1).join(', ') + ' y ' + n[n.length - 1] : n[0] || '—'; };
export const firstName = me => ((me && me.name) || 'vos').split(' ')[0];
