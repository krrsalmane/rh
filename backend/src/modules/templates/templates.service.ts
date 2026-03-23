import * as templatesRepository from './templates.repository';
import { CreateTemplateInput, UpdateTemplateInput, TemplateFiltersInput } from './templates.schema';
import { AppError } from '../../shared/utils/AppError';
import { auditLog } from '../../shared/utils/auditLogger';

export async function getTemplates(companyId: string, filters: TemplateFiltersInput) {
  return templatesRepository.findAll(companyId, filters);
}

export async function getActiveTemplates(companyId: string) {
  return templatesRepository.findActive(companyId);
}

export async function getTemplateById(id: string, companyId: string) {
  const template = await templatesRepository.findById(id, companyId);
  if (!template) throw new AppError('Template not found', 404);
  return template;
}

export async function createTemplate(input: CreateTemplateInput, companyId: string, userId: string) {
  // Validate unique name
  const existing = await templatesRepository.findByName(input.name, companyId);
  if (existing) throw new AppError('Un modèle avec ce nom existe déjà', 409);

  // Validate variable names are unique within schema
  if (input.variableSchema && input.variableSchema.length > 0) {
    const names = input.variableSchema.map((v) => v.name);
    const uniqueNames = new Set(names);
    if (uniqueNames.size !== names.length) {
      throw new AppError('Les noms de variables doivent être uniques', 400);
    }
  }

  const template = await templatesRepository.create(input, companyId, userId);
  await auditLog({
    userId, companyId, action: 'CREATE', entity: 'template', entityId: template.id,
    newValue: { name: input.name, category: input.category },
  });
  return template;
}

export async function updateTemplate(id: string, input: UpdateTemplateInput, companyId: string, userId: string) {
  const existing = await templatesRepository.findById(id, companyId);
  if (!existing) throw new AppError('Template not found', 404);
  if (existing.status === 'archived') throw new AppError('Cannot update an archived template', 400);

  // Check duplicate name if changing
  if (input.name && input.name !== existing.name) {
    const duplicate = await templatesRepository.findByName(input.name, companyId, id);
    if (duplicate) throw new AppError('Un modèle avec ce nom existe déjà', 409);
  }

  const updated = await templatesRepository.update(id, input, companyId);
  await auditLog({
    userId, companyId, action: 'UPDATE', entity: 'template', entityId: id,
    oldValue: { version: existing.version } as unknown as Record<string, unknown>,
    newValue: input as unknown as Record<string, unknown>,
  });
  return updated;
}

export async function patchTemplateStatus(id: string, status: string, companyId: string, userId: string) {
  const existing = await templatesRepository.findById(id, companyId);
  if (!existing) throw new AppError('Template not found', 404);

  // Status transition rules
  const transitions: Record<string, string[]> = {
    draft: ['active'],
    active: ['archived'],
    archived: ['active'],
  };

  const allowed = transitions[existing.status] || [];
  if (!allowed.includes(status)) {
    throw new AppError(`Transition de ${existing.status} vers ${status} non autorisée`, 400);
  }

  const updated = await templatesRepository.patchStatus(id, status, companyId);
  await auditLog({
    userId, companyId, action: 'STATUS_CHANGE', entity: 'template', entityId: id,
    oldValue: { status: existing.status }, newValue: { status },
  });
  return updated;
}

export async function deleteTemplate(id: string, companyId: string, userId: string) {
  console.log('Delete template request:', id, 'company:', companyId);
  
  const template = await templatesRepository.findById(id, companyId);
  if (!template) throw new AppError('Modèle introuvable', 404);

  const usageCount = await templatesRepository.getUsageCount(id);
  console.log('Usage count for template:', id, '=', usageCount);
  
  if (usageCount > 0) {
    throw new AppError(
      `Ce modèle a été utilisé ${usageCount} fois. Archivez-le plutôt que de le supprimer.`,
      400
    );
  }

  await templatesRepository.deleteTemplateRecord(id, companyId);

  await auditLog({
    userId,
    companyId,
    action: 'DELETE',
    entity: 'template',
    entityId: id,
    oldValue: { name: template.name },
  });

  return { message: 'Modèle supprimé avec succès' };
}
