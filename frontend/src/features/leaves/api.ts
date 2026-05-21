import axiosInstance from '@/shared/api/axiosInstance';
import type {
  LeaveRequest, LeaveType, LeaveBalance, LeaveFilters,
  CreateLeaveRequestDto, CreateLeaveTypeDto, UpdateLeaveTypeDto,
} from './types';

function mapLeaveRequest(raw: Record<string, unknown>): LeaveRequest {
  return {
    id: raw.id as string,
    companyId: (raw.company_id ?? raw.companyId) as string,
    employeeId: (raw.employee_id ?? raw.employeeId) as string,
    employeeName: (raw.employee_name ?? raw.employeeName ?? '') as string,
    department: (raw.department ?? '') as string,
    leaveTypeId: (raw.leave_type_id ?? raw.leaveTypeId) as string,
    leaveTypeName: (raw.leave_type_name ?? raw.leaveTypeName ?? '') as string,
    startDate: (raw.start_date ?? raw.startDate) as string,
    endDate: (raw.end_date ?? raw.endDate) as string,
    reason: (raw.reason ?? null) as string | null,
    supportingDocumentPath: (raw.supporting_document_path ?? raw.supportingDocumentPath ?? null) as string | null,
    supportingDocumentName: (raw.supporting_document_name ?? raw.supportingDocumentName ?? null) as string | null,
    workingDays: (raw.working_days ?? raw.workingDays ?? null) as number | null,
    status: (raw.status as LeaveRequest['status']) || 'pending',
    requestedAt: (raw.requested_at ?? raw.requestedAt) as string,
    approvedBy: (raw.approved_by ?? raw.approvedBy ?? null) as string | null,
    approvalNote: (raw.approval_note ?? raw.approvalNote ?? null) as string | null,
  };
}

function mapLeaveType(raw: Record<string, unknown>): LeaveType {
  return {
    id: raw.id as string,
    companyId: (raw.company_id ?? raw.companyId) as string,
    name: raw.name as string,
    annualDays: (raw.annual_days ?? raw.annualDays ?? null) as number | null,
    accrualRule: (raw.accrual_rule ?? raw.accrualRule ?? null) as string | null,
    carryOverMax: (raw.carry_over_max ?? raw.carryOverMax ?? 0) as number,
    requiresApproval: Boolean(raw.requires_approval ?? raw.requiresApproval ?? true),
    isActive: Boolean(raw.is_active ?? raw.isActive ?? true),
  };
}

function mapBalance(raw: Record<string, unknown>): LeaveBalance {
  return {
    id: raw.id as string,
    employeeId: (raw.employee_id ?? raw.employeeId) as string,
    leaveTypeId: (raw.leave_type_id ?? raw.leaveTypeId) as string,
    leaveTypeName: (raw.leave_type_name ?? raw.leaveTypeName ?? '') as string,
    year: raw.year as number,
    credited: Number(raw.credited ?? 0),
    taken: Number(raw.taken ?? 0),
    remaining: Number(raw.remaining ?? 0),
  };
}

// ── Leave Requests ──
export async function getLeaveRequests(filters: LeaveFilters) {
  const params: Record<string, string | number> = { page: filters.page, limit: filters.limit };
  if (filters.employeeId) params.employeeId = filters.employeeId;
  if (filters.leaveTypeId) params.leaveTypeId = filters.leaveTypeId;
  if (filters.status) params.status = filters.status;

  const { data } = await axiosInstance.get('/leaves', { params });
  return {
    ...data,
    data: ((data.data as Record<string, unknown>[]) || []).map(mapLeaveRequest),
  };
}

export async function getLeaveRequestById(id: string) {
  const { data } = await axiosInstance.get(`/leaves/${id}`);
  return { ...data, data: mapLeaveRequest(data.data) };
}

export async function createLeaveRequest(dto: CreateLeaveRequestDto | FormData) {
  const { data } = await axiosInstance.post('/leaves', dto);
  return { ...data, data: mapLeaveRequest(data.data) };
}

export async function downloadLeaveRequestDocument(id: string) {
  const response = await axiosInstance.get(`/leaves/${id}/document`, {
    responseType: 'blob',
  });
  const disposition = response.headers['content-disposition'] as string | undefined;
  const filenameMatch = disposition?.match(/filename="?([^";]+)"?/i);
  return {
    blob: response.data as Blob,
    filename: filenameMatch?.[1] || 'justificatif',
  };
}

export async function markAllNotificationsAsRead() {
  await axiosInstance.post('/notifications/read-all');
}

export async function approveLeaveRequest(id: string, approvalNote?: string) {
  const { data } = await axiosInstance.put(`/leaves/${id}/approve`, { approvalNote });
  return { ...data, data: mapLeaveRequest(data.data) };
}

export async function rejectLeaveRequest(id: string, approvalNote?: string) {
  const { data } = await axiosInstance.put(`/leaves/${id}/reject`, { approvalNote });
  return { ...data, data: mapLeaveRequest(data.data) };
}

export async function cancelLeaveRequest(id: string) {
  const { data } = await axiosInstance.put(`/leaves/${id}/cancel`);
  return { ...data, data: mapLeaveRequest(data.data) };
}

export async function getBalances(employeeId: string, year?: number) {
  const params: Record<string, string | number> = {};
  if (year) params.year = year;
  const { data } = await axiosInstance.get(`/leaves/balance/${employeeId}`, { params });
  return ((data.data as Record<string, unknown>[]) || []).map(mapBalance);
}

// ── Leave Types ──
export async function getLeaveTypes() {
  const { data } = await axiosInstance.get('/leave-types');
  return ((data.data as Record<string, unknown>[]) || []).map(mapLeaveType);
}

export async function getLeaveTypeById(id: string) {
  const { data } = await axiosInstance.get(`/leave-types/${id}`);
  return mapLeaveType(data.data);
}

export async function createLeaveType(dto: CreateLeaveTypeDto) {
  const { data } = await axiosInstance.post('/leave-types', dto);
  return mapLeaveType(data.data);
}

export async function updateLeaveType(id: string, dto: UpdateLeaveTypeDto) {
  const { data } = await axiosInstance.put(`/leave-types/${id}`, dto);
  return mapLeaveType(data.data);
}

export async function deleteLeaveType(id: string) {
  await axiosInstance.delete(`/leave-types/${id}`);
}
