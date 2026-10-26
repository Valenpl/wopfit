import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { ACTS, AVOID, BUDGET, DAYF, DAYL, EQUIP, GOALS, HEALTH, Icon, LEVELS } from '../lib.jsx';
import { Btn, Field, Loading, Note, Screen, Sect, TopBar, useApp, useBack } from '../ui.jsx';

// ---------- Contanos un poco de vos ----------
function aboutError(f) {
  if (!f.name.trim()) return 'Contanos cómo te llamamos.';
  if (!f.birthDate) return 'Completá tu fecha de nacimiento.';
  const age = (Date.now() - new Date(f.birthDate)) / 3.15576e10;
  if (!(age >= 13 && age <= 110)) return 'Revisá la fecha: la app es para mayores de 13 años.';
  if (f.heightCm && (+f.heightCm < 100 || +f.heightCm > 230)) return 'La altura va en centímetros (ej: 165).';
  if (f.weightKg && (+f.weightKg < 30 || +f.weightKg > 300)) return 'El peso va en kilos (ej: 60).';
  return '';
}

export function About({ edit }) {
  const { me, setMe, toast } = useApp();
  const nav = useNavigate();
  const back = useBack('/perfil');
  const [f, setF] = useState({ name: me.name || '', birthDate: me.birthDate || '', heightCm: me.heightCm ?? '', weightKg: me.weightKg ?? '' });
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const err = aboutError(f);
  const set = k => e => setF({ ...f, [k]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setTouched(true);
    if (err || busy) return;
    setBusy(true);
    try {
      const m = await api.put('/me/about', { name: f.name.trim(), birthDate: f.birthDate, heightCm: f.heightCm ? +f.heightCm : null, weightKg: f.weightKg ? +String(f.weightKg).replace(',', '.') : null });
      setMe(m);
      if (edit) { toast('Guardamos tus datos'); back(); } else nav('/preferencias/1', { replace: true });
    } catch (ex) { toast(ex.message); } finally { setBusy(false); }
  };

  return <form className="screen narrow" onSubmit={submit} noValidate>
    <div className="scroll">{edit ? <TopBar fallback="/perfil" /> : <div className="top" />}
      <h1>{edit ? 'Datos básicos' : 'Contanos un poco de vos'}</h1><p className="sub">Con esto armamos un plan seguro para vos.</p>
      <Field id="name" label="¿Cómo te llamamos?" placeholder="Tu nombre" autoComplete="given-name" value={f.name} onChange={set('name')} />
      <Field id="birth" label="Fecha de nacimiento" type="date" max={new Date().toISOString().slice(0, 10)} value={f.birthDate} onChange={set('birthDate')} />
      <div className="grid2">
        <div><Field id="height" label="Altura (cm)" optional placeholder="165" inputMode="numeric" maxLength={3} value={f.heightCm} onChange={set('heightCm')} /></div>
        <div><Field id="weight" label="Peso (kg)" optional placeholder="60" inputMode="decimal" maxLength={5} value={f.weightKg} onChange={set('weightKg')} /></div>
      </div>
      {touched && err && <div className="err">{err}</div>}
      <Note icon="lock" className="mt20">Tus datos son privados. Solo los usamos para ajustar tu plan, nadie más los ve.</Note>
    </div>
    <div className="foot"><Btn type="submit" busy={busy}>{edit ? 'Guardar' : 'Continuar'}</Btn></div>
  </form>;
}

// ---------- Preferencias (3 pasos) ----------
const DRAFT = 'wopfit-draft';
const fromMe = p => p ? { goals: p.goals, days: p.days, minutes: p.minutes, budget: p.budget, activities: p.activities, avoid: p.avoid, otherAvoid: p.otherAvoid || '', health: p.health, level: p.level, equipment: p.equipment }
  : { goals: [], days: [0, 2, 4], minutes: 30, budget: 'medio', activities: [], avoid: [], otherAvoid: '', health: [], level: 'principiante', equipment: ['nada'] };

export function Prefs({ edit }) {
  const { me, setMe, toast } = useApp();
  const nav = useNavigate();
  const back = useBack('/perfil');
  const step = Math.min(3, Math.max(1, +useParams().step || 1));
  const [d, setD] = useState(() => {
    if (!edit) { try { const s = sessionStorage.getItem(DRAFT); if (s) return JSON.parse(s); } catch { /* */ } }
    return fromMe(me.preferences);
  });
  const [busy, setBusy] = useState(false);
  const first = useRef(true);
  useEffect(() => { if (!edit) try { sessionStorage.setItem(DRAFT, JSON.stringify(d)); } catch { /* */ } }, [d, edit]);
  useEffect(() => { if (first.current) { first.current = false; return; } document.querySelector('.scroll')?.scrollTo(0, 0); }, [step]);

  const tgl = (k, v) => setD(x => ({ ...x, [k]: x[k].includes(v) ? x[k].filter(y => y !== v) : [...x[k], v] }));
  const tglEquip = v => setD(x => {
    if (v === 'nada') return { ...x, equipment: ['nada'] };
    const e = x.equipment.filter(y => y !== 'nada');
    const n = e.includes(v) ? e.filter(y => y !== v) : [...e, v];
    return { ...x, equipment: n.length ? n : ['nada'] };
  });
  const canNext = step === 1 ? d.goals.length > 0 : step === 2 ? d.days.length > 0 : true;

  const save = async () => {
    const m = await api.put('/me/preferences', d);
    setMe(m);
    return m;
  };
  const next = async () => {
    if (!canNext || busy) return;
    if (edit) {
      setBusy(true);
      try { const m = await save(); toast(m.preferences.pendingChanges.length ? 'Guardado. Actualizá tu plan para ver los cambios.' : 'Guardado'); back(); }
      catch (ex) { toast(ex.message); } finally { setBusy(false); }
      return;
    }
    if (step < 3) { nav(`/preferencias/${step + 1}`); return; }
    setBusy(true);
    try {
      await api.put('/me/preferences', d);
      const r = await api.post('/plan');
      sessionStorage.removeItem(DRAFT);
      const m = await api.get('/me');
      setMe(m);
      nav('/plan-listo', { replace: true, state: { fresh: true, changes: r.changes } });
    } catch (ex) { toast(ex.message); setBusy(false); }
  };

  const head = edit ? <TopBar fallback="/perfil" />
    : <>{step > 1 ? <TopBar fallback={`/preferencias/${step - 1}`} right={<span className="steplabel">Paso {step} de 3</span>} />
      : <div className="top"><span /><span className="steplabel">Paso 1 de 3</span></div>}<div className="progress"><i style={{ width: `${step * 33.4}%` }} /></div></>;
  const label = edit ? 'Guardar' : step < 3 ? <>Siguiente <Icon n="arrow" /></> : <>Generar mi plan <Icon n="spark" /></>;
  const pc = (d.minutes - 10) / 80 * 100;

  return <Screen narrow foot={<Btn onClick={next} busy={busy} disabled={!canNext}>{label}</Btn>}>
    {head}
    {step === 1 && <>
      <h1>¿Qué querés lograr?</h1><p className="sub">Elegí uno o más objetivos para armar tu plan a medida.</p>
      <div className="stack">{GOALS.map(g => <button key={g.k} className={`opt ${d.goals.includes(g.k) ? 'on' : ''}`} onClick={() => tgl('goals', g.k)} aria-pressed={d.goals.includes(g.k)}>
        <div className={`tile ${g.p ? 'p' : ''}`}><Icon n={g.i} /></div><div className="grow"><div className="t">{g.t}</div><div className="d">{g.d}</div></div><span className="ck"><Icon n="check" /></span></button>)}</div>
      <Note icon="spark" className="mt16">Podés cambiar o sumar nuevos objetivos cuando quieras desde tu perfil.</Note>
    </>}
    {step === 2 && <>
      <h1>Tiempo y presupuesto</h1><p className="sub">Adaptamos el entrenamiento y la nutrición a tu rutina real.</p>
      <div className="card"><h3>¿Cuánto tiempo tenés?</h3><p className="small muted" style={{ margin: '4px 0 14px' }}>Elegí qué días querés entrenar y la duración por sesión.</p>
        <div className="lbl">Días disponibles</div>
        <div className="days">{DAYL.map((l, i) => <button key={i} className={`day ${d.days.includes(i) ? 'on' : ''}`} onClick={() => tgl('days', i)} aria-label={DAYF[i]} aria-pressed={d.days.includes(i)}>{l}</button>)}</div>
        <div className="row between small" style={{ flexWrap: 'wrap' }}><span className="tag">Con 2 días ya suma</span><b className="muted">{d.days.length} {d.days.length === 1 ? 'día seleccionado' : 'días seleccionados'}</b></div>
        <div className="row between mt20"><div className="lbl">Duración</div><span className="pill">{d.minutes} min / día</span></div>
        <input type="range" min="10" max="90" step="5" value={d.minutes} style={{ '--p': `${pc}%` }} aria-label="Duración en minutos" onChange={e => setD({ ...d, minutes: +e.target.value })} />
        <div className="scale"><span>10 min</span><span>45 min</span><span>90 min</span></div>
      </div>
      <div className="card"><h3>¿Cuánto podés gastar por semana en comida?</h3><p className="small muted" style={{ margin: '4px 0 12px' }}>Armamos tu menú ajustado a tus posibilidades.</p>
        <div className="stack">{Object.entries(BUDGET).map(([k, b]) => <button key={k} className={`opt ${d.budget === k ? 'on' : ''}`} onClick={() => setD({ ...d, budget: k })}>
          <span className="radio" /><div className="grow"><div className="row between"><span className="t">{b.t}</span>{b.tag && <span className={`tag ${k === 'alto' ? 'blue' : ''}`}>{b.tag}</span>}</div>
            <div className="small" style={{ color: 'var(--navy)', fontWeight: 700 }}>{b.r}/semana</div></div></button>)}</div>
      </div>
    </>}
    {step === 3 && <>
      <h1>Afinemos tus preferencias</h1><p className="sub">Con esto armamos tu rutina para que entrenar sea un hábito que disfrutes.</p>
      <Sect title="Actividades que te gustan" right={<span className="tag blue">Elegí varias</span>} />
      <div className="chips">{ACTS.map(a => <button key={a.k} className={`chip ${d.activities.includes(a.k) ? 'on' : ''}`} onClick={() => tgl('activities', a.k)}><Icon n={a.i} />{a.t}</button>)}</div>
      <Sect title="Alimentos que evitás" right={<span className="tag peach">Nutrición</span>} />
      <div className="chips">{AVOID.map(a => <button key={a.k} className={`chip ${d.avoid.includes(a.k) ? 'on' : ''}`} onClick={() => tgl('avoid', a.k)}>{a.t}</button>)}</div>
      <div className="inp mt12"><input placeholder="Otro: ej. frutos secos" maxLength={80} value={d.otherAvoid} onChange={e => setD({ ...d, otherAvoid: e.target.value })} aria-label="Otro alimento que evitás" /></div>
      {d.avoid.includes('tacc') && <Note tone="blue" className="mt12">Sacamos el trigo, la avena, la cebada y el centeno de tu plan. Igual revisá que los productos tengan el logo <b>Sin TACC</b>.</Note>}
      <Sect title="¿Tenés alguna condición de salud?" right={<span className="tag">Opcional</span>} />
      <div className="chips">{HEALTH.map(h => <button key={h.k} className={`chip ${d.health.includes(h.k) ? 'on' : ''}`} onClick={() => tgl('health', h.k)}>{h.t}</button>)}</div>
      <Note icon="shield" className="mt12">WopFit no reemplaza a un profesional de la salud. Si tenés una condición, consultá antes de empezar.</Note>
      <Sect title="Tu nivel" right={<span className="tag blue">Una opción</span>} />
      <div className="stack">{LEVELS.map(l => <button key={l.k} className={`opt ${d.level === l.k ? 'on' : ''}`} onClick={() => setD({ ...d, level: l.k })}><span className="radio" /><div className="grow"><div className="t">{l.t}</div><div className="d">{l.d}</div></div></button>)}</div>
      <Sect title="¿Qué equipamiento tenés?" right={<span className="tag">En casa o gym</span>} />
      <div className="stack">{EQUIP.map(e => <button key={e.k} className={`opt ${d.equipment.includes(e.k) ? 'on' : ''}`} onClick={() => tglEquip(e.k)}><span className="ck box"><Icon n="check" /></span><div className="t grow">{e.t}</div></button>)}</div>
    </>}
  </Screen>;
}

// ---------- Plan listo / actualizado ----------
export function Ready() {
  const { me, setMe, toast } = useApp();
  const { state } = useLocation();
  const nav = useNavigate();
  const upd = state && state.upd;
  const plan = me.plan;
  const p = me.preferences;
  useEffect(() => {
    // Preferencias guardadas pero sin plan (por ejemplo, se recargó la página a mitad de camino): lo creamos.
    if (!plan) api.post('/plan').then(() => api.get('/me')).then(setMe).catch(ex => toast(ex.message));
  }, [plan, setMe, toast]);
  if (!plan) return <Loading text="Armando tu plan…" />;
  return <Screen narrow scrollStyle={{ paddingTop: 'calc(var(--sat) + 40px)' }}
    foot={<button className="btn" onClick={() => nav(upd ? '/entreno' : '/inicio', { replace: true })}>{upd ? 'Ver mi plan' : 'Empezar mi plan'}</button>}>
    <div className="bigicon g pop"><Icon n="check" /></div>
    <h1 className="center">{upd ? '¡Tu plan se actualizó!' : '¡Tu plan está listo!'}</h1>
    <p className="sub center">{upd ? 'Lo reacomodamos con tus cambios. Tu progreso se mantiene.' : 'Lo armamos con lo que nos contaste. Lo podés ajustar cuando quieras.'}</p>
    {upd && (state.changes && state.changes.length
      ? <div className="card"><h3>Qué cambió</h3><div className="mt8">{state.changes.map(c => <div className="diff" key={c.label}><span className="tiny muted" style={{ fontWeight: 800 }}>{c.label}</span><s>{c.before}</s><b>{c.after}</b></div>)}</div></div>
      : <Note tone="blue">No había cambios pendientes: tu plan ya estaba al día.</Note>)}
    <div className="chips mt12" style={{ justifyContent: 'center' }}>
      <span className="pill"><Icon n="cal" />{plan.days.length} días / sem</span><span className="pill"><Icon n="clock" />{plan.minutes} min</span>
      <span className="pill"><Icon n="cash" />Presupuesto {BUDGET[p.budget].t.toLowerCase()}</span>
    </div>
    <div className="card mt16"><div className="row"><div className="tile"><Icon n="dumb" /></div><div className="grow"><h3>Tu entrenamiento</h3><div className="small muted">{plan.trainingSummary}</div></div></div></div>
    <div className="card"><div className="row"><div className="tile p"><Icon n="fork" /></div><div className="grow"><h3>Tu alimentación</h3><div className="small muted">{plan.foodSummary}</div></div></div></div>
    {plan.healthNotes.length > 0 && <div className="card"><div className="row"><div className="tile"><Icon n="shield" /></div><div className="grow"><h3>Tu salud</h3><div className="small muted">{plan.healthNotes.join(' ')}</div></div></div></div>}
    {!upd && <Note icon="heart" className="mt16">Si algún día no podés, avisanos y lo reacomodamos.</Note>}
  </Screen>;
}

export function Updating() {
  const { setMe, toast } = useApp();
  const nav = useNavigate();
  const [w, setW] = useState(5);
  const once = useRef(false);
  useEffect(() => {
    if (once.current) return;
    once.current = true;
    requestAnimationFrame(() => setW(85));
    const started = Date.now();
    (async () => {
      try {
        const r = await api.post('/plan');
        const m = await api.get('/me');
        await new Promise(res => setTimeout(res, Math.max(0, 900 - (Date.now() - started))));
        setMe(m);
        nav('/plan-listo', { replace: true, state: { upd: true, changes: r.changes } });
      } catch (ex) { toast(ex.message); nav(-1); }
    })();
  }, [nav, setMe, toast]);
  return <div className="screen"><div className="scroll" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
    <img src="/wopi.webp" alt="" style={{ width: 180 }} className="wopi" /><h1>Reacomodando tu plan…</h1><p className="sub">Mantenemos tu historial y tu progreso.</p>
    <div className="progress blue" style={{ width: '70%' }}><i style={{ width: `${w}%`, transition: 'width 1s' }} /></div>
  </div></div>;
}
