import { useParams } from 'react-router-dom';
import { fetchSession, fetchToday } from '../../redux/slices/workoutSlice';
import { getEntry } from '../../redux/helpers';
import useFetch from '../../hooks/useFetch';
import { longDay, today } from '../../utils/dates';
import { isAlt } from '../../utils/workoutChecks';
import ErrorBox from '../../components/shared/ErrorBox.jsx';
import Loading from '../../components/shared/Loading.jsx';
import Note from '../../components/shared/Note.jsx';
import Screen from '../../components/shared/Screen.jsx';
import TopBar from '../../components/shared/TopBar.jsx';
import Routine from './Routine.jsx';

/** La rutina de una sesión (/entreno/:id) o la caminata opcional de los días de descanso (/entreno/caminata). */
export default function Workout() {
  const { id } = useParams();
  const walk = id === 'caminata';
  const session = useFetch(fetchSession, id, s => getEntry(s.workouts.sessions, id), { skip: walk });
  const td = useFetch(fetchToday, undefined, s => s.workouts.today, { skip: !walk });
  const src = walk ? td : session;
  if (src.error && !src.data) return <Screen><TopBar fallback="/entreno" /><ErrorBox error={src.error} onRetry={src.retry} /></Screen>;
  if (!src.data) return <Loading />;
  const s = walk
    ? { id: 'caminata', date: today(), status: 'PENDING', title: td.data.alternativeToday && td.data.alternativeToday.title, minutes: 15, content: td.data.alternativeToday }
    : session.data;
  if (!s.content) return <Screen><TopBar fallback="/entreno" /><h1>{s.title}</h1><Note tone="blue">Esta sesión pasó al {longDay(s.movedTo)}.</Note></Screen>;
  const altKey = isAlt(s) ? s.alternative : null;
  // La key hace que los tildes se lean de nuevo si cambia la sesión o pasa a ser la alternativa.
  return <Routine key={`${s.id}-${altKey}`} s={s} walk={walk} altKey={altKey} />;
}
