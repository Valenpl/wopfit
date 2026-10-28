import { createSlice } from '@reduxjs/toolkit';
import { http } from '../../api/axios';
import { addEntryCases, addSingleCases, apiThunk, emptyEntry, fulfilledOf, getEntry, markAllStale, markStale } from '../helpers';

// Ayuda profesional: listado (con mis consultas y el cupo del mes) y la agenda de cada profesional.
export const fetchPros = apiThunk('pros/fetch', () => http.get('/pros'), { cached: s => s.pros.list });
export const fetchPro = apiThunk('pros/fetchOne', id => http.get(`/pros/${id}`), { cached: (s, id) => getEntry(s.pros.details, String(id)) });
export const bookConsult = apiThunk('pros/book', ({ id, date, time, mode }) => http.post(`/pros/${id}/book`, { date, time, mode }));
export const cancelConsult = apiThunk('pros/cancel', id => http.del(`/consultations/${id}`), { toast: r => r.message });

const initialState = { list: emptyEntry, details: {} };
const byDate = (a, b) => (a.date + a.time).localeCompare(b.date + b.time);

const proSlice = createSlice({
  name: 'pros',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase('auth/logout', () => initialState)
      .addCase(bookConsult.fulfilled, (s, a) => {
        if (s.list.data) {
          s.list.data.mine = [...s.list.data.mine, a.payload.consult].sort(byDate);
          s.list.data.left = a.payload.left;
        }
        markAllStale(s.details); // el turno ya no está libre
      })
      // Si el turno se ocupó mientras elegías (409), se vuelve a pedir la agenda.
      .addCase(bookConsult.rejected, (s, a) => { if (a.payload && a.payload.status === 409) markStale(s.details[String(a.meta.arg.id)]); })
      .addCase(cancelConsult.fulfilled, (s, a) => {
        if (s.list.data) {
          s.list.data.mine = s.list.data.mine.filter(c => c.id !== a.payload.id);
          s.list.data.left = a.payload.left;
        }
        markAllStale(s.details);
      });
    addSingleCases(builder, fetchPros, 'list');
    addEntryCases(builder, fetchPro, 'details', id => String(id));
    builder.addMatcher(fulfilledOf('auth/activatePremium', 'auth/cancelPremium'), s => {
      markStale(s.list);
      markAllStale(s.details);
    });
  }
});

export default proSlice.reducer;
