import { add, shortDate, today } from '../../utils/dates';

export const rating = r => String(r).replace('.', ',');
export const leftTxt = n => (n === 1 ? 'queda 1 consulta' : `quedan ${n} consultas`);
export const nextTxt = p => (!p.nextDate ? 'Sin turnos esta semana' : `Próximo turno: ${p.nextDate === add(today(), 1) ? 'mañana' : shortDate(p.nextDate).toLowerCase()} ${p.nextTime}`);
