/** Texto con **negrita**, sin HTML (respuestas de Wopi y consejos de expertos). */
export default function Rich({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/).map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : p));
}
