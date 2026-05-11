import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ROLES } from '@/shared/constants/permissions';

export type UserRole = typeof ROLES[keyof typeof ROLES];

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  employeeId?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  role: UserRole | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  companyId: string | null;
}

const initialState: AuthState = {
  user: null,
  role: null,
  accessToken: null,
  isAuthenticated: false,
  companyId: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: AuthUser;
        role: UserRole;
        accessToken: string;
        companyId: string;
        employeeId?: string | null;
      }>
    ) => {
      state.user = action.payload.user;
      state.role = action.payload.role;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.companyId = action.payload.companyId;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.role = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.companyId = null;
    },
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, updateAccessToken } = authSlice.actions;
export default authSlice.reducer;
