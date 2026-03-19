import path from 'path';
import fs from 'fs';
import * as documentsRepository from './documents.repository';
import * as templatesRepository from '../templates/templates.repository';
import * as employeesRepository from '../employees/employees.repository';
import { buildTemplateData, compileTemplate } from './templateEngine';
import { renderPDF } from './pdfRenderer';
import { getStoragePath, ensureDirectoryExists } from '../../config/storage';
import { AppError } from '../../shared/utils/AppError';
import { auditLog } from '../../shared/utils/auditLogger';
import { GenerateDocumentInput, DocumentFiltersInput } from './documents.schema';
import { query } from '../../config/database';

async function getCompany(companyId: string) {
  const result = await query<{ id: string; name: string; address: string | null; logo_url: string | null }>(
    'SELECT id, name, address, logo_url FROM companies WHERE id = $1',
    [companyId]
  );
  return result.rows[0] || null;
}

export async function getDocuments(companyId: string, filters: DocumentFiltersInput) {
  return documentsRepository.findAll(companyId, filters);
}

export async function getDocumentById(id: string, companyId: string) {
  const doc = await documentsRepository.findById(id, companyId);
  if (!doc) throw new AppError('Document not found', 404);
  return doc;
}

export async function generateDocument(input: GenerateDocumentInput, companyId: string, userId: string) {
  // 1. Fetch template — must be active
  const template = await templatesRepository.findById(input.templateId, companyId);
  if (!template) throw new AppError('Template not found', 404);
  if (template.status !== 'active') throw new AppError('Le modèle doit être actif pour générer un document', 400);

  // 2. Fetch employee
  const employee = await employeesRepository.findById(input.employeeId, companyId);
  if (!employee) throw new AppError('Employee not found', 404);

  // 3. Fetch company
  const company = await getCompany(companyId);
  if (!company) throw new AppError('Company not found', 404);

  // 4. Build template data
  const data = buildTemplateData(employee, company, input.formData);

  // 5. Compile HTML
  const html = compileTemplate(template.body, data);

  // 6. Generate filename (sanitize employee name)
  const safeName = `${employee.last_name}_${employee.first_name}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeTplName = template.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeName}_${safeTplName}_${Date.now()}.pdf`;

  // 7. Output path (per company, prevent traversal)
  const documentsDir = getStoragePath('documents', companyId);
  ensureDirectoryExists(documentsDir);
  const outputPath = path.join(documentsDir, filename);

  // Path traversal guard
  const resolvedPath = path.resolve(outputPath);
  const resolvedDir = path.resolve(documentsDir);
  if (!resolvedPath.startsWith(resolvedDir)) {
    throw new AppError('Invalid file path', 400);
  }

  // 8. Generate PDF
  const pdfBuffer = await renderPDF(html);
  fs.writeFileSync(outputPath, pdfBuffer);

  // 9. Save record
  const document = await documentsRepository.create(
    companyId, input.templateId, input.employeeId,
    template.version, data, outputPath, userId
  );

  // 10. Audit log
  await auditLog({
    userId, companyId, action: 'GENERATE', entity: 'document', entityId: document.id,
    newValue: { templateId: input.templateId, employeeId: input.employeeId, filename },
  });

  return document;
}

export async function getDocumentFile(id: string, companyId: string): Promise<{ filePath: string; filename: string }> {
  const doc = await documentsRepository.findById(id, companyId);
  if (!doc) throw new AppError('Document not found', 404);
  if (!doc.pdf_path || !fs.existsSync(doc.pdf_path)) {
    throw new AppError('Le fichier PDF est introuvable sur le serveur', 404);
  }

  // Path traversal guard
  const storagePath = path.resolve(getStoragePath('documents'));
  const resolvedPath = path.resolve(doc.pdf_path);
  if (!resolvedPath.startsWith(storagePath)) {
    throw new AppError('Invalid file path', 400);
  }

  const filename = path.basename(doc.pdf_path);
  return { filePath: doc.pdf_path, filename };
}

export async function archiveDocument(id: string, companyId: string, userId: string) {
  const doc = await documentsRepository.findById(id, companyId);
  if (!doc) throw new AppError('Document not found', 404);

  const updated = await documentsRepository.patchStatus(id, 'archived', companyId);
  await auditLog({
    userId, companyId, action: 'ARCHIVE', entity: 'document', entityId: id,
    oldValue: { status: doc.status }, newValue: { status: 'archived' },
  });
  return updated;
}

export async function deleteDocument(id: string, companyId: string, userId: string) {
  const doc = await documentsRepository.findById(id, companyId);
  if (!doc) throw new AppError('Document not found', 404);

  // Delete PDF file if exists
  if (doc.pdf_path && fs.existsSync(doc.pdf_path)) {
    const storagePath = path.resolve(getStoragePath('documents'));
    const resolvedPath = path.resolve(doc.pdf_path);
    if (resolvedPath.startsWith(storagePath)) {
      fs.unlinkSync(doc.pdf_path);
    }
  }

  await documentsRepository.remove(id, companyId);
  await auditLog({
    userId, companyId, action: 'DELETE', entity: 'document', entityId: id,
    oldValue: doc as unknown as Record<string, unknown>,
  });
}
