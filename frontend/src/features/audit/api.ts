import axiosInstance from '@/shared/api/axiosInstance';
import type { AuditLog, AuditLogFilters } from './types';

function mapAuditLog(raw: Record<string, unknown>): AuditLog {
  return {
    id: raw.id as string,
    companyId: (raw.company_id ?? raw.companyId) as string,
    userId: (raw.user_id ?? raw.userId) as string,
    userName: (raw.user_name ?? raw.userName ?? '') as string,
    userEmail: (raw.user_email ?? raw.userEmail ?? '') as string,
    action: raw.action as string,
    module: raw.module as string,
    entityId: (raw.entity_id ?? raw.entityId) as string | null,
    oldValue: (raw.old_value ?? raw.oldValue),
    newValue: (raw.new_value ?? raw.newValue),
    ipAddress: (raw.ip_address ?? raw.ipAddress) as string | null,
    userAgent: (raw.user_agent ?? raw.userAgent) as string | null,
    createdAt: (raw.created_at ?? raw.createdAt) as string,
  };
}

export async function getAuditLogs(filters: AuditLogFilters) {
  const params: Record<string, string | number> = {
    page: filters.page,
    limit: filters.limit,
  };
  if (filters.userId) params.userId = filters.userId;
  if (filters.module) params.module = filters.module;
  if (filters.action) params.action = filters.action;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;

  const { data } = await axiosInstance.get('/audit-logs', { params });
  return {
    ...data,
    data: ((data.data as Record<string, unknown>[]) || []).map(mapAuditLog),
  };
}
