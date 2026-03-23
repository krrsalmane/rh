import Handlebars from 'handlebars';
import { AppError } from '../../shared/utils/AppError';

// Register helpers
// ... (rest of imports/helpers)


// Register helpers
Handlebars.registerHelper('formatDate', (dateStr: string) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
});

Handlebars.registerHelper('formatDateLong', (dateStr: string) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
});

Handlebars.registerHelper('formatCurrency', (amount: unknown) => {
  if (amount === null || amount === undefined) return '—';
  const num = Number(amount);
  if (isNaN(num)) return '—';
  return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD';
});

Handlebars.registerHelper('uppercase', (text: string) => {
  return text ? String(text).toUpperCase() : '';
});

Handlebars.registerHelper('lowercase', (text: string) => {
  return text ? String(text).toLowerCase() : '';
});

Handlebars.registerHelper('ifEqual', function (this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
  return a === b ? options.fn(this) : options.inverse(this);
});

// Types
interface EmployeeData {
  first_name: string;
  last_name: string;
  cin: string | null;
  cne: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  hire_date: string;
  contract_type: string;
  function: string | null;
  department: string | null;
  salary: number | null;
  status: string;
}

interface CompanyData {
  name: string;
  address: string | null;
  logo_url: string | null;
}

export function buildTemplateData(
  employee: EmployeeData,
  company: CompanyData,
  formData: Record<string, unknown>
): Record<string, unknown> {
  const now = new Date();
  return {
    employee: {
      firstName: employee.first_name,
      lastName: employee.last_name,
      fullName: `${employee.first_name} ${employee.last_name}`,
      cin: employee.cin || '',
      cne: employee.cne || '',
      email: employee.email || '',
      phone: employee.phone || '',
      address: employee.address || '',
      hireDate: employee.hire_date,
      contractType: employee.contract_type,
      function: employee.function || '',
      department: employee.department || '',
      salary: employee.salary,
      status: employee.status,
    },
    company: {
      name: company.name,
      address: company.address || '',
      logoUrl: company.logo_url || '',
    },
    form: { ...formData },
    meta: {
      generatedAt: now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      generatedAtLong: now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
      generatedYear: now.getFullYear(),
    },
  };
}

function sanitizeTemplate(html: string): string {
  // Remove HTML tags inside {{ }} placeholders
  // Pattern: {{ anything with HTML tags }}
  return html
    // Remove HTML tags inside handlebars {{ }}
    .replace(/\{\{([^}]*?)<[^>]*>([^}]*?)\}\}/g, '{{$1$2}}')
    .replace(/\{\{([^}]*?)<\/[^>]*>([^}]*?)\}\}/g, '{{$1$2}}')
    // Clean any remaining HTML inside {{ }}
    .replace(/\{\{[^}]*\}\}/g, (match) => {
      return match.replace(/<[^>]*>/g, '');
    })
    // Fix any double spaces in variable names
    .replace(/\{\{\s+/g, '{{')
    .replace(/\s+\}\}/g, '}}')
    // Trim variable names
    .replace(/\{\{(\s*)(.*?)(\s*)\}\}/g, '{{$2}}');
}

function wrapInHtml(bodyHtml: string, data: any): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', 'Helvetica Neue', sans-serif; font-size: 12pt; color: #333; padding: 40px; line-height: 1.6; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; }
    .company-name { font-size: 18pt; font-weight: bold; color: #0f172a; }
    .company-address { font-size: 10pt; color: #666; margin-top: 4px; }
    .date-info { text-align: right; color: #666; font-size: 10pt; }
    .document-body { line-height: 1.8; }
    .document-body p { margin-bottom: 12px; }
    .document-body h1 { font-size: 16pt; text-align: center; margin: 30px 0 20px; color: #0f172a; }
    .document-body h2 { font-size: 14pt; margin: 20px 0 10px; color: #1e293b; }
    .document-body h3 { font-size: 12pt; margin: 15px 0 8px; color: #334155; }
    .document-body ul, .document-body ol { margin: 10px 0 10px 20px; }
    .document-body li { margin-bottom: 4px; }
    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 9pt; color: #94a3b8; text-align: center; }
    .signature-zone { margin-top: 60px; display: flex; justify-content: space-between; }
    .signature-block { text-align: center; width: 200px; }
    .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; font-size: 10pt; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    td, th { border: 1px solid #d1d5db; padding: 8px 12px; font-size: 11pt; }
    th { background: #f1f5f9; font-weight: 600; text-align: left; }
    strong { font-weight: 600; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">${Handlebars.Utils.escapeExpression(String(data?.company?.name || ''))}</div>
      <div class="company-address">${Handlebars.Utils.escapeExpression(String(data?.company?.address || ''))}</div>
    </div>
    <div class="date-info">
      Date: ${Handlebars.Utils.escapeExpression(String(data?.meta?.generatedAtLong || ''))}
    </div>
  </div>
  <div class="document-body">
    ${bodyHtml}
  </div>
  <div class="footer">
    Document généré le ${Handlebars.Utils.escapeExpression(String(data?.meta?.generatedAt || ''))} via Maya HR Platform
  </div>
</body>
</html>`;
}

export function compileTemplate(templateBody: string, data: Record<string, unknown>): string {
  try {
    // Step 1: Sanitize template (remove HTML inside variables)
    const cleanTemplate = sanitizeTemplate(templateBody);

    // Step 2: Compile with Handlebars
    const template = Handlebars.compile(cleanTemplate);

    // Step 3: Execute with data
    const compiled = template(data);

    // Step 4: Wrap in full HTML
    return wrapInHtml(compiled, data);
  } catch (error: any) {
    console.error('Template compilation error:', error);
    console.error('Template body (first 200 chars):', templateBody.substring(0, 200));
    throw new AppError(`Erreur lors de la compilation du modèle: ${error.message}`, 500);
  }
}
export function extractVariablesFromBody(body: string): string[] {
  const matches = body.match(/\{\{([^}]+)\}\}/g) || [];
  return matches
    .map((m) => m.replace(/\{\{|\}\}/g, '').trim())
    .filter((v, i, arr) => arr.indexOf(v) === i) // unique
    .filter((v) => !v.startsWith('company.') && !v.startsWith('meta.'));
}
