import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { commentPost, deletePost, fetchPost, markPost } from '../../redux/slices/communitySlice';
import { getEntry } from '../../redux/helpers';
import useFetch from '../../hooks/useFetch';
import useRequest from '../../hooks/useRequest';
import { ago } from '../../utils/dates';
import PostCard from '../../components/community/PostCard.jsx';
import Avatar from '../../components/pros/Avatar.jsx';
import ConfirmSheet from '../../components/shared/ConfirmSheet.jsx';
import ErrorBox from '../../components/shared/ErrorBox.jsx';
import Icon from '../../components/shared/Icon.jsx';
import Loading from '../../components/shared/Loading.jsx';
import Screen from '../../components/shared/Screen.jsx';
import ScrollArea from '../../components/shared/ScrollArea.jsx';
import Sect from '../../components/shared/Sect.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

export default function Publicacion() {
  const { id } = useParams();
  const nav = useNavigate();
  const dispatch = useDispatch();
  const { data, error, retry } = useFetch(fetchPost, id, s => getEntry(s.community.posts, id));
  const [cm, setCm] = useState('');
  const [asking, setAsking] = useState(false);
  // El botón de comentarios de la tarjeta lleva el foco al campo de texto, con un ref (sin buscarlo en el DOM).
  const input = useRef(null);
  const comment = useRequest(commentPost, { onSuccess: () => setCm('') });
  const remove = useRequest(deletePost, { onSuccess: () => nav('/comunidad', { replace: true }), onError: () => setAsking(false) });
  if (error && !data) return <Screen><TopBar fallback="/comunidad" /><ErrorBox error={error} onRetry={retry} /></Screen>;
  if (!data) return <Loading />;
  const { post, comments } = data;
  const send = e => {
    e.preventDefault();
    const text = cm.trim();
    if (text) comment.run({ id, text });
  };
  return <div className="screen"><ScrollArea>
    <TopBar fallback="/comunidad" right={post.mine ? <button className="textbtn" onClick={() => setAsking(true)} disabled={remove.busy}>Borrar</button> : null} />
    <div className="mt12" />
    <PostCard p={post} onMark={(kind, on) => dispatch(markPost({ id: post.id, kind, on }))} onComments={() => input.current && input.current.focus()} />
    <Sect title="Comentarios" right={<span className="tag blue">{comments.length}</span>} />
    <div className="card">{comments.length ? comments.map(c => <div key={c.id} className="cmt"><Avatar n={c.author} size={32} />
      <div><b style={{ color: 'var(--navy)', fontSize: 13 }}>{c.author}</b> <span className="tiny muted">{ago(c.createdAt)}</span><div className="small">{c.text}</div></div></div>)
      : <div className="small muted">Sé la primera persona en comentar.</div>}</div>
  </ScrollArea>
  <form className="composer" onSubmit={send}><input id="cm" ref={input} value={cm} onChange={e => setCm(e.target.value)} maxLength={300} placeholder="Escribí un comentario…" aria-label="Comentario" />
    <button type="submit" aria-label="Enviar" disabled={comment.busy || !cm.trim()}><Icon n="send" /></button></form>
    {asking && <ConfirmSheet title="¿Borrar tu publicación?" text="No se puede deshacer." confirm="Sí, borrar" cancel="Volver" busy={remove.busy}
      onConfirm={() => remove.run(post.id)} onClose={() => setAsking(false)} />}
  </div>;
}
