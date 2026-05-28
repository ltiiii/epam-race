import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import * as engineApi from '../../api/engineApi';
import * as winnersApi from '../../api/winnersApi';
import type { Car } from '../../types/api';
import type { CarRaceState } from '../../types/race';

type RaceState = {
  byCarId: Record<number, CarRaceState>;
  raceRunning: boolean;
  winnerMessage: string | null;
  activeRaceId: number;
};

const initialState: RaceState = {
  byCarId: {},
  raceRunning: false,
  winnerMessage: null,
  activeRaceId: 0,
};

function msToSec(durationMs: number): number {
  return Number((durationMs / 1000).toFixed(2));
}

async function saveWinner(id: number, time: number): Promise<void> {
  const winner = await winnersApi.fetchWinnerById(id);
  if (!winner) {
    await winnersApi.createWinner({ id, wins: 1, time });
    return;
  }
  await winnersApi.updateWinner(id, { wins: winner.wins + 1, time: Math.min(winner.time, time) });
}

export const stopCar = createAsyncThunk('race/stopCar', async (id: number) => {
  await engineApi.setEngineStatus(id, 'stopped');
  return { id };
});

export const startCar = createAsyncThunk('race/startCar', async (car: Car, thunkApi) => {
  thunkApi.dispatch(setCarState({ id: car.id, state: { status: 'starting', durationMs: 0 } }));
  const started = await engineApi.setEngineStatus(car.id, 'started');
  const durationMs = Math.round(started.distance / started.velocity);
  thunkApi.dispatch(setCarState({ id: car.id, state: { status: 'driving', durationMs } }));
  await engineApi.driveEngine(car.id);
  thunkApi.dispatch(setCarState({ id: car.id, state: { status: 'finished', durationMs } }));
  return { id: car.id, name: car.name, durationMs };
});

export const startRace = createAsyncThunk('race/startRace', async (cars: Car[], thunkApi) => {
  thunkApi.dispatch(startRaceSession());
  const raceId = (thunkApi.getState() as { race: RaceState }).race.activeRaceId;
  thunkApi.dispatch(setRaceRunning(true));
  thunkApi.dispatch(setWinnerMessage(null));
  const tasks = cars.map((car) => thunkApi.dispatch(startCar(car)).unwrap());
  const settled = await Promise.allSettled(tasks);
  const success = settled
    .filter((item): item is PromiseFulfilledResult<{ id: number; name: string; durationMs: number }> => item.status === 'fulfilled')
    .map((item) => item.value)
    .sort((a, b) => a.durationMs - b.durationMs);

  const isStillActive = (thunkApi.getState() as { race: RaceState }).race.activeRaceId === raceId;

  if (success[0] && isStillActive) {
    const [best] = success;
    const time = msToSec(best.durationMs);
    await saveWinner(best.id, time);
    thunkApi.dispatch(setWinnerMessage(`${best.name} won in ${time}s`));
  }

  if (isStillActive) {
    thunkApi.dispatch(setRaceRunning(false));
  }
});

const raceSlice = createSlice({
  name: 'race',
  initialState,
  reducers: {
    setCarState(state, action: PayloadAction<{ id: number; state: CarRaceState }>) {
      state.byCarId[action.payload.id] = action.payload.state;
    },
    setWinnerMessage(state, action: PayloadAction<string | null>) {
      state.winnerMessage = action.payload;
    },
    setRaceRunning(state, action: PayloadAction<boolean>) {
      state.raceRunning = action.payload;
    },
    resetCarsState(state, action: PayloadAction<number[]>) {
      action.payload.forEach((id) => {
        state.byCarId[id] = { status: 'idle', durationMs: 0 };
      });
      state.winnerMessage = null;
      state.raceRunning = false;
      state.activeRaceId += 1;
    },
    startRaceSession(state) {
      state.activeRaceId += 1;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(startCar.rejected, (state, action) => {
        const { id } = action.meta.arg;
        state.byCarId[id] = { status: 'broken', durationMs: 0 };
      })
      .addCase(stopCar.fulfilled, (state, action) => {
        state.byCarId[action.payload.id] = { status: 'idle', durationMs: 0 };
      });
  },
});

export const { setCarState, setWinnerMessage, setRaceRunning, resetCarsState, startRaceSession } =
  raceSlice.actions;
export default raceSlice.reducer;
