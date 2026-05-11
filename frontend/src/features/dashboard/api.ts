import axiosInstance from '@/shared/api/axiosInstance';
import { useQuery } from '@tanstack/react-query';

export interface DashboardStats {
  totalEmployees: number;
  totalUsers: number;
  pendingLeaves: number;
  pendingAbsences: number;
  teamSize?: number;
}

export interface DepartmentStat {
  name: string;
  value: number;
}

export interface AbsenceTrend {
  month: string;
  count: number;
}

export interface DashboardData {
  stats: DashboardStats;
  distribution: DepartmentStat[];
  trends: AbsenceTrend[];
  alerts: any[];
  nextHoliday: { name: string; date: string } | null;
  recentActivity: any[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const { data } = await axiosInstance.get('/dashboard');
  return data.data;
}

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
