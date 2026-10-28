import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import { http } from '../../api/axios';
import { addSingleCases, apiThunk, changeOf, emptyEntry, fulfilledOf, markStale } from '../helpers';

// Lugares cercanos (Premium) y ofertas, con datos de demostración.
export const fetchPlaces = apiThunk('places/fetch', () => http.get('/places'), { cached: s => s.places.places });
export const fetchOffers = apiThunk('places/fetchOffers', () => http.get('/offers'), { cached: s => s.places.offers });

const initialState = { places: emptyEntry, offers: emptyEntry };

const placeSlice = createSlice({
  name: 'places',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder.addCase('auth/logout', () => initialState);
    addSingleCases(builder, fetchPlaces, 'places');
    addSingleCases(builder, fetchOffers, 'offers');
    builder
      // Premium cambia qué se puede ver (alertas, lugares); un plan nuevo cambia qué ofertas sirven para tu lista.
      .addMatcher(isAnyOf(fulfilledOf('auth/activatePremium', 'auth/cancelPremium'), changeOf('plan')), s => {
        markStale(s.places);
        markStale(s.offers);
      });
  }
});

export default placeSlice.reducer;
