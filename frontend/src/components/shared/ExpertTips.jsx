import Icon from './Icon.jsx';
import Rich from './Rich.jsx';
import Source from './Source.jsx';

/** Consejos de expertos con su fuente (plan listo y rutina). Primero vienen los de la salud y objetivos de la persona. */
export default function ExpertTips({ tips, className = '' }) {
  if (!tips || !tips.length) return null;
  return <div className={`card ${className}`}>
    <div className="row"><div className="tile g"><Icon n="shield" /></div><h3 className="grow">Lo que recomiendan los expertos</h3></div>
    {tips.map(t => <div key={t.text} className="tip small"><Rich text={t.text} /><Source name={t.source} url={t.url} /></div>)}
  </div>;
}
