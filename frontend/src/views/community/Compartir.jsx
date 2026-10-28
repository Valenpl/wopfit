import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../../redux/slices/communitySlice';
import useAuth from '../../hooks/useAuth';
import useRequest from '../../hooks/useRequest';
import useToast from '../../hooks/useToast';
import { GOALS, goal } from '../../utils/constants';
import { shrink } from '../../utils/images';
import { saveSession } from '../../utils/storage';
import Btn from '../../components/shared/Btn.jsx';
import Field from '../../components/shared/Field.jsx';
import Icon from '../../components/shared/Icon.jsx';
import Note from '../../components/shared/Note.jsx';
import Screen from '../../components/shared/Screen.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

const TYPES = [['receta', 'Receta', '🥗'], ['actividad', 'Actividad', '🏃'], ['pregunta', 'Pregunta', '💬']];

export default function Compartir() {
  const nav = useNavigate();
  const toast = useToast();
  const { me } = useAuth();
  const [type, setType] = useState('receta');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photo, setPhoto] = useState(null);
  // Cambiar la key vuelve a crear el input de archivo vacío, así se puede elegir la misma foto otra vez.
  const [fileKey, setFileKey] = useState(0);
  const publish = useRequest(createPost, {
    onSuccess: () => { saveSession('wopfit-cf', 'para'); nav('/comunidad', { replace: true }); }
  });
  const can = (title.trim() || body.trim()) && !publish.busy;
  const myGoal = goal(me.preferences.goals.find(g => GOALS.some(x => x.k === g)) || 'mover');
  const pickPhoto = async e => {
    const file = e.target.files && e.target.files[0];
    setFileKey(k => k + 1);
    if (!file) return;
    try { setPhoto(await shrink(file)); } catch (ex) { toast(ex.message); }
  };
  const ph = type === 'receta' ? 'Ej: Guiso de lentejas por $1.500' : type === 'actividad' ? 'Ej: Hoy caminé 30 min' : 'Ej: ¿Alguien entrena a la mañana?';
  return <Screen narrow foot={<Btn busy={publish.busy} disabled={!can} onClick={() => publish.run({ type, title: title.trim(), body: body.trim(), photo })}>Publicar</Btn>}>
    <TopBar fallback="/comunidad" />
    <h1>¿Qué querés compartir?</h1><p className="sub">Lo ve gente con tus mismos objetivos.</p>
    <div className="grid3">{TYPES.map(([k, t, e]) => <button key={k} className={`slot ${type === k ? 'on' : ''}`} onClick={() => setType(k)} aria-pressed={type === k}>
      <span style={{ fontSize: 24 }}>{e}</span><small style={{ fontSize: 13, color: 'var(--navy)' }}>{t}</small></button>)}</div>
    <Field id="ptitle" label="Título" placeholder={ph} value={title} maxLength={100} onChange={e => setTitle(e.target.value)} />
    <label className="f" htmlFor="ptext">Contá más</label>
    <textarea className="ta" id="ptext" style={{ height: 120 }} maxLength={1000} placeholder="Ingredientes, cómo te fue, tu pregunta…" value={body} onChange={e => setBody(e.target.value)} />
    <label className="opt mt12" htmlFor="pfile" style={{ cursor: 'pointer' }}><div className="tile sm"><Icon n="img" /></div><span className="t grow">{photo ? 'Cambiar foto' : 'Agregar foto'}</span><Icon n="chev" className="chev" /></label>
    <input key={fileKey} type="file" id="pfile" accept="image/*" onChange={pickPhoto} style={{ display: 'none' }} aria-label="Foto" />
    {photo && <div className="pprev"><img src={photo} alt="Vista previa" /><button className="iconbtn" onClick={() => setPhoto(null)} aria-label="Quitar foto"><Icon n="x" /></button></div>}
    {!can && !publish.busy && <p className="tiny muted mt8">Escribí un título o un texto para poder publicar.</p>}
    <Note tone="blue" icon="users" className="mt12">Se publica con tu objetivo: {myGoal.t}.</Note>
  </Screen>;
}
