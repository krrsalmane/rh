import axiosInstance from '@/shared/api/axiosInstance';
import type {
  Employee,
  EmployeeFilters,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  PaginatedResponse,
  SingleResponse,
  LeaveBalance,
} from './types';

// Helper to map leave balance fields
function mapLeaveBalance(raw: any): LeaveBalance {
  return {
    id: raw.id,
    employeeId: raw.employee_id || raw.employeeId,
    leaveTypeId: raw.leave_type_id || raw.leaveTypeId,
    year: raw.year,
    totalDays: Number(raw.credited ?? raw.total_days ?? 0),
    usedDays: Number(raw.taken ?? raw.used_days ?? 0),
    remainingDays: Number(raw.remaining ?? raw.remaining_days ?? 0),
  };
}

// Map snake_case API response to camelCase
function mapEmployee(raw: Record<string, unknown>): Employee {
  return {
    id: raw.id as string,
    companyId: (raw.company_id ?? raw.companyId) as string,
    firstName: (raw.first_name ?? raw.firstName) as string,
    lastName: (raw.last_name ?? raw.lastName) as string,
    cin: (raw.cin as string) || undefined,
    cne: (raw.cne as string) || undefined,
    email: (raw.email as string) || undefined,
    phone: (raw.phone as string) || undefined,
    address: (raw.address as string) || undefined,
    hireDate: (raw.hire_date ?? raw.hireDate) as string,
    contractType: (raw.contract_type ?? raw.contractType) as Employee['contractType'],
    function: (raw.function as string) || undefined,
    department: (raw.department as string) || undefined,
    salary: (raw.salary as number) || undefined,
    status: (raw.status as Employee['status']) || 'active',
    workScheduleId: (raw.work_schedule_id ?? raw.workScheduleId) as string | undefined,
    workScheduleName: (raw.work_schedule_name ?? raw.workScheduleName) as string | undefined,
    weeklyHours: (raw.weekly_hours ?? raw.weeklyHours) as number | undefined,
    dailyHours: (raw.daily_hours ?? raw.dailyHours) as number | undefined,
    createdAt: (raw.created_at ?? raw.createdAt) as string,
    leaveBalances: Array.isArray(raw.leaveBalances) ? raw.leaveBalances.map(mapLeaveBalance) : undefined,
  };
}

export async function getEmployees(filters: EmployeeFilters) {
  const params: Record<string, string | number> = {
    page: filters.page,
    limit: filters.limit,
  };
  if (filters.search) params.search = filters.search;
  if (filters.department) params.department = filters.department;
  if (filters.status) params.status = filters.status;
  if (filters.contractType) params.contractType = filters.contractType;

  const { data } = await axiosInstance.get<PaginatedResponse<Record<string, unknown>>>('/employees', { params });
  return {
    ...data,
    data: data.data.map(mapEmployee),
  };
}

export async function getEmployeeById(id: string) {
  const { data } = await axiosInstance.get<SingleResponse<Record<string, unknown>>>(`/employees/${id}`);
  return { ...data, data: mapEmployee(data.data) };
}

export async function createEmployee(dto: CreateEmployeeDto) {
  const { data } = await axiosInstance.post<SingleResponse<Record<string, unknown>>>('/employees', dto);
  return { ...data, data: mapEmployee(data.data) };
}

export async function updateEmployee(id: string, dto: UpdateEmployeeDto) {
  const { data } = await axiosInstance.put<SingleResponse<Record<string, unknown>>>(`/employees/${id}`, dto);
  return { ...data, data: mapEmployee(data.data) };
}

export async function deleteEmployee(id: string) {
  const { data } = await axiosInstance.delete<{ status: string; message: string }>(`/employees/${id}`);
  return data;
}

export async function getDepartments() {
  const { data } = await axiosInstance.get<{ status: string; data: string[] }>('/employees/departments');
  return data.data;
}

export async function getLeaveBalances(employeeId: string) {
  const { data } = await axiosInstance.get<{ status: string; data: any[] }>(`/employees/${employeeId}/leave-balances`);
  return data.data.map(mapLeaveBalance);
}
