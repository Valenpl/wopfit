import { createSlice } from '@reduxjs/toolkit';
import { loadLocal } from '../../utils/storage';

// Estado de la interfaz: el toast, si se ve la versión celu o compu, la pestaña elegida en cada pantalla,
// el borrador de las preferencias y los ejercicios tildados. Todo síncrono, así que va en reducers.
// Solo la vista se guarda entre recargas (ver store.js); lo demás dura mientras la app esté abierta.
export const WIDE_QUERY = '(min-width: 1000px)';

/** 'auto' (según el ancho), 'celu' o 'compu'. Se puede forzar con ?modo=celu|compu. */
function initialView() {
  try {
    const q = new URLSearchParams(window.location.search).get('modo');
    if (q === 'celu' || q === 'compu') return q;
  } catch { /* sin URL */ }
  return loadLocal('wopfit-view', 'auto');
}

const initialWide = () => { try { return window.matchMedia(WIDE_QUERY).matches; } catch { return false; } };

// Lo que es de la cuenta y se borra al cerrar la sesión.
const sessionState = { tabs: {}, prefsDraft: null, workoutChecks: {} };

const uiSlice = createSlice({
  name: 'ui',
  initialState: { toast: null, nextToast: 1, view: initialView(), wide: initialWide(), ...sessionState },
  reducers: {
    showToast: (state, action) => {
      state.toast = { id: state.nextToast, msg: action.payload };
      state.nextToast += 1;
    },
    hideToast: (state, action) => {
      if (state.toast && state.toast.id === action.payload) state.toast = null;
    },
    setView: (state, action) => { state.view = action.payload; },
    setWide: (state, action) => { state.wide = action.payload; },
    /** { screen: 'comunidad' | 'comida' | 'entreno', tab } */
    setTab: (state, action) => { state.tabs[action.payload.screen] = action.payload.tab; },
    setPrefsDraft: (state, action) => { state.prefsDraft = action.payload; },
    /** { key, checks }: la key sale de checksKey (sesión y, si es la alternativa, cuál). */
    setWorkoutChecks: (state, action) => { state.workoutChecks[action.payload.key] = action.payload.checks; }
  },
  extraReducers: builder => {
    builder
      .addCase('auth/logout', state => ({ ...state, ...sessionState }))
      // Después de publicar, la comunidad se abre en "Para vos", donde aparece la publicación nueva.
      .addCase('community/create/fulfilled', state => { state.tabs.comunidad = 'para'; });
  }
});

export const selectDesk = s => s.ui.view === 'compu' || (s.ui.view === 'auto' && s.ui.wide);

export const { showToast, hideToast, setView, setWide, setTab, setPrefsDraft, setWorkoutChecks } = uiSlice.actions;
export default uiSlice.reducer;
