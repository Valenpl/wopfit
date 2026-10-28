import useBack from '../../hooks/useBack';
import Icon from './Icon.jsx';

export default function TopBar({ right, fallback = '/inicio' }) {
  const back = useBack(fallback);
  return <div className="top"><button className="iconbtn" onClick={back} aria-label="Volver"><Icon n="back" /></button>{right}</div>;
}
