/** De dónde sale un consejo de expertos, con el link al documento. */
export default function Source({ name, url }) {
  return <div className="src">Fuente: <a href={url} target="_blank" rel="noopener noreferrer">{name}</a></div>;
}
