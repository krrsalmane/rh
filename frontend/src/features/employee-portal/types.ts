export interface EmployeeProfile {
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

export interface LeaveBalance {
  type: string;
  total: number;
  used: number;
  pending: number;
  approved: number;
  remaining: number;
}

export interface EmployeeDocument {
  id: string;
  title: string;
  type: string;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  hours: number;
  type: 'regular' | 'overtime';
}
