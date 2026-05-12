import { formatDate, formatCurrency, formatNumber, getLanguageFont, getTextDirection, getLanguageClasses, getDefaultLanguage, translateTemplate, SupportedLanguage } from './translationService';
import { loadTemplate } from './templateLoader';
import Handlebars from 'handlebars';
import { AppError } from '../../shared/utils/AppError';

// Register helpers
// ... (rest of imports/helpers)

// Register helpers with language support
Handlebars.registerHelper('formatDate', (dateStr: string, options?: any) => {
  if (!dateStr) return '—';
  try {
    // Get language from options.hash.language or from data context
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
    const dateObj = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    const config = language === 'en' ? 'en-US' : language === 'de' ? 'de-DE' : language === 'ar' ? 'ar-MA' : 'fr-FR';
    return dateObj.toLocaleDateString(config, { day: '2-digit', month: 'long', year: 'numeric' });
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
      address: company.address || '',
      logoUrl: company.logo_url || '',
    },
    form: { ...formData },
    meta: {
      generatedAt: formatDate(now, lang),
      generatedAtLong: (() => {
        const locale = lang === 'en' ? 'en-US' : lang === 'de' ? 'de-DE' : lang === 'ar' ? 'ar-MA' : 'fr-FR';
        return now.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
      })(),
      generatedYear: now.getFullYear(),
    },
    language: lang,
    direction: getTextDirection(lang),
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

function wrapInHtml(zones: { header: string; body: string; footer: string }, data: any, language: SupportedLanguage = 'fr'): string {
  // Check for hidden flags (injected by TemplateBuilder)
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
      font-family: ${fontFamily}; 
      font-size: 11pt; 
      color: #334155; 
      line-height: 1.6;
      direction: ${direction};
      text-align: ${direction === 'rtl' ? 'right' : 'left'};
    }
    
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
    th { background: #f8fafc; font-weight: 600; text-align: ${direction === 'rtl' ? 'right' : 'left'}; }
    
    img { max-width: 100%; height: auto; display: block; }
    .logo { margin-bottom: 15px; }
    
    /* RTL specific styles */
    .lang-ar .document-body h1,
    .lang-ar .document-body h2,
    .lang-ar .document-body h3 {
      font-family: Arial, 'Segoe UI', Tahoma, sans-serif;
    }
    
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
  typeOrContent: string,
  data: Record<string, unknown>,
  language: SupportedLanguage = 'fr'
): { html: string; header: string; footer: string } {
  try {
    const lang = language || getDefaultLanguage();
    
    // Step 1: Load or use the provided template content
    let templateContent: string;
    
    // If it looks like a template (contains HTML tags or Handlebars placeholders), use it directly
    if (typeOrContent.includes('<') || typeOrContent.includes('{{') || typeOrContent.includes('<!--')) {
      templateContent = typeOrContent;
    } else {
      // Otherwise, load it from disk (fallback for system templates)
      templateContent = loadTemplate(typeOrContent, lang);
    }

    // Step 2: Apply multi-language translation (Zone-aware)
    // This translates static French phrases into the target language (AR, EN, DE)
    // while protecting variable placeholders.
    templateContent = translateTemplate(templateContent, lang);
    
    // Step 3: Extract zones (Header, Body, Footer)
    const zones = parseTemplateZones(templateContent);

    // Step 3: Sanitize each zone — especially for body which comes from TipTap/Editor
    zones.header = sanitizeTemplate(zones.header);
    zones.body = sanitizeTemplate(zones.body);
    zones.footer = sanitizeTemplate(zones.footer);

    // Step 4: Compile each zone with Handlebars (pass language in data context)
    const templateData = { ...data, language: lang, direction: getTextDirection(lang) };
    const compiledZones = {
      header: Handlebars.compile(zones.header)(templateData),
      body: Handlebars.compile(zones.body)(templateData),
      footer: Handlebars.compile(zones.footer)(templateData),
    };

    // Step 5: Wrap the main body in full HTML shell (CSS, etc.)
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
    .filter((v, i, arr) => arr.indexOf(v) === i) // unique
    .filter((v) => !v.startsWith('company.') && !v.startsWith('meta.'));
}
