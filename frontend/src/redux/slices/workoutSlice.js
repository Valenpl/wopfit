import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import { http } from '../../api/axios';
import { addEntryCases, addSingleCases, apiThunk, changeOf, emptyEntry, fulfilledOf, getEntry, markAllStale, markStale } from '../helpers';

// Entrenamientos: hoy, semanas (por lunes; '' = la actual) y cada sesión por id.
export const fetchToday = apiThunk('workouts/fetchToday', () => http.get('/workouts/today'), { cached: s => s.workouts.today });
export const fetchWeek = apiThunk('workouts/fetchWeek', start => http.get(start ? `/workouts/week?start=${start}` : '/workouts/week'),
  { cached: (s, start) => getEntry(s.workouts.weeks, start || '') });
export const fetchSession = apiThunk('workouts/fetchSession', id => http.get(`/workouts/${id}`), { cached: (s, id) => getEntry(s.workouts.sessions, String(id)) });

export const reportWorkout = apiThunk('workouts/report', ({ id, reason, note }) => http.post(`/workouts/${id}/report`, { reason, note }));
export const acceptAlternative = apiThunk('workouts/acceptAlternative', ({ id, kind }) => http.post(`/workouts/${id}/accept-alternative`, { kind }), { toast: r => r.message });
export const restWorkout = apiThunk('workouts/rest', id => http.post(`/workouts/${id}/rest`), { toast: r => r.message });
export const rescheduleWorkout = apiThunk('workouts/reschedule', id => http.post(`/workouts/${id}/reschedule`), { toast: r => r.message });
export const finishWorkout = apiThunk('workouts/done', ({ id, feel, note }) => http.post(`/workouts/${id}/done`, { feel, note }), { toast: '¡Guardado! Seguí así 💪' });

const initialState = { today: emptyEntry, weeks: {}, sessions: {} };

const workoutSlice = createSlice({
  name: 'workouts',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder.addCase('auth/logout', () => initialState);
    addSingleCases(builder, fetchToday, 'today');
    addEntryCases(builder, fetchWeek, 'weeks');
    addEntryCases(builder, fetchSession, 'sessions', id => String(id));
    builder
      // La sesión que cambió se guarda con la respuesta; lo demás (hoy, la semana, otras sesiones) lo recalcula el backend.
      .addMatcher(changeOf('workouts'), (s, a) => {
        markStale(s.today);
        markAllStale(s.weeks);
        markAllStale(s.sessions);
        const session = a.type === finishWorkout.fulfilled.type ? a.payload : a.payload && a.payload.session;
        if (session) s.sessions[String(session.id)] = { data: session, loaded: true, loading: false, error: null };
      })
      // Un plan nuevo o ajustado cambia todas las sesiones que vienen.
      .addMatcher(isAnyOf(changeOf('plan'), fulfilledOf('progress/lighten', 'progress/grow')), s => {
        markStale(s.today);
        markAllStale(s.weeks);
        markAllStale(s.sessions);
      });
  }
});

export default workoutSlice.reducer;
