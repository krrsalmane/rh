// Multi-language configuration service for documents
import { AppError } from '../../shared/utils/AppError';

export type SupportedLanguage = 'fr' | 'ar' | 'en' | 'de';

export interface TranslationConfig {
  language: string;
  direction: 'ltr' | 'rtl';
  dateFormat: Intl.DateTimeFormatOptions;
  numberFormat: Intl.NumberFormatOptions;
  currencyFormat: Intl.NumberFormatOptions;
}

export const LANGUAGE_CONFIGS: Record<SupportedLanguage, TranslationConfig> = {
  fr: {
    language: 'fr-FR',
    direction: 'ltr',
    dateFormat: { day: '2-digit', month: '2-digit', year: 'numeric' },
    numberFormat: { style: 'decimal', minimumFractionDigits: 2 },
    currencyFormat: { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 }
  },
  ar: {
    language: 'ar-MA',
    direction: 'rtl',
    dateFormat: { day: '2-digit', month: 'long', year: 'numeric' },
    numberFormat: { style: 'decimal', minimumFractionDigits: 2 },
    currencyFormat: { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 }
  },
  en: {
    language: 'en-GB',
    direction: 'ltr',
    dateFormat: { day: '2-digit', month: '2-digit', year: 'numeric' },
    numberFormat: { style: 'decimal', minimumFractionDigits: 2 },
    currencyFormat: { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 }
  },
  de: {
    language: 'de-DE',
    direction: 'ltr',
    dateFormat: { day: '2-digit', month: '2-digit', year: 'numeric' },
    numberFormat: { style: 'decimal', minimumFractionDigits: 2 },
    currencyFormat: { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 }
  }
};

/**
 * Format date according to language
 */
export function formatDate(date: Date | string, language: SupportedLanguage): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const config = LANGUAGE_CONFIGS[language];
  return dateObj.toLocaleDateString(config.language, config.dateFormat);
}

/**
 * Format currency according to language
 */
export function formatCurrency(amount: number, language: SupportedLanguage): string {
  const config = LANGUAGE_CONFIGS[language];
  return amount.toLocaleString(config.language, config.currencyFormat);
}

/**
 * Format number according to language
 */
export function formatNumber(amount: number, language: SupportedLanguage): string {
  const config = LANGUAGE_CONFIGS[language];
  return amount.toLocaleString(config.language, config.numberFormat);
}

/**
 * Get language-specific CSS classes
 */
export function getLanguageClasses(language: SupportedLanguage): string {
  const config = LANGUAGE_CONFIGS[language];
  return `lang-${language} dir-${config.direction}`;
}

/**
 * Get language-specific font family
 */
export function getLanguageFont(language: SupportedLanguage): string {
  switch (language) {
    case 'ar':
      return 'Arial, "Segoe UI", "Tahoma", sans-serif';
    case 'de':
    case 'en':
      return 'Arial, "Helvetica Neue", Helvetica, sans-serif';
    case 'fr':
    default:
      return 'Arial, "Helvetica Neue", Helvetica, sans-serif';
  }
}

/**
 * Get language-specific text direction
 */
export function getTextDirection(language: SupportedLanguage): 'ltr' | 'rtl' {
  return LANGUAGE_CONFIGS[language].direction;
}

/**
 * Validate if language is supported
 */
export function isValidLanguage(language: string): language is SupportedLanguage {
  return ['fr', 'ar', 'en', 'de'].includes(language);
}

/**
 * Get default language (French)
 */
export function getDefaultLanguage(): SupportedLanguage {
  return 'fr';
}