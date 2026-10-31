import { createSlice } from '@reduxjs/toolkit';
import { http } from '../../api/axios';
import { apiThunk } from '../helpers';
import { loadLocal } from '../../utils/storage';

// Sesión: el token JWT y el usuario (GET /users/me). Los cambios de perfil, preferencias y Premium devuelven el usuario actualizado.
export const fetchMe = apiThunk('auth/fetchMe', () => http.get('/users/me'), {
  toastError: false,
  condition: (_, { getState }) => { const a = getState().auth; return !!a.token && !a.meLoaded && !a.meLoading; }
});
export const register = apiThunk('auth/register', body => http.post('/auth/register', body), { toastError: false });
export const verify = apiThunk('auth/verify', body => http.post('/auth/verify', body), { toastError: false });
export const resendCode = apiThunk('auth/resend', email => http.post('/auth/resend', { email }), { toastError: false });
export const login = apiThunk('auth/login', body => http.post('/auth/authenticate', body), { toastError: false });
export const forgotPassword = apiThunk('auth/forgot', email => http.post('/auth/forgot', { email }), { toastError: false });
export const resetPassword = apiThunk('auth/reset', body => http.post('/auth/reset', body), { toastError: false, toast: 'Listo, ya podés usar tu contraseña nueva' });
export const updateAbout = apiThunk('auth/updateAbout', body => http.put('/users/me', body));
export const updatePreferences = apiThunk('auth/updatePreferences', body => http.put('/users/me/preferences', body));
export const changePassword = apiThunk('auth/changePassword', body => http.put('/users/me/password', body), { toastError: false, toast: 'Contraseña actualizada' });
export const activatePremium = apiThunk('auth/activatePremium', period => http.post('/users/me/subscription', { period }));
export const cancelPremium = apiThunk('auth/cancelPremium', () => http.del('/users/me/subscription'), { toast: 'Volviste al plan Gratuito' });

const initialState = { token: loadLocal('wopfit-token'), me: null, meLoaded: false, meLoading: false };

const setPlan = (state, plan) => {
  if (!state.me) return;
  state.me.plan = plan;
  if (state.me.preferences) state.me.preferences.pendingChanges = [];
};
const setSubscription = (state, changes) => {
  if (state.me && state.me.subscription) Object.assign(state.me.subscription, changes);
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: () => ({ ...initialState, token: null }),
    /** El registro termina con el plan creado: la pantalla navega y guarda el usuario en el mismo paso (ver Prefs). */
    setMe: (state, action) => { state.me = action.payload; }
  },
  extraReducers: builder => {
    const signedIn = (s, a) => { s.token = a.payload.token; s.me = a.payload.me; s.meLoaded = true; };
    const meUpdated = (s, a) => { s.me = a.payload; };
    builder
      .addCase(fetchMe.pending, s => { s.meLoading = true; })
      .addCase(fetchMe.fulfilled, (s, a) => { s.me = a.payload; s.meLoaded = true; s.meLoading = false; })
      // Si no se puede cargar el usuario, se arranca sin sesión.
      .addCase(fetchMe.rejected, s => { s.meLoading = false; s.token = null; })
      .addCase(verify.fulfilled, signedIn)
      .addCase(login.fulfilled, signedIn)
      .addCase(resetPassword.fulfilled, signedIn)
      .addCase(updateAbout.fulfilled, meUpdated)
      .addCase(updatePreferences.fulfilled, meUpdated)
      .addCase(activatePremium.fulfilled, meUpdated)
      .addCase(cancelPremium.fulfilled, meUpdated)
      // Respuestas de otros slices que cambian datos del usuario (por tipo, sin importar los slices).
      .addCase('plan/create/fulfilled', (s, a) => setPlan(s, a.payload.plan))
      .addCase('progress/lighten/fulfilled', (s, a) => setPlan(s, a.payload))
      .addCase('progress/grow/fulfilled', (s, a) => setPlan(s, a.payload))
      .addCase('wopi/ask/fulfilled', (s, a) => setSubscription(s, { wopiLeft: a.payload.left }))
      .addCase('pros/book/fulfilled', (s, a) => setSubscription(s, { consultsLeft: a.payload.left }))
      .addCase('pros/cancel/fulfilled', (s, a) => setSubscription(s, { consultsLeft: a.payload.left }));
  }
});

/** Etapa de la cuenta: sin sesión, completando datos o usando la app. */
export const selectStage = s => {
  const me = s.auth.me;
  if (!me) return 'out';
  if (!me.name) return 'about';
  if (!me.preferences) return 'prefs';
  if (!me.plan) return 'ready';
  return 'app';
};
/** Lista para mostrar: sin token, o con el usuario ya cargado. */
export const selectReady = s => !s.auth.token || s.auth.meLoaded;

export const { logout, setMe } = authSlice.actions;
export default authSlice.reducer;
