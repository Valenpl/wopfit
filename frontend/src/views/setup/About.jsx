import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateAbout } from '../../redux/slices/authSlice';
import useAuth from '../../hooks/useAuth';
import useBack from '../../hooks/useBack';
import useRequest from '../../hooks/useRequest';
import useToast from '../../hooks/useToast';
import Btn from '../../components/shared/Btn.jsx';
import Field from '../../components/shared/Field.jsx';
import Note from '../../components/shared/Note.jsx';
import ScrollArea from '../../components/shared/ScrollArea.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

function aboutError(f) {
  if (!f.name.trim()) return 'Contanos cómo te llamamos.';
  if (!f.birthDate) return 'Completá tu fecha de nacimiento.';
  const age = (Date.now() - new Date(f.birthDate)) / 3.15576e10;
  if (!(age >= 13 && age <= 110)) return 'Revisá la fecha: la app es para mayores de 13 años.';
  if (f.heightCm && (+f.heightCm < 100 || +f.heightCm > 230)) return 'La altura va en centímetros (ej: 165).';
  if (f.weightKg && (+f.weightKg < 30 || +f.weightKg > 300)) return 'El peso va en kilos (ej: 60).';
  return '';
}

/** "Contanos un poco de vos" (registro) y "Datos básicos" (perfil, con `edit`). */
export default function About({ edit }) {
  const { me } = useAuth();
  const nav = useNavigate();
  const back = useBack('/perfil');
  const toast = useToast();
  const [f, setF] = useState({ name: me.name || '', birthDate: me.birthDate || '', heightCm: me.heightCm ?? '', weightKg: me.weightKg ?? '' });
  const [touched, setTouched] = useState(false);
  const save = useRequest(updateAbout, {
    onSuccess: () => { if (edit) { toast('Guardamos tus datos'); back(); } else nav('/preferencias/1', { replace: true }); }
  });
  const err = aboutError(f);
  const set = k => e => setF({ ...f, [k]: e.target.value });

  const submit = e => {
    e.preventDefault();
    setTouched(true);
    if (err || save.busy) return;
    save.run({ name: f.name.trim(), birthDate: f.birthDate, heightCm: f.heightCm ? +f.heightCm : null, weightKg: f.weightKg ? +String(f.weightKg).replace(',', '.') : null });
  };

  return <form className="screen narrow" onSubmit={submit} noValidate>
    <ScrollArea>{edit ? <TopBar fallback="/perfil" /> : <div className="top" />}
      <h1>{edit ? 'Datos básicos' : 'Contanos un poco de vos'}</h1><p className="sub">Con esto armamos un plan seguro para vos.</p>
      <Field id="name" label="¿Cómo te llamamos?" placeholder="Tu nombre" autoComplete="given-name" value={f.name} onChange={set('name')} />
      <Field id="birth" label="Fecha de nacimiento" type="date" max={new Date().toISOString().slice(0, 10)} value={f.birthDate} onChange={set('birthDate')} />
      <div className="grid2">
        <div><Field id="height" label="Altura (cm)" optional placeholder="165" inputMode="numeric" maxLength={3} value={f.heightCm} onChange={set('heightCm')} /></div>
        <div><Field id="weight" label="Peso (kg)" optional placeholder="60" inputMode="decimal" maxLength={5} value={f.weightKg} onChange={set('weightKg')} /></div>
      </div>
      {touched && err && <div className="err">{err}</div>}
      <Note icon="lock" className="mt20">Tus datos son privados. Solo los usamos para ajustar tu plan, nadie más los ve.</Note>
    </ScrollArea>
    <div className="foot"><Btn type="submit" busy={save.busy}>{edit ? 'Guardar' : 'Continuar'}</Btn></div>
  </form>;
}
