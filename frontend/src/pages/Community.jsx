import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, apiUrl } from '../api.js';
import { GOALS, Icon, cap, goal } from '../lib.jsx';
import { Avatar, Btn, ErrorBox, Field, Loading, Note, Screen, Sect, TopBar, useAction, useApp, useLoad } from '../ui.jsx';

const FILTERS = [['para', 'Para vos'], ['recetas', 'Recetas'], ['act', 'Activid.'], ['preg', 'Dudas']];
const TYPES = [['receta', 'Receta', '🥗'], ['actividad', 'Actividad', '🏃'], ['pregunta', 'Pregunta', '💬']];

/** "recién", "hace 5 min", "hace 2 h", "ayer", "hace 3 días". */
function ago(iso) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return 'recién';
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
}

/** Tarjeta de publicación. `short` = en el feed (texto recortado, los comentarios abren la publicación). */
function PostCard({ p, short, onChange, onComments }) {
  const nav = useNavigate();
  const { toast } = useApp();
  const g = GOALS.find(x => x.k === p.goal);
  const toggle = async kind => {
    const on = kind === 'like' ? !p.liked : !p.saved;
    onChange({ ...p, ...(kind === 'like' ? { liked: on, likes: p.likes + (on ? 1 : -1) } : { saved: on }) });
    try {
      const r = await api.put(`/posts/${p.id}/${kind}`, { on });
      onChange({ ...p, ...(kind === 'like' ? { liked: on, likes: r.likes } : { saved: on }) });
      if (kind === 'save') toast(on ? 'Guardado' : 'Quitado de guardados');
    } catch (ex) { onChange(p); toast(ex.message); }
  };
  const open = () => nav(`/comunidad/${p.id}`);
  return <article className="post">
    <div className="row"><Avatar n={p.author} size={36} /><div className="grow"><b style={{ color: 'var(--navy)', fontSize: 14 }}>{p.author}{p.mine && ' (vos)'}</b>
      <div className="tiny muted">{ago(p.createdAt)} · {cap(p.type)}</div></div><span className={`tag ${g && g.p ? 'peach' : ''}`}>{p.goalName}</span></div>
    <h3 className="mt12" style={{ fontSize: 15 }}>{p.title}</h3>
    {p.body && <p className={`txt ${short ? 'clamp' : ''}`}>{p.body}</p>}
    {short && p.body && p.body.length > 90 && <button className="more mt8" style={{ fontSize: 13 }} onClick={open}>Ver más <Icon n="chev" /></button>}
    {p.photoUrl ? <img className="pimg" src={apiUrl(p.photoUrl)} alt="Foto de la publicación" loading="lazy" />
      : p.emoji ? <div className="ph" style={{ background: p.bg }}>{p.emoji}</div> : null}
    {p.tags.length > 0 && <div className="chips mt8">{p.tags.map(t => <span key={t} className="tag blue">{t}</span>)}</div>}
    <div className="acts">
      <button className={p.liked ? 'liked' : ''} onClick={() => toggle('like')} aria-pressed={p.liked} aria-label={`Me gusta, ${p.likes}`}><Icon n="heart" /> {p.likes}</button>
      <button onClick={short ? open : onComments} aria-label={`Comentarios, ${p.comments}`}><Icon n="chat" /> {p.comments}</button>
      <button onClick={() => toggle('save')} style={p.saved ? { color: 'var(--blue)' } : undefined} aria-pressed={p.saved}><Icon n="bookmark" /> {p.saved ? 'Guardado' : 'Guardar'}</button>
    </div>
  </article>;
}

