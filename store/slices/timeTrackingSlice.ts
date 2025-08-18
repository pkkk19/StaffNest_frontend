import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TimeEntry {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  totalHours?: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  notes?: string;
  editedBy?: string;
  editedAt?: string;
  status: 'active' | 'completed' | 'edited';
}

interface TimeTrackingState {
  entries: TimeEntry[];
  currentEntry: TimeEntry | null;
  loading: boolean;
  locationPermission: boolean;
}

const initialState: TimeTrackingState = {
  entries: [],
  currentEntry: null,
  loading: false,
  locationPermission: false,
};

const timeTrackingSlice = createSlice({
  name: 'timeTracking',
  initialState,
  reducers: {
    setEntries: (state, action: PayloadAction<TimeEntry[]>) => {
      state.entries = action.payload;
    },
    clockIn: (state, action: PayloadAction<TimeEntry>) => {
      state.currentEntry = action.payload;
      state.entries.push(action.payload);
    },
    clockOut: (state, action: PayloadAction<{ id: string; clockOut: string; totalHours: number }>) => {
      const entry = state.entries.find(e => e.id === action.payload.id);
      if (entry) {
        entry.clockOut = action.payload.clockOut;
        entry.totalHours = action.payload.totalHours;
        entry.status = 'completed';
      }
      state.currentEntry = null;
    },
    editTimeEntry: (state, action: PayloadAction<{ id: string; clockIn: string; clockOut: string; editedBy: string; notes?: string }>) => {
      const entry = state.entries.find(e => e.id === action.payload.id);
      if (entry) {
        entry.clockIn = action.payload.clockIn;
        entry.clockOut = action.payload.clockOut;
        entry.editedBy = action.payload.editedBy;
        entry.editedAt = new Date().toISOString();
        entry.notes = action.payload.notes;
        entry.status = 'edited';
        entry.totalHours = calculateHours(action.payload.clockIn, action.payload.clockOut);
      }
    },
    setLocationPermission: (state, action: PayloadAction<boolean>) => {
      state.locationPermission = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

function calculateHours(clockIn: string, clockOut: string): number {
  const start = new Date(clockIn);
  const end = new Date(clockOut);
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

export const { setEntries, clockIn, clockOut, editTimeEntry, setLocationPermission, setLoading } = timeTrackingSlice.actions;
export default timeTrackingSlice.reducer;