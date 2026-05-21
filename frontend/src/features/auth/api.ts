import axiosInstance from '@/shared/api/axiosInstance';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'super_admin' | 'hr_agent' | 'manager' | 'employee';
  companyId: string;
  employeeId?: string | null;
}

export interface LoginResponse {
  status: string;
  data: {
    accessToken: string;
    user: AuthUser;
  };
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await axiosInstance.post<LoginResponse>('/auth/login', payload);
    return data;
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post('/auth/login/logout');
  },

  me: async (): Promise<AuthUser> => {
    const { data } = await axiosInstance.get<{ status: string; data: AuthUser }>('/auth/me');
    return data.data;
  },

  refresh: async (): Promise<{ accessToken: string; user: AuthUser }> => {
    const { data } = await axiosInstance.post<{ data: { accessToken: string; user: AuthUser } }>(
      '/auth/refresh',
      {}
    );
    return data.data;
  },
};
