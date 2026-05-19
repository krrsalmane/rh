export interface TimeEntry {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  lunchOut: string | null;
  lunchIn: string | null;
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

export interface TimeActionDto {
  action: 'morning-in' | 'morning-out' | 'lunch-out' | 'lunch-in' | 'prayer-out' | 'prayer-in';
  time?: string;
  employeeId?: string;
  date?: string;
}

export interface CreateTimeEntryDto {
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  lunchOut?: string;
  lunchIn?: string;
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
