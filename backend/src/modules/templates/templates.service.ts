import * as templatesRepository from './templates.repository';
import { CreateTemplateInput, UpdateTemplateInput } from './templates.schema';
import { AppError } from '../../shared/utils/AppError';
import { auditLog } from '../../shared/utils/auditLogger';

export async function getTemplates(companyId: string, page: number = 1, limit: number = 20) {
  return templatesRepository.findAll(companyId, page, limit);
}

export async function getTemplateById(id: string, companyId: string) {
  const template = await templatesRepository.findById(id, companyId);
  if (!template) throw new AppError('Template not found', 404);
  return template;
}

export async function createTemplate(input: CreateTemplateInput, companyId: string, userId: string) {
  const template = await templatesRepository.create(input, companyId, userId);
  await auditLog({ userId, companyId, action: 'CREATE', entity: 'template', entityId: template.id, newValue: { name: input.name, category: input.category } });
  return template;
}

export async function updateTemplate(id: string, input: UpdateTemplateInput, companyId: string, userId: string) {
  const existing = await templatesRepository.findById(id, companyId);
  if (!existing) throw new AppError('Template not found', 404);
  const updated = await templatesRepository.update(id, input, companyId);
  await auditLog({ userId, companyId, action: 'UPDATE', entity: 'template', entityId: id, oldValue: existing as unknown as Record<string, unknown>, newValue: input as unknown as Record<string, unknown> });
  return updated;
}

export async function patchTemplateStatus(id: string, status: string, companyId: string, userId: string) {
  const existing = await templatesRepository.findById(id, companyId);
  if (!existing) throw new AppError('Template not found', 404);
  const updated = await templatesRepository.patchStatus(id, status, companyId);
  await auditLog({ userId, companyId, action: 'PATCH_STATUS', entity: 'template', entityId: id, oldValue: { status: existing.status }, newValue: { status } });
  return updated;
}

export async function deleteTemplate(id: string, companyId: string, userId: string) {
  const existing = await templatesRepository.findById(id, companyId);
  if (!existing) throw new AppError('Template not found', 404);
  await templatesRepository.remove(id, companyId);
  await auditLog({ userId, companyId, action: 'DELETE', entity: 'template', entityId: id, oldValue: existing as unknown as Record<string, unknown> });
}
