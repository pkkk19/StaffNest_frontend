import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface HolidayRequest {
  id: string;
  staffId: string;
  staffName: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'declined';
  submittedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  notes?: string;
}

interface HolidayBalance {
  staffId: string;
  totalAllowance: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

interface HolidayState {
  requests: HolidayRequest[];
  balances: HolidayBalance[];
  loading: boolean;
}

const initialState: HolidayState = {
  requests: [],
  balances: [],
  loading: false,
};

const holidaySlice = createSlice({
  name: 'holiday',
  initialState,
  reducers: {
    setRequests: (state, action: PayloadAction<HolidayRequest[]>) => {
      state.requests = action.payload;
    },
    addRequest: (state, action: PayloadAction<HolidayRequest>) => {
      state.requests.push(action.payload);
    },
    updateRequestStatus: (state, action: PayloadAction<{ id: string; status: 'approved' | 'declined'; approvedBy: string; notes?: string }>) => {
      const request = state.requests.find(req => req.id === action.payload.id);
      if (request) {
        request.status = action.payload.status;
        request.approvedBy = action.payload.approvedBy;
        request.approvedDate = new Date().toISOString();
        request.notes = action.payload.notes;
      }
    },
    setBalances: (state, action: PayloadAction<HolidayBalance[]>) => {
      state.balances = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setRequests, addRequest, updateRequestStatus, setBalances, setLoading } = holidaySlice.actions;
export default holidaySlice.reducer;