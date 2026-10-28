// localStorage puede no estar (modo privado): nunca rompe la app. Solo guarda el token y la vista (ver store.js).
const read = (box, key, fallback) => { try { const v = box().getItem(key); return v === null ? fallback : v; } catch { return fallback; } };
const write = (box, key, value) => { try { if (value === null || value === undefined) box().removeItem(key); else box().setItem(key, value); } catch { /* sin storage */ } };

export const loadLocal = (key, fallback = null) => read(() => localStorage, key, fallback);
export const saveLocal = (key, value) => write(() => localStorage, key, value);
