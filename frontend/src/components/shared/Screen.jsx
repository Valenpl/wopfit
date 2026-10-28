import ScrollArea from './ScrollArea.jsx';

/** Pantalla con zona de scroll y, opcional, botones fijos abajo (`foot`). */
export default function Screen({ children, foot, narrow, className = '', scrollStyle }) {
  return <div className={`screen ${narrow ? 'narrow' : ''} ${className}`}>
    <ScrollArea style={scrollStyle}>{children}</ScrollArea>
    {foot && <div className="foot">{foot}</div>}
  </div>;
}
