export default function Loading({ text = 'Cargando…' }) {
  return <div className="screen still"><div className="scroll" style={{ display: 'grid', placeItems: 'center' }}>
    <div className="center"><img src="/wopi.webp" alt="" className="wopi" style={{ width: 130 }} /><p className="muted" style={{ fontWeight: 700 }}>{text}</p></div>
  </div></div>;
}
