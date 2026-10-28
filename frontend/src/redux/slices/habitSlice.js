import { createSlice } from '@reduxjs/toolkit';
import { http } from '../../api/axios';
import { addEntryCases, apiThunk, getEntry } from '../helpers';

// Los 3 hábitos de cada día (agua, caminar, dormir).
export const fetchHabits = apiThunk('habits/fetch', date => http.get(`/habits/${date}`), { cached: (s, date) => getEntry(s.habits.days, date) });
export const saveHabits = apiThunk('habits/save', ({ date, water, walk, sleep }) => http.put(`/habits/${date}`, { water, walk, sleep }));
/** Al terminar la caminata opcional se suma el hábito "caminar": un solo thunk que lee el día (si no está) y lo guarda. */
export const markWalk = apiThunk('habits/markWalk', async (date, getState) => {
  const e = getEntry(getState().habits.days, date);
  const h = e.data || await http.get(`/habits/${date}`);
  return http.put(`/habits/${date}`, { water: h.water, walk: true, sleep: h.sleep });
}, { toast: '¡Bien ahí! Sumamos la caminata a tus hábitos' });

const initialState = { days: {}, backup: {} };
const set = (s, date, data) => { s.days[date] = { data, loaded: true, loading: false, error: null }; };

const habitSlice = createSlice({
  name: 'habits',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase('auth/logout', () => initialState)
      // Se marca al instante; si el backend falla, vuelve a como estaba.
      .addCase(saveHabits.pending, (s, a) => {
        const { date, ...h } = a.meta.arg;
        const e = s.days[date];
        if (e && e.data) { s.backup[date] = e.data; e.data = { ...e.data, ...h }; }
      })
      .addCase(saveHabits.rejected, (s, a) => {
        const { date } = a.meta.arg;
        if (s.backup[date] && s.days[date]) s.days[date].data = s.backup[date];
        delete s.backup[date];
      })
      .addCase(saveHabits.fulfilled, (s, a) => { set(s, a.meta.arg.date, a.payload); delete s.backup[a.meta.arg.date]; })
      .addCase(markWalk.fulfilled, (s, a) => set(s, a.meta.arg, a.payload));
    addEntryCases(builder, fetchHabits, 'days');
  }
});

export default habitSlice.reducer;
