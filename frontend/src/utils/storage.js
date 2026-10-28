// localStorage y sessionStorage pueden no estar (modo privado): nunca rompen la app.
const read = (box, key, fallback) => { try { const v = box().getItem(key); return v === null ? fallback : v; } catch { return fallback; } };
const write = (box, key, value) => { try { if (value === null || value === undefined) box().removeItem(key); else box().setItem(key, value); } catch { /* sin storage */ } };

export const loadLocal = (key, fallback = null) => read(() => localStorage, key, fallback);
export const saveLocal = (key, value) => write(() => localStorage, key, value);
export const loadSession = (key, fallback = null) => read(() => sessionStorage, key, fallback);
export const saveSession = (key, value) => write(() => sessionStorage, key, value);
