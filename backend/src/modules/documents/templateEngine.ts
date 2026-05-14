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
    signature: '',
    footer: ''
  };

  // Improved regex to handle both tagged and untagged templates
  const headerMatch = fullBody.match(/<!-- HEADER_START -->([\s\S]*?)<!-- HEADER_END -->/);
  const bodyMatch = fullBody.match(/<!-- BODY_START -->([\s\S]*?)<!-- BODY_END -->/);
  const signatureMatch = fullBody.match(/<!-- SIGNATURE_START -->([\s\S]*?)<!-- SIGNATURE_END -->/);
  const footerMatch = fullBody.match(/<!-- FOOTER_START -->([\s\S]*?)<!-- FOOTER_END -->/);

  if (headerMatch) zones.header = headerMatch[1].trim();
  if (bodyMatch) zones.body = bodyMatch[1].trim();
  if (signatureMatch) zones.signature = signatureMatch[1].trim();
  if (footerMatch) zones.footer = footerMatch[1].trim();

  // Fallback for older format
  if (!headerMatch && !bodyMatch && fullBody.includes('<!-- HEADER -->')) {
     const hMatch = fullBody.match(/<!-- HEADER -->\n([\s\S]*?)(?=<!-- BODY -->)/);
     const bMatch = fullBody.match(/<!-- BODY -->\n([\s\S]*?)(?=<!-- FOOTER -->|$)/);
     const fMatch = fullBody.match(/<!-- FOOTER -->\n([\s\S]*?)$/);
     if (hMatch) zones.header = hMatch[1].trim();
     if (bMatch) zones.body = bMatch[1].trim();
     if (fMatch) zones.footer = fMatch[1].trim();
  }

  return zones;
}

function wrapInHtml(zones: { header: string; body: string; signature: string; footer: string }, data: any, language: SupportedLanguage = 'fr'): string {
  const lang = language || getDefaultLanguage();
  const direction = getTextDirection(lang);
  const langClass = getLanguageClasses(lang);

  // Extract CSS from body if it exists
  const customStyleMatch = zones.body.match(/<style>([\s\S]*?)<\/style>/);
  const bodyWithoutStyle = zones.body.replace(/<style>([\s\S]*?)<\/style>/, '');

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${direction}" class="${langClass}">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Cairo:wght@400;500;600;700;800&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body { 
      font-family: 'Inter', sans-serif; 
      font-size: 11pt; 
      color: #334155; 
      line-height: 1.6;
      background: #f8fafc;
      -webkit-print-color-adjust: exact;
    }

    @media print {
      body { background: white; }
      .document-page { box-shadow: none !important; margin: 0 !important; }
      @page { size: A4; margin: 0; }
    }

    .document-page {
      position: relative;
      background: white;
      width: 210mm;
      min-height: 297mm;
      margin: 20px auto;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 40px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    .document-header { 
      padding: 60px 80px 20px; 
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .company-info { flex: 1; }
    .company-name { font-size: 16pt; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.02em; }
    .company-details { font-size: 9pt; color: #64748b; line-height: 1.4; max-width: 400px; }
    .doc-date { font-size: 10.5pt; color: #475569; font-weight: 600; text-align: right; margin-top: 4px; }

    .document-body { 
      padding: 20px 80px; 
      overflow: hidden;
    }
    
    .document-body h1 { 
      font-size: 20pt; 
      font-weight: 800;
      text-align: center; 
      margin: 40px 0 45px; 
      color: #0f172a; 
      text-transform: uppercase;
      letter-spacing: 0.03em;
      position: relative;
    }

    .document-body h1::after {
      content: '';
      position: absolute;
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 3px;
      background-color: #0f172a;
    }

    .document-body p { 
      margin-bottom: 18px; 
      text-align: justify;
      font-size: 11pt;
      line-height: 1.7;
    }

    .document-body strong { font-weight: 700; color: #0f172a; }

    .document-footer { 
      padding: 25px 80px; 
      font-size: 8.5pt; 
      color: #94a3b8; 
      text-align: center;
      background: white;
      margin-top: auto;
    }

    .document-signature {
      padding: 0 80px 40px;
    }

    /* Support for Custom Template Styles */
    ${customStyleMatch ? customStyleMatch[1] : ''}

    /* RTL Specifics */
    [dir="rtl"] { font-family: 'Cairo', sans-serif; }
    [dir="rtl"] .doc-date { text-align: left; }
    [dir="rtl"] .company-info { text-align: right; }
    [dir="rtl"] .company-name { font-size: 18pt; letter-spacing: 0; }
    [dir="rtl"] .document-body h1 { font-size: 22pt; margin: 35px 0 40px; letter-spacing: 0; }
    [dir="rtl"] .document-body p { line-height: 1.8; margin-bottom: 16px; font-size: 11.5pt; }
  </style>
</head>
<body>
  <div class="document-page">
    <div class="document-header">
      ${zones.header || `
        <div class="company-info">
          <div class="company-name">${data.company.name}</div>
          <div class="company-details">${data.company.address}</div>
        </div>
        <div class="doc-date">${data.meta.generatedAt}</div>
      `}
    </div>

    <div class="document-body">
      ${bodyWithoutStyle}
    </div>

    ${zones.signature ? `
    <div class="document-signature">
      ${zones.signature}
    </div>
    ` : ''}

    <div class="document-footer">
      ${zones.footer || `${data.company.name} — ${data.company.address}`}
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
    zones.signature = sanitizeTemplate(zones.signature);
    zones.footer = sanitizeTemplate(zones.footer);

    // Step 4: Compile
    const templateData = { ...data, language: lang, direction: getTextDirection(lang) };
    const compiledZones = {
      header: Handlebars.compile(zones.header)(templateData),
      body: Handlebars.compile(zones.body)(templateData),
      signature: Handlebars.compile(zones.signature)(templateData),
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

/**
 * Compiles a raw template string (from DB) with data
 */
export function compileRawTemplate(
  rawContent: string,
  data: Record<string, unknown>,
  language: SupportedLanguage = 'fr'
): { html: string; header: string; footer: string } {
  try {
    const lang = language || getDefaultLanguage();
    
    // Step 1: Extract zones
    const zones = parseTemplateZones(rawContent);

    // Step 2: Sanitize
    zones.header = sanitizeTemplate(zones.header);
    zones.body = sanitizeTemplate(zones.body);
    zones.signature = sanitizeTemplate(zones.signature);
    zones.footer = sanitizeTemplate(zones.footer);

    // Step 3: Compile
    const templateData = { ...data, language: lang, direction: getTextDirection(lang) };
    const compiledZones = {
      header: Handlebars.compile(zones.header)(templateData),
      body: Handlebars.compile(zones.body)(templateData),
      signature: Handlebars.compile(zones.signature)(templateData),
      footer: Handlebars.compile(zones.footer)(templateData),
    };

    // Step 4: Wrap in HTML
    const html = wrapInHtml(compiledZones, data, lang);

    return {
      html,
      header: compiledZones.header,
      footer: compiledZones.footer
    };
  } catch (error: any) {
    throw new AppError(`Erreur lors de la compilation du modèle personnalisé: ${error.message}`, 500);
  }
}

export function extractVariablesFromBody(body: string): string[] {
  const matches = body.match(/\{\{([^}]+)\}\}/g) || [];
  return matches
    .map((m) => m.replace(/\{\{|\}\}/g, '').trim())
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .filter((v) => !v.startsWith('company.') && !v.startsWith('meta.'));
}
