import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPlan } from '../../redux/slices/planSlice';
import useRequest from '../../hooks/useRequest';

/** "Reacomodando tu plan…": actualiza el plan con las preferencias nuevas y muestra qué cambió. */
export default function Updating() {
  const nav = useNavigate();
  const [w, setW] = useState(5);
  const update = useRequest(createPlan, {
    onSuccess: r => nav('/plan-listo', { replace: true, state: { upd: true, changes: r.changes } }),
    onError: () => nav(-1)
  });
  const { run } = update;
  // Se manda una sola vez: createPlan tiene `condition` y useRequest sigue el pedido que ya está en curso.
  useEffect(() => { run({ minMs: 900 }); }, [run]);
  useEffect(() => { const f = requestAnimationFrame(() => setW(85)); return () => cancelAnimationFrame(f); }, []);
  return <div className="screen"><div className="scroll" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
    <img src="/wopi.webp" alt="" style={{ width: 180 }} className="wopi" /><h1>Reacomodando tu plan…</h1><p className="sub">Mantenemos tu historial y tu progreso.</p>
    <div className="progress blue" style={{ width: '70%' }}><i style={{ width: `${w}%`, transition: 'width 1s' }} /></div>
  </div></div>;
}
