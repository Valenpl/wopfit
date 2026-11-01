import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { markWalk } from '../../redux/slices/habitSlice';
import { setWorkoutChecks } from '../../redux/slices/uiSlice';
import useRequest from '../../hooks/useRequest';
import { howto } from '../../utils/constants';
import { longDay, today } from '../../utils/dates';
import { checksKey, isAlt, selectChecks } from '../../utils/workoutChecks';
import ReportSheet from '../../components/train/ReportSheet.jsx';
import Btn from '../../components/shared/Btn.jsx';
import ExpertTips from '../../components/shared/ExpertTips.jsx';
import Icon from '../../components/shared/Icon.jsx';
import IconInline from '../../components/shared/IconInline.jsx';
import Note from '../../components/shared/Note.jsx';
import Screen from '../../components/shared/Screen.jsx';
import Sheet from '../../components/shared/Sheet.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

/** Los bloques de la rutina con sus tildes, el "¿Cómo se hace?" y el botón para terminar. */
export default function Routine({ s, walk, altKey }) {
  const nav = useNavigate();
  const c = s.content, t = today();
  const dispatch = useDispatch();
  const w = useSelector(selectChecks(s.id, altKey));
  const [open, setOpen] = useState(() => Math.max(0, c.blocks.findIndex((b, bi) => !b.items.every((_, ii) => w.includes(bi + '-' + ii)))));
  const [how, setHow] = useState(null);
  const [report, setReport] = useState(null);
  const walked = useRequest(markWalk, { onSuccess: () => nav('/entreno', { replace: true }) });

  const total = c.blocks.reduce((n, b) => n + b.items.length, 0);
  const tick = k => dispatch(setWorkoutChecks({ key: checksKey(s.id, altKey), checks: w.includes(k) ? w.filter(x => x !== k) : [...w, k] }));
  const future = s.date > t;
  const finish = () => (walk ? walked.run(t) : nav(`/entreno/${s.id}/hecho`));

  let foot;
  if (s.status === 'DONE') foot = <Note icon="check">¡Rutina completada!</Note>;
  else if (s.status === 'MISSED') foot = <Note tone="peach">Esta sesión quedó sin hacer. Podés reprogramarla desde la semana.</Note>;
  else if (future) foot = <Note tone="blue" icon="cal">Esta rutina es para el {longDay(s.date)}.</Note>;
  else foot = <><Btn busy={walked.busy} onClick={finish}><Icon n="check" /> Marcar como hecho</Btn>
    {!walk && !isAlt(s) && <button className="btn ghost" onClick={() => setReport(s)}>No puedo hacerlo hoy</button>}</>;

  return <Screen foot={foot} scrollStyle={{ paddingBottom: 40 }}>
    <TopBar fallback="/entreno" right={<span className="tag blue">{w.length} de {total}</span>} />
    <div className="row between mt16"><span className="kicker">{s.date === t ? 'Hoy · ' : ''}{longDay(s.date)}</span><span className="tag blue">{c.minutes} min</span></div>
    <h1 style={{ marginTop: 6 }}>{c.title}</h1><p className="sub" style={{ marginBottom: 12 }}>{c.description}</p>
    <div className="chips">{c.chips.map(x => <span key={x} className="tag blue">{x}</span>)}</div>
    {s.alternative === 'suave' && <Note tone="peach" className="mt12">Si el dolor sigue o es fuerte, consultá con un profesional de la salud antes de volver a entrenar.</Note>}
    {c.blocks.map((b, bi) => {
      const n = b.items.filter((_, ii) => w.includes(bi + '-' + ii)).length, ok = n === b.items.length;
      return <div key={bi} className={`card mt12 acc ${open === bi ? 'open' : ''}`}>
        <button className="acc-h" onClick={() => setOpen(open === bi ? -1 : bi)} aria-expanded={open === bi}><span className={`num ${ok ? 'ok' : ''}`}>{ok ? <Icon n="check" /> : bi + 1}</span>
          <span className="grow"><h3>{b.name}</h3><span className="tiny muted" style={{ fontWeight: 700 }}>{b.minutes} min · {n} de {b.items.length}</span></span><Icon n="chev" className="chev2" /></button>
        <div className="acc-b mt8">{b.items.map((e, ii) => { const on = w.includes(bi + '-' + ii); return <div key={ii} className={`ex ${on ? 'on' : ''}`} style={{ padding: '4px 0' }}>
          <button className="row grow" style={{ textAlign: 'left', padding: '5px 0' }} onClick={() => tick(bi + '-' + ii)} disabled={s.status === 'DONE'}><span className={`ck box ${on ? 'on' : ''}`}><Icon n="check" /></span><span className="t grow">{e.name}</span><span className="small muted" style={{ fontWeight: 700 }}>{e.amount}</span></button>
          <button className="infob" onClick={() => setHow(e.name)} aria-label="Cómo se hace"><Icon n="info" /></button></div>; })}</div>
      </div>;
    })}
    <p className="center small muted mt16"><IconInline n="clock" /> Descanso entre series: {c.rest}</p>
    <ExpertTips tips={s.tips} className="mt16" />
    {how && <Sheet onClose={() => setHow(null)}><h1 style={{ marginTop: 12 }}>{how}</h1><div className="card" style={{ background: '#F6FAFD' }}>{howto(how)}</div>
      <Note tone="blue" className="mt12">Si sentís dolor, frená y probá la versión más suave.</Note><button className="btn mt16" onClick={() => setHow(null)}>Entendido</button></Sheet>}
    {report && <ReportSheet session={report} onClose={() => setReport(null)} />}
  </Screen>;
}
