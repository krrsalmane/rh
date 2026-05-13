import { formatDate, formatCurrency, formatNumber, getLanguageFont, getTextDirection, getLanguageClasses, getDefaultLanguage, SupportedLanguage } from './translationService';
import { loadTemplate } from './templateLoader';
import Handlebars from 'handlebars';
import { AppError } from '../../shared/utils/AppError';

// Register helpers with language support
Handlebars.registerHelper('formatDate', (dateStr: string, options?: any) => {
  if (!dateStr) return '—';
  try {
    const language = (options?.hash?.language || options?.data?.root?.language || 'fr') as SupportedLanguage;
    return formatDate(dateStr, language);
  } catch {
    return dateStr;
  }
});

Handlebars.registerHelper('formatDateLong', (dateStr: string, options?: any) => {
  if (!dateStr) return '—';
  try {
    const language = (options?.hash?.language || options?.data?.root?.language || 'fr') as SupportedLanguage;
    return formatDate(dateStr, language);
  } catch {
    return dateStr;
  }
});

Handlebars.registerHelper('formatCurrency', (amount: unknown, options?: any) => {
  if (amount === null || amount === undefined) return '—';
  const num = Number(amount);
  if (isNaN(num)) return '—';
  const language = (options?.hash?.language || options?.data?.root?.language || 'fr') as SupportedLanguage;
  return formatCurrency(num, language);
});

Handlebars.registerHelper('formatNumber', (amount: unknown, options?: any) => {
  if (amount === null || amount === undefined) return '—';
  const num = Number(amount);
  if (isNaN(num)) return '—';
  const language = (options?.hash?.language || options?.data?.root?.language || 'fr') as SupportedLanguage;
  return formatNumber(num, language);
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

// Contract type localization map
const CONTRACT_TYPE_MAP: Record<string, Partial<Record<SupportedLanguage, string>>> = {
  'CDI':        { en: 'permanent contract',   de: 'unbefristeten Arbeitsvertrag', ar: 'عمل غير محدد المدة' },
  'CDD':        { en: 'fixed-term contract',   de: 'befristeten Arbeitsvertrag',   ar: 'عمل محدد المدة' },
  'internship': { en: 'internship contract',  de: 'Praktikum',                   ar: 'تدريب مهني' },
  'freelance':  { en: 'freelance contract',   de: 'freiberuflichen Tätigkeit',    ar: 'عمل حر' },
};

function translateContractType(contractType: string, lang: SupportedLanguage): string {
  if (lang === 'fr') return contractType;
  return CONTRACT_TYPE_MAP[contractType]?.[lang] ?? contractType;
}

export function buildTemplateData(
  employee: EmployeeData,
  company: CompanyData,
  formData: Record<string, unknown>,
  language: SupportedLanguage = 'fr'
): Record<string, unknown> {
  const now = new Date();
  const lang = language || getDefaultLanguage();
  
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
      contractType: translateContractType(employee.contract_type, lang),
      function: employee.function || '',
      department: employee.department || '',
      salary: employee.salary,
      status: employee.status,
    },
    company: {
      name: company.name,
      address: (() => {
        const addr = company.address || '';
        if (lang === 'ar') {
          return addr
            .replace(/Casablanca/i, 'الدار البيضاء')
            .replace(/Morocco/i, 'المغرب')
            .split(',')
            .map(s => s.trim())
            .join('، ');
        }
        if (lang === 'de') return addr.replace(/Morocco/i, 'Marokko');
        return addr;
      })(),
      logoUrl: company.logo_url || '',
    },
    form: { ...formData },
    meta: {
      generatedAt: formatDate(now, lang),
      generatedAtLong: formatDate(now, lang),
      generatedYear: now.getFullYear(),
    },
    language: lang,
    direction: getTextDirection(lang),
  };
}

function sanitizeTemplate(html: string): string {
  return html
    .replace(/\{\{([^}]*?)<[^>]*>([^}]*?)\}\}/g, '{{$1$2}}')
    .replace(/\{\{([^}]*?)<\/[^>]*>([^}]*?)\}\}/g, '{{$1$2}}')
    .replace(/\{\{[^}]*\}\}/g, (match) => {
      return match.replace(/<[^>]*>/g, '');
    })
    .replace(/\{\{\s+/g, '{{')
    .replace(/\s+\}\}/g, '}}')
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

