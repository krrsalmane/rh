export interface Absence {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  startDate: string;
  endDate: string;
  type: string | null;
  justificationStatus: 'pending' | 'justified' | 'unjustified';
  reason: string | null;
  attachments: string[];
  reviewedBy: string | null;
  reviewNote: string | null;
  createdAt: string;
}

export interface AbsenceFilters {
  employeeId?: string;
  type?: string;
  justificationStatus?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

export interface CreateAbsenceDto {
  employeeId: string;
  startDate: string;
  endDate: string;
  type?: string;
  reason?: string;
}

export interface UpdateAbsenceDto {
  justificationStatus?: 'pending' | 'justified' | 'unjustified';
  reviewNote?: string;
  reason?: string;
}

export interface AbsenceAnalytics {
  totalAbsences: number;
  pendingJustification: number;
  absencesByType: Record<string, number>;
  absencesByMonth: { month: string; count: number }[];
}
