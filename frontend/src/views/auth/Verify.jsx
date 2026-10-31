import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { resendCode, verify } from '../../redux/slices/authSlice';
import useRequest from '../../hooks/useRequest';
import useToast from '../../hooks/useToast';
import { emailOk } from '../../utils/validation';
import Btn from '../../components/shared/Btn.jsx';
import CodeInput from '../../components/shared/CodeInput.jsx';
import Field from '../../components/shared/Field.jsx';
import Icon from '../../components/shared/Icon.jsx';
import ScrollArea from '../../components/shared/ScrollArea.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

export default function Verify() {
  const { state } = useLocation();
  const nav = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState((state && state.email) || '');
  const [code, setCode] = useState('');
  const [dev, setDev] = useState((state && state.devCode) || null);
  const check = useRequest(verify, { onSuccess: () => nav('/sobre-vos', { replace: true }), onError: () => setCode('') });
  const resend = useRequest(resendCode, { onSuccess: r => { setDev(r.devCode); toast(r.message); }, onError: e => toast(e.message) });

  const submit = e => {
    e.preventDefault();
    if (code.length !== 6 || check.busy) return;
    check.run({ email, code });
  };

  return <form className="screen narrow" onSubmit={submit}>
    <ScrollArea><TopBar fallback="/registro" />
      <div className="bigicon pop"><Icon n="mail" /></div>
      <h1 className="center">Revisá tu email</h1>
      {state && state.email
        ? <p className="sub center">Te enviamos un código de 6 números a<br /><b style={{ color: 'var(--navy)' }}>{email}</b></p>
        : <><p className="sub center">Escribí tu email y el código que te mandamos.</p><Field id="vemail" label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} /></>}
      <CodeInput value={code} onChange={setCode} />
      {dev && <div className="devcode">Modo desarrollo: tu código es {dev}</div>}
      {check.error && <div className="formerr center">{check.error.message}</div>}
      <p className="center" style={{ marginTop: 22 }}>¿No te llegó? <button type="button" className="link" onClick={() => resend.run(email)} disabled={!emailOk(email)}>Reenviar código</button></p>
    </ScrollArea>
    <div className="foot"><Btn type="submit" busy={check.busy} disabled={code.length !== 6}>Verificar</Btn></div>
  </form>;
}
