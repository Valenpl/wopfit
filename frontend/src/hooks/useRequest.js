import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';

/**
 * Manda un thunk que cambia algo y lee del store cómo terminó (requestSlice).
 *   const save = useRequest(createGoal, { onSuccess: () => nav('/metas') });
 *   <Btn busy={save.busy} onClick={() => save.run(datos)}>Guardar</Btn>
 * onSuccess/onError corren cuando el estado del pedido cambia en el store. No hay .unwrap() en los componentes.
 */
export default function useRequest(thunk, { onSuccess, onError } = {}) {
  const dispatch = useDispatch();
  const store = useStore();
  const type = thunk.typePrefix;
  const [id, setId] = useState(null);
  const req = useSelector(s => s.requests[type]);
  const mine = id && req && req.requestId === id ? req : null;
  const status = mine ? mine.status : 'idle';

  // Siempre la última versión de los callbacks, sin volver a correr el efecto.
  const callbacks = useRef({ onSuccess, onError });
  useEffect(() => { callbacks.current = { onSuccess, onError }; });

  useEffect(() => {
    if (!mine) return;
    if (status === 'succeeded' && callbacks.current.onSuccess) callbacks.current.onSuccess(mine.result, mine.arg);
    if (status === 'failed' && callbacks.current.onError) callbacks.current.onError(mine.error, mine.arg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, id]);

  const run = useCallback(arg => {
    const action = dispatch(thunk(arg));
    // Si el thunk no salió porque ya había uno igual en curso (condition), seguimos ese.
    const now = store.getState().requests[type];
    setId(now && now.status === 'loading' ? now.requestId : action.requestId);
  }, [dispatch, store, thunk, type]);

  return { run, status, busy: status === 'loading', result: mine ? mine.result : null, error: mine ? mine.error : null };
}
