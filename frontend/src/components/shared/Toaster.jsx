import { useEffect } from 'react';

/** El aviso de abajo (uiSlice.toast). Se va solo a los 2,7 s: avisa con onHide y App lo saca del store. */
export default function Toaster({ toast, onHide }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => onHide(toast.id), 2700);
    return () => clearTimeout(t);
    // Solo depende del aviso: onHide cambia en cada render de App y reiniciaría la cuenta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);
  return toast ? <div className="toast" key={toast.id} role="status">{toast.msg}</div> : null;
}
