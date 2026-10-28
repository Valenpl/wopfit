import { MEAL_BG } from '../../utils/constants';
import { money } from '../../utils/format';
import Icon from '../shared/Icon.jsx';

export const eaten = m => m.status === 'EATEN' || m.status === 'ALTERNATIVE';

/** Una comida del día. `onEat` solo se pasa para hoy (el tilde de "la comí"). */
export default function MealRow({ m, onOpen, onEat }) {
  return <div className="mrow">
    <button className="row grow" style={{ textAlign: 'left', gap: 12, minWidth: 0 }} onClick={() => onOpen(m)}>
      <span className="em" style={{ background: MEAL_BG[m.slot] }}>{m.emoji}</span>
      <span className="body"><span className="d">{m.slotName} · {m.time}{m.status === 'ALTERNATIVE' && <> · <span style={{ color: 'var(--blue)' }}>Alternativa</span></>}{m.status === 'SKIPPED' && <> · <span style={{ color: 'var(--peach-d)' }}>No pude</span></>}</span>
        <span className={`t ${eaten(m) ? 'done-t' : ''}`}>{m.name}</span><span className="d">{money(m.price)}</span></span>
    </button>
    {onEat && <span className="mact"><button className={`okb ${eaten(m) ? 'on' : ''}`} onClick={() => onEat(m)} aria-label="La comí" disabled={eaten(m)}><Icon n="check" /></button></span>}
  </div>;
}
