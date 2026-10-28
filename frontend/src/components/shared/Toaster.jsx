import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hideToast } from '../../redux/slices/uiSlice';

/** El aviso de abajo (uiSlice.toast). Se va solo a los 2,7 s. */
export default function Toaster() {
  const dispatch = useDispatch();
  const toast = useSelector(s => s.ui.toast);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => dispatch(hideToast(toast.id)), 2700);
    return () => clearTimeout(t);
  }, [toast, dispatch]);
  return toast ? <div className="toast" key={toast.id} role="status">{toast.msg}</div> : null;
}
