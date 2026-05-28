import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as garageApi from '../../api/garageApi';
import * as winnersApi from '../../api/winnersApi';
import { GARAGE_PAGE_SIZE } from '../../constants/common';
import type { Car, CarPayload } from '../../types/api';
import { generateRandomCars } from '../../utils/randomCars';
import type { RootState } from '../../app/store';

type GarageState = {
  cars: Car[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  selectedCarId: number | null;
  randomCreating: boolean;
};

const initialState: GarageState = {
  cars: [],
  totalCount: 0,
  loading: false,
  error: null,
  selectedCarId: null,
  randomCreating: false,
};

export const loadCars = createAsyncThunk('garage/loadCars', async (_, thunkApi) => {
  const state = thunkApi.getState() as RootState;
  return garageApi.fetchCars({ page: state.ui.garagePage, limit: GARAGE_PAGE_SIZE });
});

export const createCarThunk = createAsyncThunk('garage/createCar', async (payload: CarPayload) => {
  await garageApi.createCar(payload);
});

export const updateCarThunk = createAsyncThunk(
  'garage/updateCar',
  async (payload: { id: number; car: CarPayload }) => {
    await garageApi.updateCar(payload.id, payload.car);
  },
);

export const deleteCarThunk = createAsyncThunk('garage/deleteCar', async (id: number) => {
  await garageApi.deleteCar(id);
  await winnersApi.deleteWinner(id);
});

export const createRandomCarsThunk = createAsyncThunk('garage/createRandomCars', async () => {
  const cars = generateRandomCars(100);
  await Promise.all(cars.map((car) => garageApi.createCar(car)));
});

const garageSlice = createSlice({
  name: 'garage',
  initialState,
  reducers: {
    selectCar(state, action: { payload: number | null }) {
      state.selectedCarId = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadCars.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCars.fulfilled, (state, action) => {
        state.loading = false;
        state.cars = action.payload.cars;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(loadCars.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load cars';
      })
      .addCase(createRandomCarsThunk.pending, (state) => {
        state.randomCreating = true;
      })
      .addCase(createRandomCarsThunk.fulfilled, (state) => {
        state.randomCreating = false;
      })
      .addCase(createRandomCarsThunk.rejected, (state) => {
        state.randomCreating = false;
      });
  },
});

export const { selectCar } = garageSlice.actions;
export default garageSlice.reducer;
