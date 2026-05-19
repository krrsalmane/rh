import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/shared/api/axiosInstance';

interface EmployeeProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  hireDate?: string;
}

interface LeaveBalance {
  type: string;
  total: number;
  used: number;
  pending: number;
  approved: number;
  remaining: number;
}

interface EmployeeDocument {
  id: string;
  title: string;
  type: string;
  createdAt: string;
}

interface TimeEntry {
  id: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  hours: number;
  type: 'regular' | 'overtime';
}

export function useEmployeeData() {
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['employee-profile'],
    queryFn: async () => {
      const response = await axiosInstance.get('/employees/profile');
      return response.data.data;
    },
  });

  const { data: leaveBalances, isLoading: leaveLoading, error: leaveError } = useQuery({
    queryKey: ['employee-leave-balances'],
    queryFn: async () => {
      const response = await axiosInstance.get('/leaves/balances');
      return response.data.data;
    },
  });

  const { data: documents, isLoading: documentsLoading, error: documentsError } = useQuery({
    queryKey: ['employee-documents'],
    queryFn: async () => {
      const response = await axiosInstance.get('/documents/employee');
      return response.data.data;
    },
  });

  const { data: timeEntries, isLoading: timeLoading, error: timeError } = useQuery({
    queryKey: ['employee-time-entries'],
    queryFn: async () => {
      const response = await axiosInstance.get('/time-entries');
      return response.data.data;
    },
  });

  const isLoading = profileLoading || leaveLoading || documentsLoading || timeLoading;
  const error = profileError || leaveError || documentsError || timeError;

  return {
    profile: profile as EmployeeProfile | undefined,
    leaveBalance: leaveBalances?.reduce((acc: any, balance: any) => {
      if (!acc.byType) acc.byType = {};
      acc.byType[balance.type] = balance;
      return acc;
    }, {}),
    documents: documents as EmployeeDocument[] || [],
    timeEntries: timeEntries as TimeEntry[] || [],
    isLoading,
    error,
  };
}
