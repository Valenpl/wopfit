/** Botón que muestra un spinner y no se puede tocar mientras `busy`. */
export default function Btn({ busy, children, className = '', ...rest }) {
  return <button className={`btn ${className}`} disabled={busy || rest.disabled} {...rest}>{busy ? <span className="spinner" /> : children}</button>;
}
