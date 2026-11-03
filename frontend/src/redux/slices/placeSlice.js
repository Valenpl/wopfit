import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import { http } from '../../api/axios';
import { addEntryCases, addSingleCases, apiThunk, changeOf, emptyEntry, fulfilledOf, getEntry, markAllStale, markStale } from '../helpers';

// Lugares cercanos (Premium) y ofertas. Los aliados son datos de demostración; los de Google, reales.
export const fetchPlaces = apiThunk('places/fetch', () => http.get('/places'), { cached: s => s.places.places });
export const fetchOffers = apiThunk('places/fetchOffers', () => http.get('/offers'), { cached: s => s.places.offers });

/**
 * Gimnasios, parques, súper y tiendas deportivas de Google alrededor de un punto. El argumento es la clave "lat,lng"
 * redondeada a 3 decimales (unos 100 m): así no se manda la ubicación exacta y moverse un poco no dispara otro pedido.
 * Si falla no se muestra toast: la pantalla sigue con los aliados y avisa abajo.
 */
export const nearbyKey = here => `${here.lat.toFixed(3)},${here.lng.toFixed(3)}`;
export const fetchNearby = apiThunk('places/fetchNearby', key => {
  const [lat, lng] = key.split(',');
  return http.get(`/places/nearby?lat=${lat}&lng=${lng}`);
}, { cached: (s, key) => getEntry(s.places.nearby, key), toastError: false });

const initialState = { places: emptyEntry, offers: emptyEntry, nearby: {} };

const placeSlice = createSlice({
  name: 'places',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder.addCase('auth/logout', () => initialState);
    addSingleCases(builder, fetchPlaces, 'places');
    addSingleCases(builder, fetchOffers, 'offers');
    addEntryCases(builder, fetchNearby, 'nearby');
    builder
      // Premium cambia qué se puede ver (alertas, lugares); un plan nuevo cambia qué ofertas sirven para tu lista.
      .addMatcher(isAnyOf(fulfilledOf('auth/activatePremium', 'auth/cancelPremium'), changeOf('plan')), s => {
        markStale(s.places);
        markStale(s.offers);
        markAllStale(s.nearby);
      });
  }
});

export default placeSlice.reducer;
