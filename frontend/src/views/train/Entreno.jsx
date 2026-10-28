import { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { loadSession, saveSession } from '../../utils/storage';
import ScrollArea from '../../components/shared/ScrollArea.jsx';
import ProgressTab from './ProgressTab.jsx';
import TodayTab from './TodayTab.jsx';
import WeekTab from './WeekTab.jsx';

const TABS = [['hoy', 'Hoy'], ['semana', 'Semana'], ['prog', 'Progreso']];

/** Entreno, con tres pestañas. La pestaña elegida se recuerda mientras dure la pestaña del navegador. */
export default function Entreno() {
  const { me } = useAuth();
  const [tab, setTab] = useState(() => loadSession('wopfit-et', 'hoy'));
  const pick = k => { setTab(k); saveSession('wopfit-et', k); };
  return <div className="screen"><ScrollArea>
    <div className="row between"><h1 style={{ margin: 0 }}>Entreno</h1><span className="tag">{me.plan.levelName}</span></div>
    <div className="seg three">{TABS.map(([k, t]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => pick(k)}>{t}</button>)}</div>
    {tab === 'hoy' && <TodayTab />}
    {tab === 'semana' && <WeekTab />}
    {tab === 'prog' && <ProgressTab />}
  </ScrollArea></div>;
}