function wrapInHtml(zones: { header: string; body: string; footer: string }, data: any, language: SupportedLanguage = 'fr'): string {
  const showHeader = !zones.body.includes('<!-- HEADER_HIDDEN -->') && zones.header.length > 0;
  const showFooter = !zones.body.includes('<!-- FOOTER_HIDDEN -->') && zones.footer.length > 0;
  
  const lang = language || getDefaultLanguage();
  const direction = getTextDirection(lang);
  const fontFamily = getLanguageFont(lang);
  const langClass = getLanguageClasses(lang);

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${direction}" class="${langClass}">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
      font-size: 11pt; 
      color: #334155; 
      line-height: 1.5;
      direction: ${direction};
      text-align: ${direction === 'rtl' ? 'right' : 'left'};
      background: white;
    }
    
    .document-page {
      position: relative;
      padding: 0;
    }

    .accent-bar {
      height: 6px;
      background: #2563eb;
      width: 100%;
      position: absolute;
      top: 0;
      left: 0;
    }

    .document-header { 
      padding: 40px 60px 20px; 
      margin-bottom: 10px;
    }
    
    .header-table {
      width: 100%;
      border: none;
      margin: 0;
    }
    
    .header-table td {
      border: none;
      padding: 0;
      vertical-align: top;
    }

    .company-name {
      font-size: 18pt;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.2;
    }

    .company-details {
      font-size: 8pt;
      color: #64748b;
      margin-top: 3px;
    }

    .document-body { 
      padding: 0 60px; 
      min-height: auto; 
    }
    
    .document-body p { 
      margin-bottom: 14px; 
      text-align: justify; 
    }
    
    .document-body h1 { 
      font-size: 20pt; 
      font-weight: 800;
      text-align: center; 
      margin: 25px 0 35px; 
      color: #0f172a; 
      text-transform: uppercase;
      letter-spacing: 1.2px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 10px;
      width: 100%;
    }
    
    .document-body h2 { 
      font-size: 14pt; 
      font-weight: 700;
      margin: 30px 0 12px; 
      color: #1e293b; 
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Signature Table - More reliable than Flex */
    .sig-table {
      width: 100%;
      border: none;
      margin-top: 80px;
      page-break-inside: avoid;
    }

    .sig-table td {
      border: none;
      padding: 0;
      width: 45%;
      vertical-align: top;
    }

    .sig-spacer {
      width: 10% !important;
    }

    .sig-box {
      border-top: 1px solid #cbd5e1;
      padding-top: 15px;
      text-align: center;
    }

    .sig-label {
      font-size: 9pt;
      font-weight: 600;
      color: #475569;
      margin-bottom: 60px; /* Space for physical signature */
      display: block;
    }

    .sig-sublabel {
      font-size: 8pt;
      color: #94a3b8;
      font-style: italic;
    }

    .document-footer { 
      margin-top: 80px; 
      border-top: 1px solid #f1f5f9; 
      padding: 40px 70px; 
      font-size: 9pt; 
      color: #94a3b8; 
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="document-page">
    <div class="accent-bar"></div>
    
    <div class="document-header">
      <table class="header-table">
        <tr>
          <td>
            <div class="company-name">${data.company.name}</div>
            <div class="company-details">${data.company.address}</div>
          </td>
        </tr>
      </table>
    </div>

    <div class="document-body">
      ${zones.body}
    </div>

    <div class="document-footer">
      ${data.company.name} - ${data.company.address}
    </div>
  </div>
</body>
</html>`;
}

export function compileTemplate(
  documentType: string,
  data: Record<string, unknown>,
  language: SupportedLanguage = 'fr'
): { html: string; header: string; footer: string } {
  try {
    const lang = language || getDefaultLanguage();
    
    // Step 1: Load template from disk based on type and language
    const templateContent = loadTemplate(documentType, lang);
    
    // Step 2: Extract zones
    const zones = parseTemplateZones(templateContent);

    // Step 3: Sanitize
    zones.header = sanitizeTemplate(zones.header);
    zones.body = sanitizeTemplate(zones.body);
    zones.footer = sanitizeTemplate(zones.footer);

    // Step 4: Compile
    const templateData = { ...data, language: lang, direction: getTextDirection(lang) };
    const compiledZones = {
      header: Handlebars.compile(zones.header)(templateData),
      body: Handlebars.compile(zones.body)(templateData),
      footer: Handlebars.compile(zones.footer)(templateData),
    };

    // Step 5: Wrap in HTML
    const html = wrapInHtml(compiledZones, data, lang);

    return {
      html,
      header: compiledZones.header,
      footer: compiledZones.footer
    };
  } catch (error: any) {
    throw new AppError(`Erreur lors de la compilation du modèle: ${error.message}`, 500);
  }
}

export function extractVariablesFromBody(body: string): string[] {
  const matches = body.match(/\{\{([^}]+)\}\}/g) || [];
  return matches
    .map((m) => m.replace(/\{\{|\}\}/g, '').trim())
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .filter((v) => !v.startsWith('company.') && !v.startsWith('meta.'));
}
