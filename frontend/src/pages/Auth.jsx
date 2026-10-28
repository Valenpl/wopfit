import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Icon } from '../lib.jsx';
import { Btn, Field, PwField, TopBar, useApp } from '../ui.jsx';

const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e || '');

export function Welcome() {
  const nav = useNavigate();
  return <div className="screen"><div className="fit">
    <div className="hero-title">Hábitos que se adaptan<br /><span className="sp">✦</span> <span>a tu vida real</span> <span className="sp">✦</span></div>
    <p className="hero-sub">Tu bienestar también es progreso. Entrenamiento y alimentación adaptados a vos, sin presiones ni culpas.</p>
    <img className="wopi" src="/wopi.webp" alt="Wopi, la mascota de WopFit, saltando feliz" />
    <div className="feat2">
      <div className="feat"><div className="tile sm g"><Icon n="clock" /></div><div><b>A tu ritmo</b><span>Rutinas de 15, 30 o 45 minutos.</span></div></div>
      <div className="feat"><div className="tile sm"><Icon n="heart" /></div><div><b>Cero frustración</b><span>Planes flexibles que no te castigan.</span></div></div>
    </div>
    <button className="btn" onClick={() => nav('/registro')}>Crear cuenta <Icon n="arrow" /></button>
    <div className="footnote" style={{ marginTop: 10 }}>¿Ya tenés una cuenta? <button className="link" onClick={() => nav('/ingresar')}>Ya tengo cuenta</button></div>
  </div></div>;
}

export function Signup() {
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', pass: '', pass2: '', terms: false });
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const checks = [[f.pass.length >= 8, 'Mínimo 8 caracteres'], [/\d/.test(f.pass), 'Al menos un número'], [f.pass.length > 0 && f.pass === f.pass2, 'Las contraseñas coinciden']];
  const ok = emailOk(f.email) && checks.every(c => c[0]) && f.terms;

  const submit = async e => {
    e.preventDefault();
    if (!ok || busy) return;
    setBusy(true); setErr('');
    try {
      const r = await api.post('/auth/register', { email: f.email.trim(), password: f.pass });
      nav('/verificar', { state: { email: f.email.trim(), devCode: r.devCode, message: r.message } });
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  return <form className="screen narrow" onSubmit={submit} noValidate>
    <div className="scroll"><TopBar fallback="/" />
      <h1>Creá tu cuenta</h1><p className="sub">Así guardamos tu plan y tu avance.</p>
      <Field id="email" label="Email" placeholder="tu@email.com" type="email" inputMode="email" autoComplete="email" value={f.email} onChange={set('email')} onBlur={() => setTouched(true)}
        error={touched && f.email && !emailOk(f.email) ? 'Revisá el formato del email.' : ''} />
      <PwField id="pass" label="Contraseña" placeholder="Creá una contraseña" autoComplete="new-password" value={f.pass} onChange={set('pass')} />
      <PwField id="pass2" label="Repetí tu contraseña" placeholder="Escribila de nuevo" autoComplete="new-password" value={f.pass2} onChange={set('pass2')} />
      <div className="checks">{checks.map(([o, t]) => <div key={t} className={o ? 'ok' : ''}><span className={`ck ${o ? 'on' : ''}`}><Icon n="check" /></span>{t}</div>)}</div>
      <button type="button" className="terms" onClick={() => setF({ ...f, terms: !f.terms })} aria-pressed={f.terms}><span className={`ck box ${f.terms ? 'on' : ''}`}><Icon n="check" /></span><span>Acepto los <b>Términos</b> y la <b>Política de privacidad</b></span></button>
      {err && <div className="formerr">{err}</div>}
    </div>
    <div className="foot"><Btn type="submit" busy={busy} disabled={!ok}>Crear cuenta <Icon n="arrow" /></Btn>
      <div className="footnote">¿Ya tenés una cuenta? <button type="button" className="link" onClick={() => nav('/ingresar')}>Ingresá</button></div></div>
  </form>;
}

export function Verify() {
  const { state } = useLocation();
  const nav = useNavigate();
  const { login, toast } = useApp();
  const [email, setEmail] = useState(state?.email || '');
  const [code, setCode] = useState('');
  const [dev, setDev] = useState(state?.devCode || null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async e => {
    e.preventDefault();
    if (code.length !== 6 || busy) return;
    setBusy(true); setErr('');
    try {
      const r = await api.post('/auth/verify', { email, code });
      login(r.token, r.me);
      nav('/sobre-vos', { replace: true });
    } catch (ex) { setErr(ex.message); setCode(''); } finally { setBusy(false); }
  };
  const resend = async () => {
    try { const r = await api.post('/auth/resend', { email }); setDev(r.devCode); toast(r.message); } catch (ex) { toast(ex.message); }
  };

  return <form className="screen narrow" onSubmit={submit}>
    <div className="scroll"><TopBar fallback="/registro" />
      <div className="bigicon pop"><Icon n="mail" /></div>
      <h1 className="center">Revisá tu email</h1>
      {state?.email
        ? <p className="sub center">Te enviamos un código de 6 números a<br /><b style={{ color: 'var(--navy)' }}>{email}</b></p>
        : <><p className="sub center">Escribí tu email y el código que te mandamos.</p><Field id="vemail" label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} /></>}
      <div className="code">
        <div className="cboxes" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(i => <span key={i} className={`cbox ${i === Math.min(5, code.length) ? 'cur' : ''}`}>{code[i] || ''}</span>)}</div>
        <input className="codein" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete="one-time-code" autoFocus value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} aria-label="Código de 6 números" />
      </div>
      {dev && <div className="devcode">Modo desarrollo: tu código es {dev}</div>}
      {err && <div className="formerr center">{err}</div>}
      <p className="center" style={{ marginTop: 22 }}>¿No te llegó? <button type="button" className="link" onClick={resend} disabled={!emailOk(email)}>Reenviar código</button></p>
    </div>
    <div className="foot"><Btn type="submit" busy={busy} disabled={code.length !== 6}>Verificar</Btn></div>
  </form>;
}

