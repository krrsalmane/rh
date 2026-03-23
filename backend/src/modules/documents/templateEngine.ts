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

function parseTemplateZones(fullBody: string) {
  const zones = {
    header: '',
    body: fullBody,
    footer: ''
  };

  if (fullBody.includes('<!-- HEADER -->')) {
    const headerMatch = fullBody.match(/<!-- HEADER -->([\s\S]*?)<!-- END_HEADER -->/);
    if (headerMatch) zones.header = headerMatch[1].trim();

    const bodyMatch = fullBody.match(/<!-- BODY -->([\s\S]*?)<!-- END_BODY -->/);
    if (bodyMatch) zones.body = bodyMatch[1].trim();

    const footerMatch = fullBody.match(/<!-- FOOTER -->([\s\S]*?)<!-- END_FOOTER -->/);
    if (footerMatch) zones.footer = footerMatch[1].trim();
  }

  return zones;
}

function wrapInHtml(zones: { header: string; body: string; footer: string }, data: any): string {
  // Check for hidden flags (injected by TemplateBuilder)
  const showHeader = !zones.body.includes('<!-- HEADER_HIDDEN -->') && zones.header.length > 0;
  const showFooter = !zones.body.includes('<!-- FOOTER_HIDDEN -->') && zones.footer.length > 0;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', 'Helvetica Neue', sans-serif; font-size: 11pt; color: #334155; line-height: 1.6; }
    
    /* Layout Zones */
    .document-header { border-bottom: 2px solid #f1f5f9; padding: 40px 60px 20px; margin-bottom: 30px; }
    .document-body { padding: 0 60px; min-height: 500px; }
    .document-footer { margin-top: 40px; border-top: 1px solid #f1f5f9; padding: 20px 60px 40px; font-size: 9pt; color: #94a3b8; }

    /* Content Styling */
    .document-body p { margin-bottom: 12px; }
    .document-body h1 { font-size: 18pt; text-align: center; margin: 30px 0 20px; color: #0f172a; }
    .document-body h2 { font-size: 15pt; margin: 25px 0 12px; color: #1e293b; }
    .document-body h3 { font-size: 13pt; margin: 20px 0 10px; color: #334155; }
    
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    td, th { border: 1px solid #e2e8f0; padding: 10px 12px; font-size: 10.5pt; }
    th { background: #f8fafc; font-weight: 600; text-align: left; }
    
    img { max-width: 100%; height: auto; display: block; }
    .logo { margin-bottom: 15px; }
    
    @media print { 
      body { padding: 0; }
      .document-header, .document-body, .document-footer { padding-left: 0; padding-right: 0; }
    }
  </style>
</head>
<body>
  ${showHeader ? `<div class="document-header">${zones.header}</div>` : ''}
  
  <div class="document-body">
    ${zones.body}
  </div>
  
  ${showFooter ? `<div class="document-footer">${zones.footer}</div>` : ''}
</body>
</html>`;
}

export function compileTemplate(
  templateBody: string, 
  data: Record<string, unknown>
): { html: string; header: string; footer: string } {
  try {
    // Step 1: Extract zones (Header, Body, Footer)
    const zones = parseTemplateZones(templateBody);

    // Step 2: Sanitize each zone — especially the body which comes from TipTap/Editor
    zones.header = sanitizeTemplate(zones.header);
    zones.body = sanitizeTemplate(zones.body);
    zones.footer = sanitizeTemplate(zones.footer);

    // Step 3: Compile each zone with Handlebars
    const compiledZones = {
      header: Handlebars.compile(zones.header)(data),
      body: Handlebars.compile(zones.body)(data),
      footer: Handlebars.compile(zones.footer)(data),
    };

    // Step 4: Wrap the main body in full HTML shell (CSS, etc.)
    const html = wrapInHtml(compiledZones, data);

    return {
      html,
      header: compiledZones.header,
      footer: compiledZones.footer
    };
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
