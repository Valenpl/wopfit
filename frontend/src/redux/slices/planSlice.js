import { createSlice } from '@reduxjs/toolkit';
import { http } from '../../api/axios';
import { apiThunk, wait } from '../helpers';

// Crear o actualizar el plan (POST /plan). El plan nuevo lo guarda authSlice en me.plan, sin volver a pedir /me.
// `minMs`: duración mínima, para que la pantalla "Reacomodando tu plan…" se llegue a ver.
export const createPlan = apiThunk('plan/create', async ({ minMs = 0 } = {}) => {
  const [r] = await Promise.all([http.post('/plan'), wait(minMs)]);
  return r;
}, { condition: (_, { getState }) => !getState().plan.creating });

/** Último paso del registro: guarda las preferencias y crea el plan, en un solo thunk. */
export const setupPlan = apiThunk('plan/setup', async prefs => {
  const me = await http.put('/me/preferences', prefs);
  const r = await http.post('/plan');
  return { me: { ...me, plan: r.plan, preferences: { ...me.preferences, pendingChanges: [] } }, changes: r.changes };
}, { condition: (_, { getState }) => !getState().plan.creating });

const planSlice = createSlice({
  name: 'plan',
  initialState: { creating: false },
  reducers: {},
  extraReducers: builder => {
    for (const t of [createPlan, setupPlan]) {
      builder
        .addCase(t.pending, s => { s.creating = true; })
        .addCase(t.fulfilled, s => { s.creating = false; })
        .addCase(t.rejected, s => { s.creating = false; });
    }
  }
});

export default planSlice.reducer;
