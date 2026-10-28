import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { DAYS, HABITS, Icon, REASONS, dayNum, dow } from '../lib.jsx';
import { Btn, Sheet, useAction, useApp } from '../ui.jsx';

// Ejercicios tildados de una rutina (se guardan en este dispositivo).
const wkKey = (id, alt) => `wopfit-wk-${id}${alt ? '-' + alt : ''}`;
export const getChecks = (id, alt) => { try { return JSON.parse(localStorage.getItem(wkKey(id, alt)) || '[]'); } catch { return []; } };
export const setChecks = (id, alt, v) => { try { localStorage.setItem(wkKey(id, alt), JSON.stringify(v)); } catch { /* */ } };
export const blocksDone = (s) => {
  if (!s || !s.content) return 0;
  const w = getChecks(s.id, s.alternative && s.movedFrom ? s.alternative : null);
  return s.content.blocks.filter((b, bi) => b.items.every((_, ii) => w.includes(bi + '-' + ii))).length;
};

/** Celda de la tira semanal (L M M J V S D). */
function StripCell({ day }) {
  const s = day.session;
  let c = 'sq', inner = 'Desc';
  if (s) {
    if (s.status === 'DONE') { c += s.alternative && s.movedFrom ? ' alt' : ' ok'; inner = <Icon n={s.alternative && s.movedFrom ? 'walk' : 'check'} />; }
    else if (s.status === 'MISSED') { c += ' miss'; inner = <Icon n="x" />; }
    else if (s.status === 'MOVED') { c += ' mov'; inner = 'Mov'; }
    else { c += ' pend'; inner = ''; }
  }
  return <div><span className="lbl2">{DAYS[dow(day.date)].toUpperCase()}<br />{dayNum(day.date)}</span><span className={c}>{inner}</span></div>;
}
export const Strip = ({ days }) => <div className="strip" style={{ marginTop: 0 }}>{days.map(d => <StripCell key={d.date} day={d} />)}</div>;

/** Los 3 hábitos del día, con guardado inmediato. */
export function Habits({ date, value, onChange }) {
  const { toast } = useApp();
  const flip = async k => {
    const next = { ...value, [k]: !value[k] };
    onChange(next);
    try { onChange(await api.put(`/habits/${date}`, next)); } catch (ex) { onChange(value); toast(ex.message); }
  };
  return <div className="habits3">{HABITS.map(h => <button key={h.k} className={`hb ${value[h.k] ? 'on' : ''}`} onClick={() => flip(h.k)} aria-pressed={value[h.k]}>
    <span className="ic"><Icon n={value[h.k] ? 'check' : h.i} /></span>{h.t}</button>)}</div>;
}

/** "¿Qué pasó?" — reporta que no se pudo entrenar. */
export function ReportSheet({ session, onClose, onDone }) {
  const nav = useNavigate();
  const { toast } = useApp();
  const [reason, setReason] = useState('tiempo');
  const [note, setNote] = useState('');
  const [busy, run] = useAction();
  const send = () => run(async () => {
    const r = await api.post(`/workouts/${session.id}/report`, { reason, note: note.trim() || null });
    onClose();
    if (r.action === 'PROPOSAL') nav(`/entreno/${session.id}/propuesta`, { state: { proposal: r.proposal, reason } });
    else { toast(r.message); onDone && onDone(); }
  });
  return <Sheet onClose={onClose}>
    <h1 style={{ marginTop: 12 }}>¿Qué pasó?</h1><p className="sub">Está bien, pasa. Contanos y lo ajustamos juntos.</p>
    <div className="stack">{REASONS.map(([k, t]) => <button key={k} className={`opt ${reason === k ? 'on' : ''}`} onClick={() => setReason(k)}><span className="radio" /><span className="t">{t}</span></button>)}</div>
    <label className="f" htmlFor="rnote">¿Querés contarnos algo más?</label>
    <textarea className="ta" id="rnote" placeholder="Opcional" maxLength={300} value={note} onChange={e => setNote(e.target.value)} />
    <Btn className="mt16" busy={busy} onClick={send}>Seguir</Btn>
  </Sheet>;
}
