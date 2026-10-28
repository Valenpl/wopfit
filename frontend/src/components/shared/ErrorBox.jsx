export default function ErrorBox({ error, onRetry }) {
  return <div className="card center"><p className="muted" style={{ fontWeight: 700, margin: '4px 0 12px' }}>{(error && error.message) || 'No pudimos cargar esto.'}</p>
    {onRetry && <button className="btn sm" style={{ margin: '0 auto' }} onClick={onRetry}>Reintentar</button>}</div>;
}
