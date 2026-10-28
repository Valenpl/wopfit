// Catálogos fijos de la app: objetivos, presupuestos, precios, motivos, etc.
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

// Lugares y ofertas de demostración
export const PCATS = [['todos', 'Todos', '📍'], ['super', 'Supermercados', '🛒'], ['diet', 'Dietéticas', '🌾'], ['verdu', 'Verdulerías', '🥬'], ['gym', 'Gimnasios', '🏋️'], ['parque', 'Parques', '🌳']];
export const PCOL = { super: '#1E7FCB', diet: '#C08A2B', verdu: '#6DBB3A', gym: '#8E6BD1', parque: '#2E9E6A' };
export const PEMO = { super: '🛒', diet: '🌾', verdu: '🥬', gym: '🏋️', parque: '🌳' };
export const OCATS = [['todas', 'Todas', '🏷️'], ['super', 'Supermercados', '🛒'], ['diet', 'Dietéticas', '🌾'], ['gym', 'Gimnasios', '🏋️'], ['ropa', 'Ropa deportiva', '👟'], ['supl', 'Suplementos', '💊']];
/** Si no hay ubicación, la demo se centra en UADE (Lima 775, Monserrat). */
export const DEFAULT_HERE = { lat: -34.6170, lng: -58.3818, real: false };
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
