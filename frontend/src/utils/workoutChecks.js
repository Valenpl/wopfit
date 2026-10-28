import { loadLocal, saveLocal } from './storage';

// Ejercicios tildados de una rutina: se guardan solo en este dispositivo (no van al backend).
const key = (id, alt) => `wopfit-wk-${id}${alt ? '-' + alt : ''}`;
const parse = v => { try { return JSON.parse(v || '[]'); } catch { return []; } };

export const isAlt = s => !!(s && s.alternative && s.movedFrom);
export const getChecks = (id, alt) => parse(loadLocal(key(id, alt)));
export const setChecks = (id, alt, v) => saveLocal(key(id, alt), JSON.stringify(v));

/** Cuántos bloques de la sesión tienen todos sus ejercicios tildados. */
export function blocksDone(s) {
  if (!s || !s.content) return 0;
  const w = getChecks(s.id, isAlt(s) ? s.alternative : null);
  return s.content.blocks.filter((b, bi) => b.items.every((_, ii) => w.includes(bi + '-' + ii))).length;
}
