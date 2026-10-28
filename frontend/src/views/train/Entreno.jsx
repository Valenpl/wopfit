import useAuth from '../../hooks/useAuth';
import useTab from '../../hooks/useTab';
import ScrollArea from '../../components/shared/ScrollArea.jsx';
import ProgressTab from './ProgressTab.jsx';
import TodayTab from './TodayTab.jsx';
import WeekTab from './WeekTab.jsx';

const TABS = [['hoy', 'Hoy'], ['semana', 'Semana'], ['prog', 'Progreso']];
const KEYS = TABS.map(([k]) => k);

/** Entreno, con tres pestañas. La pestaña elegida se recuerda con useTab. */
export default function Entreno() {
  const { me } = useAuth();
  const [tab, pick] = useTab('entreno', KEYS, 'hoy');
  return <div className="screen"><ScrollArea>
    <div className="row between"><h1 style={{ margin: 0 }}>Entreno</h1><span className="tag">{me.plan.levelName}</span></div>
    <div className="seg three">{TABS.map(([k, t]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => pick(k)}>{t}</button>)}</div>
    {tab === 'hoy' && <TodayTab />}
    {tab === 'semana' && <WeekTab />}
    {tab === 'prog' && <ProgressTab />}
  </ScrollArea></div>;
}
