import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  location: {
    latitude: number;
    longitude: number;
    radius: number; // Geo-fence radius in meters
  };
  isActive: boolean;
}

interface Company {
  id: string;
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  registrationNumber?: string;
  taxNumber?: string;
  currency: 'GBP' | 'NPR' | 'USD';
  country: string;
  subscription: {
    plan: 'basic' | 'premium' | 'enterprise';
    status: 'active' | 'expired' | 'cancelled';
    expiryDate: string;
    maxUsers: number;
    currentUsers: number;
  };
}

interface CompanyState {
  company: Company | null;
  branches: Branch[];
  documents: {
    id: string;
    name: string;
    type: string;
    category: 'policy' | 'license' | 'contract' | 'other';
    uploadDate: string;
    url: string;
  }[];
  loading: boolean;
}

const initialState: CompanyState = {
  company: null,
  branches: [],
  documents: [],
  loading: false,
};

const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {
    setCompany: (state, action: PayloadAction<Company>) => {
      state.company = action.payload;
    },
    setBranches: (state, action: PayloadAction<Branch[]>) => {
      state.branches = action.payload;
    },
    addBranch: (state, action: PayloadAction<Branch>) => {
      state.branches.push(action.payload);
    },
    updateBranch: (state, action: PayloadAction<Branch>) => {
      const index = state.branches.findIndex(branch => branch.id === action.payload.id);
      if (index !== -1) {
        state.branches[index] = action.payload;
      }
    },
    setDocuments: (state, action: PayloadAction<typeof initialState.documents>) => {
      state.documents = action.payload;
    },
    addDocument: (state, action: PayloadAction<typeof initialState.documents[0]>) => {
      state.documents.push(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setCompany, setBranches, addBranch, updateBranch, setDocuments, addDocument, setLoading } = companySlice.actions;
export default companySlice.reducer;