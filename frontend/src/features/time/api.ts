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
    lunchOut: (raw.lunch_out ?? raw.lunchOut) as string | null,
    lunchIn: (raw.lunch_in ?? raw.lunchIn) as string | null,
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

const DAY_NUMBER_TO_NAME: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

function parseWorkDays(rawWorkDays: unknown): string[] {
  if (!Array.isArray(rawWorkDays)) return [];
  return rawWorkDays
    .map((value) => {
      if (typeof value === 'number' && DAY_NUMBER_TO_NAME[value] !== undefined) {
        return DAY_NUMBER_TO_NAME[value];
      }
      if (typeof value === 'string') {
        const normalized = value.toLowerCase().trim();
        if (Object.values(DAY_NUMBER_TO_NAME).includes(normalized)) return normalized;
        const numberValue = Number(normalized);
        return DAY_NUMBER_TO_NAME[numberValue] ?? null;
      }
      return null;
    })
    .filter((day): day is string => typeof day === 'string');
}

function mapWorkSchedule(raw: Record<string, unknown>): WorkSchedule {
  return {
    id: raw.id as string,
    companyId: (raw.company_id ?? raw.companyId) as string,
    name: raw.name as string,
    weeklyHours: Number(raw.weekly_hours ?? raw.weeklyHours ?? 0),
    dailyHours: Number(raw.daily_hours ?? raw.dailyHours ?? 0),
    workDays: parseWorkDays(raw.work_days ?? raw.workDays),
    breakMinutes: Number(raw.break_minutes ?? raw.breakMinutes ?? 60),
    isRotating: Boolean(raw.is_rotating ?? raw.isRotating ?? false),
  };
}

// ── Time Entries ──
function serializeWorkDays(workDays: string[] | undefined): number[] | undefined {
  if (!workDays || workDays.length === 0) return undefined;
  const mapping: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  const uniqueDays = Array.from(new Set(workDays.map((day) => day.toLowerCase().trim())));
  const values = uniqueDays.map((day) => mapping[day]).filter((value) => value !== undefined);
  return values.length > 0 ? values : undefined;
}

export async function getTimeEntries(filters: TimeEntryFilters) {
  const params: Record<string, string | number> = {
    page: filters.page,
    limit: filters.limit,
  };
  if (filters.employeeId) params.employeeId = filters.employeeId;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;

  const { data } = await axiosInstance.get('/time-entries', { params });
  return {
    ...data,
    data: ((data.data as Record<string, unknown>[]) || []).map(mapTimeEntry),
  };
}

export async function getTimeEntryById(id: string) {
  const { data } = await axiosInstance.get(`/time-entries/${id}`);
  return { ...data, data: mapTimeEntry(data.data) };
}

export async function createTimeEntry(dto: CreateTimeEntryDto) {
  const { data } = await axiosInstance.post('/time-entries', dto);
  return { ...data, data: mapTimeEntry(data.data) };
}

export async function updateTimeEntry(id: string, dto: UpdateTimeEntryDto) {
  const { data } = await axiosInstance.put(`/time-entries/${id}`, dto);
  return { ...data, data: mapTimeEntry(data.data) };
}

export async function deleteTimeEntry(id: string) {
  await axiosInstance.delete(`/time-entries/${id}`);
}

export async function getTimeSummary(filters: { employeeId?: string; startDate?: string; endDate?: string }) {
  const { data } = await axiosInstance.get('/time-entries/summary', { params: filters });
  return data.data as TimeSummary;
}

export async function exportTimeReport(filters: { employeeId?: string; startDate?: string; endDate?: string; format?: string }) {
  const response = await axiosInstance.get('/time-entries/export', { params: filters, responseType: 'blob' });
  return response.data as Blob;
}

export async function clockIn(time?: string) {
  const { data } = await axiosInstance.post('/time-entries/clock-in', { time });
  return { ...data, data: mapTimeEntry(data.data) };
}

export async function clockOut(time?: string) {
  const { data } = await axiosInstance.post('/time-entries/clock-out', { time });
  return { ...data, data: mapTimeEntry(data.data) };
}

export async function createWorkSchedule(dto: CreateWorkScheduleDto) {
  const payload = {
    ...dto,
    workDays: serializeWorkDays(dto.workDays),
  };
  const { data } = await axiosInstance.post('/work-schedules', payload);
  return mapWorkSchedule(data.data);
}

export async function updateWorkSchedule(id: string, dto: Partial<CreateWorkScheduleDto>) {
  const payload = {
    ...dto,
    workDays: serializeWorkDays(dto.workDays as string[] | undefined),
  };
  const { data } = await axiosInstance.put(`/work-schedules/${id}`, payload);
  return mapWorkSchedule(data.data);
}

// ── Work Schedules ──
export async function getWorkSchedules() {
  const { data } = await axiosInstance.get('/work-schedules');
  return ((data.data as Record<string, unknown>[]) || []).map(mapWorkSchedule);
}

export async function deleteWorkSchedule(id: string) {
  await axiosInstance.delete(`/work-schedules/${id}`);
}

export async function generateDefaultTimeEntries(date: string) {
  const { data } = await axiosInstance.post('/time-entries/generate-defaults', { date });
  return data;
}
