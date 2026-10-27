import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken, isAbort, setToken, setUnauthorizedHandler } from './api.js';
import { Icon } from './lib.jsx';

// ---------- sesión + toasts + vista celu/compu ----------
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const VIEW_KEY = 'wopfit-view';
const WIDE = '(min-width: 1000px)';
/** 'auto' (según el ancho), 'celu' o 'compu'. Se puede forzar con ?modo=celu|compu. */
function initialView() {
  try {
    const q = new URLSearchParams(window.location.search).get('modo');
    if (q === 'celu' || q === 'compu') return q;
    return localStorage.getItem(VIEW_KEY) || 'auto';
  } catch { return 'auto'; }
}

export function AppProvider({ children }) {
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [view, setViewState] = useState(initialView);
  const [wide, setWide] = useState(() => window.matchMedia(WIDE).matches);
  const timer = useRef();
  const desk = view === 'compu' || (view === 'auto' && wide);
  const setView = useCallback(v => { setViewState(v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* sin storage */ } }, []);

  useEffect(() => {
    const mq = window.matchMedia(WIDE);
    const apply = () => setWide(mq.matches);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  useEffect(() => { document.documentElement.classList.toggle('desk', desk); }, [desk]);

  const toast = useCallback(msg => {
    clearTimeout(timer.current);
    setToastMsg({ msg, id: Date.now() });
    timer.current = setTimeout(() => setToastMsg(null), 2700);
  }, []);
  // api.get comparte el pedido en curso: la carga inicial y cualquier renovación simultánea usan la misma promesa de /me.
  const refresh = useCallback(async () => { const m = await api.get('/me'); setMe(m); return m; }, []);
  const login = useCallback((token, m) => { setToken(token); setMe(m); }, []);
  const logout = useCallback(() => { setToken(null); setMe(null); }, []);
  const booted = useRef(false);

  useEffect(() => {
    setUnauthorizedHandler(() => { setToken(null); setMe(null); });
    if (booted.current) return;
    booted.current = true;
    if (!getToken()) { setReady(true); return; }
    refresh().catch(() => setToken(null)).finally(() => setReady(true));
  }, [refresh]);

  return <Ctx.Provider value={{ me, setMe, ready, refresh, login, logout, toast, toastMsg, desk, wide, setView }}>{children}</Ctx.Provider>;
}

/**
 * Carga datos de la API; vuelve a pedirlos cuando cambian las dependencias.
 * `fn` recibe un AbortSignal para pasarle a api.get: al limpiarse el efecto se cancela el pedido anterior.
 */
export function useLoad(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    const ctrl = new AbortController();
    const live = () => !ctrl.signal.aborted;
    setState(s => ({ ...s, loading: true, error: null }));
    fn(ctrl.signal).then(data => live() && setState({ data, error: null, loading: false }))
      .catch(error => live() && !isAbort(error) && setState({ data: null, error, loading: false }));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, n]);
  return { ...state, reload: () => setN(x => x + 1), set: data => setState(s => ({ ...s, data })) };
}

// ---------- piezas de pantalla ----------
export function Screen({ children, foot, narrow, className = '', scrollStyle }) {
  return <div className={`screen ${narrow ? 'narrow' : ''} ${className}`}>
    <div className="scroll" style={scrollStyle}>{children}</div>
    {foot && <div className="foot">{foot}</div>}
  </div>;
}

export function useBack(fallback = '/') {
  const nav = useNavigate();
  return () => (window.history.state && window.history.state.idx > 0 ? nav(-1) : nav(fallback, { replace: true }));
}

export function TopBar({ right, fallback = '/inicio' }) {
  const back = useBack(fallback);
  return <div className="top"><button className="iconbtn" onClick={back} aria-label="Volver"><Icon n="back" /></button>{right}</div>;
}

export const Sect = ({ title, right }) => <div className="sect"><h2>{title}</h2>{right}</div>;
export const More = ({ onClick, children = 'Ver más' }) => <button className="more" onClick={onClick}>{children} <Icon n="chev" /></button>;
export const Note = ({ icon = 'info', tone = '', className = '', children }) => <div className={`note ${tone} ${className}`}><Icon n={icon} /><span>{children}</span></div>;

export function Field({ id, label, optional, error, icon, onIcon, iconLabel, ...input }) {
  return <>
    <label className="f" htmlFor={id}>{label}{optional && <span className="opt-l">Opcional</span>}</label>
    <div className="inp">
      <input id={id} className={`${icon ? 'has-ic' : ''} ${error ? 'bad' : ''}`} {...input} />
      {icon && <button className="in-ic" type="button" onClick={onIcon} tabIndex={onIcon ? 0 : -1} aria-label={iconLabel}><Icon n={icon} /></button>}
    </div>
    {error && <div className="fielderr">{error}</div>}
  </>;
}

export function PwField(props) {
  const [show, setShow] = useState(false);
  return <Field {...props} type={show ? 'text' : 'password'} icon={show ? 'eyeoff' : 'eye'} onIcon={() => setShow(s => !s)} iconLabel="Mostrar contraseña" />;
}

export function Btn({ busy, children, className = '', ...rest }) {
  return <button className={`btn ${className}`} disabled={busy || rest.disabled} {...rest}>{busy ? <span className="spinner" /> : children}</button>;
}

export function Sheet({ onClose, children, white }) {
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

export function Loading({ text = 'Cargando…' }) {
  return <div className="screen still"><div className="scroll" style={{ display: 'grid', placeItems: 'center' }}>
    <div className="center"><img src="/wopi.webp" alt="" className="wopi" style={{ width: 130 }} /><p className="muted" style={{ fontWeight: 700 }}>{text}</p></div>
  </div></div>;
}

export function ErrorBox({ error, onRetry }) {
  return <div className="card center"><p className="muted" style={{ fontWeight: 700, margin: '4px 0 12px' }}>{error?.message || 'No pudimos cargar esto.'}</p>
    {onRetry && <button className="btn sm" style={{ margin: '0 auto' }} onClick={onRetry}>Reintentar</button>}</div>;
}

/** Envuelve una acción async: muestra el error como toast y evita doble click. */
export function useAction() {
  const { toast } = useApp();
  const [busy, setBusy] = useState(false);
  const run = useCallback(async fn => {
    if (busy) return undefined;
    setBusy(true);
    try { return await fn(); } catch (e) { toast(e.message); return undefined; } finally { setBusy(false); }
  }, [busy, toast]);
  return [busy, run];
}
