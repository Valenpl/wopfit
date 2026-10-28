import StripCell from './StripCell.jsx';

export default function Strip({ days }) {
  return <div className="strip" style={{ marginTop: 0 }}>{days.map(d => <StripCell key={d.date} day={d} />)}</div>;
}
