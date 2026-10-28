import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import { http } from '../../api/axios';
import { addSingleCases, apiThunk, changeOf, emptyEntry, fulfilledOf, markStale } from '../helpers';

// Progreso e historial: los calcula el backend con todo lo demás, así que cualquier cambio los deja desactualizados.
export const fetchProgress = apiThunk('progress/fetch', () => http.get('/users/me/progress'), { cached: s => s.progress.summary });
export const fetchHistory = apiThunk('progress/fetchHistory', () => http.get('/users/me/history'), { cached: s => s.progress.history });
export const lightenPlan = apiThunk('progress/lighten', () => http.post('/users/me/plan/lighten'), { toast: 'Listo, tu plan ahora es más liviano' });
export const growPlan = apiThunk('progress/grow', () => http.post('/users/me/plan/grow'), { toast: '¡Listo! Tu plan subió un escalón' });
export const dismissSuggestion = apiThunk('progress/dismiss', type => http.post('/users/me/plan/dismiss', { type }), { toast: 'Lo dejamos como está' });

const initialState = { summary: emptyEntry, history: emptyEntry };

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase('auth/logout', () => initialState)
      // Descartar la sugerencia solo la saca de la pantalla.
      .addCase(dismissSuggestion.fulfilled, s => { if (s.summary.data) s.summary.data.suggestion = null; });
    addSingleCases(builder, fetchProgress, 'summary');
    addSingleCases(builder, fetchHistory, 'history');
    builder.addMatcher(isAnyOf(changeOf('workouts', 'habits', 'goals', 'meals', 'plan'), fulfilledOf('progress/lighten', 'progress/grow')), s => {
      markStale(s.summary);
      markStale(s.history);
    });
  }
});

export default progressSlice.reducer;
