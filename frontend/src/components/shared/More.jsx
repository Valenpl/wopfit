import Icon from './Icon.jsx';

export default function More({ onClick, children = 'Ver más' }) {
  return <button className="more" onClick={onClick}>{children} <Icon n="chev" /></button>;
}
