import { useEffect } from 'react';

/** Panel que sube desde abajo. Se cierra tocando afuera o con Escape. */
export default function Sheet({ onClose, children, white }) {
  useEffect(() => {
    const k = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return <>
    <div className="scrim" onClick={onClose} />
    <div className={`sheet ${white ? 'white' : ''}`} role="dialog" aria-modal="true"><div className="grab" />{children}</div>
  </>;
}
