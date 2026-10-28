import { createSlice } from '@reduxjs/toolkit';
import { http } from '../../api/axios';
import { addSingleCases, apiThunk, emptyEntry } from '../helpers';

// Metas: la lista se pide una vez y después se actualiza con cada respuesta (push, findIndex, sin volver a pedirla).
export const fetchGoals = apiThunk('goals/fetch', () => http.get('/goals'), { cached: s => s.goals.list });
export const createGoal = apiThunk('goals/create', body => http.post('/goals', body), { toast: '¡Meta guardada!' });
export const checkGoal = apiThunk('goals/check', id => http.post(`/goals/${id}/check`),
  { toast: g => (g.done ? '¡Meta cumplida! 🎉' : g.checkedToday ? '¡Sumaste uno!' : 'Desmarcado') });

const initialState = { list: emptyEntry };

const goalSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase('auth/logout', () => initialState)
      // La lista viene ordenada de la más nueva a la más vieja.
      .addCase(createGoal.fulfilled, (s, a) => { if (s.list.data) s.list.data.unshift(a.payload); })
      .addCase(checkGoal.fulfilled, (s, a) => {
        if (!s.list.data) return;
        const i = s.list.data.findIndex(g => g.id === a.payload.id);
        if (i >= 0) s.list.data[i] = a.payload;
      });
    addSingleCases(builder, fetchGoals, 'list');
  }
});

export default goalSlice.reducer;
