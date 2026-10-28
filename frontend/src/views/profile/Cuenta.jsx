import { useState } from 'react';
import { changePassword } from '../../redux/slices/authSlice';
import useAuth from '../../hooks/useAuth';
import useBack from '../../hooks/useBack';
import useRequest from '../../hooks/useRequest';
import useToast from '../../hooks/useToast';
import Btn from '../../components/shared/Btn.jsx';
import Field from '../../components/shared/Field.jsx';
import PwField from '../../components/shared/PwField.jsx';
import Screen from '../../components/shared/Screen.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

/** Cuenta: email (solo lectura) y cambio de contraseña. */
export default function Cuenta() {
  const { me } = useAuth();
  const toast = useToast();
  const back = useBack('/perfil');
  const [f, setF] = useState({ current: '', password: '' });
  const [err, setErr] = useState({});
  // Los errores de cada campo vienen del backend (fields); si no hay, se muestra el mensaje general.
  const save = useRequest(changePassword, {
    onSuccess: back,
    onError: e => (Object.keys(e.fields).length ? setErr(e.fields) : toast(e.message))
  });
  const up = k => e => { setF({ ...f, [k]: e.target.value }); setErr({ ...err, [k]: undefined }); };
  const submit = () => {
    const e = {};
    if (!f.current) e.current = 'Escribí tu contraseña actual';
    if (f.password.length < 8 || !/\d/.test(f.password)) e.password = 'Mínimo 8 caracteres y un número';
    setErr(e);
    if (!Object.keys(e).length) save.run(f);
  };
  return <Screen narrow foot={<Btn busy={save.busy} onClick={submit}>Guardar</Btn>}>
    <TopBar fallback="/perfil" />
    <h1>Cuenta</h1><p className="sub">Tu email y tu contraseña.</p>
    <Field id="email" label="Email" value={me.email} disabled />
    <PwField id="current" label="Contraseña actual" autoComplete="current-password" value={f.current} onChange={up('current')} error={err.current} />
    <PwField id="password" label="Nueva contraseña" placeholder="Mínimo 8 caracteres y un número" autoComplete="new-password" value={f.password} onChange={up('password')} error={err.password} />
  </Screen>;
}
