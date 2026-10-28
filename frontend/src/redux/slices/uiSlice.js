import { createSlice } from '@reduxjs/toolkit';
import { loadLocal } from '../../utils/storage';

// Estado de la interfaz: el toast y si se ve la versión celu o compu. Todo síncrono, así que va en reducers.
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

const uiSlice = createSlice({
  name: 'ui',
  initialState: { toast: null, nextToast: 1, view: initialView(), wide: initialWide() },
  reducers: {
    showToast: (state, action) => {
      state.toast = { id: state.nextToast, msg: action.payload };
      state.nextToast += 1;
    },
    hideToast: (state, action) => {
      if (state.toast && state.toast.id === action.payload) state.toast = null;
    },
    setView: (state, action) => { state.view = action.payload; },
    setWide: (state, action) => { state.wide = action.payload; }
  }
});

export const selectDesk = s => s.ui.view === 'compu' || (s.ui.view === 'auto' && s.ui.wide);

export const { showToast, hideToast, setView, setWide } = uiSlice.actions;
export default uiSlice.reducer;
