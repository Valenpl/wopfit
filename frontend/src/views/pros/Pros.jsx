import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cancelConsult, fetchPros } from '../../redux/slices/proSlice';
import useFetch from '../../hooks/useFetch';
import useRequest from '../../hooks/useRequest';
import { shortDate } from '../../utils/dates';
import Avatar from '../../components/pros/Avatar.jsx';
import ConfirmSheet from '../../components/shared/ConfirmSheet.jsx';
import ErrorBox from '../../components/shared/ErrorBox.jsx';
import Icon from '../../components/shared/Icon.jsx';
import Loading from '../../components/shared/Loading.jsx';
import Screen from '../../components/shared/Screen.jsx';
import Sect from '../../components/shared/Sect.jsx';
import TopBar from '../../components/shared/TopBar.jsx';
import { leftTxt, nextTxt, rating } from './prosText';

/** Ayuda profesional: el cupo del mes, mis consultas y el listado por tipo. */
export default function Pros() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [kind, setKind] = useState(params.get('tipo') === 'entre' ? 'entre' : 'nutri');
  const [asking, setAsking] = useState(null);
  const { data, error, retry } = useFetch(fetchPros, undefined, s => s.pros.list);
  const cancel = useRequest(cancelConsult, { onSuccess: () => setAsking(null), onError: () => setAsking(null) });
  if (error && !data) return <Screen><TopBar /><ErrorBox error={error} onRetry={retry} /></Screen>;
  if (!data) return <Loading />;
  return <Screen>
    <TopBar right={data.premium ? <span className="tag gold">★ Premium</span> : null} />
    <h1>Ayuda profesional</h1><p className="sub">Nutricionistas y entrenadores matriculados.</p>
    {data.premium
      ? <div className="card row between"><div><b style={{ color: 'var(--navy)' }}>Te {leftTxt(data.left)} este mes</b><div className="tiny muted">Incluidas en tu plan Premium</div></div>
        <span className="dots2">{Array.from({ length: data.limit }, (_, i) => <i key={i} className={data.left > i ? '' : 'off'} />)}</span></div>
      : <button className="banner" style={{ background: '#FFF6DD', color: '#8A6300' }} onClick={() => nav('/planes')}><Icon n="star" /><span className="grow">2 consultas por mes incluidas en Premium</span><Icon n="chev" /></button>}
    {data.mine.length > 0 && <><Sect title="Mis consultas" />
      {data.mine.map(c => <div key={c.id} className="pro"><Avatar n={c.proName} size={44} />
        <div className="grow"><b style={{ color: 'var(--navy)' }}>{c.proName}</b><div className="tiny muted" style={{ fontWeight: 700 }}>{shortDate(c.date)} · {c.time} · {c.mode}</div>
          <button className="link small" disabled={cancel.busy} onClick={() => setAsking(c)}>Cancelar</button></div><span className="tag">Confirmada</span></div>)}</>}
    <div className="seg" style={{ marginTop: 18 }}>
      <button className={kind === 'nutri' ? 'on' : ''} onClick={() => setKind('nutri')}>Nutricionistas</button>
      <button className={kind === 'entre' ? 'on' : ''} onClick={() => setKind('entre')}>Entrenadores</button></div>
    {data.pros.filter(p => p.kind === kind).map(p => <button key={p.id} className="pro" onClick={() => nav(`/profesionales/${p.id}`)}><Avatar n={p.name} size={48} />
      <div className="grow"><b style={{ color: 'var(--navy)' }}>{p.name}</b><div className="tiny muted">{p.specialty}</div>
        <div className="tiny" style={{ fontWeight: 700, color: 'var(--navy)' }}>⭐ {rating(p.rating)} · {p.license}</div>
        <div className="tiny" style={{ color: 'var(--green-d)', fontWeight: 700 }}>{nextTxt(p)}</div></div><Icon n="chev" className="chev" /></button>)}
    <p className="tiny muted center mt16">Profesionales de ejemplo para la demo.</p>
    {asking && <ConfirmSheet title={`¿Cancelar la consulta con ${asking.proName}?`} text={`${shortDate(asking.date)} · ${asking.time} · ${asking.mode}`}
      confirm="Sí, cancelar" cancel="No, mantenerla" busy={cancel.busy} onConfirm={() => cancel.run(asking.id)} onClose={() => setAsking(null)} />}
  </Screen>;
}
