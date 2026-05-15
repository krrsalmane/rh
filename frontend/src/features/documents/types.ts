// ============ Variable Schema ============
export interface VariableSchema {
  name: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'currency' | 'select' | 'textarea';
  required: boolean;
  autoFill: boolean;
  options?: string[];
  defaultValue?: string;
}

// ============ Template ============
export interface Template {
  id: string;
  name: string;
  category: 'contract' | 'attestation' | 'letter' | 'custom';
  language: 'fr' | 'ar' | 'en' | 'de';
  body: string;
  bodyTranslations?: Partial<Record<'fr' | 'ar' | 'en' | 'de', string>>;
  variableSchema: VariableSchema[];
  version: number;
  status: 'draft' | 'active' | 'archived';
  usageCount: number;
  createdBy: string | null;
  createdAt: string;
}

export interface CreateTemplateDto {
  name: string;
  category: 'contract' | 'attestation' | 'letter' | 'custom';
  language?: 'fr' | 'ar' | 'en' | 'de';
  body: string;
  bodyTranslations?: Partial<Record<'fr' | 'ar' | 'en' | 'de', string>>;
  variableSchema: VariableSchema[];
  status?: 'draft' | 'active' | 'archived';
}

export interface TemplateFilters {
  status?: string;
  category?: string;
  language?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ============ Generated Document ============
export interface GeneratedDocument {
  id: string;
  employeeId: string | null;
  employeeName: string | null;
  templateId: string | null;
  templateName: string | null;
  templateVersion: number | null;
  formData: Record<string, unknown> | null;
  pdfPath: string | null;
  status: 'generated' | 'archived' | 'deleted';
  generatedBy: string | null;
  generatedByEmail: string | null;
  generatedAt: string;
}

export interface GenerateDocumentDto {
  documentType?: string;
  templateId?: string;
  employeeId: string;
  formData: Record<string, unknown>;
  language?: 'fr' | 'ar' | 'en' | 'de';
}

export interface DocumentFilters {
  employeeId?: string;
  documentType?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// ============ API Responses ============
export interface ApiListResponse<T> {
  status: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  status: string;
  data: T;
}
