import Btn from './Btn.jsx';
import Sheet from './Sheet.jsx';

/** Pregunta de confirmación (en lugar de window.confirm). */
export default function ConfirmSheet({ title, text, confirm = 'Sí', cancel = 'No', busy, onConfirm, onClose }) {
  return <Sheet onClose={onClose}>
    <h1 style={{ marginTop: 12 }}>{title}</h1>
    {text && <p className="sub">{text}</p>}
    <Btn className="mt16" busy={busy} onClick={onConfirm}>{confirm}</Btn>
    <button className="btn ghost mt8" disabled={busy} onClick={onClose}>{cancel}</button>
  </Sheet>;
}
