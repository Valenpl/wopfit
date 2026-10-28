import { useEffect, useState } from 'react';

/**
 * Con el teclado abierto en el celu, la app ocupa solo la parte visible y esconde la barra de abajo.
 * Devuelve si está abierto y el estilo para #app (alto y desplazamiento de la parte visible). No toca el DOM: App lo pone con `style`.
 */
export default function useKeyboard() {
  const [kb, setKb] = useState({ open: false, style: undefined });
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const fit = () => setKb({
      open: vv.height < window.innerHeight - 120,
      style: { height: vv.height + 'px', transform: `translateY(${vv.offsetTop}px)` }
    });
    vv.addEventListener('resize', fit);
    vv.addEventListener('scroll', fit);
    fit();
    return () => { vv.removeEventListener('resize', fit); vv.removeEventListener('scroll', fit); };
  }, []);
  return kb;
}
