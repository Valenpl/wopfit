import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchSession, fetchWeek, finishWorkout } from '../../redux/slices/workoutSlice';
import { getEntry } from '../../redux/helpers';
import useFetch from '../../hooks/useFetch';
import useRequest from '../../hooks/useRequest';
import { FEELS } from '../../utils/constants';
import { isAlt } from '../../utils/workoutChecks';
import Btn from '../../components/shared/Btn.jsx';
import Icon from '../../components/shared/Icon.jsx';
import Loading from '../../components/shared/Loading.jsx';
import Note from '../../components/shared/Note.jsx';
import Screen from '../../components/shared/Screen.jsx';

/** "¡Entrenamiento completado!": cómo te sentiste y una nota opcional. */
export default function Done() {
  const { id } = useParams();
  const nav = useNavigate();
  const session = useFetch(fetchSession, id, s => getEntry(s.workouts.sessions, id));
  const week = useFetch(fetchWeek, undefined, s => getEntry(s.workouts.weeks, ''));
  const [feel, setFeel] = useState(null);
  const [note, setNote] = useState('');
  const save = useRequest(finishWorkout, { onSuccess: () => nav('/entreno', { replace: true }) });
  if (!session.data || !week.data) return <Loading />;
  const s = session.data, w = week.data;
  const n = s.content ? s.content.blocks.length : 0;
  return <Screen narrow scrollStyle={{ paddingTop: 'calc(var(--sat) + 36px)' }}
    foot={<Btn busy={save.busy} onClick={() => save.run({ id, feel, note: note.trim() || null })}>Guardar</Btn>}>
    <div className="bigicon g pop"><Icon n="check" /></div>
    <h1 className="center">¡Entrenamiento completado!</h1><p className="sub center">{s.title} · {s.minutes} min · {n} de {n} bloques</p>
    <h2>¿Cómo te sentiste?</h2>
    <div className="feels">{FEELS.map(([e, t], i) => <button key={t} className={`feel ${feel === i ? 'on' : ''}`} onClick={() => setFeel(i)}><span>{e}</span>{t}</button>)}</div>
    <label className="f" htmlFor="fnote" style={{ marginTop: 20 }}>¿Algo para contarnos? <span className="opt-l">Opcional</span></label>
    <textarea className="ta" id="fnote" maxLength={300} placeholder="Ej: la sentadilla me costó un poco" value={note} onChange={e => setNote(e.target.value)} />
    <Note icon="trend" className="mt16">{isAlt(s) ? '¡Bien ahí! Moverte un poco también suma.' : `Con esta, llevás ${w.done + 1} de ${w.total} entrenamientos esta semana.`}</Note>
  </Screen>;
}
