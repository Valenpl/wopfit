import { createAsyncThunk } from '@reduxjs/toolkit';
import { showToast } from './slices/uiSlice';

/**
 * Cada dato que viene del backend se guarda como una "entrada":
 * - loaded: ya está y está al día (no se vuelve a pedir).
 * - loading: hay un pedido en curso (no sale otro igual).
 * - data se mantiene aunque la entrada quede desactualizada, así la pantalla no parpadea.
 */
export const emptyEntry = { data: null, loaded: false, loading: false, error: null };
export const getEntry = (map, key) => (map && map[key]) || emptyEntry;
export const needsFetch = e => !e || (!e.loaded && !e.loading);

/** Marca como desactualizadas una entrada o todas las de un mapa: se vuelven a pedir una vez cuando se muestran. */
export const markStale = e => { if (e) e.loaded = false; };
export const markAllStale = map => Object.values(map).forEach(markStale);

const toError = e => ({ status: (e && e.status) || 0, message: (e && e.message) || 'Algo salió mal. Probá de nuevo.', fields: (e && e.fields) || {} });

/**
 * createAsyncThunk con lo que repetimos en todos los pedidos.
 * - request(arg, getState) hace el pedido con `http` y devuelve el dato.
 * - cached(state, arg) devuelve la entrada del store: si ya está o se está pidiendo, el pedido no sale (sin doble fetch).
 * - toast: mensaje (o función del resultado) que se muestra si sale bien.
 * - toastError: si es false, el error no se muestra como toast (la pantalla lo muestra en el formulario).
 */
export function apiThunk(type, request, { cached, condition, toast, toastError = true } = {}) {
  const cond = condition || (cached ? (arg, { getState }) => needsFetch(cached(getState(), arg)) : undefined);
  return createAsyncThunk(type, async (arg, { dispatch, getState, rejectWithValue }) => {
    try {
      const data = await request(arg, getState);
      const msg = typeof toast === 'function' ? toast(data, arg) : toast;
      if (msg) dispatch(showToast(msg));
      return data;
    } catch (e) {
      const err = toError(e);
      if (toastError) dispatch(showToast(err.message));
      return rejectWithValue(err);
    }
  }, cond ? { condition: cond } : undefined);
}

/** Casos pending/fulfilled/rejected de un thunk de lectura que guarda en `state[field][key]`. */
export function addEntryCases(builder, thunk, field, keyOf = arg => arg || '') {
  builder
    .addCase(thunk.pending, (s, a) => {
      const k = keyOf(a.meta.arg);
      s[field][k] = { ...getEntry(s[field], k), loading: true, error: null };
    })
    .addCase(thunk.fulfilled, (s, a) => {
      s[field][keyOf(a.meta.arg)] = { data: a.payload, loaded: true, loading: false, error: null };
    })
    .addCase(thunk.rejected, (s, a) => {
      const k = keyOf(a.meta.arg);
      s[field][k] = { ...getEntry(s[field], k), loading: false, error: a.payload || toError(a.error) };
    });
}

/** Lo mismo para un dato único, guardado en `state[field]`. */
export function addSingleCases(builder, thunk, field) {
  builder
    .addCase(thunk.pending, s => { s[field] = { ...s[field], loading: true, error: null }; })
    .addCase(thunk.fulfilled, (s, a) => { s[field] = { data: a.payload, loaded: true, loading: false, error: null }; })
    .addCase(thunk.rejected, (s, a) => { s[field] = { ...s[field], loading: false, error: a.payload || toError(a.error) }; });
}

/**
 * Matcher para "salió bien un cambio" (POST/PUT/DELETE) de otros slices, por nombre de slice.
 * Los thunks de lectura se llaman fetchX, así que quedan afuera.
 * Se usa con el nombre del slice (y no importando sus thunks) para no tener imports circulares entre slices.
 */
export const changeOf = (...slices) => a => {
  if (!a.type.endsWith('/fulfilled')) return false;
  const [slice, name] = a.type.split('/');
  return slices.includes(slice) && !name.startsWith('fetch');
};

/** Matcher para acciones puntuales, por tipo: fulfilledOf('auth/activatePremium'). */
export const fulfilledOf = (...types) => a => types.some(t => a.type === t + '/fulfilled');

/** Pausa para que una animación dure al menos `ms` (por ejemplo "Wopi está escribiendo"). */
export const wait = ms => new Promise(res => setTimeout(res, ms));
