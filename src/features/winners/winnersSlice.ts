import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import * as winnersApi from '../../api/winnersApi';
import { WINNERS_PAGE_SIZE } from '../../constants/common';
import type { RootState } from '../../app/store';
import type { SortOrder, WinnerWithCar, WinnersSortField } from '../../types/api';

type WinnersState = {
  items: WinnerWithCar[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  sort: WinnersSortField;
  order: SortOrder;
};

const initialState: WinnersState = {
  items: [],
  totalCount: 0,
  loading: false,
  error: null,
  sort: 'wins',
  order: 'DESC',
};

export const loadWinners = createAsyncThunk('winners/loadWinners', async (_, thunkApi) => {
  const state = thunkApi.getState() as RootState;
  const response = await winnersApi.fetchWinners({
    page: state.ui.winnersPage,
    limit: WINNERS_PAGE_SIZE,
    sort: state.winners.sort,
    order: state.winners.order,
  });

  const cars = await Promise.all(response.winners.map((winner) => winnersApi.fetchCarById(winner.id)));
  const items = response.winners.map((winner, index) => ({ ...winner, car: cars[index] }));

  return { items, totalCount: response.totalCount };
});

const winnersSlice = createSlice({
  name: 'winners',
  initialState,
  reducers: {
    setWinnersSort(state, action: PayloadAction<WinnersSortField>) {
      if (state.sort === action.payload) {
        state.order = state.order === 'ASC' ? 'DESC' : 'ASC';
      } else {
        state.sort = action.payload;
        state.order = 'DESC';
      }
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadWinners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadWinners.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(loadWinners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load winners';
      });
  },
});

export const { setWinnersSort } = winnersSlice.actions;
export default winnersSlice.reducer;
