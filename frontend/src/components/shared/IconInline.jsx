import Icon from './Icon.jsx';

/** Ícono chico dentro de un texto. */
export default function IconInline({ n }) {
  return <Icon n={n} style={{ width: 15, height: 15, verticalAlign: -3 }} />;
}
