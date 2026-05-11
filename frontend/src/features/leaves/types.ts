export interface LeaveRequest {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  workingDays: number | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedAt: string;
  approvedBy: string | null;
  approvalNote: string | null;
}

export interface LeaveType {
  id: string;
  companyId: string;
  name: string;
  annualDays: number | null;
  accrualRule: string | null;
  carryOverMax: number;
  requiresApproval: boolean;
  isActive: boolean;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName: string;
  year: number;
  credited: number;
  taken: number;
  remaining: number;
}

export interface LeaveFilters {
  employeeId?: string;
  leaveTypeId?: string;
  status?: string;
  page: number;
  limit: number;
}

export interface CreateLeaveRequestDto {
  employeeId?: string | null;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  workingDays?: number | null;
}

export interface CreateLeaveTypeDto {
  name: string;
  annualDays?: number;
  accrualRule?: string;
  carryOverMax?: number;
  requiresApproval?: boolean;
}

export type UpdateLeaveTypeDto = Partial<CreateLeaveTypeDto>;
