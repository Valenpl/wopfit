/** Las 6 cajitas del código que llega por email (verificar la cuenta o cambiar la contraseña). */
export default function CodeInput({ value, onChange }) {
  return <div className="code">
    <div className="cboxes" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(i => <span key={i} className={`cbox ${i === Math.min(5, value.length) ? 'cur' : ''}`}>{value[i] || ''}</span>)}</div>
    <input className="codein" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete="one-time-code" autoFocus value={value}
      onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))} aria-label="Código de 6 números" />
  </div>;
}
