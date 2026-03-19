import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as documentsRepository from './documents.repository';
import * as templatesRepository from '../templates/templates.repository';
import * as employeesRepository from '../employees/employees.repository';
import { compileTemplate } from './templateEngine';
import { renderPDF } from './pdfRenderer';
import { getStoragePath, ensureDirectoryExists } from '../../config/storage';
import { AppError } from '../../shared/utils/AppError';
import { auditLog } from '../../shared/utils/auditLogger';
import { GenerateDocumentInput } from './documents.schema';
import fs from 'fs';

export async function getDocuments(companyId: string, page: number = 1, limit: number = 20) {
  return documentsRepository.findAll(companyId, page, limit);
}

export async function getDocumentById(id: string, companyId: string) {
  const doc = await documentsRepository.findById(id, companyId);
  if (!doc) throw new AppError('Document not found', 404);
  return doc;
}

export async function generateDocument(input: GenerateDocumentInput, companyId: string, userId: string) {
  const template = await templatesRepository.findById(input.templateId, companyId);
  if (!template) throw new AppError('Template not found', 404);

  const employee = await employeesRepository.findById(input.employeeId, companyId);
  if (!employee) throw new AppError('Employee not found', 404);

  const templateData: Record<string, unknown> = {
    employee_first_name: employee.first_name,
    employee_last_name: employee.last_name,
    employee_full_name: `${employee.first_name} ${employee.last_name}`,
    employee_cin: employee.cin,
    employee_cne: employee.cne,
    employee_email: employee.email,
    employee_phone: employee.phone,
    employee_department: employee.department,
    employee_function: employee.function,
    employee_contract_type: employee.contract_type,
    employee_hire_date: employee.hire_date,
    employee_salary: employee.salary,
    employee_address: employee.address,
    current_date: new Date().toISOString().split('T')[0],
    ...input.formData,
  };

  const html = compileTemplate(template.body, templateData);
  const pdfBuffer = await renderPDF(html);

  const documentsDir = getStoragePath('documents');
  ensureDirectoryExists(documentsDir);

  const filename = `${uuidv4()}.pdf`;
  const filePath = path.join(documentsDir, filename);
  fs.writeFileSync(filePath, pdfBuffer);

  const document = await documentsRepository.create(
    companyId, input.templateId, input.employeeId,
    template.version, templateData, filePath, userId
  );

  await auditLog({
    userId, companyId, action: 'GENERATE', entity: 'document', entityId: document.id,
    newValue: { templateId: input.templateId, employeeId: input.employeeId },
  });

  return document;
}

export async function getDocumentFile(id: string, companyId: string): Promise<string> {
  const doc = await documentsRepository.findById(id, companyId);
  if (!doc) throw new AppError('Document not found', 404);
  if (!doc.pdf_path || !fs.existsSync(doc.pdf_path)) {
    throw new AppError('Document file not found on disk', 404);
  }
  return doc.pdf_path;
}
