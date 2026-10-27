// Cliente de la API de WopFit. El token JWT se guarda en localStorage.
const BASE = import.meta.env.VITE_API_URL || '/api';
/** URL absoluta de algo que devuelve la API como "/api/..." (por ejemplo una foto), aunque el front esté en otro dominio. */
export const apiUrl = path => BASE.replace(/\/api\/?$/, '') + path;
const TOKEN_KEY = 'wopfit-token';

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = t => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* sin storage */ } };

export class ApiError extends Error {
  constructor(status, message, fields) { super(message); this.status = status; this.fields = fields || {}; }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = fn => { onUnauthorized = fn; };

export const isAbort = e => e && e.name === 'AbortError';
const aborted = () => new DOMException('Pedido cancelado', 'AbortError');

async function request(method, path, body, signal) {
  const headers = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(BASE + path, { method, headers, signal, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch (e) {
    if (isAbort(e)) throw e;
    throw new ApiError(0, 'No pudimos conectarnos con el servidor. Revisá tu conexión.');
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(res.status, (data && data.error) || 'Algo salió mal. Probá de nuevo.', data && data.fields);
  }
  return data;
}

// GET en curso, por token + ruta. Si dos componentes (o el doble efecto de StrictMode) piden lo mismo a la vez, sale un solo fetch.
const inflight = new Map();

function start(key, path) {
  const ctrl = new AbortController();
  const entry = { ctrl, users: 0, promise: request('GET', path, undefined, ctrl.signal) };
  entry.promise.catch(() => {}).finally(() => { if (inflight.get(key) === entry) inflight.delete(key); });
  inflight.set(key, entry);
  return entry;
}

function shared(path, signal) {
  const key = (getToken() || '') + ' ' + path;
  const entry = inflight.get(key) || start(key, path);
  entry.users++;
  return new Promise((resolve, reject) => {
    let left = false;
    const leave = () => { if (left) return false; left = true; entry.users--; signal?.removeEventListener('abort', onAbort); return true; };
    function onAbort() {
      if (!leave()) return;
      reject(aborted());
      // El fetch se cancela recién si nadie lo retomó en este mismo ciclo (StrictMode desmonta y vuelve a montar al instante).
      setTimeout(() => { if (entry.users === 0 && inflight.get(key) === entry) { inflight.delete(key); entry.ctrl.abort(); } }, 0);
    }
    if (signal?.aborted) { onAbort(); return; }
    signal?.addEventListener('abort', onAbort, { once: true });
    entry.promise.then(v => { if (leave()) resolve(v); }, err => { if (leave()) reject(err); });
  });
}

/** Un cambio deja viejos los GET en curso: los que vengan después piden datos nuevos. */
const write = (method, p, b) => { inflight.clear(); return request(method, p, b); };

export const api = {
  /** `signal` (opcional) cancela este pedido; el fetch compartido sigue si otro lo está esperando. */
  get: (p, signal) => shared(p, signal),
  post: (p, b) => write('POST', p, b),
  put: (p, b) => write('PUT', p, b),
  del: p => write('DELETE', p)
};
