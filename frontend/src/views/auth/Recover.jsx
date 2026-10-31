import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../../redux/slices/authSlice';
import useRequest from '../../hooks/useRequest';
import { emailOk } from '../../utils/validation';
import Btn from '../../components/shared/Btn.jsx';
import CodeInput from '../../components/shared/CodeInput.jsx';
import Field from '../../components/shared/Field.jsx';
import Icon from '../../components/shared/Icon.jsx';
import PwChecks, { passChecks } from '../../components/shared/PwChecks.jsx';
import PwField from '../../components/shared/PwField.jsx';
import ScrollArea from '../../components/shared/ScrollArea.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

/** "¿Olvidaste tu contraseña?": pide un código por email y con él elige una contraseña nueva (y entra). */
export default function Recover() {
  const { state } = useLocation();
  const nav = useNavigate();
  const [email, setEmail] = useState((state && state.email) || '');
  const [sent, setSent] = useState(null); // la respuesta de /auth/forgot: { message, devCode }
  const [code, setCode] = useState('');
  const [f, setF] = useState({ pass: '', pass2: '' });
  const forgot = useRequest(forgotPassword, { onSuccess: r => { setSent(r); setCode(''); } });
  const reset = useRequest(resetPassword, { onSuccess: () => nav('/inicio', { replace: true }), onError: () => setCode('') });
  const checks = passChecks(f.pass, f.pass2);
  const ok = sent ? code.length === 6 && checks.every(c => c[0]) : emailOk(email);
  const set = k => e => setF({ ...f, [k]: e.target.value });

  const submit = e => {
    e.preventDefault();
    if (!ok || forgot.busy || reset.busy) return;
    if (sent) reset.run({ email: email.trim(), code, password: f.pass });
    else forgot.run(email.trim());
  };

  return <form className="screen narrow" onSubmit={submit} noValidate>
    <ScrollArea><TopBar fallback="/ingresar" />
      <div className="bigicon pop"><Icon n="mail" /></div>
      <h1 className="center">Recuperá tu contraseña</h1>
      {!sent
        ? <><p className="sub center">Te mandamos un código a tu email para que elijas una contraseña nueva.</p>
          <Field id="remail" label="Email" placeholder="tu@email.com" type="email" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
          {forgot.error && <div className="formerr">{forgot.error.message}</div>}</>
        : <><p className="sub center">{sent.message}.</p>
          <CodeInput value={code} onChange={setCode} />
          {sent.devCode && <div className="devcode">Modo desarrollo: tu código es {sent.devCode}</div>}
          <PwField id="npass" label="Contraseña nueva" placeholder="Creá una contraseña" autoComplete="new-password" value={f.pass} onChange={set('pass')} />
          <PwField id="npass2" label="Repetí tu contraseña" placeholder="Escribila de nuevo" autoComplete="new-password" value={f.pass2} onChange={set('pass2')} />
          <PwChecks checks={checks} />
          {reset.error && !code && <div className="formerr">{reset.error.message}</div>}
          <p className="center" style={{ marginTop: 22 }}>¿No te llegó? <button type="button" className="link" onClick={() => forgot.run(email.trim())} disabled={forgot.busy}>Mandar otro código</button></p></>}
    </ScrollArea>
    <div className="foot"><Btn type="submit" busy={forgot.busy || reset.busy} disabled={!ok}>{sent ? 'Cambiar contraseña' : 'Mandarme el código'}</Btn></div>
  </form>;
}
