import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportWorkout } from '../../redux/slices/workoutSlice';
import useRequest from '../../hooks/useRequest';
import useToast from '../../hooks/useToast';
import { REASONS } from '../../utils/constants';
import Btn from '../shared/Btn.jsx';
import Sheet from '../shared/Sheet.jsx';

/** "¿Qué pasó?": reporta que no se pudo entrenar. Si hay propuesta, va a verla; si no, avisa qué se hizo. */
export default function ReportSheet({ session, onClose }) {
  const nav = useNavigate();
  const toast = useToast();
  const [reason, setReason] = useState('tiempo');
  const [note, setNote] = useState('');
  const report = useRequest(reportWorkout, {
    onSuccess: (r, arg) => {
      onClose();
      if (r.action === 'PROPOSAL') nav(`/entreno/${arg.id}/propuesta`, { state: { proposal: r.proposal, reason: arg.reason } });
      else toast(r.message);
    }
  });
  return <Sheet onClose={onClose}>
    <h1 style={{ marginTop: 12 }}>¿Qué pasó?</h1><p className="sub">Está bien, pasa. Contanos y lo ajustamos juntos.</p>
    <div className="stack">{REASONS.map(([k, t]) => <button key={k} className={`opt ${reason === k ? 'on' : ''}`} onClick={() => setReason(k)}><span className="radio" /><span className="t">{t}</span></button>)}</div>
    <label className="f" htmlFor="rnote">¿Querés contarnos algo más?</label>
    <textarea className="ta" id="rnote" placeholder="Opcional" maxLength={300} value={note} onChange={e => setNote(e.target.value)} />
    <Btn className="mt16" busy={report.busy} onClick={() => report.run({ id: session.id, reason, note: note.trim() || null })}>Seguir</Btn>
  </Sheet>;
}
