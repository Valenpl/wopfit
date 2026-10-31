import Icon from './Icon.jsx';

/** Lo que pide el backend para una contraseña nueva, tildado a medida que se cumple. */
export const passChecks = (pass, pass2) => [[pass.length >= 8, 'Mínimo 8 caracteres'], [/\d/.test(pass), 'Al menos un número'], [pass.length > 0 && pass === pass2, 'Las contraseñas coinciden']];

export default function PwChecks({ checks }) {
  return <div className="checks">{checks.map(([o, t]) => <div key={t} className={o ? 'ok' : ''}><span className={`ck ${o ? 'on' : ''}`}><Icon n="check" /></span>{t}</div>)}</div>;
}
