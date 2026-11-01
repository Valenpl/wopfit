/** Texto con **negrita**, sin HTML (respuestas de Wopi y consejos de expertos). */
export default function Rich({ text }) {
  // Cada parte lleva de key su posición en el texto: no se reordenan y dos partes nunca empiezan en el mismo lugar.
  let at = 0;
  return text.split(/(\*\*[^*]+\*\*)/).map(p => {
    const key = at;
    at += p.length;
    return p.startsWith('**') && p.endsWith('**') ? <b key={key}>{p.slice(2, -2)}</b> : p;
  });
}
