export interface TimeEntry {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  totalHours: number | null;
  expectedHours: number;
  overtime: number;
  deficit: number;
  source: 'manual' | 'system' | 'import';
  modifiedBy: string | null;
  reason: string | null;
  createdAt: string;
}

export interface TimeEntryFilters {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

export interface CreateTimeEntryDto {
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  expectedHours?: number;
  source?: 'manual' | 'system' | 'import';
  reason?: string;
}

export interface UpdateTimeEntryDto extends Partial<Omit<CreateTimeEntryDto, 'employeeId'>> {}

export interface TimeSummary {
  period: string;
  totalHours: number;
  expectedHours: number;
  overtime: number;
  deficit: number;
  attendanceRate: number;
}

export interface WorkSchedule {
  id: string;
  companyId: string;
  name: string;
  weeklyHours: number;
  dailyHours: number;
  workDays: string[]; // ['monday', 'tuesday', ...]
  breakMinutes: number;
  isRotating: boolean;
}

export interface CreateWorkScheduleDto {
  name: string;
  weeklyHours: number;
  dailyHours: number;
  workDays: string[];
  breakMinutes?: number;
  isRotating?: boolean;
}
