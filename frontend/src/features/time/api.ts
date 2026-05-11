import axiosInstance from '@/shared/api/axiosInstance';
import type {
  TimeEntry,
  TimeEntryFilters,
  CreateTimeEntryDto,
  UpdateTimeEntryDto,
  TimeSummary,
  WorkSchedule,
  CreateWorkScheduleDto,
} from './types';

function mapTimeEntry(raw: Record<string, unknown>): TimeEntry {
  return {
    id: raw.id as string,
    companyId: (raw.company_id ?? raw.companyId) as string,
    employeeId: (raw.employee_id ?? raw.employeeId) as string,
    employeeName: (raw.employee_name ?? raw.employeeName ?? '') as string,
    department: (raw.department ?? '') as string,
    date: (raw.date as string),
    clockIn: (raw.clock_in ?? raw.clockIn) as string | null,
    clockOut: (raw.clock_out ?? raw.clockOut) as string | null,
    totalHours: (raw.total_hours ?? raw.totalHours) as number | null,
    expectedHours: (raw.expected_hours ?? raw.expectedHours ?? 0) as number,
    overtime: (raw.overtime as number) || 0,
    deficit: (raw.deficit as number) || 0,
    source: (raw.source as TimeEntry['source']) || 'manual',
    modifiedBy: (raw.modified_by ?? raw.modifiedBy) as string | null,
    reason: (raw.reason as string) || null,
    createdAt: (raw.created_at ?? raw.createdAt) as string,
  };
}

function mapWorkSchedule(raw: Record<string, unknown>): WorkSchedule {
  return {
    id: raw.id as string,
    companyId: (raw.company_id ?? raw.companyId) as string,
    name: raw.name as string,
    weeklyHours: Number(raw.weekly_hours ?? raw.weeklyHours ?? 0),
    dailyHours: Number(raw.daily_hours ?? raw.dailyHours ?? 0),
    workDays: (raw.work_days ?? raw.workDays) as string[] || [],
    breakMinutes: Number(raw.break_minutes ?? raw.breakMinutes ?? 60),
    isRotating: Boolean(raw.is_rotating ?? raw.isRotating ?? false),
  };
}

// ── Time Entries ──
export async function getTimeEntries(filters: TimeEntryFilters) {
  const params: Record<string, string | number> = {
    page: filters.page,
    limit: filters.limit,
  };
  if (filters.employeeId) params.employeeId = filters.employeeId;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;

  const { data } = await axiosInstance.get('/time', { params });
  return {
    ...data,
    data: ((data.data as Record<string, unknown>[]) || []).map(mapTimeEntry),
  };
}

export async function getTimeEntryById(id: string) {
  const { data } = await axiosInstance.get(`/time/${id}`);
  return { ...data, data: mapTimeEntry(data.data) };
}

export async function createTimeEntry(dto: CreateTimeEntryDto) {
  const { data } = await axiosInstance.post('/time', dto);
  return { ...data, data: mapTimeEntry(data.data) };
}

export async function updateTimeEntry(id: string, dto: UpdateTimeEntryDto) {
  const { data } = await axiosInstance.put(`/time/${id}`, dto);
  return { ...data, data: mapTimeEntry(data.data) };
}

export async function deleteTimeEntry(id: string) {
  await axiosInstance.delete(`/time/${id}`);
}

export async function getTimeSummary(filters: { employeeId?: string; startDate?: string; endDate?: string }) {
  const { data } = await axiosInstance.get('/time/summary', { params: filters });
  return data.data as TimeSummary;
}

// ── Work Schedules ──
export async function getWorkSchedules() {
  const { data } = await axiosInstance.get('/work-schedules');
  return ((data.data as Record<string, unknown>[]) || []).map(mapWorkSchedule);
}

export async function createWorkSchedule(dto: CreateWorkScheduleDto) {
  const { data } = await axiosInstance.post('/work-schedules', dto);
  return mapWorkSchedule(data.data);
}

export async function updateWorkSchedule(id: string, dto: Partial<CreateWorkScheduleDto>) {
  const { data } = await axiosInstance.put(`/work-schedules/${id}`, dto);
  return mapWorkSchedule(data.data);
}

export async function deleteWorkSchedule(id: string) {
  await axiosInstance.delete(`/work-schedules/${id}`);
}
