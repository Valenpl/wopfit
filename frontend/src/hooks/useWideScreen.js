import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { WIDE_QUERY, setWide } from '../redux/slices/uiSlice';

/** Avisa al store cuando la ventana pasa a ser ancha o angosta (para la vista compu automática). */
export default function useWideScreen() {
  const dispatch = useDispatch();
  useEffect(() => {
    const mq = window.matchMedia(WIDE_QUERY);
    const apply = () => dispatch(setWide(mq.matches));
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [dispatch]);
}
