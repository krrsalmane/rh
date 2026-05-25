export type UserRole = 'super_admin' | 'hr_agent' | 'manager' | 'employee';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  employeeId?: string;
  employeeName?: string;
  department?: string;
  function?: string;
  createdAt: string;
  lastLogin?: string;
  mustChangePassword?: boolean;
}

export interface CreateUserDto {
  email: string;
  password: string;
  role: UserRole;
  employeeId?: string;
}

export interface UpdateUserDto {
  email?: string;
  role?: UserRole;
  employeeId?: string | null;
  isActive?: boolean;
}

export interface UserFilters {
  search?: string;
  role?: string;
  isActive?: string;
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  status: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  hr_agent: 'Agent RH',
  manager: 'Manager',
  employee: 'Employé',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-slate-100 text-slate-600 border border-slate-200',
  hr_agent: 'bg-slate-100 text-slate-600 border border-slate-200',
  manager: 'bg-slate-100 text-slate-600 border border-slate-200',
  employee: 'bg-slate-100 text-slate-600 border border-slate-200',
};
