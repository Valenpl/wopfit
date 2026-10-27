import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Icon, firstName, isPremium, today } from '../lib.jsx';
import { ErrorBox, Loading, TopBar, useApp, useLoad } from '../ui.jsx';

const SUGG = ['¿Qué desayuno rápido?', '¿Qué almuerzo con $2.000?', '¿Qué ceno hoy?', 'Tengo 10 minutos, ¿qué hago?', 'Armame la lista del súper'];
const SLOTN = ['desayuno', 'almuerzo', 'cena'];

/** Texto de Wopi con **negrita**, sin HTML. */
const Rich = ({ text }) => text.split(/(\*\*[^*]+\*\*)/).map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : p));

export default function Wopi() {
  const nav = useNavigate();
  const { me, setMe, toast } = useApp();
  const pr = isPremium(me);
  const { data, error, reload, set } = useLoad(sig => api.get('/wopi', sig), []);
  const [msg, setMsg] = useState('');
  const [typing, setTyping] = useState(false);
  const scroll = useRef(null);
  const count = data ? data.messages.length : 0;
  useEffect(() => { const el = scroll.current; if (el) el.scrollTop = el.scrollHeight; }, [count, typing]);

  if (error) return <div className="screen"><div className="scroll"><TopBar /><ErrorBox error={error} onRetry={reload} /></div></div>;
  if (!data) return <Loading />;
  const { left, limit, messages } = data;

  const send = async q => {
    const text = (q || '').trim();
    if (!text || typing || left <= 0) return;
    setMsg('');
    setTyping(true);
    set({ ...data, messages: [...messages, { id: 'tmp', role: 'user', text, cards: [], actions: [] }] });
    try {
      const [r] = await Promise.all([api.post('/wopi', { text }), new Promise(res => setTimeout(res, 600))]);
      set({ ...data, left: r.left, messages: [...messages, r.question, r.reply] });
      setMe({ ...me, subscription: { ...me.subscription, wopiLeft: r.left } });
    } catch (ex) {
      set({ ...data, messages });
      setMsg(text);
      toast(ex.message);
    } finally { setTyping(false); }
  };

  const act = async a => {
    try {
      if (a.kind === 'go') return nav(a.value);
      if (a.kind === 'ask') return send(a.value);
      if (a.kind === 'meal') {
        const i = a.value.indexOf('|'), slot = a.value.slice(0, i);
        await api.post(`/meals/${today()}/${slot}/accept`, { name: a.value.slice(i + 1) });
        return toast(`Agregado a tu ${SLOTN[slot]} de hoy 🍽️`);
      }
      if (a.kind === 'alt') {
        const [id, kind] = a.value.split('|');
        const r = await api.post(`/workouts/${id}/accept-alternative`, { kind });
        toast(r.message);
        return nav(`/entreno/${id}`);
      }
    } catch (ex) { toast(ex.message); }
    return undefined;
  };

  const last = messages[messages.length - 1];
  const showMore = last && last.role === 'wopi' && last.more && !typing && left > 0;
  return <div className="screen narrow">
    <div className="scroll" ref={scroll}>
      <TopBar right={<span className={`tag ${pr ? 'gold' : 'blue'}`}>{pr ? '★ Premium' : 'Gratis'} · {left} de {limit} este mes</span>} />
      <div className="row mt16"><div className="wopiav"><img src="/wopi.webp" alt="" /></div><div className="grow"><h3>Preguntale a Wopi</h3><div className="tiny muted">Tu asistente de bienestar</div></div></div>
      <div className="chat mt16">
        <div className="bub w">¡Hola, {firstName(me)}! Conozco tu plan, tu presupuesto y lo que no comés. ¿En qué te ayudo?</div>
        {messages.map(m => (m.role === 'user'
          ? <div key={m.id} className="bub u">{m.text}</div>
          : <div key={m.id} className="bub w"><Rich text={m.text} />
            {m.cards.map(c => <span key={c.title} className="opt2"><b>{c.title}</b><small>{c.subtitle}</small>
              <button className="btn sm" onClick={() => act(c.action)}>{c.action.label}</button></span>)}
            {m.actions.length > 0 && <div className="row mt8" style={{ flexWrap: 'wrap', gap: 6 }}>{m.actions.map(a => <button key={a.label} className="btn sm ghost" style={{ minHeight: 34, fontSize: 13 }} onClick={() => act(a)}>{a.label}</button>)}</div>}
          </div>))}
        {typing && <div className="bub w" aria-label="Wopi está escribiendo"><span className="typing"><i /><i /><i /></span></div>}
      </div>
      {showMore && <div className="chips mt12"><button className="chip" style={{ fontSize: 13 }} onClick={() => send('Dame otras opciones')}><Icon n="refresh" /> Dame otras opciones</button></div>}
      {!messages.length && !typing && <div className="chips mt16">{SUGG.map(s => <button key={s} className="chip" style={{ fontSize: 13 }} onClick={() => send(s)}>{s}</button>)}</div>}
      {left === 0 && !typing && <div className="card mt16" style={{ background: '#FFF8E6' }}>
        <h3>{pr ? 'Usaste todas tus consultas del mes' : 'Seguí charlando con Wopi en Premium'}</h3>
        <p className="small muted">{pr ? 'Se renuevan el 1° del mes que viene.' : 'Con Premium tenés 20 consultas por mes, lugares cerca tuyo y 2 consultas con profesionales.'}</p>
        {!pr && <button className="btn sm" onClick={() => nav('/planes')}>Mejorar plan</button>}</div>}
      <p className="tiny muted center mt16">Wopi no reemplaza a un profesional de la salud.</p>
    </div>
    <form className="composer" onSubmit={e => { e.preventDefault(); send(msg); }}>
      <input value={msg} onChange={e => setMsg(e.target.value)} maxLength={300} placeholder={left ? 'Escribile a Wopi…' : 'Sin consultas disponibles'} aria-label="Mensaje" disabled={!left} />
      <button type="submit" aria-label="Enviar" disabled={!left || typing || !msg.trim()}><Icon n="send" /></button>
    </form>
  </div>;
}
