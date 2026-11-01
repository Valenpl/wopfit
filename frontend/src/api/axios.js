import axios from 'axios';
import { BASE_URL } from '../utils/api';

// Única instancia de axios de la app. Solo la usan los thunks de redux/slices.
const api = axios.create({ baseURL: BASE_URL, headers: { Accept: 'application/json' } });

// El store se inyecta desde store.js para no importar el store acá (sería un import circular).
let store;
export const injectStore = s => { store = s; };

api.interceptors.request.use(config => {
  const token = store && store.getState().auth.token;
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

// Todos los errores llegan a los thunks con la misma forma: { status, message, fields }.
api.interceptors.response.use(res => res, error => {
  const status = error.response ? error.response.status : 0;
  const data = error.response && error.response.data;
  // Sesión vencida: se cierra la sesión (la acción 'auth/logout' la define authSlice).
  if (status === 401 && store && store.getState().auth.token) store.dispatch({ type: 'auth/logout' });
  return Promise.reject({
    status,
    message: (data && data.error) || (status ? 'Algo salió mal. Probá de nuevo.' : 'No pudimos conectarnos con el servidor. Revisá tu conexión.'),
    fields: (data && data.fields) || {}
  });
});

/** Atajos que devuelven directamente el cuerpo de la respuesta. */
export const http = {
  get: url => api.get(url).then(r => r.data),
  post: (url, body) => api.post(url, body).then(r => r.data),
  put: (url, body) => api.put(url, body).then(r => r.data),
  del: url => api.delete(url).then(r => r.data)
};

export default api;
