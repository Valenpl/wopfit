// Dirección de la API. La usan api/axios.js (baseURL) y los componentes que muestran archivos del backend (fotos).
export const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

/** URL absoluta de algo que devuelve la API como "/api/v1/..." (por ejemplo una foto), aunque el front esté en otro dominio. */
export const apiUrl = path => BASE_URL.replace(/\/api\/v1\/?$/, '') + path;
