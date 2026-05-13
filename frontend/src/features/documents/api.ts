import axios from '@/shared/api/axiosInstance';
import type {
  Template, CreateTemplateDto, TemplateFilters,
  GeneratedDocument, GenerateDocumentDto, DocumentFilters,
  ApiListResponse, ApiResponse,
} from './types';

// ============ Helpers: snake_case -> camelCase ============

function mapTemplate(row: Record<string, unknown>): Template {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as Template['category'],
    language: (row.language as Template['language']) || 'fr',
    body: (row.body as string) || '',
    variableSchema: parseVariableSchema(row.variable_schema),
    version: (row.version as number) || 1,
    status: row.status as Template['status'],
    usageCount: (row.usage_count as number) || 0,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string,
  };
}

function mapDocument(row: Record<string, unknown>): GeneratedDocument {
  return {
    id: row.id as string,
    employeeId: row.employee_id as string | null,
    employeeName: row.employee_name as string | null,
    templateId: row.template_id as string | null,
    templateName: row.template_name as string | null,
    templateVersion: row.template_version as number | null,
    formData: (row.form_data as Record<string, unknown>) ?? null,
    pdfPath: row.pdf_path as string | null,
    status: row.status as GeneratedDocument['status'],
    generatedBy: row.generated_by as string | null,
    generatedByEmail: row.generated_by_email as string | null,
    generatedAt: row.generated_at as string,
  };
}

function parseVariableSchema(raw: unknown): Template['variableSchema'] {
  if (!raw) return [];
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  if (Array.isArray(raw)) return raw;
  return [];
}

// ============ Templates API ============
export async function fetchTemplates(filters: TemplateFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.category) params.set('category', filters.category);
  if (filters.language) params.set('language', filters.language);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const res = await axios.get<ApiListResponse<Record<string, unknown>>>(`/templates?${params}`);
  return {
    data: res.data.data.map(mapTemplate),
    pagination: res.data.pagination,
  };
}

export async function fetchActiveTemplates() {
  // Use the same /templates endpoint with status=active filter
  // This is more robust than /templates/active which requires backend restart
  const result = await fetchTemplates({ status: 'active', limit: 100 });
  return result.data;
}

export async function fetchTemplate(id: string) {
  const res = await axios.get<ApiResponse<Record<string, unknown>>>(`/templates/${id}`);
  return mapTemplate(res.data.data);
}

export async function createTemplate(data: CreateTemplateDto) {
  const payload = {
    name: data.name,
    category: data.category,
    language: data.language || 'fr',
    body: data.body,
    variableSchema: data.variableSchema,
    status: data.status || 'draft',
  };
  const res = await axios.post<ApiResponse<Record<string, unknown>>>('/templates', payload);
  return mapTemplate(res.data.data);
}

export async function updateTemplate(id: string, data: Partial<CreateTemplateDto>) {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.category !== undefined) payload.category = data.category;
  if (data.language !== undefined) payload.language = data.language;
  if (data.body !== undefined) payload.body = data.body;
  if (data.variableSchema !== undefined) payload.variableSchema = data.variableSchema;
  if (data.status !== undefined) payload.status = data.status;

  const res = await axios.put<ApiResponse<Record<string, unknown>>>(`/templates/${id}`, payload);
  return mapTemplate(res.data.data);
}

export async function patchTemplateStatus(id: string, status: 'draft' | 'active' | 'archived') {
  const res = await axios.patch<ApiResponse<Record<string, unknown>>>(`/templates/${id}/status`, { status });
  return mapTemplate(res.data.data);
}

export async function deleteTemplate(id: string, force = false) {
  const res = await axios.delete(`/templates/${id}${force ? '?force=true' : ''}`);
  return res.data;
}

// ============ Documents API ============
export async function fetchDocuments(filters: DocumentFilters = {}) {
  const params = new URLSearchParams();
  if (filters.employeeId) params.set('employeeId', filters.employeeId);
  if (filters.documentType) params.set('documentType', filters.documentType);
  if (filters.status) params.set('status', filters.status);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const res = await axios.get<ApiListResponse<Record<string, unknown>>>(`/documents?${params}`);
  return {
    data: res.data.data.map(mapDocument),
    pagination: res.data.pagination,
  };
}

export async function fetchDocument(id: string) {
  const res = await axios.get<ApiResponse<Record<string, unknown>>>(`/documents/${id}`);
  return mapDocument(res.data.data);
}

export async function generateDocument(data: GenerateDocumentDto) {
  const res = await axios.post<ApiResponse<Record<string, unknown>>>('/documents/generate', data);
  return mapDocument(res.data.data);
}

export async function fetchAvailableTemplates() {
  const res = await axios.get<ApiResponse<Record<string, string[]>>>('/documents/available-templates');
  return res.data.data;
}

export async function fetchTemplateContent(type: string, lang: string) {
  const res = await axios.get<ApiResponse<string>>(`/documents/template-content/${type}/${lang}`);
  return res.data.data;
}

export function getDocumentPdfUrl(id: string): string {
  return `/documents/${id}/pdf`;
}

export function getDocumentDownloadUrl(id: string): string {
  return `/documents/${id}/download`;
}

export async function archiveDocument(id: string) {
  const res = await axios.patch<ApiResponse<Record<string, unknown>>>(`/documents/${id}/archive`);
  return mapDocument(res.data.data);
}

export async function deleteDocument(id: string) {
  await axios.delete(`/documents/${id}`);
}

// Consolidated Templates API object
export const templatesApi = {
  getAll: (filters?: TemplateFilters) => fetchTemplates(filters),
  getById: (id: string) => fetchTemplate(id),
  getAvailable: () => fetchAvailableTemplates(),
  create: (data: CreateTemplateDto) => createTemplate(data),
  update: (id: string, data: Partial<CreateTemplateDto>) => updateTemplate(id, data),
  updateStatus: (id: string, status: 'draft' | 'active' | 'archived') => patchTemplateStatus(id, status),
  delete: (id: string, force = false) => axios.delete(`/templates/${id}${force ? '?force=true' : ''}`).then(r => r.data),
};
