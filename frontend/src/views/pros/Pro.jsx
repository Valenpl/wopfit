import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bookConsult, fetchPro } from '../../redux/slices/proSlice';
import { getEntry } from '../../redux/helpers';
import useFetch from '../../hooks/useFetch';
import useRequest from '../../hooks/useRequest';
import { DAYS, dayNum, dow } from '../../utils/dates';
import Avatar from '../../components/pros/Avatar.jsx';
import Btn from '../../components/shared/Btn.jsx';
import ErrorBox from '../../components/shared/ErrorBox.jsx';
import Loading from '../../components/shared/Loading.jsx';
import Note from '../../components/shared/Note.jsx';
import Screen from '../../components/shared/Screen.jsx';
import TopBar from '../../components/shared/TopBar.jsx';
import { rating } from './prosText';

const firstFree = d => (d.slots.find(s => s.free) || {}).time || null;

/** Perfil de un profesional y reserva de turno. */
export default function Pro() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, error, retry } = useFetch(fetchPro, id, s => getEntry(s.pros.details, id));
  const [mode, setMode] = useState('Videollamada');
  const [picked, setPicked] = useState({ day: null, time: null });
  // Si el turno se ocupó (409), proSlice vuelve a pedir la agenda y acá se elige otro libre.
  const book = useRequest(bookConsult, { onSuccess: r => nav('/profesionales/confirmada', { replace: true, state: r }) });
  if (error && !data) return <Screen><TopBar fallback="/profesionales" /><ErrorBox error={error} onRetry={retry} /></Screen>;
  if (!data) return <Loading />;
  // Por defecto, el primer día con turnos libres y su primer horario libre.
  const d = data.days.find(x => x.date === picked.day) || data.days.find(x => x.slots.some(s => s.free)) || data.days[0];
  const slots = d.slots;
  const time = slots.some(s => s.time === picked.time && s.free) ? picked.time : firstFree(d);
  const p = data.pro;
  const can = data.premium && data.left > 0 && time;
  const foot = can ? <Btn busy={book.busy} onClick={() => book.run({ id, date: d.date, time, mode })}>Confirmar consulta</Btn>
    : data.premium ? <button className="btn" disabled>{data.left ? 'Elegí un horario' : 'Sin consultas este mes'}</button>
      : <button className="btn" onClick={() => nav('/planes')}>Mejorar plan para reservar</button>;
  return <Screen foot={foot}>
    <TopBar fallback="/profesionales" />
    <div className="center mt16" style={{ display: 'flex', justifyContent: 'center' }}><Avatar n={p.name} size={84} /></div>
    <h1 className="center">{p.name}</h1><p className="sub center" style={{ marginBottom: 8 }}>{p.specialty}</p>
    <div className="chips" style={{ justifyContent: 'center' }}><span className="tag blue">⭐ {rating(p.rating)}</span><span className="tag blue">{p.license}</span><span className="tag blue">{p.experience}</span></div>
    <div className="card mt16 small">{p.bio}</div>
    <h2>Modalidad</h2>
    <div className="grid2">{data.modes.map(m => <button key={m} className={`slot ${mode === m ? 'on' : ''}`} onClick={() => setMode(m)} aria-pressed={mode === m}>{m === 'Chat' ? '💬' : '🎥'} {m}</button>)}</div>
    <h2>Día</h2>
    <div className="grid2" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>{data.days.map(x => <button key={x.date} className={`slot ${d.date === x.date ? 'on' : ''}`} onClick={() => setPicked({ day: x.date, time: null })} aria-pressed={d.date === x.date}>
      <small>{DAYS[dow(x.date)]}</small>{dayNum(x.date)}</button>)}</div>
    <h2>Horario</h2>
    <div className="grid3">{slots.map(s => <button key={s.time} className={`slot ${time === s.time ? 'on' : ''}`} disabled={!s.free} onClick={() => setPicked({ day: d.date, time: s.time })} aria-pressed={time === s.time}
      style={s.free ? undefined : { opacity: 0.45, textDecoration: 'line-through' }} aria-label={s.free ? s.time : `${s.time} ocupado`}>{s.time}</button>)}</div>
    {!slots.some(s => s.free) && <Note tone="blue" className="mt12">Ese día no quedan turnos. Probá con otro.</Note>}
    {!data.premium ? <Note tone="peach" icon="lock" className="mt16">Las consultas con profesionales están incluidas en Premium.</Note>
      : !data.left && <Note tone="peach" className="mt16">Ya usaste tus 2 consultas de este mes.</Note>}
  </Screen>;
}
