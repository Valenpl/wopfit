import Icon from './Icon.jsx';

export default function Note({ icon = 'info', tone = '', className = '', children }) {
  return <div className={`note ${tone} ${className}`}><Icon n={icon} /><span>{children}</span></div>;
}
