import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { injectStore } from '../api/axios';
import { saveLocal } from '../utils/storage';
import auth from './slices/authSlice';
import ui from './slices/uiSlice';
import requests from './slices/requestSlice';
import plan from './slices/planSlice';
import workouts from './slices/workoutSlice';
import meals from './slices/mealSlice';
import habits from './slices/habitSlice';
import goals from './slices/goalSlice';
import progress from './slices/progressSlice';
import places from './slices/placeSlice';
import pros from './slices/proSlice';
import wopi from './slices/wopiSlice';
import community from './slices/communitySlice';

// Un solo store, con un slice por recurso del backend más auth, ui y el estado de los pedidos.
const rootReducer = combineReducers({ auth, ui, requests, plan, workouts, meals, habits, goals, progress, places, pros, wopi, community });

export const store = configureStore({ reducer: rootReducer });
injectStore(store);

// Entre recargas solo se guardan el token y la vista elegida (celu o compu). Los reducers no tocan el storage.
const pick = () => ({ token: store.getState().auth.token, view: store.getState().ui.view });
let saved = pick();
store.subscribe(() => {
  const now = pick();
  if (now.token !== saved.token) saveLocal('wopfit-token', now.token);
  if (now.view !== saved.view) saveLocal('wopfit-view', now.view);
  saved = now;
});
