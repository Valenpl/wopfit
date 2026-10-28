import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHistory } from '../../redux/slices/progressSlice';
import useFetch from '../../hooks/useFetch';
import { FEELS, HABITS } from '../../utils/constants';
import { DAYS, add, dayNum, dow, longDay, monthName, shortDate } from '../../utils/dates';
import { cap } from '../../utils/format';
import ErrorBox from '../../components/shared/ErrorBox.jsx';
import Icon from '../../components/shared/Icon.jsx';
import IconInline from '../../components/shared/IconInline.jsx';
import Loading from '../../components/shared/Loading.jsx';
import Screen from '../../components/shared/Screen.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

export default function History() {
  const nav = useNavigate();
  const [tab, setTab] = useState('train');
  const [all, setAll] = useState(false);
  const { data: h, error, retry } = useFetch(fetchHistory, undefined, s => s.progress.history);
  if (error && !h) return <Screen><TopBar fallback="/progreso" /><ErrorBox error={error} onRetry={retry} /></Screen>;
  if (!h) return <Loading />;
  const [cur, prev] = [h.weeks[0], h.weeks[1]];
  const diff = cur.done - (prev ? prev.done : 0);
  const msg = !prev ? 'Tu primera semana: todo lo que hagas suma.' : diff > 0 ? `${diff === 1 ? 'Una sesión' : diff + ' sesiones'} más que la semana pasada.` : diff === 0 ? 'Igual que la semana pasada. ¡Constancia!' : `Te ${cur.total - cur.done === 1 ? 'queda 1 sesión' : 'quedan ' + (cur.total - cur.done) + ' sesiones'} esta semana.`;
  const shown = all ? h.weeks : h.weeks.slice(0, 2);
  const wlabel = w => `Semana ${w.weekNumber} · ${dayNum(w.monday)} al ${dayNum(add(w.monday, 6))} ${monthName(add(w.monday, 6)).slice(0, 3)}`;

  let list;
  if (tab === 'train') list = shown.map(w => <div key={w.monday}><h2 style={{ fontSize: 16 }}>{wlabel(w)}</h2>
    {w.sessions.filter(s => s.status !== 'PENDING').length ? w.sessions.filter(s => s.status !== 'PENDING').map(s => {
      const alt = s.alternative && s.movedFrom;
      const d = s.status === 'MOVED' ? `Pasó al ${DAYS[dow(s.movedTo)].toLowerCase()} ${dayNum(s.movedTo)}${s.reasonLabel ? ' · ' + s.reasonLabel : ''}`
        : s.status === 'DONE' ? `${s.minutes} min${s.feel != null ? ' · ' + FEELS[s.feel][0] : ''}` : 'Sin registrar';
      return <div className="hist" key={s.id}><span className={`circ ${s.status === 'DONE' ? (alt ? 'alt' : 'ok') : ''}`}>{s.status === 'DONE' && <Icon n={alt ? 'walk' : 'check'} />}</span>
        <div className="grow"><div className="t">{s.title} {alt && <span className="tag blue">Alternativa</span>}</div><div className="d">{DAYS[dow(s.date)]} {dayNum(s.date)} · {d}</div></div></div>;
    }) : <div className="hist"><div className="d">Todavía no hay sesiones registradas.</div></div>}</div>);
  else if (tab === 'hab') list = shown.map(w => <div key={w.monday}><h2 style={{ fontSize: 16 }}>{wlabel(w)}</h2>
    {w.habits.length ? [...w.habits].reverse().map(x => { const n = [x.water, x.walk, x.sleep].filter(Boolean).length; return <div className="hist" key={x.date}>
      <span className={`circ ${n === 3 ? 'ok' : ''}`}>{n === 3 && <Icon n="check" />}</span><div className="grow"><div className="t">{cap(longDay(x.date))}</div>
        <div className="d">{HABITS.filter(hb => x[hb.k]).map(hb => hb.s).join(' · ') || 'Sin hábitos marcados'}</div></div><b className="small" style={{ color: 'var(--navy)' }}>{n}/3</b></div>; })
      : <div className="hist"><div className="d">No marcaste hábitos esta semana.</div></div>}</div>);
  else list = h.difficulties.length ? <>
    {h.mostCommon && <div className="card" style={{ background: 'var(--peach)' }}><h3>Lo que más se repite</h3><p className="small" style={{ margin: '6px 0 0', color: 'var(--peach-ink)', fontWeight: 700 }}>{h.mostCommon} · {h.mostCommonCount} {h.mostCommonCount === 1 ? 'vez' : 'veces'}</p>
      {h.mostCommonCount >= 2 && <button className="btn sm mt12" onClick={() => nav('/ajuste')}>Ver ajustes de mi plan</button>}</div>}
    <div className="mt12">{h.difficulties.slice(0, all ? 999 : 8).map(x => <div className="hist" key={`${x.kind}-${x.id}`}><span className="circ" /><div className="grow"><div className="t">{x.label}</div>
      <div className="d">{shortDate(x.date)} · {x.kind === 'WORKOUT' ? 'Entrenamiento' : x.note}{x.kind === 'WORKOUT' && x.note ? ` · «${x.note}»` : ''}</div></div></div>)}</div></>
    : <div className="card center muted">Todavía no nos contaste ninguna dificultad. Cuando algo no salga, tocá «No puedo hoy».</div>;

  return <Screen>
    <TopBar fallback="/progreso" />
    <h1>Tu historial</h1><p className="sub">Mirá cómo venís semana a semana.</p>
    <div className="seg three">{[['train', 'Entrenos'], ['hab', 'Hábitos'], ['dif', 'Dificultades']].map(([k, t]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t}</button>)}</div>
    <div className="card" style={{ background: 'var(--green-bg)' }}><h3>Esta semana vs. la anterior</h3>
      <div className="cmp"><div><span className="tiny muted">Esta semana</span><b>{cur.done} de {cur.total}</b></div><div><span className="tiny muted">Semana anterior</span><b>{prev ? `${prev.done} de ${prev.total}` : '—'}</b></div></div>
      <div className="small mt12" style={{ color: 'var(--green-d)', fontWeight: 700 }}><IconInline n="trend" /> {msg}</div></div>
    {list}
    {((tab !== 'dif' && h.weeks.length > 2) || (tab === 'dif' && h.difficulties.length > 8)) && !all && <div className="center mt12"><button className="link" onClick={() => setAll(true)}>Ver más</button></div>}
  </Screen>;
}
