import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface StaffMember {
  id: string;
  email: string;
  name: string;
  position: string;
  department: string;
  branchId: string;
  branchName: string;
  phoneNumber: string;
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  employmentDetails: {
    startDate: string;
    contractType: 'full-time' | 'part-time' | 'contract';
    salary: number;
    hourlyRate?: number;
    currency: 'GBP' | 'NPR' | 'USD';
  };
  documents: {
    id: string;
    name: string;
    type: string;
    uploadDate: string;
    url: string;
  }[];
  isActive: boolean;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

interface StaffState {
  members: StaffMember[];
  loading: boolean;
}

const initialState: StaffState = {
  members: [],
  loading: false,
};

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    setStaffMembers: (state, action: PayloadAction<StaffMember[]>) => {
      state.members = action.payload;
    },
    addStaffMember: (state, action: PayloadAction<StaffMember>) => {
      state.members.push(action.payload);
    },
    updateStaffMember: (state, action: PayloadAction<StaffMember>) => {
      const index = state.members.findIndex(member => member.id === action.payload.id);
      if (index !== -1) {
        state.members[index] = action.payload;
      }
    },
    deactivateStaffMember: (state, action: PayloadAction<string>) => {
      const member = state.members.find(m => m.id === action.payload);
      if (member) {
        member.isActive = false;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setStaffMembers, addStaffMember, updateStaffMember, deactivateStaffMember, setLoading } = staffSlice.actions;
export default staffSlice.reducer;