// ---------- Comunidad ----------
export function Comunidad() {
  const nav = useNavigate();
  const { toast } = useApp();
  const [f, setF] = useState(() => sessionStorage.getItem('wopfit-cf') || 'para');
  const { data, error, reload, set } = useLoad(sig => api.get(`/community?f=${f}`, sig), [f]);
  const pick = k => { setF(k); try { sessionStorage.setItem('wopfit-cf', k); } catch { /* */ } };
  const follow = async person => {
    const on = !person.following;
    const put = v => set(d => ({ ...d, people: d.people.map(x => (x.id === person.id ? { ...x, following: v } : x)) }));
    put(on);
    try { await api.put(`/community/people/${person.id}/follow`, { on }); } catch (ex) { put(!on); toast(ex.message); }
  };
  const update = p => set(d => ({ ...d, posts: d.posts.map(x => (x.id === p.id ? p : x)) }));
  return <div className="screen"><div className="scroll" style={{ paddingBottom: 90 }}>
    <h1 style={{ marginTop: 4 }}>Comunidad</h1><p className="sub">Gente como vos, con tus mismos objetivos.</p>
    {error && <ErrorBox error={error} onRetry={reload} />}
    {!data && !error && <p className="center muted">Cargando…</p>}
    {data && <>
      <Sect title="Personas como vos" />
      <div className="hscroll">{data.people.map(p => <div key={p.id} className="person"><Avatar n={p.name} />
        <b style={{ color: 'var(--navy)', fontSize: 14 }}>{p.name}</b>
        <span className="tiny muted" style={{ lineHeight: 1.3 }}>{p.sharedGoal ? 'También quiere ' + goal(p.sharedGoal).t.toLowerCase() : goal(p.goals[0] || 'mover').t} · Entrena {p.daysPerWeek} días</span>
        <button className={`btn sm ${p.following ? 'outline' : ''}`} style={{ minHeight: 32, padding: '0 12px', fontSize: 13 }} onClick={() => follow(p)} aria-pressed={p.following}>{p.following ? 'Siguiendo' : 'Seguir'}</button>
      </div>)}</div>
      <div className="seg four" style={{ marginTop: 16 }}>{FILTERS.map(([k, t]) => <button key={k} className={f === k ? 'on' : ''} onClick={() => pick(k)}>{t}</button>)}</div>
      {data.posts.length ? data.posts.map(p => <PostCard key={p.id} p={p} short onChange={update} />) : <div className="card center muted">Todavía no hay publicaciones acá.</div>}
    </>}
  </div><button className="fabbtn" onClick={() => nav('/comunidad/compartir')}><Icon n="plus" /> Compartir</button></div>;
}

// ---------- Publicación ----------
export function Publicacion() {
  const { id } = useParams();
  const nav = useNavigate();
  const { toast } = useApp();
  const { data, error, reload, set } = useLoad(sig => api.get(`/posts/${id}`, sig), [id]);
  const [cm, setCm] = useState('');
  const [busy, run] = useAction();
  if (error) return <Screen><TopBar fallback="/comunidad" /><ErrorBox error={error} onRetry={reload} /></Screen>;
  if (!data) return <Loading />;
  const { post, comments } = data;
  const send = e => {
    e.preventDefault();
    const text = cm.trim();
    if (!text) return;
    run(async () => {
      const c = await api.post(`/posts/${id}/comments`, { text });
      setCm('');
      set(d => ({ post: { ...d.post, comments: d.post.comments + 1 }, comments: [...d.comments, c] }));
    });
  };
  const remove = () => {
    if (!window.confirm('¿Borrar tu publicación?')) return;
    run(async () => { await api.del(`/posts/${id}`); toast('Publicación borrada'); nav('/comunidad', { replace: true }); });
  };
  return <div className="screen"><div className="scroll">
    <TopBar fallback="/comunidad" right={post.mine ? <button className="textbtn" onClick={remove} disabled={busy}>Borrar</button> : null} />
    <div className="mt12" />
    <PostCard p={post} onChange={p => set(d => ({ ...d, post: p }))} onComments={() => document.getElementById('cm')?.focus()} />
    <Sect title="Comentarios" right={<span className="tag blue">{comments.length}</span>} />
    <div className="card">{comments.length ? comments.map(c => <div key={c.id} className="cmt"><Avatar n={c.author} size={32} />
      <div><b style={{ color: 'var(--navy)', fontSize: 13 }}>{c.author}</b> <span className="tiny muted">{ago(c.createdAt)}</span><div className="small">{c.text}</div></div></div>)
      : <div className="small muted">Sé la primera persona en comentar.</div>}</div>
  </div>
  <form className="composer" onSubmit={send}><input id="cm" value={cm} onChange={e => setCm(e.target.value)} maxLength={300} placeholder="Escribí un comentario…" aria-label="Comentario" />
    <button type="submit" aria-label="Enviar" disabled={busy || !cm.trim()}><Icon n="send" /></button></form></div>;
}

