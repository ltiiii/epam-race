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

function clampProgress(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function getCarState(state: { race: RaceState }, id: number): CarRaceState {
  return state.race.byCarId[id] ?? { status: 'idle', durationMs: 0, progress: 0, runId: 0 };
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

function setStarting(thunkApi: Parameters<typeof startCarPayload>[1], carId: number, runId: number): void {
  thunkApi.dispatch(
    setCarState({
      id: carId,
      state: { status: 'starting', durationMs: 0, progress: 0, runId },
    }),
  );
}

function setDriving(
  thunkApi: Parameters<typeof startCarPayload>[1],
  carId: number,
  runId: number,
  durationMs: number,
): void {
  thunkApi.dispatch(
    setCarState({
      id: carId,
      state: { status: 'driving', durationMs, progress: 1, runId },
    }),
  );
}

function setBroken(
  thunkApi: Parameters<typeof startCarPayload>[1],
  carId: number,
  runId: number,
  progress: number,
): void {
  thunkApi.dispatch(
    setCarState({
      id: carId,
      state: { status: 'broken', durationMs: 0, progress, runId },
    }),
  );
}

function setFinished(thunkApi: Parameters<typeof startCarPayload>[1], carId: number, runId: number): void {
  thunkApi.dispatch(
    setCarState({
      id: carId,
      state: { status: 'finished', durationMs: 0, progress: 1, runId },
    }),
  );
}

async function startCarPayload(car: Car, thunkApi: {
  dispatch: (action: unknown) => unknown;
  getState: () => unknown;
}): Promise<{ id: number; name: string; elapsedMs: number }> {
  const before = getCarState(thunkApi.getState() as { race: RaceState }, car.id);
  const runId = before.runId + 1;
  const startedAt = performance.now();
  setStarting(thunkApi, car.id, runId);
  const started = await engineApi.setEngineStatus(car.id, 'started');
  const afterStart = getCarState(thunkApi.getState() as { race: RaceState }, car.id);
  if (afterStart.runId !== runId) {
    return { id: car.id, name: car.name, elapsedMs: Number.MAX_SAFE_INTEGER };
  }
  const durationMs = Math.round(started.distance / started.velocity);
  setDriving(thunkApi, car.id, runId, durationMs);

  try {
    await engineApi.driveEngine(car.id);
  } catch (error) {
    const elapsedMs = Math.round(performance.now() - startedAt);
    const progress = clampProgress(elapsedMs / durationMs);
    setBroken(thunkApi, car.id, runId, progress);
    throw error;
  }

  const afterDrive = getCarState(thunkApi.getState() as { race: RaceState }, car.id);
  if (afterDrive.runId !== runId) {
    return { id: car.id, name: car.name, elapsedMs: Number.MAX_SAFE_INTEGER };
  }
  const elapsedMs = Math.round(performance.now() - startedAt);
  setFinished(thunkApi, car.id, runId);
  return { id: car.id, name: car.name, elapsedMs };
}

export const startCar = createAsyncThunk('race/startCar', async (car: Car, thunkApi) =>
  startCarPayload(car, thunkApi));

export const startRace = createAsyncThunk('race/startRace', async (cars: Car[], thunkApi) => {
  thunkApi.dispatch(startRaceSession());
  const raceId = (thunkApi.getState() as { race: RaceState }).race.activeRaceId;
  thunkApi.dispatch(setRaceRunning(true));
  thunkApi.dispatch(setWinnerMessage(null));
  const tasks = cars.map((car) => thunkApi.dispatch(startCar(car)).unwrap());
  const settled = await Promise.allSettled(tasks);
  const success = settled
    .filter((item): item is PromiseFulfilledResult<{ id: number; name: string; elapsedMs: number }> => item.status === 'fulfilled')
    .map((item) => item.value)
    .filter((item) => Number.isFinite(item.elapsedMs))
    .sort((a, b) => a.elapsedMs - b.elapsedMs);

  const isStillActive = (thunkApi.getState() as { race: RaceState }).race.activeRaceId === raceId;

  if (success[0] && isStillActive) {
    const [best] = success;
    const time = msToSec(best.elapsedMs);
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
        const current = state.byCarId[id] ?? { status: 'idle', durationMs: 0, progress: 0, runId: 0 };
        state.byCarId[id] = { status: 'idle', durationMs: 0, progress: 0, runId: current.runId + 1 };
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
      .addCase(stopCar.fulfilled, (state, action) => {
        const current = state.byCarId[action.payload.id] ?? {
          status: 'idle',
          durationMs: 0,
          progress: 0,
          runId: 0,
        };
        state.byCarId[action.payload.id] = {
          status: 'idle',
          durationMs: 0,
          progress: 0,
          runId: current.runId + 1,
        };
      });
  },
});

export const { setCarState, setWinnerMessage, setRaceRunning, resetCarsState, startRaceSession } =
  raceSlice.actions;
export default raceSlice.reducer;
