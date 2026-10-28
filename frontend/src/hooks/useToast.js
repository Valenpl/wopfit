import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '../redux/slices/uiSlice';

/** toast('Guardado'): muestra un aviso abajo durante unos segundos (uiSlice). */
export default function useToast() {
  const dispatch = useDispatch();
  return useCallback(msg => dispatch(showToast(msg)), [dispatch]);
}
