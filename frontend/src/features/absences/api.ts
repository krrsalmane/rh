import axiosInstance from '@/shared/api/axiosInstance';
import type {
  Absence,
  AbsenceFilters,
  CreateAbsenceDto,
  UpdateAbsenceDto,
  AbsenceAnalytics,
} from './types';

function mapAbsence(raw: Record<string, unknown>): Absence {
  return {
    id: raw.id as string,
    companyId: (raw.company_id ?? raw.companyId) as string,
    employeeId: (raw.employee_id ?? raw.employeeId) as string,
    employeeName: (raw.employee_name ?? raw.employeeName ?? '') as string,
    department: (raw.department ?? '') as string,
    startDate: (raw.start_date ?? raw.startDate) as string,
    endDate: (raw.end_date ?? raw.endDate) as string,
    type: (raw.type as string) || null,
    justificationStatus: (raw.justification_status ?? raw.justificationStatus ?? 'pending') as Absence['justificationStatus'],
    reason: (raw.reason as string) || null,
    attachments: (raw.attachments as string[]) || [],
    reviewedBy: (raw.reviewed_by ?? raw.reviewedBy) as string | null,
    reviewNote: (raw.review_note ?? raw.reviewNote) as string | null,
    createdAt: (raw.created_at ?? raw.createdAt) as string,
  };
}

export async function getAbsences(filters: AbsenceFilters) {
  const params: Record<string, string | number> = {
    page: filters.page,
    limit: filters.limit,
  };
  if (filters.employeeId) params.employeeId = filters.employeeId;
  if (filters.type) params.type = filters.type;
  if (filters.justificationStatus) params.justificationStatus = filters.justificationStatus;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;

  const { data } = await axiosInstance.get('/absences', { params });
  return {
    ...data,
    data: ((data.data as Record<string, unknown>[]) || []).map(mapAbsence),
  };
}

export async function getAbsenceById(id: string) {
  const { data } = await axiosInstance.get(`/absences/${id}`);
  return { ...data, data: mapAbsence(data.data) };
}

export async function createAbsence(dto: CreateAbsenceDto) {
  const { data } = await axiosInstance.post('/absences', dto);
  return { ...data, data: mapAbsence(data.data) };
}

export async function justifyAbsence(id: string, formData: FormData) {
  const { data } = await axiosInstance.put(`/absences/${id}/justify`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return { ...data, data: mapAbsence(data.data) };
}

export async function markUnjustified(id: string) {
  const { data } = await axiosInstance.put(`/absences/${id}/unjustify`);
  return { ...data, data: mapAbsence(data.data) };
}

export async function deleteAbsence(id: string) {
  await axiosInstance.delete(`/absences/${id}`);
}

export async function getAbsenceAnalytics() {
  const { data } = await axiosInstance.get('/absences/analytics');
  return data.data as AbsenceAnalytics;
}
