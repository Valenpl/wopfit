import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../redux/slices/authSlice';
import useRequest from '../../hooks/useRequest';
import { emailOk } from '../../utils/validation';
import Btn from '../../components/shared/Btn.jsx';
import Field from '../../components/shared/Field.jsx';
import Icon from '../../components/shared/Icon.jsx';
import PwChecks, { passChecks } from '../../components/shared/PwChecks.jsx';
import PwField from '../../components/shared/PwField.jsx';
import ScrollArea from '../../components/shared/ScrollArea.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

export default function Signup() {
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', pass: '', pass2: '', terms: false });
  const [touched, setTouched] = useState(false);
  const signup = useRequest(register, {
    onSuccess: (r, arg) => nav('/verificar', { state: { email: arg.email, devCode: r.devCode, message: r.message } })
  });
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const checks = passChecks(f.pass, f.pass2);
  const ok = emailOk(f.email) && checks.every(c => c[0]) && f.terms;

  const submit = e => {
    e.preventDefault();
    if (!ok || signup.busy) return;
    signup.run({ email: f.email.trim(), password: f.pass });
  };

  return <form className="screen narrow" onSubmit={submit} noValidate>
    <ScrollArea><TopBar fallback="/" />
      <h1>Creá tu cuenta</h1><p className="sub">Así guardamos tu plan y tu avance.</p>
      <Field id="email" label="Email" placeholder="tu@email.com" type="email" inputMode="email" autoComplete="email" value={f.email} onChange={set('email')} onBlur={() => setTouched(true)}
        error={touched && f.email && !emailOk(f.email) ? 'Revisá el formato del email.' : ''} />
      <PwField id="pass" label="Contraseña" placeholder="Creá una contraseña" autoComplete="new-password" value={f.pass} onChange={set('pass')} />
      <PwField id="pass2" label="Repetí tu contraseña" placeholder="Escribila de nuevo" autoComplete="new-password" value={f.pass2} onChange={set('pass2')} />
      <PwChecks checks={checks} />
      <button type="button" className="terms" onClick={() => setF({ ...f, terms: !f.terms })} aria-pressed={f.terms}><span className={`ck box ${f.terms ? 'on' : ''}`}><Icon n="check" /></span><span>Acepto los <b>Términos</b> y la <b>Política de privacidad</b></span></button>
      {signup.error && <div className="formerr">{signup.error.message}</div>}
    </ScrollArea>
    <div className="foot"><Btn type="submit" busy={signup.busy} disabled={!ok}>Crear cuenta <Icon n="arrow" /></Btn>
      <div className="footnote">¿Ya tenés una cuenta? <button type="button" className="link" onClick={() => nav('/ingresar')}>Ingresá</button></div></div>
  </form>;
}