export function Login() {
  const nav = useNavigate();
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const ok = emailOk(email) && pass.length >= 1;

  const submit = async e => {
    e.preventDefault();
    if (!ok || busy) return;
    setBusy(true); setErr('');
    try {
      const r = await api.post('/auth/login', { email: email.trim(), password: pass });
      login(r.token, r.me);
      nav('/inicio', { replace: true });
    } catch (ex) {
      if (ex.status === 403) { await api.post('/auth/resend', { email: email.trim() }).then(r => nav('/verificar', { state: { email: email.trim(), devCode: r.devCode } })).catch(() => setErr(ex.message)); }
      else setErr(ex.message);
    } finally { setBusy(false); }
  };

  return <form className="screen narrow" onSubmit={submit} noValidate>
    <div className="scroll"><TopBar fallback="/" />
      <div className="brand mt8"><img src="/logo.webp" alt="" /><b>Wop<i>Fit</i></b></div>
      <h1 className="center">¡Qué bueno verte de nuevo!</h1><p className="sub center">Ingresá para seguir con tu plan.</p>
      <Field id="lemail" label="Email" placeholder="tu@email.com" type="email" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
      <PwField id="lpass" label="Contraseña" placeholder="Tu contraseña" autoComplete="current-password" value={pass} onChange={e => setPass(e.target.value)} />
      {err && <div className="formerr">{err}</div>}
    </div>
    <div className="foot"><Btn type="submit" busy={busy} disabled={!ok}>Ingresar</Btn>
      <div className="footnote">¿No tenés cuenta? <button type="button" className="link" onClick={() => nav('/registro')}>Creala</button></div></div>
  </form>;
}
