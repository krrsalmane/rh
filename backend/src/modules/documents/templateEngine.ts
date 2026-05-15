import { formatDate, formatCurrency, formatNumber, getLanguageFont, getTextDirection, getLanguageClasses, getDefaultLanguage, SupportedLanguage } from './translationService';
import { loadTemplate } from './templateLoader';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { AppError } from '../../shared/utils/AppError';
import { getStoragePath } from '../../config/storage';

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

function resolveLogoUrl(logoUrl: string | null): string {
  if (!logoUrl) return '';
  if (logoUrl.startsWith('data:') || /^https?:\/\//i.test(logoUrl)) return logoUrl;

  const normalized = logoUrl.replace(/\\/g, '/');
  const candidates = [
    normalized,
    normalized.replace(/^\/+/, ''),
    getStoragePath('uploads', path.basename(normalized)),
  ];

  const filePath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!filePath) return logoUrl;

  const extension = path.extname(filePath).toLowerCase();
  const mimeType = extension === '.png' ? 'image/png' : extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : '';
  if (!mimeType) return logoUrl;

  const fileBuffer = fs.readFileSync(filePath);
  return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
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
      logoUrl: resolveLogoUrl(company.logo_url),
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

  const headerHtml = zones.header ? `
    <div class="document-header">
      ${zones.header}
    </div>
  ` : '';

  const footerHtml = zones.footer ? `
    <div class="document-footer">
      ${zones.footer}
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${direction}" class="${langClass}">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&family=Cairo:wght@400;500;600;700&family=Great+Vibes&family=UnifrakturCook:wght@700&family=Fredoka:wght@400;600&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; }
    
    body { 
      font-family: 'Inter', sans-serif; 
      font-size: 11pt; 
      color: #1f2937; 
      line-height: 1.65;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
    }

    @media print {
      body { background: white; }
      .document-page { box-shadow: none !important; margin: 0 !important; }
      @page { size: A4; margin: 14mm 18mm 20mm; }
    }

    .document-page {
      position: relative;
      background: white;
      width: 100%;
      min-height: 100vh;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    @media print {
      .document-page {
        min-height: calc(297mm - 34mm);
      }
    }

    .document-header { 
      padding: 6mm 0 4mm; 
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .company-info { flex: 1; }
    .company-name { font-size: 14pt; font-weight: 700; color: #111827; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.02em; }
    .company-details { font-size: 9.5pt; color: #6b7280; line-height: 1.4; max-width: 400px; }
    .doc-date { font-size: 10pt; color: #374151; font-weight: 600; text-align: right; margin-top: 4px; }

    .document-body { 
      padding: 6mm 0 8mm; 
      overflow: hidden;
    }
    
    .document-body h1 { 
      font-family: 'Merriweather', serif;
      font-size: 19pt; 
      font-weight: 700;
      text-align: center; 
      margin: 18mm 0 10mm; 
      color: #111827; 
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
      width: 54px;
      height: 2px;
      background-color: #111827;
    }

    .document-body p { 
      margin-bottom: 14px; 
      text-align: justify;
      font-size: 11pt;
      line-height: 1.65;
    }

    .document-body strong { font-weight: 700; color: #111827; }

    .document-footer { 
      padding: 12mm 0 4mm; 
      font-size: 8.5pt; 
      color: #9ca3af; 
      text-align: center;
      background: white;
      flex: 0 0 auto;
      margin-top: auto;
    }

    .document-signature {
      padding: 0 0 10mm;
    }

    .page-break { page-break-before: always; }
    h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
    p, ul, ol, table, blockquote { page-break-inside: avoid; }

    /* Support for Custom Template Styles */
    ${customStyleMatch ? customStyleMatch[1] : ''}

    /* RTL Specifics */
    [dir="rtl"] { font-family: 'Cairo', sans-serif; }
    [dir="rtl"] .doc-date { text-align: left; }
    [dir="rtl"] .company-info { text-align: right; }
    [dir="rtl"] .company-name { font-size: 16pt; letter-spacing: 0; }
    [dir="rtl"] .document-body h1 { font-size: 20pt; margin: 14mm 0 10mm; letter-spacing: 0; }
    [dir="rtl"] .document-body p { line-height: 1.8; margin-bottom: 14px; font-size: 11.5pt; }
  </style>
</head>
<body>
  <div class="document-page">
    ${headerHtml}

    <div class="document-body">
      ${bodyWithoutStyle}
    </div>

    ${zones.signature ? `
    <div class="document-signature">
      ${zones.signature}
    </div>
    ` : ''}

    ${footerHtml}
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
