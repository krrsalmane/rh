import path from 'path';
import fs from 'fs';
import * as documentsRepository from './documents.repository';
import * as employeesRepository from '../employees/employees.repository';
import { buildTemplateData, compileTemplate, compileRawTemplate } from './templateEngine';
import { renderPDF } from './pdfRenderer';
import { getStoragePath, ensureDirectoryExists } from '../../config/storage';
import { AppError } from '../../shared/utils/AppError';
import { auditLog } from '../../shared/utils/auditLogger';
import { GenerateDocumentInput, DocumentFiltersInput } from './documents.schema';
import { query } from '../../config/database';
import { getDefaultLanguage, isValidLanguage, SupportedLanguage } from './translationService';

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
  // 1. Validate and normalize language
  const language: SupportedLanguage = input.language && isValidLanguage(input.language) 
    ? input.language 
    : getDefaultLanguage();

  // 2. Fetch employee
  const employee = await employeesRepository.findById(input.employeeId, companyId);
  if (!employee) throw new AppError('Employee not found', 404);

  // 3. Fetch company
  const company = await getCompany(companyId);
  if (!company) throw new AppError('Company not found', 404);

  // 4. Build template data with language support
  const data = buildTemplateData(employee, company, input.formData, language);
  
  let compiled: { html: string; header: string; footer: string };
  let docTypeName = input.documentType || 'custom_document';

  // 5. Compile HTML
  if (input.templateId) {
    // Fetch custom template from DB
    const tplResult = await query<{ name: string; body: string }>(
      'SELECT name, body FROM templates WHERE id = $1 AND company_id = $2',
      [input.templateId, companyId]
    );
    const tpl = tplResult.rows[0];
    if (!tpl) throw new AppError('Template not found', 404);
    
    docTypeName = tpl.name;
    compiled = compileRawTemplate(tpl.body, data, language);
  } else if (input.documentType) {
    console.log(`🌍 Generating document "${input.documentType}" with language: ${language}`);
    compiled = compileTemplate(input.documentType, data, language);
  } else {
    throw new AppError('documentType or templateId is required', 400);
  }

  const { html, header, footer } = compiled;
  console.log(`📄 Template compiled. Sample: ${html.substring(0, 200)}...`);

  // 6. Generate filename (sanitize names)
  const safeName = `${employee.last_name}_${employee.first_name}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeDocType = docTypeName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeName}_${safeDocType}_${language}_${Date.now()}.pdf`;

  // 7. Output path
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
  const pdfBuffer = await renderPDF(html, header, footer);
  fs.writeFileSync(outputPath, pdfBuffer);

  // 9. Save record
  const document = await documentsRepository.create(
    companyId, input.templateId || null, input.employeeId,
    1, data, outputPath, userId
  );

  // 10. Audit log
  await auditLog({
    userId, companyId, action: 'GENERATE', entity: 'document', entityId: document.id,
    newValue: { documentType: docTypeName, employeeId: input.employeeId, filename, templateId: input.templateId },
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
