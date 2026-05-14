import fs from 'fs';
import path from 'path';
import { SupportedLanguage } from './translationService';

// Cache for loaded templates
const templateCache = new Map<string, string>();

/**
 * Load template content from disk
 */
export function loadTemplate(documentType: string, language: SupportedLanguage): string {
  const cacheKey = `${documentType}/${language}`;
  
  /* Cache disabled to ensure disk changes reflect immediately */
  // if (templateCache.has(cacheKey)) {
  //   return templateCache.get(cacheKey)!;
  // }
  
  const templatePath = path.join(__dirname, 'templates', documentType, `${language}.hbs`);
  
  try {
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    templateCache.set(cacheKey, templateContent);
    console.log(`📄 Loaded template: ${cacheKey}`);
    return templateContent;
  } catch (error) {
    throw new Error(`Template not found: ${documentType}/${language}.hbs`);
  }
}

/**
 * List all available document types and their supported languages
 */
export function listAvailableTemplates(): Record<string, SupportedLanguage[]> {
  const templatesDir = path.join(__dirname, 'templates');
  const result: Record<string, SupportedLanguage[]> = {};
  
  try {
    const documentTypes = fs.readdirSync(templatesDir, { withFileTypes: true });
    
    for (const docType of documentTypes) {
      if (docType.isDirectory()) {
        const docTypePath = path.join(templatesDir, docType.name);
        const languages = fs.readdirSync(docTypePath)
          .filter(file => file.endsWith('.hbs'))
          .map(file => file.replace('.hbs', '') as SupportedLanguage)
          .filter(lang => ['fr', 'ar', 'en', 'de'].includes(lang));
        
        result[docType.name] = languages;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error scanning templates directory:', error);
    return {};
  }
}

/**
 * Clear template cache (useful for development)
 */
export function clearTemplateCache(): void {
  templateCache.clear();
}
