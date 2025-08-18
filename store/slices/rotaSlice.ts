import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  branchId: string;
  branchName: string;
  role: string;
  color: string;
  notes?: string;
}

interface RotaState {
  shifts: Shift[];
  currentWeek: string;
  loading: boolean;
}

const initialState: RotaState = {
  shifts: [],
  currentWeek: new Date().toISOString().split('T')[0],
  loading: false,
};

const rotaSlice = createSlice({
  name: 'rota',
  initialState,
  reducers: {
    setShifts: (state, action: PayloadAction<Shift[]>) => {
      state.shifts = action.payload;
    },
    addShift: (state, action: PayloadAction<Shift>) => {
      state.shifts.push(action.payload);
    },
    updateShift: (state, action: PayloadAction<Shift>) => {
      const index = state.shifts.findIndex(shift => shift.id === action.payload.id);
      if (index !== -1) {
        state.shifts[index] = action.payload;
      }
    },
    deleteShift: (state, action: PayloadAction<string>) => {
      state.shifts = state.shifts.filter(shift => shift.id !== action.payload);
    },
    setCurrentWeek: (state, action: PayloadAction<string>) => {
      state.currentWeek = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setShifts, addShift, updateShift, deleteShift, setCurrentWeek, setLoading } = rotaSlice.actions;
export default rotaSlice.reducer;