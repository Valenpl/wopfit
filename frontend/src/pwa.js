// Instalar la app: registra el service worker (solo en la versión publicada) y guarda el aviso de instalación de Chrome.
let prompt = null;
const listeners = new Set();
const notify = () => listeners.forEach(fn => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); prompt = e; notify(); });
  window.addEventListener('appinstalled', () => { prompt = null; notify(); });
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
}

/** Se abrió desde el ícono de la pantalla de inicio. */
export const isStandalone = () => {
  try { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch { return false; }
};

/** El navegador ofrece instalar con un botón (Chrome, Edge, Android). En iPhone no: se hace desde Compartir. */
export const canInstall = () => prompt !== null;

/** Abre el aviso del navegador. Devuelve true si la persona aceptó. */
export async function install() {
  if (!prompt) return false;
  const p = prompt;
  prompt = null;
  p.prompt();
  const { outcome } = await p.userChoice;
  notify();
  return outcome === 'accepted';
}

/** Avisa cuando cambia si se puede instalar. Devuelve la función para dejar de escuchar. */
export function onInstallChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
