import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * La zona con scroll de cada pantalla.
 * Si cambia la ruta sin que se desmonte la pantalla (por ejemplo /comunidad/1 → /comunidad/2), el scroll vuelve arriba.
 * Es el único lugar donde se mueve el scroll a mano, y por eso usa un ref de React. `scrollRef` permite que la pantalla use el mismo ref.
 */
export default function ScrollArea({ children, style, scrollRef }) {
  const own = useRef(null);
  const ref = scrollRef || own;
  const { pathname } = useLocation();
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0; }, [pathname, ref]);
  return <div className="scroll" style={style} ref={ref}>{children}</div>;
}
