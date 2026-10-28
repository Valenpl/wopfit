// Ejercicios tildados de una rutina: quedan en el store (ui.workoutChecks), no van al backend.
const NONE = [];

export const isAlt = s => !!(s && s.alternative && s.movedFrom);
export const checksKey = (id, alt) => `${id}${alt ? '-' + alt : ''}`;
export const selectChecks = (id, alt) => s => s.ui.workoutChecks[checksKey(id, alt)] || NONE;

/** Cuántos bloques de la sesión tienen todos sus ejercicios tildados. `all` es ui.workoutChecks. */
export function blocksDone(s, all) {
  if (!s || !s.content) return 0;
  const w = all[checksKey(s.id, isAlt(s) ? s.alternative : null)] || NONE;
  return s.content.blocks.filter((b, bi) => b.items.every((_, ii) => w.includes(bi + '-' + ii))).length;
}
