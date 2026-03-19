export interface Employee {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  cin?: string;
  cne?: string;
  email?: string;
  phone?: string;
  address?: string;
  hireDate: string;
  contractType: 'CDI' | 'CDD' | 'internship' | 'freelance';
  function?: string;
  department?: string;
  salary?: number;
  status: 'active' | 'inactive' | 'terminated';
  workScheduleId?: string;
  workScheduleName?: string;
  weeklyHours?: number;
  dailyHours?: number;
  createdAt: string;
  leaveBalances?: LeaveBalance[];
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

export interface EmployeeFilters {
  search?: string;
  department?: string;
  status?: string;
  contractType?: string;
  page: number;
  limit: number;
}

export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  cin?: string;
  cne?: string;
  email?: string;
  phone?: string;
  address?: string;
  hireDate: string;
  contractType: 'CDI' | 'CDD' | 'internship' | 'freelance';
  function?: string;
  department?: string;
  salary?: number;
  status: 'active' | 'inactive' | 'terminated';
  workScheduleId?: string;
}

export type UpdateEmployeeDto = Partial<CreateEmployeeDto>;

export interface PaginatedResponse<T> {
  status: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SingleResponse<T> {
  status: string;
  data: T;
}
