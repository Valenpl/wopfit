import { HABITS } from '../../utils/constants';
import Icon from '../shared/Icon.jsx';

/** Los 3 hábitos del día. `onToggle(k)` lo guarda la pantalla. */
export default function Habits({ value, onToggle }) {
  return <div className="habits3">{HABITS.map(h => <button key={h.k} className={`hb ${value[h.k] ? 'on' : ''}`} onClick={() => onToggle(h.k)} aria-pressed={value[h.k]}>
    <span className="ic"><Icon n={value[h.k] ? 'check' : h.i} /></span>{h.t}</button>)}</div>;
}