/** Achica la foto en el celu (lado mayor 1080 px, JPEG) antes de subirla. */
function shrink(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error('No pudimos abrir esa imagen'));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('No pudimos abrir esa imagen'));
      img.onload = () => {
        const k = Math.min(1, 1080 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; // JPEG no tiene transparencia: sin esto un PNG transparente queda con fondo negro
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.8));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

// ---------- Compartir ----------
export function Compartir() {
  const nav = useNavigate();
  const { me, toast } = useApp();
  const [type, setType] = useState('receta');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photo, setPhoto] = useState(null);
  const [busy, run] = useAction();
  const can = (title.trim() || body.trim()) && !busy;
  const myGoal = goal(me.preferences.goals.find(g => GOALS.some(x => x.k === g)) || 'mover');
  const pickPhoto = async e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try { setPhoto(await shrink(file)); } catch (ex) { toast(ex.message); }
  };
  const publish = () => run(async () => {
    await api.post('/posts', { type, title: title.trim(), body: body.trim(), photo });
    try { sessionStorage.setItem('wopfit-cf', 'para'); } catch { /* */ }
    toast('¡Publicado en la comunidad!');
    nav('/comunidad', { replace: true });
  });
  const ph = type === 'receta' ? 'Ej: Guiso de lentejas por $1.500' : type === 'actividad' ? 'Ej: Hoy caminé 30 min' : 'Ej: ¿Alguien entrena a la mañana?';
  return <Screen narrow foot={<Btn busy={busy} disabled={!can} onClick={publish}>Publicar</Btn>}>
    <TopBar fallback="/comunidad" />
    <h1>¿Qué querés compartir?</h1><p className="sub">Lo ve gente con tus mismos objetivos.</p>
    <div className="grid3">{TYPES.map(([k, t, e]) => <button key={k} className={`slot ${type === k ? 'on' : ''}`} onClick={() => setType(k)} aria-pressed={type === k}>
      <span style={{ fontSize: 24 }}>{e}</span><small style={{ fontSize: 13, color: 'var(--navy)' }}>{t}</small></button>)}</div>
    <Field id="ptitle" label="Título" placeholder={ph} value={title} maxLength={100} onChange={e => setTitle(e.target.value)} />
    <label className="f" htmlFor="ptext">Contá más</label>
    <textarea className="ta" id="ptext" style={{ height: 120 }} maxLength={1000} placeholder="Ingredientes, cómo te fue, tu pregunta…" value={body} onChange={e => setBody(e.target.value)} />
    <label className="opt mt12" htmlFor="pfile" style={{ cursor: 'pointer' }}><div className="tile sm"><Icon n="img" /></div><span className="t grow">{photo ? 'Cambiar foto' : 'Agregar foto'}</span><Icon n="chev" className="chev" /></label>
    <input type="file" id="pfile" accept="image/*" onChange={pickPhoto} style={{ display: 'none' }} aria-label="Foto" />
    {photo && <div className="pprev"><img src={photo} alt="Vista previa" /><button className="iconbtn" onClick={() => setPhoto(null)} aria-label="Quitar foto"><Icon n="x" /></button></div>}
    {!can && !busy && <p className="tiny muted mt8">Escribí un título o un texto para poder publicar.</p>}
    <Note tone="blue" icon="users" className="mt12">Se publica con tu objetivo: {myGoal.t}.</Note>
  </Screen>;
}
