import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, resendCode } from '../../redux/slices/authSlice';
import useRequest from '../../hooks/useRequest';
import { emailOk } from '../../utils/validation';
import Btn from '../../components/shared/Btn.jsx';
import Field from '../../components/shared/Field.jsx';
import PwField from '../../components/shared/PwField.jsx';
import ScrollArea from '../../components/shared/ScrollArea.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const ok = emailOk(email) && pass.length >= 1;
  // Si la cuenta no está verificada (403), mandamos un código nuevo y vamos a verificar.
  // Si eso falla, se muestra el aviso original ("Verificá tu email...").
  const [unverified, setUnverified] = useState('');
  const resend = useRequest(resendCode, {
    onSuccess: (r, mail) => nav('/verificar', { state: { email: mail, devCode: r.devCode } }),
    onError: () => setErr(unverified)
  });
  const signin = useRequest(login, {
    onSuccess: () => nav('/inicio', { replace: true }),
    onError: e => { if (e.status === 403) { setUnverified(e.message); resend.run(email.trim()); } else setErr(e.message); }
  });

  const submit = e => {
    e.preventDefault();
    if (!ok || signin.busy) return;
    setErr('');
    signin.run({ email: email.trim(), password: pass });
  };

  return <form className="screen narrow" onSubmit={submit} noValidate>
    <ScrollArea><TopBar fallback="/" />
      <div className="brand mt8"><img src="/logo.webp" alt="" /><b>Wop<i>Fit</i></b></div>
      <h1 className="center">¡Qué bueno verte de nuevo!</h1><p className="sub center">Ingresá para seguir con tu plan.</p>
      <Field id="lemail" label="Email" placeholder="tu@email.com" type="email" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
      <PwField id="lpass" label="Contraseña" placeholder="Tu contraseña" autoComplete="current-password" value={pass} onChange={e => setPass(e.target.value)} />
      <div style={{ textAlign: 'right', marginTop: 10 }}><button type="button" className="link" style={{ fontSize: 14 }} onClick={() => nav('/recuperar', { state: { email: email.trim() } })}>¿Olvidaste tu contraseña?</button></div>
      {err && <div className="formerr">{err}</div>}
    </ScrollArea>
    <div className="foot"><Btn type="submit" busy={signin.busy || resend.busy} disabled={!ok}>Ingresar</Btn>
      <div className="footnote">¿No tenés cuenta? <button type="button" className="link" onClick={() => nav('/registro')}>Creala</button></div></div>
  </form>;
}
