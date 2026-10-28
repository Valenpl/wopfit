import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { emptyEntry } from '../redux/helpers';

/**
 * Pide un dato al montar la pantalla y lo lee del store.
 *   const { data, error, retry } = useFetch(fetchGoals, undefined, s => s.goals.list);
 * El thunk tiene `condition`: si el dato ya está o se está pidiendo, no sale otro pedido (aunque StrictMode corra el efecto dos veces).
 * Si un cambio en otro lado deja el dato desactualizado (loaded = false), se vuelve a pedir una sola vez.
 */
export default function useFetch(thunk, arg, select, { skip = false } = {}) {
  const dispatch = useDispatch();
  const entry = useSelector(select) || emptyEntry;
  useEffect(() => {
    if (!skip) dispatch(thunk(arg));
  }, [dispatch, thunk, arg, skip, entry.loaded]);
  const retry = useCallback(() => dispatch(thunk(arg)), [dispatch, thunk, arg]);
  return { ...entry, retry };
}
