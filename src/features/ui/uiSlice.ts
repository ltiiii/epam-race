import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type UiState = {
  garagePage: number;
  winnersPage: number;
  createName: string;
  createColor: string;
  editName: string;
  editColor: string;
};

const initialState: UiState = {
  garagePage: 1,
  winnersPage: 1,
  createName: '',
  createColor: '#ff0000',
  editName: '',
  editColor: '#0000ff',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setGaragePage(state, action: PayloadAction<number>) {
      state.garagePage = action.payload;
    },
    setCreateName(state, action: PayloadAction<string>) {
      state.createName = action.payload;
    },
    setCreateColor(state, action: PayloadAction<string>) {
      state.createColor = action.payload;
    },
    setEditName(state, action: PayloadAction<string>) {
      state.editName = action.payload;
    },
    setEditColor(state, action: PayloadAction<string>) {
      state.editColor = action.payload;
    },
    setWinnersPage(state, action: PayloadAction<number>) {
      state.winnersPage = action.payload;
    },
  },
});

export const { setGaragePage, setCreateColor, setCreateName, setEditColor, setEditName, setWinnersPage } =
  uiSlice.actions;
export default uiSlice.reducer;
