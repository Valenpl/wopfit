import { useEffect, useState } from 'react';
import { Icon, IconInline } from '../lib.jsx';
import { canInstall, install, isStandalone, onInstallChange } from '../pwa.js';
import { Note, Screen, TopBar, useApp } from '../ui.jsx';

// ---------- Instalá WopFit ----------
export default function Install() {
  const { toast } = useApp();
  const [can, setCan] = useState(canInstall);
  useEffect(() => onInstallChange(() => setCan(canInstall())), []);
  const go = async () => { if (await install()) toast('¡Listo! WopFit quedó en tu pantalla de inicio'); };
  return <Screen narrow>
    <TopBar fallback="/perfil" />
    <h1>Instalá WopFit</h1><p className="sub">Queda en tu pantalla de inicio como una app.</p>
    {isStandalone() && <Note icon="check">Ya la tenés instalada: la estás usando desde el ícono.</Note>}
    {can && <button className="btn" onClick={go}><Icon n="down" /> Instalar app</button>}
    <div className="card mt12"><h3>iPhone (Safari)</h3><ol className="steps"><li>Tocá <b>Compartir</b> <IconInline n="share" /></li><li>Elegí <b>Agregar a inicio</b></li><li>Abrila desde el ícono de Wopi</li></ol></div>
    <div className="card"><h3>Android (Chrome)</h3><ol className="steps"><li>Abrí el menú <b>⋮</b></li><li>Tocá <b>Instalar app</b></li></ol></div>
  </Screen>;
}
