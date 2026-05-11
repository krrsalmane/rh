import { useQuery } from '@tanstack/react-query';
import * as auditApi from '../api';
import type { AuditLogFilters } from '../types';

const AUDIT_KEY = 'audit-logs';

export function useAuditLogs(filters: AuditLogFilters) {
  return useQuery({
    queryKey: [AUDIT_KEY, filters],
    queryFn: () => auditApi.getAuditLogs(filters),
    placeholderData: (prev) => prev,
  });
}
