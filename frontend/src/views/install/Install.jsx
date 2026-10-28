import { useEffect, useState } from 'react';
import useToast from '../../hooks/useToast';
import { canInstall, install, isStandalone, onInstallChange } from '../../pwa';
import Icon from '../../components/shared/Icon.jsx';
import IconInline from '../../components/shared/IconInline.jsx';
import Note from '../../components/shared/Note.jsx';
import Screen from '../../components/shared/Screen.jsx';
import TopBar from '../../components/shared/TopBar.jsx';

/** Instalá WopFit: el botón del navegador cuando lo ofrece y los pasos para iPhone y Android. */
export default function Install() {
  const toast = useToast();
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
