import { DAYS, dayNum, dow } from '../../utils/dates';
import { isAlt } from '../../utils/workoutChecks';
import Icon from '../shared/Icon.jsx';

/** Celda de la tira semanal (L M M J V S D). */
export default function StripCell({ day }) {
  const s = day.session;
  let c = 'sq', inner = 'Desc';
  if (s) {
    if (s.status === 'DONE') { c += isAlt(s) ? ' alt' : ' ok'; inner = <Icon n={isAlt(s) ? 'walk' : 'check'} />; }
    else if (s.status === 'MISSED') { c += ' miss'; inner = <Icon n="x" />; }
    else if (s.status === 'MOVED') { c += ' mov'; inner = 'Mov'; }
    else { c += ' pend'; inner = ''; }
  }
  return <div><span className="lbl2">{DAYS[dow(day.date)].toUpperCase()}<br />{dayNum(day.date)}</span><span className={c}>{inner}</span></div>;
}
