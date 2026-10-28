import Icon from './Icon.jsx';

/** Input controlado con label, error y un botón opcional adentro (por ejemplo "mostrar contraseña"). */
export default function Field({ id, label, optional, error, icon, onIcon, iconLabel, ...input }) {
  return <>
    <label className="f" htmlFor={id}>{label}{optional && <span className="opt-l">Opcional</span>}</label>
    <div className="inp">
      <input id={id} className={`${icon ? 'has-ic' : ''} ${error ? 'bad' : ''}`} {...input} />
      {icon && <button className="in-ic" type="button" onClick={onIcon} tabIndex={onIcon ? 0 : -1} aria-label={iconLabel}><Icon n={icon} /></button>}
    </div>
    {error && <div className="fielderr">{error}</div>}
  </>;
}
