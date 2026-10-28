import { useNavigate } from 'react-router-dom';
import { fetchOffers } from '../../redux/slices/placeSlice';
import useFetch from '../../hooks/useFetch';
import useHere from '../../hooks/useHere';
import CouponCard from '../../components/places/CouponCard.jsx';
import More from '../../components/shared/More.jsx';
import Sect from '../../components/shared/Sect.jsx';

/** "Ofertas para tu lista": el primer cupón que sirve para la lista de esta semana. */
export default function ListOffer() {
  const nav = useNavigate();
  const here = useHere();
  const { data } = useFetch(fetchOffers, undefined, s => s.places.offers);
  if (!data || !data.offers.length) return null;
  const o = data.offers.find(x => x.forList) || data.offers[0];
  return <><Sect title="Ofertas para tu lista" right={<More onClick={() => nav('/ofertas')}>Ver todas</More>} /><CouponCard o={o} here={here} /></>;
}
