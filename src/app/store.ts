import { configureStore } from '@reduxjs/toolkit';
import garageReducer from '../features/garage/garageSlice';
import raceReducer from '../features/race/raceSlice';
import uiReducer from '../features/ui/uiSlice';
import winnersReducer from '../features/winners/winnersSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    garage: garageReducer,
    race: raceReducer,
    winners: winnersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
