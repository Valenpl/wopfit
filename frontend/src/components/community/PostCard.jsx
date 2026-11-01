import { apiUrl } from '../../utils/api';
import { GOALS } from '../../utils/constants';
import { ago } from '../../utils/dates';
import { cap } from '../../utils/format';
import Avatar from '../pros/Avatar.jsx';
import Icon from '../shared/Icon.jsx';

/**
 * Tarjeta de publicación. `short` = en el feed (texto recortado; tocar abre la publicación).
 * onMark(kind, on) guarda "me gusta" o "guardar"; onOpen abre la publicación; onComments lleva al campo de comentario.
 */
export default function PostCard({ p, short, onMark, onOpen, onComments }) {
  const g = GOALS.find(x => x.k === p.goal);
  return <article className="post">
    <div className="row"><Avatar n={p.author} size={36} /><div className="grow"><b style={{ color: 'var(--navy)', fontSize: 14 }}>{p.author}{p.mine && ' (vos)'}</b>
      <div className="tiny muted">{ago(p.createdAt)} · {cap(p.type)}</div></div><span className={`tag ${g && g.p ? 'peach' : ''}`}>{p.goalName}</span></div>
    <h3 className="mt12" style={{ fontSize: 15 }}>{p.title}</h3>
    {p.body && <p className={`txt ${short ? 'clamp' : ''}`}>{p.body}</p>}
    {short && p.body && p.body.length > 90 && <button className="more mt8" style={{ fontSize: 13 }} onClick={onOpen}>Ver más <Icon n="chev" /></button>}
    {p.photoUrl ? <img className="pimg" src={apiUrl(p.photoUrl)} alt="Foto de la publicación" loading="lazy" />
      : p.emoji ? <div className="ph" style={{ background: p.bg }}>{p.emoji}</div> : null}
    {p.tags.length > 0 && <div className="chips mt8">{p.tags.map(t => <span key={t} className="tag blue">{t}</span>)}</div>}
    <div className="acts">
      <button className={p.liked ? 'liked' : ''} onClick={() => onMark('like', !p.liked)} aria-pressed={p.liked} aria-label={`Me gusta, ${p.likes}`}><Icon n="heart" /> {p.likes}</button>
      <button onClick={short ? onOpen : onComments} aria-label={`Comentarios, ${p.comments}`}><Icon n="chat" /> {p.comments}</button>
      <button onClick={() => onMark('save', !p.saved)} style={p.saved ? { color: 'var(--blue)' } : undefined} aria-pressed={p.saved}><Icon n="bookmark" /> {p.saved ? 'Guardado' : 'Guardar'}</button>
    </div>
  </article>;
}
