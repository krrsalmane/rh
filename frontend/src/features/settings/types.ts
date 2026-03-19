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
  super_admin: 'bg-purple-100 text-purple-700 border border-purple-200',
  hr_agent: 'bg-blue-100 text-blue-700 border border-blue-200',
  manager: 'bg-amber-100 text-amber-700 border border-amber-200',
  employee: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
};
