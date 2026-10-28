import { createSlice, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

/**
 * Estado del último pedido de cada thunk ('goals/create', 'auth/login', ...): loading, succeeded o failed,
 * con su resultado o su error. Así una pantalla sabe cómo terminó lo que mandó leyendo el store (hook useRequest),
 * sin encadenar .unwrap() en el componente.
 */
const typeOf = a => a.type.slice(0, a.type.lastIndexOf('/'));

const requestSlice = createSlice({
  name: 'requests',
  initialState: {},
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase('auth/logout', () => ({}))
      .addMatcher(isPending, (s, a) => {
        s[typeOf(a)] = { status: 'loading', requestId: a.meta.requestId, arg: a.meta.arg, result: null, error: null };
      })
      .addMatcher(isFulfilled, (s, a) => {
        const r = s[typeOf(a)];
        if (r && r.requestId === a.meta.requestId) { r.status = 'succeeded'; r.result = a.payload; }
      })
      .addMatcher(isRejected, (s, a) => {
        const r = s[typeOf(a)];
        if (r && r.requestId === a.meta.requestId) { r.status = 'failed'; r.error = a.payload || { status: 0, message: a.error.message, fields: {} }; }
      });
  }
});

export default requestSlice.reducer;
