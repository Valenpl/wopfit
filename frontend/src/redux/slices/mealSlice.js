import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import { http } from '../../api/axios';
import { addEntryCases, apiThunk, changeOf, fulfilledOf, getEntry, markAllStale } from '../helpers';

// Comidas por día y lista del súper (por la fecha que se pidió: el backend arma la semana de esa fecha).
export const fetchMealDay = apiThunk('meals/fetchDay', date => http.get(`/meals/${date}`), { cached: (s, date) => getEntry(s.meals.days, date) });
export const fetchShopping = apiThunk('meals/fetchShopping', date => http.get(`/shopping-lists/${date}`), { cached: (s, date) => getEntry(s.meals.shopping, date) });

export const eatMeal = apiThunk('meals/eaten', ({ date, slot }) => http.post(`/meals/${date}/${slot}/eaten`), { toast: '¡Bien ahí! 🍽️' });
export const swapMeal = apiThunk('meals/swap', ({ date, slot }) => http.post(`/meals/${date}/${slot}/swap`), { toast: 'Te dejamos otra opción' });
export const skipMeal = apiThunk('meals/skip', ({ date, slot }) => http.post(`/meals/${date}/${slot}/skip`), { toast: 'Anotado. Mañana seguimos' });
/** `message`: el toast que se muestra (Wopi usa uno propio). */
export const acceptMeal = apiThunk('meals/accept', ({ date, slot, name }) => http.post(`/meals/${date}/${slot}/accept`, { name }),
  { toast: (_, arg) => arg.message || 'Listo, cambiamos tu comida' });
/** Devuelve la propuesta; no cambia nada todavía. */
export const reportMeal = apiThunk('meals/report', ({ date, slot, reason }) => http.post(`/meals/${date}/${slot}/report`, { reason }));
export const checkShoppingItem = apiThunk('meals/check', ({ date, name, checked }) => http.put(`/shopping-lists/${date}`, { name, checked }));

const initialState = { days: {}, shopping: {} };

const flipItem = (s, { date, name, checked }) => {
  const e = s.shopping[date];
  if (!e || !e.data) return;
  e.data.items = e.data.items.map(i => (i.name === name ? { ...i, checked } : i));
};

const mealSlice = createSlice({
  name: 'meals',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase('auth/logout', () => initialState)
      // Tildar en la lista se ve al instante; si falla, vuelve como estaba.
      .addCase(checkShoppingItem.pending, (s, a) => flipItem(s, a.meta.arg))
      .addCase(checkShoppingItem.rejected, (s, a) => flipItem(s, { ...a.meta.arg, checked: !a.meta.arg.checked }))
      .addCase(checkShoppingItem.fulfilled, (s, a) => { s.shopping[a.meta.arg.date] = { data: a.payload, loaded: true, loading: false, error: null }; });
    addEntryCases(builder, fetchMealDay, 'days');
    addEntryCases(builder, fetchShopping, 'shopping');
    builder
      // Registrar, cambiar o saltear devuelven el día completo: se guarda tal cual, sin volver a pedirlo.
      .addMatcher(isAnyOf(eatMeal.fulfilled, swapMeal.fulfilled, skipMeal.fulfilled, acceptMeal.fulfilled), (s, a) => {
        s.days[a.meta.arg.date] = { data: a.payload, loaded: true, loading: false, error: null };
      })
      // Cambiar una comida cambia los ingredientes de la semana.
      .addMatcher(isAnyOf(swapMeal.fulfilled, skipMeal.fulfilled, acceptMeal.fulfilled), s => markAllStale(s.shopping))
      .addMatcher(isAnyOf(changeOf('plan'), fulfilledOf('progress/lighten', 'progress/grow')), s => { markAllStale(s.days); markAllStale(s.shopping); });
  }
});

export default mealSlice.reducer;
