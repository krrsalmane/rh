export interface AuditLog {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  module: string;
  entityId: string | null;
  oldValue: any | null;
  newValue: any | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogFilters {
  userId?: string;
  module?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}
